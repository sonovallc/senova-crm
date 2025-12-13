"""
SMS Sending Profiles API endpoints with RBAC

Mirrors the email_profiles.py pattern for consistent UX.

RBAC Permissions:
- Owner: Full CRUD on profiles + assign to any user
- Admin: View profiles, view own assignments
- User: View own assigned profiles only
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from pydantic import BaseModel, Field
import logging
import uuid as uuid_lib

from app.api.dependencies import CurrentUser, DatabaseSession
from app.models.user import UserRole

router = APIRouter(prefix="/sms-profiles", tags=["SMS Profiles"])
logger = logging.getLogger(__name__)


# =========================================================================
# SCHEMAS
# =========================================================================

class SMSProfileResponse(BaseModel):
    """SMS profile response schema"""
    id: UUID
    object_id: UUID
    object_name: Optional[str] = None
    phone_number_id: UUID
    phone_number: str  # Actual phone number
    phone_number_friendly_name: Optional[str] = None
    display_name: str
    signature: Optional[str] = None
    max_messages_per_day: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    assigned_user_count: int = 0

    class Config:
        from_attributes = True


class AssignedSMSProfileResponse(BaseModel):
    """Profile assigned to user response"""
    id: UUID
    phone_number: str
    display_name: str
    signature: Optional[str] = None
    is_default: bool

    class Config:
        from_attributes = True


class AssignedUserResponse(BaseModel):
    """User assigned to a profile"""
    id: UUID
    email: str
    full_name: Optional[str] = None
    is_default: bool


class ProfileWithAssignments(BaseModel):
    """Profile with its assigned users"""
    profile: SMSProfileResponse
    assigned_users: List[AssignedUserResponse]


class CreateSMSProfileRequest(BaseModel):
    """Create SMS profile request"""
    object_id: UUID = Field(..., description="Object this profile belongs to")
    phone_number_id: UUID = Field(..., description="Phone number to use for sending")
    display_name: str = Field(..., min_length=1, max_length=255, description="Display name for sender")
    signature: Optional[str] = Field(None, description="Signature appended to messages")
    max_messages_per_day: Optional[str] = Field(None, description="Daily message limit (optional)")


class UpdateSMSProfileRequest(BaseModel):
    """Update SMS profile request"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    signature: Optional[str] = None
    max_messages_per_day: Optional[str] = None
    is_active: Optional[bool] = None


class UserAssignment(BaseModel):
    """User assignment request"""
    user_id: UUID
    is_default: Optional[bool] = False


# =========================================================================
# USER ENDPOINT - MY PROFILES
# =========================================================================

