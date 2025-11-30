"""
Celery tasks for async SMS/MMS sending via Bandwidth

Features:
- Async SMS/MMS delivery
- Retry logic with exponential backoff
- Error handling and logging
- Delivery status tracking
"""

import asyncio
from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime, timezone

from celery import Task
from celery.utils.log import get_task_logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_app import celery_app
from app.services.bandwidth_service import get_bandwidth_service
from app.config.database import AsyncSessionLocal
from app.models.communication import Communication, CommunicationStatus
from app.core.exceptions import IntegrationError

logger = get_task_logger(__name__)


class SMSTask(Task):
    """Base task with retry configuration for SMS"""

    autoretry_for = (IntegrationError,)
    retry_kwargs = {"max_retries": 3}
    retry_backoff = True  # Exponential backoff
    retry_backoff_max = 600  # Max 10 minutes
    retry_jitter = True


@celery_app.task(base=SMSTask, bind=True)
def send_sms_task(
    self,
    communication_id: str,
    to_number: str,
    text: str,
    from_number: Optional[str] = None,
    tag: Optional[str] = None,
) -> Dict:
    """
    Send SMS via Bandwidth (async task)

    Args:
        communication_id: Communication record ID
        to_number: Recipient phone (E.164 format)
        text: Message text
        from_number: Sender number
        tag: Tracking tag

    Returns:
        Dict with result status
    """
    logger.info(f"Sending SMS to {to_number} (communication_id: {communication_id})")

    async def _send_sms():
        bandwidth = get_bandwidth_service()

        try:
            # Send SMS via Bandwidth
            result = await bandwidth.send_sms(
                to_number=to_number,
                text=text,
                from_number=from_number,
                tag=tag,
            )

            # Update communication record
            async with AsyncSessionLocal() as db:
                comm_result = await db.execute(
                    select(Communication).where(
                        Communication.id == UUID(communication_id)
                    )
                )
                communication = comm_result.scalar_one_or_none()

                if communication:
                    communication.status = CommunicationStatus.SENT
                    communication.sent_at = datetime.now(timezone.utc)
                    communication.external_id = result.get("message_id")

                    # Store provider metadata
                    communication.provider_metadata = {
                        "provider": "bandwidth",
                        "message_id": result.get("message_id"),
                        "segment_count": result.get("segment_count"),
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            logger.info(
                f"SMS sent successfully: {result.get('message_id')} to {to_number}"
            )

            return {
                "status": "sent",
                "message_id": result.get("message_id"),
                "to": to_number,
                "segment_count": result.get("segment_count"),
            }

        except IntegrationError as e:
            logger.error(f"Failed to send SMS: {str(e)}")

            # Update communication record as failed
            async with AsyncSessionLocal() as db:
                comm_result = await db.execute(
                    select(Communication).where(
                        Communication.id == UUID(communication_id)
                    )
                )
                communication = comm_result.scalar_one_or_none()

                if communication:
                    communication.status = CommunicationStatus.FAILED
                    communication.failed_at = datetime.now(timezone.utc)
                    communication.provider_metadata = {
                        "provider": "bandwidth",
                        "error": str(e),
                        "failed_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            # Re-raise for Celery retry logic
            raise

    # Run async function
    return asyncio.run(_send_sms())


@celery_app.task(base=SMSTask, bind=True)
def send_mms_task(
    self,
    communication_id: str,
    to_number: str,
    text: str,
    media_urls: List[str],
    from_number: Optional[str] = None,
    tag: Optional[str] = None,
) -> Dict:
    """
    Send MMS via Bandwidth (async task)

    Args:
        communication_id: Communication record ID
        to_number: Recipient phone (E.164 format)
        text: Message text
        media_urls: List of media URLs
        from_number: Sender number
        tag: Tracking tag

    Returns:
        Dict with result status
    """
    logger.info(
        f"Sending MMS with {len(media_urls)} media to {to_number} (communication_id: {communication_id})"
    )

    async def _send_mms():
        bandwidth = get_bandwidth_service()

        try:
            result = await bandwidth.send_mms(
                to_number=to_number,
                text=text,
                media_urls=media_urls,
                from_number=from_number,
                tag=tag,
            )

            # Update communication record
            async with AsyncSessionLocal() as db:
                comm_result = await db.execute(
                    select(Communication).where(
                        Communication.id == UUID(communication_id)
                    )
                )
                communication = comm_result.scalar_one_or_none()

                if communication:
                    communication.status = CommunicationStatus.SENT
                    communication.sent_at = datetime.now(timezone.utc)
                    communication.external_id = result.get("message_id")

                    communication.provider_metadata = {
                        "provider": "bandwidth",
                        "message_id": result.get("message_id"),
                        "media_count": len(media_urls),
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            logger.info(
                f"MMS sent successfully: {result.get('message_id')} to {to_number}"
            )

            return {
                "status": "sent",
                "message_id": result.get("message_id"),
                "to": to_number,
                "media_count": len(media_urls),
            }

        except IntegrationError as e:
            logger.error(f"Failed to send MMS: {str(e)}")

            async with AsyncSessionLocal() as db:
                comm_result = await db.execute(
                    select(Communication).where(
                        Communication.id == UUID(communication_id)
                    )
                )
                communication = comm_result.scalar_one_or_none()

                if communication:
                    communication.status = CommunicationStatus.FAILED
                    communication.failed_at = datetime.now(timezone.utc)
                    communication.provider_metadata = {
                        "provider": "bandwidth",
                        "error": str(e),
                        "failed_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            raise

    return asyncio.run(_send_mms())
