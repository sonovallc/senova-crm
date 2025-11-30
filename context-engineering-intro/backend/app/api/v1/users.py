"""
User Management API endpoints

Features:
- List users (owner/admin only)
- Get user details
- Approve users (owner/admin only)
- Deactivate users (owner/admin only)
- Change user roles (owner only)
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundError, ValidationError
from app.utils.permissions import can_manage_users, filter_user_list_by_role
from app.utils.password import is_password_valid, get_password_validation_errors
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["User Management"])


# Schemas
class UserResponse(BaseModel):
    """User response schema"""
    id: UUID
    email: EmailStr
    first_name: Optional[str]
    last_name: Optional[str]
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    is_approved: bool
    is_verified: bool
    approved_at: Optional[datetime]
    deactivated_at: Optional[datetime]
    created_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """User list response"""
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ApproveUserRequest(BaseModel):
    """Request to approve a user"""
    user_id: UUID


class DeactivateUserRequest(BaseModel):
    """Request to deactivate a user"""
    user_id: UUID


class ChangeRoleRequest(BaseModel):
    """Request to change user role"""
    user_id: UUID
    new_role: UserRole


class ResetPasswordRequest(BaseModel):
    """Request to reset user password"""
    user_id: UUID
    new_password: str


class DeleteUserRequest(BaseModel):
    """Request to delete a user"""
    user_id: UUID


# Endpoints
@router.get("/", response_model=UserListResponse)
async def list_users(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    role_filter: Optional[UserRole] = Query(None, alias="role"),
    is_active: Optional[bool] = Query(None),
    is_approved: Optional[bool] = Query(None),
):
    """
    List all users with pagination and filtering.

    RBAC Rules:
    - Owner/Admin: Can view all users
    - User: Can only view themselves

    Requires authentication
    """
    # Check permissions
    if not await can_manage_users(current_user):
        # Regular users can only see themselves
        return UserListResponse(
            items=[UserResponse.model_validate(current_user)],
            total=1,
            page=1,
            page_size=1,
            pages=1,
        )

    # Build base query
    query = select(User)

    # Apply filters
    filters = []

    if role_filter:
        filters.append(User.role == role_filter)

    if is_active is not None:
        filters.append(User.is_active == is_active)

    if is_approved is not None:
        filters.append(User.is_approved == is_approved)

    if filters:
        query = query.where(*filters)

    # Order by newest first
    query = query.order_by(User.created_at.desc())

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(User).where(*filters if filters else [])
    )
    total = count_result.scalar()

    # Calculate pagination
    skip = (page - 1) * page_size
    pages = (total + page_size - 1) // page_size

    # Apply pagination
    query = query.offset(skip).limit(page_size)

    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get single user by ID.

    RBAC Rules:
    - Owner/Admin: Can view any user
    - User: Can only view themselves

    Requires authentication
    """
    user = await db.get(User, user_id)

    if not user:
        raise NotFoundError(f"User {user_id} not found")

    # Check permissions
    if not await can_manage_users(current_user) and user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this user"
        )

    return UserResponse.model_validate(user)


