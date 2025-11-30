"""
Mailgun Configuration API endpoints

Features:
- Create/update Mailgun settings per user
- Test Mailgun connection
- Manage verified email addresses
- Rate limit configuration (admin/owner only)
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.user import User, UserRole
from app.models.mailgun_settings import MailgunSettings, VerifiedEmailAddress
from app.schemas.mailgun import (
    MailgunSettingsCreate,
    MailgunSettingsUpdate,
    MailgunSettingsResponse,
    VerifiedEmailCreate,
    VerifiedEmailUpdate,
    VerifiedEmailResponse,
    MailgunTestRequest,
    MailgunTestResponse,
)
from app.utils.encryption import encrypt_api_key, decrypt_api_key
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/mailgun", tags=["Mailgun Configuration"])


# Helper Functions
def mask_api_key(api_key: str) -> str:
    """
    Mask API key to show only last 4 characters.

    Args:
        api_key: Full API key (encrypted or plain text)

    Returns:
        Masked API key string (e.g., "****abcd")
    """
    if not api_key or len(api_key) < 4:
        return "****"
    return f"****{api_key[-4:]}"


def check_rate_limit_permission(user: User) -> bool:
    """
    Check if user can modify rate limit settings.

    Only admin and owner roles can modify rate limits.

    Args:
        user: Current user

    Returns:
        bool: True if user can modify rate limits
    """
    return user.role in ('owner', 'admin')


async def test_mailgun_connection(domain: str, api_key: str, region: str) -> dict:
    """
    Test Mailgun connection by validating domain.

    Makes an API call to Mailgun to verify credentials and domain.

    Args:
        domain: Mailgun domain
        api_key: Mailgun API key (plain text)
        region: Mailgun region ('us' or 'eu')

    Returns:
        dict with 'success' (bool) and 'message' or 'error' (str)
    """
    # Determine Mailgun API base URL based on region
    if region == "eu":
        base_url = "https://api.eu.mailgun.net/v3"
    else:
        base_url = "https://api.mailgun.net/v3"

    # Test endpoint: Get domain info
    url = f"{base_url}/domains/{domain}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                auth=("api", api_key)
            )

            if response.status_code == 200:
                domain_data = response.json()
                return {
                    "success": True,
                    "message": f"Successfully connected to Mailgun domain: {domain}",
                    "domain_info": domain_data.get("domain", {})
                }
            elif response.status_code == 401:
                return {
                    "success": False,
                    "error": "Invalid API key. Please check your credentials."
                }
            elif response.status_code == 404:
                return {
                    "success": False,
                    "error": f"Domain '{domain}' not found in your Mailgun account."
                }
            else:
                return {
                    "success": False,
                    "error": f"Mailgun API error: {response.status_code} - {response.text}"
                }
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "Connection timeout. Please check your network and try again."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Connection failed: {str(e)}"
        }


def _build_settings_response(settings: MailgunSettings, api_key_encrypted: str) -> MailgunSettingsResponse:
    """
    Build Mailgun settings response with masked API key.

    Args:
        settings: MailgunSettings model instance
        api_key_encrypted: Encrypted API key from database

    Returns:
        MailgunSettingsResponse with masked API key
    """
    # Create response dict from settings
    settings_dict = {
        "id": settings.id,
        "user_id": settings.user_id,
        "domain": settings.domain,
        "region": settings.region,
        "from_email": settings.from_email,
        "from_name": settings.from_name,
        "api_key_masked": mask_api_key(api_key_encrypted),
        "is_active": settings.is_active,
        "verified_at": settings.verified_at,
        "rate_limit_per_hour": settings.rate_limit_per_hour,
        "created_at": settings.created_at,
        "updated_at": settings.updated_at,
        "verified_addresses": [
            VerifiedEmailResponse.model_validate(addr)
            for addr in settings.verified_addresses
        ] if settings.verified_addresses else []
    }

    return MailgunSettingsResponse(**settings_dict)


# Mailgun Settings Endpoints
@router.post("/settings", response_model=MailgunSettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_mailgun_settings(
    data: MailgunSettingsCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create or update Mailgun configuration for current user.

    - Encrypts API key before saving
    - Sets is_active to False initially (must test connection first)
    - Returns masked API key in response

    Requires authentication
    """
    # Check if user already has settings
    query = select(MailgunSettings).where(MailgunSettings.user_id == current_user.id)
    result = await db.execute(query)
    existing_settings = result.scalar_one_or_none()

    # Encrypt API key
    encrypted_api_key = encrypt_api_key(data.api_key)

    if existing_settings:
        # Update existing settings
        existing_settings.api_key = encrypted_api_key
        existing_settings.domain = data.domain
        existing_settings.region = data.region
        existing_settings.from_email = data.from_email
        existing_settings.from_name = data.from_name
        existing_settings.is_active = False  # Reset to False, must re-test connection
        existing_settings.verified_at = None  # Clear verification

        await db.commit()
        await db.refresh(existing_settings)

        return _build_settings_response(existing_settings, encrypted_api_key)
    else:
        # Create new settings
        new_settings = MailgunSettings(
            user_id=current_user.id,
            api_key=encrypted_api_key,
            domain=data.domain,
            region=data.region,
            from_email=data.from_email,
            from_name=data.from_name,
            is_active=False,
            rate_limit_per_hour=100  # Default rate limit
        )

        db.add(new_settings)
        await db.commit()
        await db.refresh(new_settings)

        return _build_settings_response(new_settings, encrypted_api_key)


