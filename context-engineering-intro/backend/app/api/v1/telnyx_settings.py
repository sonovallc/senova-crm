"""
Telnyx Settings API endpoints

RBAC Permissions:
- Owner: Full CRUD on Telnyx settings per Object
- Admin: View settings for objects they have access to
- User: No access

Features:
- Encrypted API key storage
- Per-object Telnyx configuration
- Credential verification
"""

from typing import Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from pydantic import BaseModel, Field
import logging

from app.api.dependencies import CurrentUser, DatabaseSession
from app.models.user import UserRole
from app.services.telnyx_service import TelnyxService
from app.utils.encryption import encrypt_api_key, decrypt_api_key
from app.core.exceptions import IntegrationError

router = APIRouter(prefix="/telnyx-settings", tags=["Telnyx Settings"])
logger = logging.getLogger(__name__)


# =========================================================================
# SCHEMAS
# =========================================================================

class TelnyxSettingsResponse(BaseModel):
    """Telnyx settings response (API key masked)"""
    id: UUID
    object_id: UUID
    object_name: Optional[str] = None
    api_key_masked: str  # Last 4 chars only
    messaging_profile_id: Optional[str] = None
    webhook_secret_set: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateTelnyxSettingsRequest(BaseModel):
    """Create Telnyx settings request"""
    object_id: UUID = Field(..., description="Object (tenant) this config belongs to")
    api_key: str = Field(..., min_length=10, description="Telnyx API key")
    messaging_profile_id: Optional[str] = Field(None, description="Default messaging profile ID")
    webhook_secret: Optional[str] = Field(None, description="Webhook signing secret")


class UpdateTelnyxSettingsRequest(BaseModel):
    """Update Telnyx settings request"""
    api_key: Optional[str] = Field(None, min_length=10, description="New API key")
    messaging_profile_id: Optional[str] = Field(None, description="Messaging profile ID")
    webhook_secret: Optional[str] = Field(None, description="Webhook signing secret")
    is_active: Optional[bool] = Field(None, description="Active status")


class VerifyCredentialsResponse(BaseModel):
    """Credential verification response"""
    valid: bool
    balance: Optional[str] = None
    currency: Optional[str] = None
    error: Optional[str] = None


# =========================================================================
# HELPER FUNCTIONS
# =========================================================================

def mask_api_key(api_key: str) -> str:
    """Mask API key, showing only last 4 characters"""
    if len(api_key) <= 4:
        return "****"
    return "*" * (len(api_key) - 4) + api_key[-4:]


async def check_object_access(
    db: DatabaseSession,
    user: CurrentUser,
    object_id: UUID,
) -> bool:
    """Check if user has access to the object"""
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)

    # Owner has access to all objects
    if user_role == 'owner':
        return True

    # Admin/User: Check object_users table
    query = text("""
        SELECT 1 FROM object_users
        WHERE user_id = :user_id AND object_id = :object_id
    """)
    result = await db.execute(query, {"user_id": str(user.id), "object_id": str(object_id)})
    return result.scalar_one_or_none() is not None


# =========================================================================
# ENDPOINTS
# =========================================================================