@router.post("/approve", response_model=UserResponse)
async def approve_user(
    data: ApproveUserRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Approve a user account.

    RBAC Rules:
    - Owner/Admin: Can approve users
    - User: Cannot approve users

    Requires authentication
    """
    # Check permissions
    if not await can_manage_users(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to approve users"
        )

    user = await db.get(User, data.user_id)

    if not user:
        raise NotFoundError(f"User {data.user_id} not found")

    # Cannot approve yourself
    if user.id == current_user.id:
        raise ValidationError("You cannot approve yourself")

    # Cannot approve owner accounts
    if user.role == 'owner':
        raise ValidationError("Owner accounts cannot be approved")

    # Approve user
    user.is_approved = True
    user.approved_by_user_id = current_user.id
    user.approved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/deactivate", response_model=UserResponse)
async def deactivate_user(
    data: DeactivateUserRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Deactivate a user account.

    RBAC Rules:
    - Owner/Admin: Can deactivate users
    - User: Cannot deactivate users

    Requires authentication
    """
    # Check permissions
    if not await can_manage_users(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to deactivate users"
        )

    user = await db.get(User, data.user_id)

    if not user:
        raise NotFoundError(f"User {data.user_id} not found")

    # Cannot deactivate yourself
    if user.id == current_user.id:
        raise ValidationError("You cannot deactivate yourself")

    # Cannot deactivate owner accounts
    if user.role == 'owner':
        raise ValidationError("Owner accounts cannot be deactivated")

    # Deactivate user
    user.is_active = False
    user.deactivated_by_user_id = current_user.id
    user.deactivated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/reactivate", response_model=UserResponse)
async def reactivate_user(
    data: DeactivateUserRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Reactivate a deactivated user account.

    RBAC Rules:
    - Owner/Admin: Can reactivate users
    - User: Cannot reactivate users

    Requires authentication
    """
    # Check permissions
    if not await can_manage_users(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to reactivate users"
        )

    user = await db.get(User, data.user_id)

    if not user:
        raise NotFoundError(f"User {data.user_id} not found")

    # Cannot reactivate owner accounts
    if user.role == 'owner':
        raise ValidationError("Owner accounts cannot be reactivated")

    # Admin can only reactivate regular users
    if current_user.role == 'admin' and user.role != 'user':
        raise ValidationError("Admins can only reactivate regular users")

    # Reactivate user
    user.is_active = True
    user.deactivated_at = None
    user.deactivated_by_user_id = None

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/change-role", response_model=UserResponse)
async def change_user_role(
    data: ChangeRoleRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Change a user's role.

    RBAC Rules:
    - Owner: Can change any user's role
    - Admin: Cannot change roles
    - User: Cannot change roles

    Requires authentication
    """
    # Only owner can change roles
    if current_user.role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can change user roles"
        )

    user = await db.get(User, data.user_id)

    if not user:
        raise NotFoundError(f"User {data.user_id} not found")

    # Cannot change your own role
    if user.id == current_user.id:
        raise ValidationError("You cannot change your own role")

    # Cannot change from/to owner role
    if user.role == 'owner' or data.new_role == 'owner':
        raise ValidationError("Owner role cannot be changed")

    # Change role
    old_role = user.role
    user.role = data.new_role

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/reset-password", response_model=UserResponse)
async def reset_user_password(
    data: ResetPasswordRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Reset a user's password.

    RBAC Rules:
    - Owner/Admin: Can reset other users' passwords
    - User: Can reset their own password

    Requires authentication
    """
    user = await db.get(User, data.user_id)

    if not user:
        raise NotFoundError(f"User {data.user_id} not found")

    # Check permissions
    # Users can reset their own password, or owner/admin can reset any password
    is_self = user.id == current_user.id
    can_manage = await can_manage_users(current_user)

    if not is_self and not can_manage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to reset this user's password"
        )

    # Validate password requirements
    if not is_password_valid(data.new_password):
        validation_errors = get_password_validation_errors(data.new_password)
        raise ValidationError(f"Password does not meet requirements: {', '.join(validation_errors)}")

    # Hash and update password
    user.hashed_password = get_password_hash(data.new_password)

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.delete("/delete", status_code=status.HTTP_200_OK)
async def delete_user(
    data: DeleteUserRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete a user account permanently.

    RBAC Rules:
    - Owner: Can delete any user except themselves
    - Admin: Can delete regular users only
    - User: Cannot delete users

    Requires authentication

    Note: This is a hard delete. The user and all associated data will be permanently removed.
    """
    # Check permissions
    if not await can_manage_users(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete users"
        )

    user = await db.get(User, data.user_id)

    if not user:
        raise NotFoundError(f"User {data.user_id} not found")

    # Cannot delete yourself
    if user.id == current_user.id:
        raise ValidationError("You cannot delete yourself")

    # Cannot delete owner accounts
    if user.role == 'owner':
        raise ValidationError("Owner accounts cannot be deleted")

    # Admin can only delete regular users
    if current_user.role == 'admin' and user.role != 'user':
        raise ValidationError("Admins can only delete regular users")

    # Delete the user (hard delete)
    # SQLAlchemy will handle cascading deletes based on relationship configurations
    await db.delete(user)
    await db.commit()

    return {"message": f"User {user.email} has been permanently deleted", "deleted_user_id": str(user.id)}
