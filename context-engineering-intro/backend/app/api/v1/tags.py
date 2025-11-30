"""
Tags API endpoints with RBAC

RBAC Permissions:
- Owner: Create, Edit, Delete tags + Add/Remove from contacts
- Admin: Create tags + Add/Remove from contacts (CANNOT delete tags)
- User: Add/Remove existing tags from contacts only (CANNOT create or delete)
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.tag import Tag
from app.models.contact_tag import ContactTag
from app.models.contact import Contact
from app.models.user import UserRole
from app.services.activity_logger import ActivityLogger
from app.services.autoresponder_service import check_and_queue_autoresponders
from app.models.autoresponder import TriggerType

router = APIRouter(prefix="/tags", tags=["Tags"])


# Schemas
class TagCreate(BaseModel):
    """Create tag request"""
    name: str = Field(..., min_length=1, max_length=50, description="Tag name")
    color: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$", description="Hex color (#FF5733)")


class TagUpdate(BaseModel):
    """Update tag request"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="Tag name")
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="Hex color (#FF5733)")


class TagResponse(BaseModel):
    """Tag response schema"""
    id: UUID
    name: str
    color: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    contact_count: Optional[int] = 0

    class Config:
        from_attributes = True


class AddTagToContactRequest(BaseModel):
    """Add tag to contact request"""
    tag_id: UUID


# Helper function to check if user can create/edit tags (admin or owner)
def can_create_tags(user_role: str) -> bool:
    """Check if user can create or edit tags"""
    return user_role in [UserRole.OWNER.value, UserRole.ADMIN.value]


# Helper function to check if user can delete tags (owner only)
def can_delete_tags(user_role: str) -> bool:
    """Check if user can delete tags"""
    return user_role == UserRole.OWNER.value


