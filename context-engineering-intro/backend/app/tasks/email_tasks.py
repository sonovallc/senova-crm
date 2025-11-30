"""
Celery tasks for async email sending

Features:
- Async email delivery via Mailgun
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
from app.services.mailgun_service import get_mailgun_service
from app.config.database import AsyncSessionLocal
from app.models.communication import Communication, CommunicationStatus
from app.core.exceptions import IntegrationError

logger = get_task_logger(__name__)


class EmailTask(Task):
    """Base task with retry configuration for emails"""

    autoretry_for = (IntegrationError,)
    retry_kwargs = {"max_retries": 3}
    retry_backoff = True  # Exponential backoff
    retry_backoff_max = 600  # Max 10 minutes
    retry_jitter = True  # Add randomness to prevent thundering herd


@celery_app.task(base=EmailTask, bind=True)
def send_email_task(
    self,
    communication_id: str,
    to_email: str,
    subject: str,
    html_body: Optional[str] = None,
    text_body: Optional[str] = None,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    reply_to: Optional[str] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
) -> Dict:
    """
    Send email via Mailgun (async task)

    Args:
        communication_id: Communication record ID
        to_email: Recipient email
        subject: Email subject
        html_body: HTML content
        text_body: Plain text content
        from_email: Sender email
        from_name: Sender name
        reply_to: Reply-to address
        tags: Tracking tags

    Returns:
        Dict with result status
    """
    logger.info(f"Sending email to {to_email} (communication_id: {communication_id})")

    async def _send_email():
        # Get Mailgun service (either per-user or default)
        mailgun = get_mailgun_service()

        # If user_id provided, use per-user Mailgun settings
        if user_id:
            from app.models.mailgun_settings import MailgunSettings
            from app.utils.encryption import decrypt_api_key

            async with AsyncSessionLocal() as db:
                mg_result = await db.execute(
                    select(MailgunSettings).where(
                        MailgunSettings.user_id == UUID(user_id),
                        MailgunSettings.is_active == True
                    )
                )
                mailgun_settings = mg_result.scalar_one_or_none()

                if mailgun_settings:
                    # Override Mailgun service with user's config
                    mailgun.api_key = decrypt_api_key(mailgun_settings.api_key)
                    mailgun.domain = mailgun_settings.domain
                    mailgun.base_url = f"https://api.mailgun.net/v3/{mailgun_settings.domain}"
                    mailgun.from_email = mailgun_settings.from_email
                    mailgun.from_name = mailgun_settings.from_name
                    mailgun.auth = ("api", mailgun.api_key)

                    logger.info(f"Using per-user Mailgun config for user {user_id} (domain: {mailgun_settings.domain})")

        try:
            # Send email via Mailgun
            result = await mailgun.send_email(
                to_email=to_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
                from_email=from_email,
                from_name=from_name,
                reply_to=reply_to,
                tags=tags,
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
                        "provider": "mailgun",
                        "message_id": result.get("message_id"),
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            logger.info(
                f"Email sent successfully: {result.get('message_id')} to {to_email}"
            )

            return {
                "status": "sent",
                "message_id": result.get("message_id"),
                "to": to_email,
            }

        except IntegrationError as e:
            logger.error(f"Failed to send email: {str(e)}")

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
                        "provider": "mailgun",
                        "error": str(e),
                        "failed_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            # Re-raise for Celery retry logic
            raise

    # Run async function
    return asyncio.run(_send_email())


@celery_app.task(base=EmailTask, bind=True)
def send_template_email_task(
    self,
    communication_id: str,
    to_email: str,
    template_name: str,
    template_variables: Dict,
    subject: Optional[str] = None,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> Dict:
    """
    Send template email via Mailgun (async task)

    Args:
        communication_id: Communication record ID
        to_email: Recipient email
        template_name: Mailgun template name
        template_variables: Template variables
        subject: Email subject (override template)
        from_email: Sender email
        from_name: Sender name
        tags: Tracking tags

    Returns:
        Dict with result status
    """
    logger.info(
        f"Sending template email '{template_name}' to {to_email} (communication_id: {communication_id})"
    )

    async def _send_template_email():
        mailgun = get_mailgun_service()

        try:
            result = await mailgun.send_template_email(
                to_email=to_email,
                template_name=template_name,
                template_variables=template_variables,
                subject=subject,
                from_email=from_email,
                from_name=from_name,
                tags=tags,
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
                        "provider": "mailgun",
                        "message_id": result.get("message_id"),
                        "template": template_name,
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            logger.info(
                f"Template email sent successfully: {result.get('message_id')} to {to_email}"
            )

            return {
                "status": "sent",
                "message_id": result.get("message_id"),
                "template": template_name,
                "to": to_email,
            }

        except IntegrationError as e:
            logger.error(f"Failed to send template email: {str(e)}")

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
                        "provider": "mailgun",
                        "template": template_name,
                        "error": str(e),
                        "failed_at": datetime.now(timezone.utc).isoformat(),
                    }

                    await db.commit()

            raise

    return asyncio.run(_send_template_email())