@router.get("/my-profiles", response_model=List[AssignedSMSProfileResponse])
async def get_my_sms_profiles(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get SMS profiles assigned to the current user.
    All authenticated users can access this endpoint.
    """
    query = text("""
        SELECT
            ssp.id,
            tpn.phone_number,
            ssp.display_name,
            ssp.signature,
            uspa.is_default
        FROM sms_sending_profiles ssp
        INNER JOIN user_sms_profile_assignments uspa ON ssp.id = uspa.profile_id
        INNER JOIN telnyx_phone_numbers tpn ON ssp.phone_number_id = tpn.id
        WHERE uspa.user_id = :user_id AND ssp.is_active = true
        ORDER BY uspa.is_default DESC, ssp.display_name ASC
    """)

    result = await db.execute(query, {"user_id": str(current_user.id)})
    rows = result.fetchall()

    return [
        AssignedSMSProfileResponse(
            id=row.id,
            phone_number=row.phone_number,
            display_name=row.display_name,
            signature=row.signature,
            is_default=row.is_default,
        )
        for row in rows
    ]


# =========================================================================
# OWNER ENDPOINTS
# =========================================================================

@router.get("/", response_model=List[SMSProfileResponse])
async def list_sms_profiles(
    db: DatabaseSession,
    current_user: CurrentUser,
    is_active: Optional[bool] = None,
    object_id: Optional[UUID] = None,
):
    """
    List all SMS profiles.

    - Owner: See all profiles
    - Admin: See profiles for objects they have access to
    - User: Not allowed (use /my-profiles instead)
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users should use /my-profiles endpoint"
        )

    query = """
        SELECT
            ssp.id,
            ssp.object_id,
            o.name as object_name,
            ssp.phone_number_id,
            tpn.phone_number,
            tpn.friendly_name as phone_number_friendly_name,
            ssp.display_name,
            ssp.signature,
            ssp.max_messages_per_day,
            ssp.is_active,
            ssp.created_at,
            ssp.updated_at,
            COUNT(uspa.user_id) as assigned_user_count
        FROM sms_sending_profiles ssp
        LEFT JOIN user_sms_profile_assignments uspa ON ssp.id = uspa.profile_id
        LEFT JOIN objects o ON ssp.object_id = o.id
        LEFT JOIN telnyx_phone_numbers tpn ON ssp.phone_number_id = tpn.id
    """

    params = {}
    conditions = []

    if user_role != 'owner':
        # Admin: Filter by objects they have access to
        query = query.replace("FROM sms_sending_profiles ssp",
                             "FROM sms_sending_profiles ssp INNER JOIN object_users ou ON ssp.object_id = ou.object_id")
        conditions.append("ou.user_id = :user_id")
        params["user_id"] = str(current_user.id)

    if is_active is not None:
        conditions.append("ssp.is_active = :is_active")
        params["is_active"] = is_active

    if object_id:
        conditions.append("ssp.object_id = :object_id")
        params["object_id"] = str(object_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " GROUP BY ssp.id, o.name, tpn.phone_number, tpn.friendly_name ORDER BY ssp.display_name ASC"

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    return [
        SMSProfileResponse(
            id=row.id,
            object_id=row.object_id,
            object_name=row.object_name,
            phone_number_id=row.phone_number_id,
            phone_number=row.phone_number,
            phone_number_friendly_name=row.phone_number_friendly_name,
            display_name=row.display_name,
            signature=row.signature,
            max_messages_per_day=row.max_messages_per_day,
            is_active=row.is_active,
            created_at=row.created_at,
            updated_at=row.updated_at,
            assigned_user_count=row.assigned_user_count,
        )
        for row in rows
    ]


@router.get("/{profile_id}", response_model=ProfileWithAssignments)
async def get_sms_profile(
    profile_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get a specific SMS profile with its assigned users (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can view profile details"
        )

    # Get profile
    profile_query = text("""
        SELECT
            ssp.id,
            ssp.object_id,
            o.name as object_name,
            ssp.phone_number_id,
            tpn.phone_number,
            tpn.friendly_name as phone_number_friendly_name,
            ssp.display_name,
            ssp.signature,
            ssp.max_messages_per_day,
            ssp.is_active,
            ssp.created_at,
            ssp.updated_at,
            (SELECT COUNT(*) FROM user_sms_profile_assignments WHERE profile_id = :profile_id) as assigned_user_count
        FROM sms_sending_profiles ssp
        LEFT JOIN objects o ON ssp.object_id = o.id
        LEFT JOIN telnyx_phone_numbers tpn ON ssp.phone_number_id = tpn.id
        WHERE ssp.id = :profile_id
    """)
    result = await db.execute(profile_query, {"profile_id": str(profile_id)})
    profile_row = result.fetchone()

    if not profile_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMS profile not found"
        )

    # Get assigned users
    users_query = text("""
        SELECT
            u.id, u.email, u.first_name, u.last_name, uspa.is_default
        FROM users u
        INNER JOIN user_sms_profile_assignments uspa ON u.id = uspa.user_id
        WHERE uspa.profile_id = :profile_id
        ORDER BY uspa.is_default DESC, u.email ASC
    """)
    users_result = await db.execute(users_query, {"profile_id": str(profile_id)})
    user_rows = users_result.fetchall()

    profile = SMSProfileResponse(
        id=profile_row.id,
        object_id=profile_row.object_id,
        object_name=profile_row.object_name,
        phone_number_id=profile_row.phone_number_id,
        phone_number=profile_row.phone_number,
        phone_number_friendly_name=profile_row.phone_number_friendly_name,
        display_name=profile_row.display_name,
        signature=profile_row.signature,
        max_messages_per_day=profile_row.max_messages_per_day,
        is_active=profile_row.is_active,
        created_at=profile_row.created_at,
        updated_at=profile_row.updated_at,
        assigned_user_count=profile_row.assigned_user_count,
    )

    assigned_users = []
    for user_row in user_rows:
        full_name = None
        if user_row.first_name or user_row.last_name:
            full_name = f"{user_row.first_name or ''} {user_row.last_name or ''}".strip()

        assigned_users.append(AssignedUserResponse(
            id=user_row.id,
            email=user_row.email,
            full_name=full_name,
            is_default=user_row.is_default,
        ))

    return ProfileWithAssignments(profile=profile, assigned_users=assigned_users)


@router.post("/", response_model=SMSProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_sms_profile(
    data: CreateSMSProfileRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create a new SMS profile (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create SMS profiles"
        )

    # Verify object exists
    object_query = text("SELECT id, name FROM objects WHERE id = :object_id AND deleted = false")
    result = await db.execute(object_query, {"object_id": str(data.object_id)})
    obj = result.fetchone()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found"
        )

    # Verify phone number exists and belongs to this object
    phone_query = text("""
        SELECT id, phone_number, friendly_name
        FROM telnyx_phone_numbers
        WHERE id = :phone_number_id AND object_id = :object_id AND status = 'active'
    """)
    result = await db.execute(phone_query, {
        "phone_number_id": str(data.phone_number_id),
        "object_id": str(data.object_id),
    })
    phone = result.fetchone()

    if not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number not found or not associated with this object"
        )

    profile_id = uuid_lib.uuid4()

    insert_query = text("""
        INSERT INTO sms_sending_profiles (
            id, object_id, phone_number_id, display_name, signature,
            max_messages_per_day, is_active, created_at, updated_at
        )
        VALUES (
            :id, :object_id, :phone_number_id, :display_name, :signature,
            :max_messages_per_day, true, NOW(), NOW()
        )
        RETURNING id, object_id, phone_number_id, display_name, signature,
                  max_messages_per_day, is_active, created_at, updated_at
    """)

    result = await db.execute(insert_query, {
        "id": str(profile_id),
        "object_id": str(data.object_id),
        "phone_number_id": str(data.phone_number_id),
        "display_name": data.display_name,
        "signature": data.signature,
        "max_messages_per_day": data.max_messages_per_day,
    })

    await db.commit()
    row = result.fetchone()

    return SMSProfileResponse(
        id=row.id,
        object_id=row.object_id,
        object_name=obj.name,
        phone_number_id=row.phone_number_id,
        phone_number=phone.phone_number,
        phone_number_friendly_name=phone.friendly_name,
        display_name=row.display_name,
        signature=row.signature,
        max_messages_per_day=row.max_messages_per_day,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
        assigned_user_count=0,
    )


@router.put("/{profile_id}", response_model=SMSProfileResponse)
async def update_sms_profile(
    profile_id: UUID,
    data: UpdateSMSProfileRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update an SMS profile (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can update SMS profiles"
        )

    updates = []
    params = {"profile_id": str(profile_id)}

    if data.display_name is not None:
        updates.append("display_name = :display_name")
        params["display_name"] = data.display_name

    if data.signature is not None:
        updates.append("signature = :signature")
        params["signature"] = data.signature

    if data.max_messages_per_day is not None:
        updates.append("max_messages_per_day = :max_messages_per_day")
        params["max_messages_per_day"] = data.max_messages_per_day

    if data.is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = data.is_active

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    updates.append("updated_at = NOW()")

    query = text(f"""
        UPDATE sms_sending_profiles
        SET {', '.join(updates)}
        WHERE id = :profile_id
        RETURNING id, object_id, phone_number_id, display_name, signature,
                  max_messages_per_day, is_active, created_at, updated_at,
                  (SELECT COUNT(*) FROM user_sms_profile_assignments WHERE profile_id = :profile_id) as assigned_user_count
    """)

    result = await db.execute(query, params)
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMS profile not found"
        )

    await db.commit()

    # Get related data
    obj_query = text("SELECT name FROM objects WHERE id = :object_id")
    obj_result = await db.execute(obj_query, {"object_id": str(row.object_id)})
    obj = obj_result.fetchone()

    phone_query = text("SELECT phone_number, friendly_name FROM telnyx_phone_numbers WHERE id = :phone_number_id")
    phone_result = await db.execute(phone_query, {"phone_number_id": str(row.phone_number_id)})
    phone = phone_result.fetchone()

    return SMSProfileResponse(
        id=row.id,
        object_id=row.object_id,
        object_name=obj.name if obj else None,
        phone_number_id=row.phone_number_id,
        phone_number=phone.phone_number if phone else "",
        phone_number_friendly_name=phone.friendly_name if phone else None,
        display_name=row.display_name,
        signature=row.signature,
        max_messages_per_day=row.max_messages_per_day,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
        assigned_user_count=row.assigned_user_count,
    )


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sms_profile(
    profile_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete an SMS profile (Owner only).
    This will also remove all user assignments.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can delete SMS profiles"
        )

    query = text("DELETE FROM sms_sending_profiles WHERE id = :profile_id RETURNING id")
    result = await db.execute(query, {"profile_id": str(profile_id)})

    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMS profile not found"
        )

    await db.commit()


