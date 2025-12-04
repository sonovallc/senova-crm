"""
Email Sending Profiles API endpoints with RBAC

RBAC Permissions:
- Owner: Full CRUD on profiles + assign to any user
- Admin: View profiles, view own assignments
- User: View own assigned profiles only
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.user import User, UserRole

router = APIRouter(prefix="/email-profiles", tags=["Email Profiles"])


# Schemas
class EmailProfileResponse(BaseModel):
    """Email profile response schema"""
    id: UUID
    object_id: Optional[UUID] = None
    object_name: Optional[str] = None
    mailgun_settings_id: Optional[UUID] = None
    mailgun_domain_name: Optional[str] = None  # Name of the Mailgun config
    sending_domain: Optional[str] = None  # Actual sending domain
    local_part: Optional[str] = None
    email_address: str
    display_name: str
    reply_to_address: str
    signature_html: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    assigned_user_count: int = 0

    class Config:
        from_attributes = True


class AssignedProfileResponse(BaseModel):
    """Profile assigned to user response"""
    id: UUID
    email_address: str
    display_name: str
    reply_to_address: str
    signature_html: Optional[str] = None
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
    profile: EmailProfileResponse
    assigned_users: List[AssignedUserResponse]


class CreateProfileRequest(BaseModel):
    """Create email profile request"""
    object_id: UUID = Field(..., description="Object this profile belongs to")
    mailgun_settings_id: Optional[UUID] = Field(None, description="Specific Mailgun domain to use (optional, uses object default if not specified)")
    email_local_part: str = Field(..., min_length=1, max_length=64, description="Local part of email (before @)")
    display_name: str = Field(..., min_length=1, max_length=255, description="Display name for sender")
    signature_html: Optional[str] = Field(None, description="HTML signature to append to emails")


class UpdateProfileRequest(BaseModel):
    """Update email profile request"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    signature_html: Optional[str] = None
    is_active: Optional[bool] = None


class UserAssignment(BaseModel):
    """User assignment request"""
    user_id: UUID
    is_default: Optional[bool] = False


# User endpoint - get current user's assigned profiles (accessible to all logged in users)
@router.get("/my-profiles", response_model=List[AssignedProfileResponse])
async def get_my_profiles(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get email profiles assigned to the current user.
    All authenticated users can access this endpoint.
    """
    query = """
        SELECT
            esp.id,
            esp.email_address,
            esp.display_name,
            esp.reply_to_address,
            esp.signature_html,
            uepa.is_default
        FROM email_sending_profiles esp
        INNER JOIN user_email_profile_assignments uepa ON esp.id = uepa.profile_id
        WHERE uepa.user_id = :user_id AND esp.is_active = true
        ORDER BY uepa.is_default DESC, esp.display_name ASC
    """

    from sqlalchemy import text
    result = await db.execute(text(query), {"user_id": str(current_user.id)})
    rows = result.fetchall()

    profiles = []
    for row in rows:
        profiles.append(AssignedProfileResponse(
            id=row.id,
            email_address=row.email_address,
            display_name=row.display_name,
            reply_to_address=row.reply_to_address,
            signature_html=row.signature_html,
            is_default=row.is_default
        ))

    return profiles


# Owner-only endpoints
@router.get("/", response_model=List[EmailProfileResponse])
async def list_profiles(
    db: DatabaseSession,
    current_user: CurrentUser,
    is_active: Optional[bool] = None,
):
    """
    List all email profiles (Owner only).
    Optionally filter by active status.
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can list all email profiles"
        )

    query = """
        SELECT
            esp.id,
            esp.object_id,
            o.name as object_name,
            esp.mailgun_settings_id,
            oms.name as mailgun_domain_name,
            oms.sending_domain,
            esp.local_part,
            esp.email_address,
            esp.display_name,
            esp.reply_to_address,
            esp.signature_html,
            esp.is_active,
            esp.created_at,
            esp.updated_at,
            COUNT(uepa.user_id) as assigned_user_count
        FROM email_sending_profiles esp
        LEFT JOIN user_email_profile_assignments uepa ON esp.id = uepa.profile_id
        LEFT JOIN objects o ON esp.object_id = o.id
        LEFT JOIN object_mailgun_settings oms ON esp.mailgun_settings_id = oms.id
    """

    params = {}
    if is_active is not None:
        query += " WHERE esp.is_active = :is_active"
        params["is_active"] = is_active

    query += " GROUP BY esp.id, o.name, oms.name, oms.sending_domain ORDER BY esp.display_name ASC"

    from sqlalchemy import text
    result = await db.execute(text(query), params)
    rows = result.fetchall()

    profiles = []
    for row in rows:
        profiles.append(EmailProfileResponse(
            id=row.id,
            object_id=row.object_id,
            object_name=row.object_name,
            mailgun_settings_id=row.mailgun_settings_id,
            mailgun_domain_name=row.mailgun_domain_name,
            sending_domain=row.sending_domain,
            local_part=row.local_part,
            email_address=row.email_address,
            display_name=row.display_name,
            reply_to_address=row.reply_to_address,
            signature_html=row.signature_html,
            is_active=row.is_active,
            created_at=row.created_at,
            updated_at=row.updated_at,
            assigned_user_count=row.assigned_user_count
        ))

    return profiles