@router.get("/settings", response_model=MailgunSettingsResponse)
async def get_mailgun_settings(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get current user's Mailgun configuration.

    - Returns masked API key (only last 4 chars visible)
    - Includes verified addresses
    - Returns 404 if not configured

    Requires authentication
    """
    query = select(MailgunSettings).where(MailgunSettings.user_id == current_user.id)
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise NotFoundError("Mailgun settings not configured for this user")

    return _build_settings_response(settings, settings.api_key)


@router.patch("/settings", response_model=MailgunSettingsResponse)
async def update_mailgun_settings(
    data: MailgunSettingsUpdate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update specific Mailgun settings fields.

    - Re-encrypts API key if provided
    - Admin/owner can update rate_limit_per_hour, others cannot
    - Resets verification if credentials change

    Requires authentication
    """
    # Get existing settings
    query = select(MailgunSettings).where(MailgunSettings.user_id == current_user.id)
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise NotFoundError("Mailgun settings not configured. Please create settings first.")

    # Track if credentials changed (requires re-verification)
    credentials_changed = False

    # Update fields
    if data.api_key is not None:
        settings.api_key = encrypt_api_key(data.api_key)
        credentials_changed = True

    if data.domain is not None:
        settings.domain = data.domain
        credentials_changed = True

    if data.region is not None:
        settings.region = data.region
        credentials_changed = True

    if data.from_email is not None:
        settings.from_email = data.from_email

    if data.from_name is not None:
        settings.from_name = data.from_name

    # Rate limit can only be modified by admin/owner
    if data.rate_limit_per_hour is not None:
        if not check_rate_limit_permission(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin and owner users can modify rate limits"
            )
        settings.rate_limit_per_hour = data.rate_limit_per_hour

    # Reset verification if credentials changed
    if credentials_changed:
        settings.is_active = False
        settings.verified_at = None

    await db.commit()
    await db.refresh(settings)

    return _build_settings_response(settings, settings.api_key)


@router.delete("/settings", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mailgun_settings(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete Mailgun configuration.

    - Cascade deletes verified addresses

    Requires authentication
    """
    query = select(MailgunSettings).where(MailgunSettings.user_id == current_user.id)
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise NotFoundError("Mailgun settings not found")

    await db.delete(settings)
    await db.commit()


@router.post("/test-connection", response_model=MailgunTestResponse)
async def test_mailgun_connection_endpoint(
    data: MailgunTestRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Test Mailgun connection.

    - Decrypts API key
    - Makes test API call to Mailgun
    - If successful, sets verified_at timestamp and is_active=True
    - Returns success/failure with error details

    Requires authentication
    """
    # Get user's Mailgun settings
    query = select(MailgunSettings).where(MailgunSettings.user_id == current_user.id)
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise NotFoundError("Mailgun settings not configured. Please create settings first.")

    # Decrypt API key
    try:
        decrypted_api_key = decrypt_api_key(settings.api_key)
    except Exception as e:
        return MailgunTestResponse(
            success=False,
            message="Failed to decrypt API key",
            error_details=str(e)
        )

    # Test connection
    test_result = await test_mailgun_connection(
        domain=settings.domain,
        api_key=decrypted_api_key,
        region=settings.region
    )

    if test_result["success"]:
        # Update settings: mark as verified and active
        settings.verified_at = datetime.utcnow()
        settings.is_active = True
        await db.commit()

        return MailgunTestResponse(
            success=True,
            message=test_result["message"],
            verified_at=settings.verified_at
        )
    else:
        # Connection failed
        return MailgunTestResponse(
            success=False,
            message="Mailgun connection test failed",
            error_details=test_result.get("error", "Unknown error")
        )


# Verified Email Address Endpoints
@router.post("/verified-addresses", response_model=VerifiedEmailResponse, status_code=status.HTTP_201_CREATED)
async def add_verified_email_address(
    data: VerifiedEmailCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Add verified email address.

    - Requires mailgun_settings to exist for current user
    - Ensures only one is_default=True per settings

    Requires authentication
    """
    # Get user's Mailgun settings
    query = select(MailgunSettings).where(MailgunSettings.user_id == current_user.id)
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise NotFoundError("Mailgun settings not configured. Please create settings first.")

    # If setting as default, unset other defaults
    if data.is_default:
        query = select(VerifiedEmailAddress).where(
            VerifiedEmailAddress.mailgun_settings_id == settings.id,
            VerifiedEmailAddress.is_default == True
        )
        result = await db.execute(query)
        existing_defaults = result.scalars().all()

        for existing in existing_defaults:
            existing.is_default = False

    # Create new verified address
    new_address = VerifiedEmailAddress(
        mailgun_settings_id=settings.id,
        email_address=data.email_address,
        display_name=data.display_name,
        is_default=data.is_default,
        verified_at=datetime.utcnow()
    )

    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)

    return VerifiedEmailResponse.model_validate(new_address)


@router.get("/verified-addresses", response_model=List[VerifiedEmailResponse])
async def list_verified_email_addresses(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    List verified addresses for current user.

    Requires authentication
    """
    # Get user's Mailgun settings
    query = select(MailgunSettings).where(MailgunSettings.user_id == current_user.id)
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise NotFoundError("Mailgun settings not configured")

    # Get verified addresses
    query = select(VerifiedEmailAddress).where(
        VerifiedEmailAddress.mailgun_settings_id == settings.id
    ).order_by(VerifiedEmailAddress.is_default.desc(), VerifiedEmailAddress.created_at.desc())

    result = await db.execute(query)
    addresses = result.scalars().all()

    return [VerifiedEmailResponse.model_validate(addr) for addr in addresses]


@router.patch("/verified-addresses/{address_id}", response_model=VerifiedEmailResponse)
async def update_verified_email_address(
    address_id: UUID,
    data: VerifiedEmailUpdate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update a verified email address.

    - Can update display_name and is_default
    - Ensures only one is_default=True per settings

    Requires authentication
    """
    # Get the address
    address = await db.get(VerifiedEmailAddress, address_id)

    if not address:
        raise NotFoundError("Verified email address not found")

    # Verify ownership through mailgun_settings
    query = select(MailgunSettings).where(
        MailgunSettings.id == address.mailgun_settings_id,
        MailgunSettings.user_id == current_user.id
    )
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this email address"
        )

    # Update fields
    if data.display_name is not None:
        address.display_name = data.display_name

    if data.is_default is not None and data.is_default:
        # Unset other defaults
        query = select(VerifiedEmailAddress).where(
            VerifiedEmailAddress.mailgun_settings_id == settings.id,
            VerifiedEmailAddress.is_default == True,
            VerifiedEmailAddress.id != address_id
        )
        result = await db.execute(query)
        existing_defaults = result.scalars().all()

        for existing in existing_defaults:
            existing.is_default = False

        address.is_default = True

    await db.commit()
    await db.refresh(address)

    return VerifiedEmailResponse.model_validate(address)


@router.delete("/verified-addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_verified_email_address(
    address_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete verified email address.

    Requires authentication
    """
    # Get the address
    address = await db.get(VerifiedEmailAddress, address_id)

    if not address:
        raise NotFoundError("Verified email address not found")

    # Verify ownership through mailgun_settings
    query = select(MailgunSettings).where(
        MailgunSettings.id == address.mailgun_settings_id,
        MailgunSettings.user_id == current_user.id
    )
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this email address"
        )

    await db.delete(address)
    await db.commit()
