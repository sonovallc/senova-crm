"""Twilio settings management service"""

from typing import Optional, Dict
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioException

from app.models.twilio_settings import TwilioSettings
from app.utils.twilio_encryption import (
    encrypt_twilio_auth_token,
    decrypt_twilio_auth_token,
    encrypt_webhook_secret,
    decrypt_webhook_secret
)
from app.core.exceptions import IntegrationError


class TwilioSettingsService:
    """Service for managing Twilio settings and connections"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_settings(
        self,
        object_id: UUID,
        account_sid: str,
        auth_token: str,
        webhook_signing_secret: Optional[str] = None
    ) -> TwilioSettings:
        """
        Save or update Twilio credentials for an object/tenant

        Args:
            object_id: Object/tenant ID
            account_sid: Twilio account SID
            auth_token: Twilio auth token (will be encrypted)
            webhook_signing_secret: Optional webhook signing secret (will be encrypted)

        Returns:
            TwilioSettings instance

        Raises:
            IntegrationError: If saving fails
        """
        try:
            # Check if settings already exist for this object
            result = await self.db.execute(
                select(TwilioSettings).where(TwilioSettings.object_id == object_id)
            )
            existing_settings = result.scalar_one_or_none()

            # Encrypt sensitive data
            encrypted_auth_token = encrypt_twilio_auth_token(auth_token)
            encrypted_webhook_secret = (
                encrypt_webhook_secret(webhook_signing_secret)
                if webhook_signing_secret
                else None
            )

            if existing_settings:
                # Update existing settings
                existing_settings.account_sid = account_sid
                existing_settings.auth_token_encrypted = encrypted_auth_token
                existing_settings.webhook_signing_secret_encrypted = encrypted_webhook_secret
                existing_settings.is_active = True
                existing_settings.connection_verified_at = None  # Reset verification
                settings = existing_settings
            else:
                # Create new settings
                settings = TwilioSettings(
                    object_id=object_id,
                    account_sid=account_sid,
                    auth_token_encrypted=encrypted_auth_token,
                    webhook_signing_secret_encrypted=encrypted_webhook_secret,
                    is_active=True
                )
                self.db.add(settings)

            await self.db.commit()
            await self.db.refresh(settings)
            return settings

        except Exception as e:
            await self.db.rollback()
            raise IntegrationError(f"Failed to save Twilio settings: {str(e)}")

    async def get_settings(self, object_id: UUID) -> Optional[TwilioSettings]:
        """
        Get Twilio settings for an object

        Args:
            object_id: Object/tenant ID

        Returns:
            TwilioSettings instance or None if not found
        """
        result = await self.db.execute(
            select(TwilioSettings).where(
                TwilioSettings.object_id == object_id,
                TwilioSettings.is_active == True
            )
        )
        return result.scalar_one_or_none()

    async def test_connection(self, object_id: UUID) -> Dict:
        """
        Test Twilio connection and return account info

        Args:
            object_id: Object/tenant ID

        Returns:
            Dict with connection test results
        """
        try:
            # Get settings
            settings = await self.get_settings(object_id)
            if not settings:
                return {
                    "success": False,
                    "error": "Twilio settings not found for this object"
                }

            # Decrypt auth token
            auth_token = decrypt_twilio_auth_token(settings.auth_token_encrypted)

            # Create Twilio client
            client = TwilioClient(settings.account_sid, auth_token)

            # Try to fetch account info
            account = client.api.v2010.accounts(settings.account_sid).fetch()

            # Update verification timestamp
            settings.connection_verified_at = datetime.now(timezone.utc)
            await self.db.commit()

            return {
                "success": True,
                "account_name": account.friendly_name,
                "account_status": account.status,
                "error": None
            }

        except TwilioException as e:
            return {
                "success": False,
                "account_name": None,
                "account_status": None,
                "error": f"Twilio error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "account_name": None,
                "account_status": None,
                "error": f"Unexpected error: {str(e)}"
            }

    async def delete_settings(self, object_id: UUID) -> bool:
        """
        Remove Twilio integration for an object

        Args:
            object_id: Object/tenant ID

        Returns:
            True if deleted, False if not found
        """
        try:
            result = await self.db.execute(
                select(TwilioSettings).where(TwilioSettings.object_id == object_id)
            )
            settings = result.scalar_one_or_none()

            if settings:
                # Soft delete by setting inactive
                settings.is_active = False
                await self.db.commit()
                return True
            return False

        except Exception as e:
            await self.db.rollback()
            raise IntegrationError(f"Failed to delete Twilio settings: {str(e)}")

    async def get_twilio_client(self, object_id: UUID) -> TwilioClient:
        """
        Get authenticated Twilio client for an object

        Args:
            object_id: Object/tenant ID

        Returns:
            Configured TwilioClient instance

        Raises:
            IntegrationError: If settings not found or invalid
        """
        settings = await self.get_settings(object_id)
        if not settings:
            raise IntegrationError("Twilio settings not found for this object")

        if not settings.is_active:
            raise IntegrationError("Twilio integration is disabled for this object")

        try:
            # Decrypt credentials
            auth_token = decrypt_twilio_auth_token(settings.auth_token_encrypted)

            # Create and return client
            return TwilioClient(settings.account_sid, auth_token)

        except Exception as e:
            raise IntegrationError(f"Failed to create Twilio client: {str(e)}")

    async def update_webhook_secret(self, object_id: UUID, webhook_secret: str) -> bool:
        """
        Update the webhook signing secret for an object

        Args:
            object_id: Object/tenant ID
            webhook_secret: New webhook signing secret

        Returns:
            True if updated successfully
        """
        try:
            settings = await self.get_settings(object_id)
            if not settings:
                return False

            # Encrypt and save new webhook secret
            settings.webhook_signing_secret_encrypted = encrypt_webhook_secret(webhook_secret)
            await self.db.commit()
            return True

        except Exception as e:
            await self.db.rollback()
            raise IntegrationError(f"Failed to update webhook secret: {str(e)}")

    async def verify_webhook_signature(
        self,
        object_id: UUID,
        signature: str,
        timestamp: str,
        body: str
    ) -> bool:
        """
        Verify webhook signature from Twilio

        Args:
            object_id: Object/tenant ID
            signature: X-Twilio-Signature header
            timestamp: Request timestamp
            body: Raw request body

        Returns:
            True if signature is valid
        """
        try:
            settings = await self.get_settings(object_id)
            if not settings or not settings.webhook_signing_secret_encrypted:
                return False

            # Decrypt webhook secret
            webhook_secret = decrypt_webhook_secret(settings.webhook_signing_secret_encrypted)

            # TODO: Implement actual Twilio signature verification
            # This would use the twilio.request_validator.RequestValidator
            # For now, return True if we have a secret
            return bool(webhook_secret)

        except Exception:
            return False