@router.get("/{profile_id}", response_model=ProfileWithAssignments)
async def get_profile(
    profile_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get a specific email profile with its assigned users (Owner only).
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can view profile details"
        )

    from sqlalchemy import text

    # Get profile
    profile_query = """
        SELECT
            id, email_address, display_name, reply_to_address,
            signature_html, is_active, created_at, updated_at,
            (SELECT COUNT(*) FROM user_email_profile_assignments WHERE profile_id = :profile_id) as assigned_user_count
        FROM email_sending_profiles
        WHERE id = :profile_id
    """
    result = await db.execute(text(profile_query), {"profile_id": str(profile_id)})
    profile_row = result.fetchone()

    if not profile_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email profile not found"
        )

    # Get assigned users
    users_query = """
        SELECT
            u.id, u.email, u.first_name, u.last_name, uepa.is_default
        FROM users u
        INNER JOIN user_email_profile_assignments uepa ON u.id = uepa.user_id
        WHERE uepa.profile_id = :profile_id
        ORDER BY uepa.is_default DESC, u.email ASC
    """
    users_result = await db.execute(text(users_query), {"profile_id": str(profile_id)})
    user_rows = users_result.fetchall()

    profile = EmailProfileResponse(
        id=profile_row.id,
        email_address=profile_row.email_address,
        display_name=profile_row.display_name,
        reply_to_address=profile_row.reply_to_address,
        signature_html=profile_row.signature_html,
        is_active=profile_row.is_active,
        created_at=profile_row.created_at,
        updated_at=profile_row.updated_at,
        assigned_user_count=profile_row.assigned_user_count
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
            is_default=user_row.is_default
        ))

    return ProfileWithAssignments(profile=profile, assigned_users=assigned_users)


