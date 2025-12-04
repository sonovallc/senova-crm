"""Object Mailgun Settings API endpoints with multi-domain support

Objects can have MULTIPLE Mailgun configurations (domains).
Each domain can be independently configured, verified, and managed.
Email profiles can specify which domain to use for sending.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime
import httpx

from app.config.database import get_db
from app.models import Object, ObjectMailgunSettings, ObjectUser, User, UserRole
from app.api.v1.auth import get_current_active_user
from app.utils.encryption import encrypt_api_key, decrypt_api_key


router = APIRouter(
    prefix="/api/v1/objects",
    tags=["object-mailgun"]
)


class MailgunSettingsResponse(BaseModel):
    """Response model for Mailgun settings"""
    id: UUID
    object_id: UUID
    name: str
    is_default: bool
    sending_domain: str
    receiving_domain: str
    region: str = "us"
    webhook_signing_key: Optional[str] = None
    is_active: bool
    verified_at: Optional[datetime] = None
    rate_limit_per_hour: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateMailgunSettingsRequest(BaseModel):
    """Request model for creating Mailgun settings"""
    name: str = Field(..., description="Display name for this configuration")
    api_key: str = Field(..., description="Mailgun API key")
    sending_domain: str = Field(..., description="Domain for sending emails (e.g., senovallc.com)")
    receiving_domain: str = Field(..., description="Domain for receiving emails (e.g., mg.senovallc.com)")
    region: str = Field("us", description="Mailgun region (us or eu)")
    webhook_signing_key: Optional[str] = Field(None, description="Webhook signing key for verification")
    rate_limit_per_hour: int = Field(100, ge=1, le=10000, description="Rate limit per hour")
    is_default: bool = Field(False, description="Set as default for this object")


class UpdateMailgunSettingsRequest(BaseModel):
    """Request model for updating Mailgun settings"""
    name: Optional[str] = Field(None, description="Display name for this configuration")
    api_key: Optional[str] = Field(None, description="Mailgun API key (leave empty to keep existing)")
    sending_domain: Optional[str] = Field(None, description="Domain for sending emails")
    receiving_domain: Optional[str] = Field(None, description="Domain for receiving emails")
    region: Optional[str] = Field(None, description="Mailgun region (us or eu)")
    webhook_signing_key: Optional[str] = Field(None, description="Webhook signing key")
    rate_limit_per_hour: Optional[int] = Field(None, ge=1, le=10000, description="Rate limit per hour")


class VerifyResponse(BaseModel):
    """Response model for verification"""
    success: bool
    message: str
    verified_at: Optional[datetime] = None


async def check_owner_permission(db: AsyncSession, object_id: UUID, user: User) -> Object:
    """Check if user has owner permission on the object"""
    result = await db.execute(
        select(Object).where(
            Object.id == object_id,
            Object.deleted == False
        )
    )
    obj = result.scalar_one_or_none()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found"
        )

    # System admins and owners have full access
    if user.role in [UserRole.ADMIN, UserRole.OWNER]:
        return obj

    # Check object-specific permissions
    result = await db.execute(
        select(ObjectUser).where(
            ObjectUser.object_id == object_id,
            ObjectUser.user_id == user.id
        )
    )
    object_user = result.scalar_one_or_none()

    if not object_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this object"
        )

    permissions = object_user.permissions or {}
    if not permissions.get('can_manage_settings', False) and not permissions.get('is_owner', False) and not permissions.get('can_manage_mailgun', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You need owner permissions to manage Mailgun settings"
        )

    return obj


# ========== LIST ALL DOMAINS FOR AN OBJECT ==========
@router.get("/{object_id}/mailgun", response_model=List[MailgunSettingsResponse])
async def list_mailgun_settings(
    object_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all Mailgun settings for an object (multi-domain support)"""
    obj = await check_owner_permission(db, object_id, current_user)

    result = await db.execute(
        select(ObjectMailgunSettings)
        .where(ObjectMailgunSettings.object_id == object_id)
        .order_by(ObjectMailgunSettings.is_default.desc(), ObjectMailgunSettings.name)
    )
    settings_list = result.scalars().all()

    return settings_list