# Endpoints
@router.get("/", response_model=List[TagResponse])
async def list_tags(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    List all tags with contact counts

    Returns all tags in the system with the number of contacts using each tag.
    All authenticated users can view tags.
    """
    # Get all tags
    result = await db.execute(select(Tag).order_by(Tag.name))
    tags = result.scalars().all()

    # Get contact counts for each tag
    tag_responses = []
    for tag in tags:
        count_result = await db.execute(
            select(func.count(ContactTag.id)).where(ContactTag.tag_id == tag.id)
        )
        contact_count = count_result.scalar_one()

        tag_responses.append(
            TagResponse(
                id=tag.id,
                name=tag.name,
                color=tag.color,
                created_by=tag.created_by,
                created_at=tag.created_at,
                updated_at=tag.updated_at,
                contact_count=contact_count
            )
        )

    return tag_responses


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create a new tag

    RBAC: Admin or Owner only
    Users cannot create tags.
    """
    # Check RBAC permissions
    if not can_create_tags(current_user.role.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and owner can create tags"
        )

    # Check if tag name already exists
    existing = await db.execute(select(Tag).where(Tag.name == tag_data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag with name '{tag_data.name}' already exists"
        )

    # Create tag
    new_tag = Tag(
        name=tag_data.name,
        color=tag_data.color,
        created_by=current_user.id
    )

    db.add(new_tag)
    await db.commit()
    await db.refresh(new_tag)

    return TagResponse(
        id=new_tag.id,
        name=new_tag.name,
        color=new_tag.color,
        created_by=new_tag.created_by,
        created_at=new_tag.created_at,
        updated_at=new_tag.updated_at,
        contact_count=0
    )


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: UUID,
    tag_data: TagUpdate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update tag name and/or color

    RBAC: Admin or Owner only
    Users cannot edit tags.
    """
    # Check RBAC permissions
    if not can_create_tags(current_user.role.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and owner can edit tags"
        )

    # Get tag
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )

    # Check if new name conflicts with existing tag
    if tag_data.name and tag_data.name != tag.name:
        existing = await db.execute(select(Tag).where(Tag.name == tag_data.name))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag with name '{tag_data.name}' already exists"
            )
        tag.name = tag_data.name

    # Update color if provided
    if tag_data.color:
        tag.color = tag_data.color

    await db.commit()
    await db.refresh(tag)

    # Get contact count
    count_result = await db.execute(
        select(func.count(ContactTag.id)).where(ContactTag.tag_id == tag.id)
    )
    contact_count = count_result.scalar_one()

    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        created_by=tag.created_by,
        created_at=tag.created_at,
        updated_at=tag.updated_at,
        contact_count=contact_count
    )


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete a tag (CASCADE removes from all contacts)

    RBAC: Owner only
    Admin and users CANNOT delete tags.
    """
    # Check RBAC permissions
    if not can_delete_tags(current_user.role.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can delete tags"
        )

    # Get tag
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )

    # Delete tag (CASCADE will remove all contact_tags entries)
    await db.delete(tag)
    await db.commit()

    return None


@router.post("/contacts/{contact_id}/tags", status_code=status.HTTP_201_CREATED)
async def add_tag_to_contact(
    contact_id: UUID,
    request: AddTagToContactRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Add a tag to a contact

    RBAC: All authenticated users can add tags to contacts
    """
    # Verify contact exists
    contact_result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = contact_result.scalar_one_or_none()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with id {contact_id} not found"
        )

    # Verify tag exists
    tag_result = await db.execute(select(Tag).where(Tag.id == request.tag_id))
    tag = tag_result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {request.tag_id} not found"
        )

    # Check if tag is already assigned to contact
    existing = await db.execute(
        select(ContactTag).where(
            ContactTag.contact_id == contact_id,
            ContactTag.tag_id == request.tag_id
        )
    )

    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag is already assigned to this contact"
        )

    # Create contact_tag relationship
    contact_tag = ContactTag(
        contact_id=contact_id,
        tag_id=request.tag_id,
        added_by=current_user.id
    )

    db.add(contact_tag)
    await db.commit()
    await ActivityLogger.log_tag_added(
        db,
        contact=contact,
        tag=tag,
        user=current_user,
    )

    # Trigger tag_added autoresponders
    try:
        await check_and_queue_autoresponders(
            trigger_type=TriggerType.TAG_ADDED,
            contact_id=contact_id,
            trigger_data={"tag_id": request.tag_id},
            db=db
        )
    except Exception as e:
        # Don't fail tag addition if autoresponder fails
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error triggering autoresponders for tag_added {contact_id}: {e}")

    return {"message": "Tag added to contact successfully"}


@router.delete("/contacts/{contact_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag_from_contact(
    contact_id: UUID,
    tag_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Remove a tag from a contact

    RBAC: All authenticated users can remove tags from contacts
    """
    # Fetch contact for activity logging context
    contact_result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = contact_result.scalar_one_or_none()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with id {contact_id} not found"
        )

    tag_result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = tag_result.scalar_one_or_none()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )

    # Get contact_tag relationship
    result = await db.execute(
        select(ContactTag).where(
            ContactTag.contact_id == contact_id,
            ContactTag.tag_id == tag_id
        )
    )
    contact_tag = result.scalar_one_or_none()

    if not contact_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag is not assigned to this contact"
        )

    # Delete relationship
    await db.delete(contact_tag)
    await db.commit()
    await ActivityLogger.log_tag_removed(
        db,
        contact=contact,
        tag=tag,
        user=current_user,
    )

    return None


@router.get("/contacts/{contact_id}/tags", response_model=List[TagResponse])
async def get_contact_tags(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get all tags for a specific contact

    Returns list of tags assigned to the contact.
    """
    # Verify contact exists
    contact_result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = contact_result.scalar_one_or_none()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with id {contact_id} not found"
        )

    # Get all tags for this contact
    result = await db.execute(
        select(Tag)
        .join(ContactTag, ContactTag.tag_id == Tag.id)
        .where(ContactTag.contact_id == contact_id)
        .order_by(Tag.name)
    )
    tags = result.scalars().all()

    return [
        TagResponse(
            id=tag.id,
            name=tag.name,
            color=tag.color,
            created_by=tag.created_by,
            created_at=tag.created_at,
            updated_at=tag.updated_at,
            contact_count=0  # Not needed for individual contact tags
        )
        for tag in tags
    ]
