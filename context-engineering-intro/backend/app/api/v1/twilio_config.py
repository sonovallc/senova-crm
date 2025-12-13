"""Twilio Settings API endpoints for managing Twilio integration"""

from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, DatabaseSession
from app.models.user import UserRole
from app.schemas.twilio import (
    TwilioSettingsCreate,
    TwilioSettingsUpdate,
    TwilioSettingsResponse,
    TwilioConnectionTestRequest,
    TwilioConnectionTestResponse
)
from app.services.twilio_settings_service import TwilioSettingsService
from app.services.object_service import ObjectService
from app.core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
    IntegrationError
)

router = APIRouter()


@router.post("", response_model=TwilioSettingsResponse)
async def save_twilio_settings(
    settings_data: TwilioSettingsCreate,
    current_user: CurrentUser,
    db: DatabaseSession,
    object_id: UUID
) -> TwilioSettingsResponse:
    """
    Save or update Twilio settings for an object

    Only users with Owner role can configure Twilio settings.

    Args:
        settings_data: Twilio credentials
        object_id: Object to configure Twilio for

    Returns:
        Twilio settings response

    Raises:
        403: Insufficient permissions (not owner)
        404: Object not found
        400: Invalid settings data
    """
    # Check if user is owner
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can configure Twilio settings"
        )

    # Verify object exists and user has access
    object_service = ObjectService(db)
    try:
        await object_service.get_object(current_user, object_id)
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Object {object_id} not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to configure this object"
        )

    # Save Twilio settings
    service = TwilioSettingsService(db)
    try:
        settings = await service.save_settings(
            object_id=object_id,
            account_sid=settings_data.account_sid,
            auth_token=settings_data.auth_token,
            webhook_signing_secret=settings_data.webhook_signing_secret
        )

        # Convert to response model
        return TwilioSettingsResponse(
            id=settings.id,
            object_id=settings.object_id,
            account_sid=settings.account_sid,
            is_active=settings.is_active,
            connection_verified_at=settings.connection_verified_at,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
            phone_numbers_count=0  # TODO: Count phone numbers when that's implemented
        )
    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=TwilioSettingsResponse)
async def get_twilio_settings(
    current_user: CurrentUser,
    db: DatabaseSession,
    object_id: UUID
) -> TwilioSettingsResponse:
    """
    Get current Twilio settings for an object

    Admin and Owner users can view Twilio settings.
    Auth token is never included in response.

    Args:
        object_id: Object to get settings for

    Returns:
        Twilio settings (without auth token)

    Raises:
        403: Insufficient permissions
        404: Settings not found
    """
    # Check if user is admin or owner
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or owner access required"
        )

    # Verify object exists and user has access
    object_service = ObjectService(db)
    try:
        await object_service.get_object(current_user, object_id)
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Object {object_id} not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this object's settings"
        )

    # Get Twilio settings
    service = TwilioSettingsService(db)
    settings = await service.get_settings(object_id)

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Twilio settings not configured for this object"
        )

    # Count phone numbers
    phone_numbers_count = await service.count_phone_numbers(object_id)

    return TwilioSettingsResponse(
        id=settings.id,
        object_id=settings.object_id,
        account_sid=settings.account_sid,
        is_active=settings.is_active,
        connection_verified_at=settings.connection_verified_at,
        created_at=settings.created_at,
        updated_at=settings.updated_at,
        phone_numbers_count=phone_numbers_count
    )


@router.post("/test", response_model=TwilioConnectionTestResponse)
async def test_twilio_connection(
    test_request: TwilioConnectionTestRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
    object_id: UUID
) -> TwilioConnectionTestResponse:
    """
    Test Twilio connection with saved credentials

    Admin and Owner users can test the connection.
    Optionally sends a test SMS to verify functionality.

    Args:
        test_request: Test configuration
        object_id: Object whose settings to test

    Returns:
        Test result with account details or error

    Raises:
        403: Insufficient permissions
        404: Settings not found
    """
    # Check if user is admin or owner
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or owner access required"
        )

    # Verify object exists and user has access
    object_service = ObjectService(db)
    try:
        await object_service.get_object(current_user, object_id)
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Object {object_id} not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to test this object's settings"
        )

    # Test Twilio connection
    service = TwilioSettingsService(db)
    result = await service.test_connection(
        object_id=object_id,
        send_test_sms=test_request.send_test_sms,
        test_recipient=test_request.test_recipient
    )

    return result


@router.delete("", response_model=dict)
async def delete_twilio_settings(
    current_user: CurrentUser,
    db: DatabaseSession,
    object_id: UUID
) -> dict:
    """
    Remove Twilio integration for an object

    Only Owner users can remove Twilio settings.
    This will also deactivate any associated phone numbers.

    Args:
        object_id: Object to remove settings for

    Returns:
        Success confirmation

    Raises:
        403: Insufficient permissions (not owner)
        404: Settings not found
    """
    # Check if user is owner
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can remove Twilio settings"
        )

    # Verify object exists and user has access
    object_service = ObjectService(db)
    try:
        await object_service.get_object(current_user, object_id)
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Object {object_id} not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to remove this object's settings"
        )

    # Delete settings
    service = TwilioSettingsService(db)
    try:
        await service.delete_settings(object_id)
        return {"success": True, "message": "Twilio settings removed successfully"}
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Twilio settings not found for this object"
        )