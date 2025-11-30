"""
Suppression List Sync Service

Syncs bounces, unsubscribes, and complaints from Mailgun for GDPR/CAN-SPAM compliance.
"""

import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.config.settings import get_settings
from app.core.exceptions import IntegrationError
from app.models.email_suppression import EmailSuppression, SuppressionType

logger = logging.getLogger(__name__)
settings = get_settings()


class SuppressionSyncService:
    """
    Service for syncing email suppressions from Mailgun.

    Features:
    - Sync bounces, unsubscribes, complaints from Mailgun
    - Check if email is suppressed before sending
    - Add emails to suppression list manually
    """

    def __init__(self, api_key: Optional[str] = None, domain: Optional[str] = None):
        """
        Initialize suppression sync service.

        Args:
            api_key: Mailgun API key (defaults to settings)
            domain: Mailgun domain (defaults to settings)
        """
        self.api_key = api_key or settings.mailgun_api_key
        self.domain = domain or settings.mailgun_domain
        self.base_url = f"https://api.mailgun.net/v3/{self.domain}"
        self.auth = ("api", self.api_key)

    async def sync_bounces(self, db: AsyncSession) -> int:
        """
        Sync bounces from Mailgun.

        Args:
            db: Database session

        Returns:
            Number of bounces synced

        Raises:
            IntegrationError: If API call fails
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/bounces",
                    auth=self.auth,
                    params={"limit": 1000},  # Max 1000 per request
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()
                items = data.get("items", [])

                synced_count = 0

                for item in items:
                    email = item.get("address", "").lower().strip()
                    if not email:
                        continue

                    reason = item.get("error", "") or item.get("code", "")
                    created_at_str = item.get("created_at")

                    # Parse Mailgun timestamp (RFC 2822 format)
                    mailgun_created_at = None
                    if created_at_str:
                        try:
                            mailgun_created_at = datetime.strptime(
                                created_at_str, "%a, %d %b %Y %H:%M:%S %Z"
                            ).replace(tzinfo=timezone.utc)
                        except Exception:
                            pass

                    # Upsert suppression record
                    stmt = insert(EmailSuppression).values(
                        email=email,
                        suppression_type=SuppressionType.BOUNCE,
                        reason=reason,
                        mailgun_created_at=mailgun_created_at,
                        synced_at=datetime.now(timezone.utc),
                    ).on_conflict_do_update(
                        index_elements=["email"],
                        set_={
                            "suppression_type": SuppressionType.BOUNCE,
                            "reason": reason,
                            "mailgun_created_at": mailgun_created_at,
                            "synced_at": datetime.now(timezone.utc),
                        }
                    )

                    await db.execute(stmt)
                    synced_count += 1

                await db.commit()

                logger.info(f"Synced {synced_count} bounces from Mailgun")
                return synced_count

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Mailgun bounces API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to sync bounces from Mailgun: {str(e)}")

    async def sync_unsubscribes(self, db: AsyncSession) -> int:
        """
        Sync unsubscribes from Mailgun.

        Args:
            db: Database session

        Returns:
            Number of unsubscribes synced

        Raises:
            IntegrationError: If API call fails
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/unsubscribes",
                    auth=self.auth,
                    params={"limit": 1000},
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()
                items = data.get("items", [])

                synced_count = 0

                for item in items:
                    email = item.get("address", "").lower().strip()
                    if not email:
                        continue

                    reason = item.get("tag", "") or "User unsubscribed"
                    created_at_str = item.get("created_at")

                    # Parse Mailgun timestamp
                    mailgun_created_at = None
                    if created_at_str:
                        try:
                            mailgun_created_at = datetime.strptime(
                                created_at_str, "%a, %d %b %Y %H:%M:%S %Z"
                            ).replace(tzinfo=timezone.utc)
                        except Exception:
                            pass

                    # Upsert suppression record
                    stmt = insert(EmailSuppression).values(
                        email=email,
                        suppression_type=SuppressionType.UNSUBSCRIBE,
                        reason=reason,
                        mailgun_created_at=mailgun_created_at,
                        synced_at=datetime.now(timezone.utc),
                    ).on_conflict_do_update(
                        index_elements=["email"],
                        set_={
                            "suppression_type": SuppressionType.UNSUBSCRIBE,
                            "reason": reason,
                            "mailgun_created_at": mailgun_created_at,
                            "synced_at": datetime.now(timezone.utc),
                        }
                    )

                    await db.execute(stmt)
                    synced_count += 1

                await db.commit()

                logger.info(f"Synced {synced_count} unsubscribes from Mailgun")
                return synced_count

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Mailgun unsubscribes API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to sync unsubscribes from Mailgun: {str(e)}")

    async def sync_complaints(self, db: AsyncSession) -> int:
        """
        Sync spam complaints from Mailgun.

        Args:
            db: Database session

        Returns:
            Number of complaints synced

        Raises:
            IntegrationError: If API call fails
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/complaints",
                    auth=self.auth,
                    params={"limit": 1000},
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()
                items = data.get("items", [])

                synced_count = 0

                for item in items:
                    email = item.get("address", "").lower().strip()
                    if not email:
                        continue

                    reason = "Spam complaint"
                    created_at_str = item.get("created_at")

                    # Parse Mailgun timestamp
                    mailgun_created_at = None
                    if created_at_str:
                        try:
                            mailgun_created_at = datetime.strptime(
                                created_at_str, "%a, %d %b %Y %H:%M:%S %Z"
                            ).replace(tzinfo=timezone.utc)
                        except Exception:
                            pass

                    # Upsert suppression record
                    stmt = insert(EmailSuppression).values(
                        email=email,
                        suppression_type=SuppressionType.COMPLAINT,
                        reason=reason,
                        mailgun_created_at=mailgun_created_at,
                        synced_at=datetime.now(timezone.utc),
                    ).on_conflict_do_update(
                        index_elements=["email"],
                        set_={
                            "suppression_type": SuppressionType.COMPLAINT,
                            "reason": reason,
                            "mailgun_created_at": mailgun_created_at,
                            "synced_at": datetime.now(timezone.utc),
                        }
                    )

                    await db.execute(stmt)
                    synced_count += 1

                await db.commit()

                logger.info(f"Synced {synced_count} complaints from Mailgun")
                return synced_count

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Mailgun complaints API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to sync complaints from Mailgun: {str(e)}")

    async def sync_all(self, db: AsyncSession) -> Dict[str, int]:
        """
        Sync all suppression types from Mailgun.

        Args:
            db: Database session

        Returns:
            Dictionary with counts for each type
        """
        results = {
            "bounces": 0,
            "unsubscribes": 0,
            "complaints": 0,
        }

        try:
            results["bounces"] = await self.sync_bounces(db)
        except Exception as e:
            logger.error(f"Failed to sync bounces: {e}")

        try:
            results["unsubscribes"] = await self.sync_unsubscribes(db)
        except Exception as e:
            logger.error(f"Failed to sync unsubscribes: {e}")

        try:
            results["complaints"] = await self.sync_complaints(db)
        except Exception as e:
            logger.error(f"Failed to sync complaints: {e}")

        total = sum(results.values())
        logger.info(f"Synced {total} total suppressions from Mailgun")

        return results


async def is_suppressed(email: str, db: AsyncSession) -> bool:
    """
    Check if an email address is in the suppression list.

    Args:
        email: Email address to check
        db: Database session

    Returns:
        True if email is suppressed, False otherwise
    """
    email = email.lower().strip()

    result = await db.execute(
        select(EmailSuppression).where(EmailSuppression.email == email)
    )
    suppression = result.scalar_one_or_none()

    return suppression is not None


async def add_to_suppression(
    email: str,
    suppression_type: SuppressionType,
    reason: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> EmailSuppression:
    """
    Manually add an email to the suppression list.

    Args:
        email: Email address to suppress
        suppression_type: Type of suppression
        reason: Reason for suppression (optional)
        db: Database session

    Returns:
        Created or updated suppression record
    """
    email = email.lower().strip()

    stmt = insert(EmailSuppression).values(
        email=email,
        suppression_type=suppression_type,
        reason=reason,
        synced_at=datetime.now(timezone.utc),
    ).on_conflict_do_update(
        index_elements=["email"],
        set_={
            "suppression_type": suppression_type,
            "reason": reason,
            "synced_at": datetime.now(timezone.utc),
        }
    )

    await db.execute(stmt)
    await db.commit()

    # Fetch the record
    result = await db.execute(
        select(EmailSuppression).where(EmailSuppression.email == email)
    )
    suppression = result.scalar_one()

    logger.info(f"Added {email} to suppression list ({suppression_type})")

    return suppression


# Singleton instance
_suppression_service: Optional[SuppressionSyncService] = None


def get_suppression_service() -> SuppressionSyncService:
    """Get or create suppression sync service instance"""
    global _suppression_service
    if _suppression_service is None:
        _suppression_service = SuppressionSyncService()
    return _suppression_service