@router.post("/", response_model=EmailProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: CreateProfileRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create a new email profile (Owner only).
    The email address will be {local_part}@{object's mailgun sending domain}
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create email profiles"
        )

    from sqlalchemy import text
    import uuid

    profile_id = uuid.uuid4()

    # Check if object exists
    object_query = """
        SELECT id, name FROM objects
        WHERE id = :object_id AND deleted = false
    """
    result = await db.execute(text(object_query), {"object_id": str(data.object_id)})
    obj = result.fetchone()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found"
        )

    # Determine which Mailgun settings to use
    mailgun_settings_id = None
    sending_domain = None
    mailgun_domain_name = None

    if data.mailgun_settings_id:
        # Use the specific Mailgun settings specified
        mailgun_query = """
            SELECT id, name, sending_domain
            FROM object_mailgun_settings
            WHERE id = :mailgun_id AND object_id = :object_id
        """
        result = await db.execute(text(mailgun_query), {
            "mailgun_id": str(data.mailgun_settings_id),
            "object_id": str(data.object_id)
        })
        mailgun = result.fetchone()

        if not mailgun:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specified Mailgun settings not found for this object"
            )

        mailgun_settings_id = mailgun.id
        sending_domain = mailgun.sending_domain
        mailgun_domain_name = mailgun.name
    else:
        # Use the object's default Mailgun settings
        default_query = """
            SELECT id, name, sending_domain
            FROM object_mailgun_settings
            WHERE object_id = :object_id AND is_default = true
        """
        result = await db.execute(text(default_query), {"object_id": str(data.object_id)})
        default_mailgun = result.fetchone()

        if not default_mailgun:
            # Try to get any Mailgun settings
            any_query = """
                SELECT id, name, sending_domain
                FROM object_mailgun_settings
                WHERE object_id = :object_id
                ORDER BY created_at ASC
                LIMIT 1
            """
            result = await db.execute(text(any_query), {"object_id": str(data.object_id)})
            default_mailgun = result.fetchone()

        if not default_mailgun:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Object does not have Mailgun settings configured"
            )

        mailgun_settings_id = default_mailgun.id
        sending_domain = default_mailgun.sending_domain
        mailgun_domain_name = default_mailgun.name

    # Construct email address
    email_address = f"{data.email_local_part}@{sending_domain}"

    # Check if email already exists
    check_query = "SELECT id FROM email_sending_profiles WHERE email_address = :email"
    result = await db.execute(text(check_query), {"email": email_address})
    if result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email address {email_address} already exists"
        )

    insert_query = """
        INSERT INTO email_sending_profiles (
            id, object_id, mailgun_settings_id, local_part, email_address, display_name,
            reply_to_address, signature_html, is_active, created_at, updated_at
        )
        VALUES (
            :id, :object_id, :mailgun_settings_id, :local_part, :email, :display_name,
            :reply_to, :signature, true, NOW(), NOW()
        )
        RETURNING id, object_id, mailgun_settings_id, local_part, email_address, display_name,
                  reply_to_address, signature_html, is_active, created_at, updated_at
    """

    result = await db.execute(text(insert_query), {
        "id": str(profile_id),
        "object_id": str(data.object_id),
        "mailgun_settings_id": str(mailgun_settings_id) if mailgun_settings_id else None,
        "local_part": data.email_local_part,
        "email": email_address,
        "display_name": data.display_name,
        "reply_to": email_address,  # Default reply-to is same as email
        "signature": data.signature_html
    })

    await db.commit()
    row = result.fetchone()

    return EmailProfileResponse(
        id=row.id,
        object_id=row.object_id,
        object_name=obj.name,
        mailgun_settings_id=row.mailgun_settings_id,
        mailgun_domain_name=mailgun_domain_name,
        sending_domain=sending_domain,
        local_part=row.local_part,
        email_address=row.email_address,
        display_name=row.display_name,
        reply_to_address=row.reply_to_address,
        signature_html=row.signature_html,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
        assigned_user_count=0
    )


