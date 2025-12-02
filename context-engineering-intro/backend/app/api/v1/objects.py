"""
Object management API endpoints

This module provides endpoints for:
- Object CRUD operations with role-based access control
- Contact assignment and management
- User assignment with granular permissions
- Website management for objects
- Bulk operations with advanced filtering
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, DatabaseSession
from app.models.user import UserRole
from app.services.object_service import ObjectService
from app.schemas.object import (
    ObjectCreate,
    ObjectUpdate,
    ObjectResponse,
    ObjectListResponse,
    ObjectContactResponse,
    ObjectUserResponse,
    ObjectWebsiteResponse,
    ObjectUserCreate,
    ObjectWebsiteCreate,
    ObjectWebsiteUpdate,
    PermissionSet,
    BulkContactAssignment,
    BulkUserAssignment,
    BulkOperationResult,
    ObjectSearchParams,
    ObjectContactWithContact,
    ObjectContactListResponse,
    ContactBasicInfo,
    ObjectUserWithUser,
    UserBasicInfo,
)
from app.schemas.contact import ContactResponse
from app.core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)

router = APIRouter(prefix="/objects", tags=["Objects"])


# ==================== Object CRUD Endpoints ====================

@router.post("/", response_model=ObjectResponse)
async def create_object(
    object_data: ObjectCreate,
    current_user: CurrentUser,
    db: DatabaseSession
) -> ObjectResponse:
    """
    Create a new object (Owner only)

    Only users with the Owner role can create new objects.
    The creator is automatically assigned as the object owner with full permissions.
    """
    service = ObjectService(db)

    try:
        return await service.create_object(current_user, object_data)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=ObjectListResponse)
async def list_objects(
    current_user: CurrentUser,
    db: DatabaseSession,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    search: Optional[str] = Query(None, description="Search in name and company info"),
    type: Optional[str] = Query(None, description="Filter by object type")
) -> ObjectListResponse:
    """
    List objects visible to the current user

    - Owner: Can see all objects
    - Admin/User: Can only see objects they are assigned to
    """
    service = ObjectService(db)

    objects, total = await service.list_objects(
        current_user,
        skip=skip,
        limit=limit,
        search=search,
        type_filter=type
    )

    return ObjectListResponse(
        objects=objects,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{object_id}", response_model=ObjectResponse)
async def get_object(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> ObjectResponse:
    """
    Get object details

    Users must have view permission on the object or be an Owner.
    """
    service = ObjectService(db)

    try:
        return await service.get_object(current_user, object_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.put("/{object_id}", response_model=ObjectResponse)
async def update_object(
    object_id: UUID,
    object_data: ObjectUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
) -> ObjectResponse:
    """
    Update object details

    Users must have 'can_manage_company_info' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        return await service.update_object(current_user, object_id, object_data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{object_id}", response_model=dict)
async def delete_object(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> dict:
    """
    Delete an object (soft delete)

    Users must have 'can_delete_object' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        success = await service.delete_object(current_user, object_id)
        return {"success": success, "message": "Object deleted successfully"}
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# ==================== Contact Management Endpoints ====================

@router.get("/{object_id}/contacts", response_model=ObjectContactListResponse)
async def list_object_contacts(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    search: Optional[str] = Query(None, description="Search in contact name, email, phone")
) -> ObjectContactListResponse:
    """
    List contacts in an object with full ObjectContact relationship info

    - Owner/Admin: Can see all contacts in the object
    - User: Can only see contacts assigned to them within the object
    """
    service = ObjectService(db)

    try:
        object_contacts, total = await service.list_object_contacts_with_details(
            current_user,
            object_id,
            skip=skip,
            limit=limit,
            search=search
        )

        # Calculate pagination info
        page = (skip // limit) + 1 if limit > 0 else 1
        page_size = limit
        pages = (total + limit - 1) // limit if limit > 0 else 1

        # Convert to response format with nested contact
        items = []
        for oc in object_contacts:
            contact_info = ContactBasicInfo(
                id=oc.contact.id,
                first_name=oc.contact.first_name,
                last_name=oc.contact.last_name,
                email=oc.contact.email,
                phone=oc.contact.phone,
                company=oc.contact.company,
                status=oc.contact.status.value if oc.contact.status else None
            ) if oc.contact else None

            if contact_info:
                items.append(ObjectContactWithContact(
                    id=oc.id,
                    object_id=oc.object_id,
                    contact_id=oc.contact_id,
                    role=oc.role,
                    department=oc.department,
                    assigned_at=oc.assigned_at,
                    contact=contact_info
                ))

        return ObjectContactListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/{object_id}/contacts", response_model=BulkOperationResult)
async def assign_contacts_to_object(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    contact_ids: List[UUID] = Body(..., description="List of contact IDs to assign"),
    role: Optional[str] = Body(None, description="Role of contacts in the organization"),
    department: Optional[str] = Body(None, description="Department of contacts")
) -> BulkOperationResult:
    """
    Assign contacts to an object

    Users must have 'can_manage_contacts' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        return await service.assign_contacts_to_object(
            current_user,
            object_id,
            contact_ids,
            role=role,
            department=department
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/{object_id}/contacts/bulk", response_model=BulkOperationResult)
async def bulk_assign_contacts_with_filters(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    filters: Dict[str, Any] = Body(..., description="Filters to select contacts"),
    role: Optional[str] = Body(None, description="Default role for contacts"),
    department: Optional[str] = Body(None, description="Default department for contacts")
) -> BulkOperationResult:
    """
    Bulk assign contacts to an object based on filters

    Available filters:
    - tag_ids: List of tag IDs
    - status: Contact status
    - created_after: DateTime
    - created_before: DateTime
    - search: Search term
    - exclude_object_ids: Exclude contacts already in these objects
    - logic: "AND" or "OR" (default: "AND")
    """
    service = ObjectService(db)

    try:
        return await service.bulk_assign_with_filters(
            current_user,
            object_id,
            filters,
            role=role,
            department=department
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{object_id}/contacts/{contact_id}", response_model=dict)
async def remove_contact_from_object(
    object_id: UUID,
    contact_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> dict:
    """
    Remove a contact from an object

    Users must have 'can_manage_contacts' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        success = await service.remove_contact_from_object(
            current_user,
            object_id,
            contact_id
        )
        return {
            "success": success,
            "message": "Contact removed from object" if success else "Contact was not in object"
        }
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# ==================== User/Profile Management Endpoints ====================

@router.get("/{object_id}/users", response_model=List[ObjectUserWithUser])
async def list_object_users(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> List[ObjectUserWithUser]:
    """
    List users assigned to an object with nested user info

    Users must have view permission on the object or be an Owner.
    """
    service = ObjectService(db)

    try:
        object_users = await service.list_object_users(current_user, object_id)

        # Convert to response format with nested user
        responses = []
        for ou in object_users:
            if ou.user:
                user_info = UserBasicInfo(
                    id=ou.user.id,
                    email=ou.user.email,
                    first_name=ou.user.first_name,
                    last_name=ou.user.last_name,
                    role=ou.user.role.value if ou.user.role else None
                )
                responses.append(ObjectUserWithUser(
                    id=ou.id,
                    object_id=ou.object_id,
                    user_id=ou.user_id,
                    permissions=PermissionSet(**ou.permissions) if ou.permissions else PermissionSet(),
                    role_name=ou.role_name,
                    assigned_at=ou.assigned_at,
                    user=user_info
                ))

        return responses
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/{object_id}/users", response_model=ObjectUserResponse)
async def assign_user_to_object(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    user_id: UUID = Body(..., description="User ID to assign"),
    permissions: PermissionSet = Body(default_factory=PermissionSet, description="User permissions"),
    role_name: Optional[str] = Body(None, description="User's role in the object context")
) -> ObjectUserResponse:
    """
    Assign a user to an object with specific permissions

    Users must have 'can_assign_users' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        object_user = await service.assign_user_to_object(
            current_user,
            object_id,
            user_id,
            permissions,
            role_name
        )

        return ObjectUserResponse(
            id=object_user.id,
            object_id=object_user.object_id,
            user_id=object_user.user_id,
            permissions=PermissionSet(**object_user.permissions),
            role_name=object_user.role_name,
            assigned_at=object_user.assigned_at,
            assigned_by=object_user.assigned_by
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{object_id}/users/{user_id}", response_model=ObjectUserResponse)
async def update_user_permissions(
    object_id: UUID,
    user_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    permissions: PermissionSet = Body(..., description="Updated permissions"),
    role_name: Optional[str] = Body(None, description="Updated role name")
) -> ObjectUserResponse:
    """
    Update user permissions for an object

    Users must have 'can_assign_users' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        object_user = await service.update_user_permissions(
            current_user,
            object_id,
            user_id,
            permissions,
            role_name
        )

        return ObjectUserResponse(
            id=object_user.id,
            object_id=object_user.object_id,
            user_id=object_user.user_id,
            permissions=PermissionSet(**object_user.permissions),
            role_name=object_user.role_name,
            assigned_at=object_user.assigned_at,
            assigned_by=object_user.assigned_by
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{object_id}/users/{user_id}", response_model=dict)
async def remove_user_from_object(
    object_id: UUID,
    user_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> dict:
    """
    Remove a user from an object

    Users must have 'can_assign_users' permission or be an Owner.
    Cannot remove the last owner from an object.
    """
    service = ObjectService(db)

    try:
        success = await service.remove_user_from_object(
            current_user,
            object_id,
            user_id
        )
        return {
            "success": success,
            "message": "User removed from object" if success else "User was not assigned to object"
        }
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# ==================== Website Management Endpoints ====================

@router.get("/{object_id}/websites", response_model=List[ObjectWebsiteResponse])
async def list_object_websites(
    object_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> List[ObjectWebsiteResponse]:
    """
    List websites for an object

    Users must have view permission on the object or be an Owner.
    """
    service = ObjectService(db)

    try:
        websites = await service.list_object_websites(current_user, object_id)

        # Convert to response format
        responses = []
        for website in websites:
            responses.append(ObjectWebsiteResponse(
                id=website.id,
                object_id=website.object_id,
                name=website.name,
                slug=website.slug,
                custom_domain=website.custom_domain,
                content=website.content,
                published=website.published,
                ssl_provisioned=website.ssl_provisioned,
                created_at=website.created_at,
                updated_at=website.updated_at,
                published_at=website.published_at,
                url=f"https://{website.custom_domain}" if website.custom_domain else f"https://{website.slug}.app.example.com"
            ))

        return responses
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/{object_id}/websites", response_model=ObjectWebsiteResponse)
async def create_website(
    object_id: UUID,
    website_data: ObjectWebsiteCreate,
    current_user: CurrentUser,
    db: DatabaseSession
) -> ObjectWebsiteResponse:
    """
    Create a website for an object

    Users must have 'can_manage_websites' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        website = await service.create_website(
            current_user,
            object_id,
            website_data
        )

        return ObjectWebsiteResponse(
            id=website.id,
            object_id=website.object_id,
            name=website.name,
            slug=website.slug,
            custom_domain=website.custom_domain,
            content=website.content,
            published=website.published,
            ssl_provisioned=website.ssl_provisioned,
            created_at=website.created_at,
            updated_at=website.updated_at,
            published_at=website.published_at,
            url=f"https://{website.custom_domain}" if website.custom_domain else f"https://{website.slug}.app.example.com"
        )
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.put("/{object_id}/websites/{website_id}", response_model=ObjectWebsiteResponse)
async def update_website(
    object_id: UUID,
    website_id: UUID,
    website_data: ObjectWebsiteUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
) -> ObjectWebsiteResponse:
    """
    Update a website

    Users must have 'can_manage_websites' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        website = await service.update_website(
            current_user,
            object_id,
            website_id,
            website_data
        )

        return ObjectWebsiteResponse(
            id=website.id,
            object_id=website.object_id,
            name=website.name,
            slug=website.slug,
            custom_domain=website.custom_domain,
            content=website.content,
            published=website.published,
            ssl_provisioned=website.ssl_provisioned,
            created_at=website.created_at,
            updated_at=website.updated_at,
            published_at=website.published_at,
            url=f"https://{website.custom_domain}" if website.custom_domain else f"https://{website.slug}.app.example.com"
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{object_id}/websites/{website_id}", response_model=dict)
async def delete_website(
    object_id: UUID,
    website_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> dict:
    """
    Delete a website

    Users must have 'can_manage_websites' permission or be an Owner.
    """
    service = ObjectService(db)

    try:
        success = await service.delete_website(
            current_user,
            object_id,
            website_id
        )
        return {
            "success": success,
            "message": "Website deleted successfully" if success else "Website not found"
        }
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# ==================== Bulk Assignment Endpoints ====================

@router.post("/bulk/assign-contacts", response_model=BulkOperationResult)
async def bulk_assign_contacts(
    assignments: BulkContactAssignment,
    current_user: CurrentUser,
    db: DatabaseSession
) -> BulkOperationResult:
    """
    Bulk assign contacts to an object

    Users must have 'can_manage_contacts' permission on the target object or be an Owner.
    """
    service = ObjectService(db)

    try:
        return await service.assign_contacts_to_object(
            current_user,
            assignments.object_id,
            assignments.contact_ids,
            role=assignments.role,
            department=assignments.department
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/bulk/assign-users", response_model=BulkOperationResult)
async def bulk_assign_users(
    assignments: BulkUserAssignment,
    current_user: CurrentUser,
    db: DatabaseSession
) -> BulkOperationResult:
    """
    Bulk assign users to an object

    Users must have 'can_assign_users' permission on the target object or be an Owner.
    """
    service = ObjectService(db)

    succeeded = 0
    failed = 0
    errors = []

    for user_id in assignments.user_ids:
        try:
            await service.assign_user_to_object(
                current_user,
                assignments.object_id,
                user_id,
                assignments.permissions,
                assignments.role_name
            )
            succeeded += 1
        except Exception as e:
            failed += 1
            errors.append({
                "user_id": str(user_id),
                "error": str(e)
            })

    return BulkOperationResult(
        success=failed == 0,
        total=len(assignments.user_ids),
        succeeded=succeeded,
        failed=failed,
        errors=errors
    )