@router.get("/", response_model=list[TelnyxSettingsResponse])
async def list_telnyx_settings(
    db: DatabaseSession,
    current_user: CurrentUser,
    object_id: Optional[UUID] = None,
):
    """
    List Telnyx settings.

    - Owner: See all settings
    - Admin: See settings for objects they have access to
    - User: No access
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users cannot view Telnyx settings"
        )

    query = """
        SELECT
            ots.id,
            ots.object_id,
            o.name as object_name,
            ots.api_key,
            ots.messaging_profile_id,
            ots.webhook_secret,
            ots.is_active,
            ots.created_at,
            ots.updated_at
        FROM object_telnyx_settings ots
        INNER JOIN objects o ON ots.object_id = o.id
    """

    params = {}

    if user_role == 'owner':
        if object_id:
            query += " WHERE ots.object_id = :object_id"
            params["object_id"] = str(object_id)
    else:
        # Admin: Filter by objects they have access to
        query += """
            INNER JOIN object_users ou ON ots.object_id = ou.object_id
            WHERE ou.user_id = :user_id
        """
        params["user_id"] = str(current_user.id)
        if object_id:
            query += " AND ots.object_id = :object_id"
            params["object_id"] = str(object_id)

    query += " ORDER BY o.name ASC"

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    settings = []
    for row in rows:
        # Decrypt and mask API key
        decrypted_key = decrypt_api_key(row.api_key) if row.api_key else ""
        settings.append(TelnyxSettingsResponse(
            id=row.id,
            object_id=row.object_id,
            object_name=row.object_name,
            api_key_masked=mask_api_key(decrypted_key),
            messaging_profile_id=row.messaging_profile_id,
            webhook_secret_set=bool(row.webhook_secret),
            is_active=row.is_active,
            created_at=row.created_at,
            updated_at=row.updated_at,
        ))

    return settings


@router.get("/{settings_id}", response_model=TelnyxSettingsResponse)
async def get_telnyx_settings(
    settings_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get specific Telnyx settings by ID.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users cannot view Telnyx settings"
        )

    query = text("""
        SELECT
            ots.id,
            ots.object_id,
            o.name as object_name,
            ots.api_key,
            ots.messaging_profile_id,
            ots.webhook_secret,
            ots.is_active,
            ots.created_at,
            ots.updated_at
        FROM object_telnyx_settings ots
        INNER JOIN objects o ON ots.object_id = o.id
        WHERE ots.id = :settings_id
    """)

    result = await db.execute(query, {"settings_id": str(settings_id)})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telnyx settings not found"
        )

    # Check access for non-owners
    if user_role != 'owner':
        has_access = await check_object_access(db, current_user, row.object_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this object"
            )

    decrypted_key = decrypt_api_key(row.api_key) if row.api_key else ""
    return TelnyxSettingsResponse(
        id=row.id,
        object_id=row.object_id,
        object_name=row.object_name,
        api_key_masked=mask_api_key(decrypted_key),
        messaging_profile_id=row.messaging_profile_id,
        webhook_secret_set=bool(row.webhook_secret),
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post("/", response_model=TelnyxSettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_telnyx_settings(
    data: CreateTelnyxSettingsRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create Telnyx settings for an Object (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create Telnyx settings"
        )

    # Check if object exists
    object_query = text("SELECT id, name FROM objects WHERE id = :object_id AND deleted = false")
    result = await db.execute(object_query, {"object_id": str(data.object_id)})
    obj = result.fetchone()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found"
        )

    # Check if settings already exist for this object
    existing_query = text("SELECT id FROM object_telnyx_settings WHERE object_id = :object_id")
    existing = await db.execute(existing_query, {"object_id": str(data.object_id)})
    if existing.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telnyx settings already exist for this object"
        )

    # Verify credentials before saving
    try:
        service = TelnyxService(api_key=data.api_key)
        await service.verify_credentials()
    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Telnyx credentials: {str(e)}"
        )

    # Encrypt API key
    encrypted_api_key = encrypt_api_key(data.api_key)

    import uuid
    settings_id = uuid.uuid4()

    insert_query = text("""
        INSERT INTO object_telnyx_settings (
            id, object_id, api_key, messaging_profile_id, webhook_secret,
            is_active, created_at, updated_at
        )
        VALUES (
            :id, :object_id, :api_key, :messaging_profile_id, :webhook_secret,
            true, NOW(), NOW()
        )
        RETURNING id, object_id, api_key, messaging_profile_id, webhook_secret,
                  is_active, created_at, updated_at
    """)

    result = await db.execute(insert_query, {
        "id": str(settings_id),
        "object_id": str(data.object_id),
        "api_key": encrypted_api_key,
        "messaging_profile_id": data.messaging_profile_id,
        "webhook_secret": data.webhook_secret,
    })

    await db.commit()
    row = result.fetchone()

    return TelnyxSettingsResponse(
        id=row.id,
        object_id=row.object_id,
        object_name=obj.name,
        api_key_masked=mask_api_key(data.api_key),
        messaging_profile_id=row.messaging_profile_id,
        webhook_secret_set=bool(row.webhook_secret),
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.put("/{settings_id}", response_model=TelnyxSettingsResponse)
async def update_telnyx_settings(
    settings_id: UUID,
    data: UpdateTelnyxSettingsRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update Telnyx settings (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can update Telnyx settings"
        )

    # Build update query dynamically
    updates = []
    params = {"settings_id": str(settings_id)}

    if data.api_key is not None:
        # Verify new credentials
        try:
            service = TelnyxService(api_key=data.api_key)
            await service.verify_credentials()
        except IntegrationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid Telnyx credentials: {str(e)}"
            )
        updates.append("api_key = :api_key")
        params["api_key"] = encrypt_api_key(data.api_key)

    if data.messaging_profile_id is not None:
        updates.append("messaging_profile_id = :messaging_profile_id")
        params["messaging_profile_id"] = data.messaging_profile_id

    if data.webhook_secret is not None:
        updates.append("webhook_secret = :webhook_secret")
        params["webhook_secret"] = data.webhook_secret

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
        UPDATE object_telnyx_settings
        SET {', '.join(updates)}
        WHERE id = :settings_id
        RETURNING id, object_id, api_key, messaging_profile_id, webhook_secret,
                  is_active, created_at, updated_at
    """)

    result = await db.execute(query, params)
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telnyx settings not found"
        )

    await db.commit()

    # Get object name
    obj_query = text("SELECT name FROM objects WHERE id = :object_id")
    obj_result = await db.execute(obj_query, {"object_id": str(row.object_id)})
    obj = obj_result.fetchone()

    decrypted_key = decrypt_api_key(row.api_key) if row.api_key else ""
    return TelnyxSettingsResponse(
        id=row.id,
        object_id=row.object_id,
        object_name=obj.name if obj else None,
        api_key_masked=mask_api_key(decrypted_key),
        messaging_profile_id=row.messaging_profile_id,
        webhook_secret_set=bool(row.webhook_secret),
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.delete("/{settings_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_telnyx_settings(
    settings_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete Telnyx settings (Owner only).
    This will also cascade delete all phone numbers, brands, campaigns, and profiles.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can delete Telnyx settings"
        )

    query = text("DELETE FROM object_telnyx_settings WHERE id = :settings_id RETURNING id")
    result = await db.execute(query, {"settings_id": str(settings_id)})

    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telnyx settings not found"
        )

    await db.commit()


@router.post("/{settings_id}/verify", response_model=VerifyCredentialsResponse)
async def verify_telnyx_credentials(
    settings_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Verify Telnyx API credentials are valid (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can verify Telnyx credentials"
        )

    # Get settings
    query = text("SELECT api_key FROM object_telnyx_settings WHERE id = :settings_id")
    result = await db.execute(query, {"settings_id": str(settings_id)})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telnyx settings not found"
        )

    # Decrypt and verify
    try:
        decrypted_key = decrypt_api_key(row.api_key)
        service = TelnyxService(api_key=decrypted_key)
        verification = await service.verify_credentials()
        return VerifyCredentialsResponse(
            valid=True,
            balance=verification.get("balance"),
            currency=verification.get("currency"),
        )
    except IntegrationError as e:
        return VerifyCredentialsResponse(
            valid=False,
            error=str(e),
        )