@router.put("/{profile_id}", response_model=EmailProfileResponse)
async def update_profile(
    profile_id: UUID,
    data: UpdateProfileRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update an email profile (Owner only).
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can update email profiles"
        )

    from sqlalchemy import text

    # Build update query dynamically
    updates = []
    params = {"profile_id": str(profile_id)}

    if data.display_name is not None:
        updates.append("display_name = :display_name")
        params["display_name"] = data.display_name

    if data.signature_html is not None:
        updates.append("signature_html = :signature_html")
        params["signature_html"] = data.signature_html

    if data.is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = data.is_active

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    updates.append("updated_at = NOW()")

    query = f"""
        UPDATE email_sending_profiles
        SET {', '.join(updates)}
        WHERE id = :profile_id
        RETURNING id, email_address, display_name, reply_to_address, signature_html, is_active, created_at, updated_at,
        (SELECT COUNT(*) FROM user_email_profile_assignments WHERE profile_id = :profile_id) as assigned_user_count
    """

    result = await db.execute(text(query), params)
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email profile not found"
        )

    await db.commit()

    return EmailProfileResponse(
        id=row.id,
        email_address=row.email_address,
        display_name=row.display_name,
        reply_to_address=row.reply_to_address,
        signature_html=row.signature_html,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
        assigned_user_count=row.assigned_user_count
    )


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete an email profile (Owner only).
    This will also remove all user assignments.
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can delete email profiles"
        )

    from sqlalchemy import text

    # Delete profile (assignments cascade)
    query = "DELETE FROM email_sending_profiles WHERE id = :profile_id RETURNING id"
    result = await db.execute(text(query), {"profile_id": str(profile_id)})

    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email profile not found"
        )

    await db.commit()


@router.post("/{profile_id}/assignments", status_code=status.HTTP_204_NO_CONTENT)
async def assign_users(
    profile_id: UUID,
    assignments: List[UserAssignment],
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Assign users to an email profile (Owner only).
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can assign users to profiles"
        )

    from sqlalchemy import text
    import uuid

    # Verify profile exists
    check_query = "SELECT id FROM email_sending_profiles WHERE id = :profile_id"
    result = await db.execute(text(check_query), {"profile_id": str(profile_id)})
    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email profile not found"
        )

    for assignment in assignments:
        # Check if assignment already exists
        check_query = """
            SELECT id FROM user_email_profile_assignments
            WHERE user_id = :user_id AND profile_id = :profile_id
        """
        result = await db.execute(text(check_query), {
            "user_id": str(assignment.user_id),
            "profile_id": str(profile_id)
        })

        if result.fetchone():
            # Update existing
            update_query = """
                UPDATE user_email_profile_assignments
                SET is_default = :is_default
                WHERE user_id = :user_id AND profile_id = :profile_id
            """
            await db.execute(text(update_query), {
                "user_id": str(assignment.user_id),
                "profile_id": str(profile_id),
                "is_default": assignment.is_default or False
            })
        else:
            # Insert new
            insert_query = """
                INSERT INTO user_email_profile_assignments (id, user_id, profile_id, is_default, created_at)
                VALUES (:id, :user_id, :profile_id, :is_default, NOW())
            """
            await db.execute(text(insert_query), {
                "id": str(uuid.uuid4()),
                "user_id": str(assignment.user_id),
                "profile_id": str(profile_id),
                "is_default": assignment.is_default or False
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
    Remove a user's assignment from an email profile (Owner only).
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can remove user assignments"
        )

    from sqlalchemy import text

    query = """
        DELETE FROM user_email_profile_assignments
        WHERE profile_id = :profile_id AND user_id = :user_id
        RETURNING id
    """
    result = await db.execute(text(query), {
        "profile_id": str(profile_id),
        "user_id": str(user_id)
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
    This will unset any other default profile for that user.
    """
    if current_user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can set default profiles"
        )

    from sqlalchemy import text

    # Unset all other defaults for this user
    unset_query = """
        UPDATE user_email_profile_assignments
        SET is_default = false
        WHERE user_id = :user_id
    """
    await db.execute(text(unset_query), {"user_id": str(user_id)})

    # Set this one as default
    set_query = """
        UPDATE user_email_profile_assignments
        SET is_default = true
        WHERE profile_id = :profile_id AND user_id = :user_id
        RETURNING id
    """
    result = await db.execute(text(set_query), {
        "profile_id": str(profile_id),
        "user_id": str(user_id)
    })

    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    await db.commit()