# =========================================================================
# USER ASSIGNMENT ENDPOINTS
# =========================================================================

@router.post("/{profile_id}/assignments", status_code=status.HTTP_204_NO_CONTENT)
async def assign_users_to_profile(
    profile_id: UUID,
    assignments: List[UserAssignment],
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Assign users to an SMS profile (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can assign users to profiles"
        )

    # Verify profile exists
    check_query = text("SELECT id FROM sms_sending_profiles WHERE id = :profile_id")
    result = await db.execute(check_query, {"profile_id": str(profile_id)})
    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMS profile not found"
        )

    for assignment in assignments:
        # Check if assignment already exists
        check_query = text("""
            SELECT id FROM user_sms_profile_assignments
            WHERE user_id = :user_id AND profile_id = :profile_id
        """)
        result = await db.execute(check_query, {
            "user_id": str(assignment.user_id),
            "profile_id": str(profile_id),
        })

        if result.fetchone():
            # Update existing
            update_query = text("""
                UPDATE user_sms_profile_assignments
                SET is_default = :is_default
                WHERE user_id = :user_id AND profile_id = :profile_id
            """)
            await db.execute(update_query, {
                "user_id": str(assignment.user_id),
                "profile_id": str(profile_id),
                "is_default": assignment.is_default or False,
            })
        else:
            # Insert new
            insert_query = text("""
                INSERT INTO user_sms_profile_assignments (id, user_id, profile_id, is_default, created_at)
                VALUES (:id, :user_id, :profile_id, :is_default, NOW())
            """)
            await db.execute(insert_query, {
                "id": str(uuid_lib.uuid4()),
                "user_id": str(assignment.user_id),
                "profile_id": str(profile_id),
                "is_default": assignment.is_default or False,
            })

    await db.commit()


