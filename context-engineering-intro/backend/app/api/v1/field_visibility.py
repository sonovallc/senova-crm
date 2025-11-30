"""
Field Visibility API endpoints

Features:
- List field visibility settings (owner only)
- Get field visibility by field name (owner only)
- Update field visibility (owner only)
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.field_visibility import FieldVisibility
from app.models.user import UserRole
from app.core.exceptions import NotFoundError
from app.utils.permissions import can_change_field_visibility

router = APIRouter(prefix="/field-visibility", tags=["Field Visibility"])


# Schemas
class FieldVisibilityResponse(BaseModel):
    """Field visibility response schema"""
    id: UUID
    field_name: str
    field_label: str
    field_category: Optional[str]
    field_type: str
    visible_to_admin: bool
    visible_to_user: bool
    is_sensitive: bool

    class Config:
        from_attributes = True


class FieldVisibilityCreate(BaseModel):
    """Field visibility create schema"""
    field_name: str
    field_label: str
    field_category: Optional[str] = "custom"
    field_type: str = "string"
    visible_to_admin: bool = True
    visible_to_user: bool = False
    is_sensitive: bool = False


class FieldVisibilityUpdate(BaseModel):
    """Field visibility update schema"""
    visible_to_admin: Optional[bool] = None
    visible_to_user: Optional[bool] = None
    is_sensitive: Optional[bool] = None


class FieldVisibilityBulkUpdate(BaseModel):
    """Bulk field visibility update schema"""
    field_name: str
    visible_to_admin: bool
    visible_to_user: bool


class FieldVisibilityListResponse(BaseModel):
    """Field visibility list response"""
    items: List[FieldVisibilityResponse]
    total: int


# Endpoints
@router.post("/", response_model=FieldVisibilityResponse, status_code=status.HTTP_201_CREATED)
async def create_field_visibility(
    data: FieldVisibilityCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create a new custom field.

    RBAC Rules:
    - Owner: Can create custom fields
    - Admin/User: Forbidden

    Requires authentication
    """
    # Only owner can create custom fields
    if not await can_change_field_visibility(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can create custom fields"
        )

    # Check if field_name already exists
    result = await db.execute(
        select(FieldVisibility).where(FieldVisibility.field_name == data.field_name)
    )
    existing_field = result.scalar_one_or_none()

    if existing_field:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Field with name '{data.field_name}' already exists"
        )

    # Create new field
    new_field = FieldVisibility(
        field_name=data.field_name,
        field_label=data.field_label,
        field_category=data.field_category,
        field_type=data.field_type,
        visible_to_admin=data.visible_to_admin,
        visible_to_user=data.visible_to_user,
        is_sensitive=data.is_sensitive,
        updated_by_user_id=current_user.id,
    )

    db.add(new_field)
    await db.commit()
    await db.refresh(new_field)

    return FieldVisibilityResponse.model_validate(new_field)


@router.get("/", response_model=FieldVisibilityListResponse)
async def list_field_visibility(
    db: DatabaseSession,
    current_user: CurrentUser,
    category_filter: Optional[str] = Query(None, alias="category"),
    sensitive_only: Optional[bool] = Query(None),
):
    """
    List all field visibility settings.

    RBAC Rules:
    - Owner: Can view all field visibility settings
    - Admin/User: Forbidden

    Requires authentication
    """
    # Only owner can view field visibility settings
    if not await can_change_field_visibility(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can view field visibility settings"
        )

    # Build base query
    query = select(FieldVisibility)

    # Apply filters
    filters = []

    if category_filter:
        filters.append(FieldVisibility.field_category == category_filter)

    if sensitive_only is not None:
        filters.append(FieldVisibility.is_sensitive == sensitive_only)

    if filters:
        query = query.where(*filters)

    # Order by category and field name
    query = query.order_by(FieldVisibility.field_category, FieldVisibility.field_name)

    # Execute query
    result = await db.execute(query)
    fields = result.scalars().all()

    return FieldVisibilityListResponse(
        items=[FieldVisibilityResponse.model_validate(f) for f in fields],
        total=len(fields),
    )


@router.get("/{field_name}", response_model=FieldVisibilityResponse)
async def get_field_visibility(
    field_name: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get field visibility settings by field name.

    RBAC Rules:
    - Owner: Can view field visibility settings
    - Admin/User: Forbidden

    Requires authentication
    """
    # Only owner can view field visibility settings
    if not await can_change_field_visibility(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can view field visibility settings"
        )

    # Query by field name
    result = await db.execute(
        select(FieldVisibility).where(FieldVisibility.field_name == field_name)
    )
    field = result.scalar_one_or_none()

    if not field:
        raise NotFoundError(f"Field visibility settings for '{field_name}' not found")

    return FieldVisibilityResponse.model_validate(field)


@router.put("/{field_name}", response_model=FieldVisibilityResponse)
async def update_field_visibility(
    field_name: str,
    data: FieldVisibilityUpdate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update field visibility settings.

    RBAC Rules:
    - Owner: Can update field visibility settings
    - Admin/User: Forbidden

    Requires authentication
    """
    # Only owner can change field visibility settings
    if not await can_change_field_visibility(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can change field visibility settings"
        )

    # Query by field name
    result = await db.execute(
        select(FieldVisibility).where(FieldVisibility.field_name == field_name)
    )
    field = result.scalar_one_or_none()

    if not field:
        raise NotFoundError(f"Field visibility settings for '{field_name}' not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)

    for field_name, value in update_data.items():
        setattr(field, field_name, value)

    # Track who made the change
    field.updated_by_user_id = current_user.id

    await db.commit()
    await db.refresh(field)

    return FieldVisibilityResponse.model_validate(field)


@router.get("/categories/list")
async def list_field_categories(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get list of all field categories.

    RBAC Rules:
    - Owner: Can view categories
    - Admin/User: Forbidden

    Requires authentication
    """
    # Only owner can view field visibility settings
    if not await can_change_field_visibility(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can view field visibility settings"
        )

    # Get distinct categories
    result = await db.execute(
        select(FieldVisibility.field_category).distinct()
    )
    categories = [c for c in result.scalars().all() if c is not None]

    return {"categories": sorted(categories)}


@router.post("/bulk-update")
async def bulk_update_field_visibility(
    fields_data: List[FieldVisibilityBulkUpdate],
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Bulk update field visibility settings.

    RBAC Rules:
    - Owner: Can update field visibility settings
    - Admin/User: Forbidden

    Requires authentication
    """
    # Only owner can change field visibility settings
    if not await can_change_field_visibility(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can change field visibility settings"
        )

    updated_count = 0

    for field_data in fields_data:
        # Query by field name
        result = await db.execute(
            select(FieldVisibility).where(FieldVisibility.field_name == field_data.field_name)
        )
        field = result.scalar_one_or_none()

        if field:
            field.visible_to_admin = field_data.visible_to_admin
            field.visible_to_user = field_data.visible_to_user
            field.updated_by_user_id = current_user.id
            updated_count += 1

    await db.commit()

    return {"message": f"Updated {updated_count} fields", "updated_count": updated_count}