# ========== GET SPECIFIC DOMAIN ==========
@router.get("/{object_id}/mailgun/{settings_id}", response_model=MailgunSettingsResponse)
async def get_mailgun_settings(
    object_id: UUID,
    settings_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get specific Mailgun settings by ID"""
    obj = await check_owner_permission(db, object_id, current_user)

    result = await db.execute(
        select(ObjectMailgunSettings).where(
            ObjectMailgunSettings.id == settings_id,
            ObjectMailgunSettings.object_id == object_id
        )
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mailgun settings not found"
        )

    return settings


# ========== CREATE NEW DOMAIN ==========
@router.post("/{object_id}/mailgun", response_model=MailgunSettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_mailgun_settings(
    object_id: UUID,
    request: CreateMailgunSettingsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new Mailgun configuration for an object"""
    obj = await check_owner_permission(db, object_id, current_user)

    # If this is set as default, unset all other defaults for this object
    if request.is_default:
        result = await db.execute(
            select(ObjectMailgunSettings).where(
                ObjectMailgunSettings.object_id == object_id,
                ObjectMailgunSettings.is_default == True
            )
        )
        existing_defaults = result.scalars().all()
        for existing in existing_defaults:
            existing.is_default = False

    # Check if this is the first domain for the object - make it default automatically
    result = await db.execute(
        select(ObjectMailgunSettings).where(ObjectMailgunSettings.object_id == object_id)
    )
    existing_count = len(result.scalars().all())
    is_first = existing_count == 0

    # Encrypt the API key
    encrypted_key = encrypt_api_key(request.api_key)

    settings = ObjectMailgunSettings(
        object_id=object_id,
        name=request.name,
        api_key=encrypted_key,
        sending_domain=request.sending_domain,
        receiving_domain=request.receiving_domain,
        region=request.region,
        webhook_signing_key=request.webhook_signing_key,
        rate_limit_per_hour=request.rate_limit_per_hour,
        is_active=False,
        is_default=request.is_default or is_first  # First domain is auto-default
    )
    db.add(settings)

    await db.commit()
    await db.refresh(settings)

    return settings


# ========== UPDATE SPECIFIC DOMAIN ==========
@router.put("/{object_id}/mailgun/{settings_id}", response_model=MailgunSettingsResponse)
async def update_mailgun_settings(
    object_id: UUID,
    settings_id: UUID,
    request: UpdateMailgunSettingsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update specific Mailgun settings"""
    obj = await check_owner_permission(db, object_id, current_user)

    result = await db.execute(
        select(ObjectMailgunSettings).where(
            ObjectMailgunSettings.id == settings_id,
            ObjectMailgunSettings.object_id == object_id
        )
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mailgun settings not found"
        )

    # Update fields
    if request.name is not None:
        settings.name = request.name
    if request.api_key:  # Only update if provided
        settings.api_key = encrypt_api_key(request.api_key)
        settings.is_active = False  # Reset until verified
        settings.verified_at = None
    if request.sending_domain is not None:
        settings.sending_domain = request.sending_domain
        settings.is_active = False  # Reset until verified
        settings.verified_at = None
    if request.receiving_domain is not None:
        settings.receiving_domain = request.receiving_domain
        settings.is_active = False  # Reset until verified
        settings.verified_at = None
    if request.region is not None:
        settings.region = request.region
    if request.webhook_signing_key is not None:
        settings.webhook_signing_key = request.webhook_signing_key
    if request.rate_limit_per_hour is not None:
        settings.rate_limit_per_hour = request.rate_limit_per_hour

    await db.commit()
    await db.refresh(settings)

    return settings


# ========== DELETE SPECIFIC DOMAIN ==========
@router.delete("/{object_id}/mailgun/{settings_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mailgun_settings(
    object_id: UUID,
    settings_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete specific Mailgun settings"""
    obj = await check_owner_permission(db, object_id, current_user)

    result = await db.execute(
        select(ObjectMailgunSettings).where(
            ObjectMailgunSettings.id == settings_id,
            ObjectMailgunSettings.object_id == object_id
        )
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mailgun settings not found"
        )

    was_default = settings.is_default

    # If we're deleting the default, we need to handle reassignment BEFORE deletion
    # to avoid the unique constraint violation
    if was_default:
        # First, unset the default flag on the domain being deleted
        # This avoids the unique constraint issue
        settings.is_default = False
        await db.flush()  # Apply the change but don't commit yet

        # Find another domain to make default (excluding the one being deleted)
        result = await db.execute(
            select(ObjectMailgunSettings)
            .where(
                ObjectMailgunSettings.object_id == object_id,
                ObjectMailgunSettings.id != settings_id  # Exclude the one being deleted
            )
            .order_by(ObjectMailgunSettings.created_at)
            .limit(1)
        )
        new_default = result.scalar_one_or_none()

        # Set the new default if we found one
        if new_default:
            new_default.is_default = True
            await db.flush()  # Apply this change too

    # Now we can safely delete the domain
    await db.delete(settings)
    await db.commit()


# ========== SET AS DEFAULT ==========
@router.put("/{object_id}/mailgun/{settings_id}/set-default", response_model=MailgunSettingsResponse)
async def set_default_mailgun_settings(
    object_id: UUID,
    settings_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Set specific Mailgun settings as the default for the object"""
    obj = await check_owner_permission(db, object_id, current_user)

    # First get the target settings to ensure it exists
    result = await db.execute(
        select(ObjectMailgunSettings).where(
            ObjectMailgunSettings.id == settings_id,
            ObjectMailgunSettings.object_id == object_id
        )
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mailgun settings not found"
        )

    # If it's already default, nothing to do
    if settings.is_default:
        await db.refresh(settings)
        return settings

    # First, unset ALL defaults for this object (including any that might be incorrectly set)
    # This prevents unique constraint violations
    result = await db.execute(
        select(ObjectMailgunSettings).where(
            ObjectMailgunSettings.object_id == object_id,
            ObjectMailgunSettings.is_default == True
        )
    )
    existing_defaults = result.scalars().all()
    for existing in existing_defaults:
        existing.is_default = False

    # Flush to apply the unsetting before setting the new default
    await db.flush()

    # Now safely set this one as default
    settings.is_default = True

    await db.commit()
    await db.refresh(settings)

    return settings


# ========== VERIFY CONNECTION ==========
@router.post("/{object_id}/mailgun/{settings_id}/verify", response_model=VerifyResponse)
async def verify_mailgun_connection(
    object_id: UUID,
    settings_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Test the Mailgun connection for specific settings"""
    obj = await check_owner_permission(db, object_id, current_user)

    result = await db.execute(
        select(ObjectMailgunSettings).where(
            ObjectMailgunSettings.id == settings_id,
            ObjectMailgunSettings.object_id == object_id
        )
    )
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mailgun settings not found"
        )

    # Decrypt API key
    try:
        api_key = decrypt_api_key(settings.api_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt API key"
        )

    # Test Mailgun connection
    region = (settings.region or "us").lower()
    base_url = "https://api.mailgun.net" if region == "us" else "https://api.eu.mailgun.net"
    domain_to_check = settings.receiving_domain
    url = f"{base_url}/v3/domains/{domain_to_check}"

    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Verifying Mailgun domain: {domain_to_check} (region: {region})")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, auth=("api", api_key))

            if response.status_code == 200:
                settings.verified_at = datetime.utcnow()
                settings.is_active = True
                await db.commit()
                await db.refresh(settings)

                return VerifyResponse(
                    success=True,
                    message=f"Mailgun connection verified for {settings.name}",
                    verified_at=settings.verified_at
                )
            else:
                error_message = "Unknown error"
                try:
                    if response.content:
                        error_detail = response.json()
                        error_message = error_detail.get('message', str(error_detail))
                except Exception:
                    error_message = f"HTTP {response.status_code}: {response.text[:200] if response.text else 'Empty response'}"

                return VerifyResponse(
                    success=False,
                    message=f"Mailgun verification failed: {error_message}"
                )

        except httpx.RequestError as e:
            return VerifyResponse(
                success=False,
                message=f"Connection error: {str(e)}"
            )
        except Exception as e:
            return VerifyResponse(
                success=False,
                message=f"Unexpected error: {str(e)}"
            )


# ========== BACKWARD COMPATIBILITY - Get default domain ==========
@router.get("/{object_id}/mailgun/default", response_model=Optional[MailgunSettingsResponse])
async def get_default_mailgun_settings(
    object_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the default Mailgun settings for an object (backward compatibility)"""
    obj = await check_owner_permission(db, object_id, current_user)

    result = await db.execute(
        select(ObjectMailgunSettings).where(
            ObjectMailgunSettings.object_id == object_id,
            ObjectMailgunSettings.is_default == True
        )
    )
    settings = result.scalar_one_or_none()

    if not settings:
        # Try to get any settings if no default
        result = await db.execute(
            select(ObjectMailgunSettings)
            .where(ObjectMailgunSettings.object_id == object_id)
            .order_by(ObjectMailgunSettings.created_at)
            .limit(1)
        )
        settings = result.scalar_one_or_none()

    return settings