@router.delete("/{profile_id}/assignments/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_assignment(
    profile_id: UUID,
    user_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Remove a user's assignment from an SMS profile (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can remove user assignments"
        )

    query = text("""
        DELETE FROM user_sms_profile_assignments
        WHERE profile_id = :profile_id AND user_id = :user_id
        RETURNING id
    """)
    result = await db.execute(query, {
        "profile_id": str(profile_id),
        "user_id": str(user_id),
    })

    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    await db.commit()


@router.put("/{profile_id}/assignments/{user_id}/default", status_code=status.HTTP_204_NO_CONTENT)
async def set_default_profile(
    profile_id: UUID,
    user_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Set a profile as the default for a user (Owner only).
    This will unset any other default SMS profile for that user.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can set default profiles"
        )

    # Unset all other defaults for this user
    unset_query = text("""
        UPDATE user_sms_profile_assignments
        SET is_default = false
        WHERE user_id = :user_id
    """)
    await db.execute(unset_query, {"user_id": str(user_id)})

    # Set this one as default
    set_query = text("""
        UPDATE user_sms_profile_assignments
        SET is_default = true
        WHERE profile_id = :profile_id AND user_id = :user_id
        RETURNING id
    """)
    result = await db.execute(set_query, {
        "profile_id": str(profile_id),
        "user_id": str(user_id),
    })

    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    await db.commit()
