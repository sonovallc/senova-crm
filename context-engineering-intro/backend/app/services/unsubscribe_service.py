"""
Unsubscribe Service

Manages unsubscribe tokens and handles one-click unsubscribe (RFC 8058 compliance).
"""

import base64
import secrets
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.unsubscribe_token import UnsubscribeToken
from app.models.contact import Contact
from app.models.email_suppression import SuppressionType
from app.services.suppression_sync import add_to_suppression

logger = logging.getLogger(__name__)


async def generate_unsubscribe_token(
    contact_id: UUID,
    email: str,
    campaign_id: Optional[UUID] = None,
    db: Optional[AsyncSession] = None,
) -> str:
    """
    Generate and store a unique unsubscribe token.

    Args:
        contact_id: Contact UUID
        email: Contact email address
        campaign_id: Optional campaign UUID for tracking
        db: Database session

    Returns:
        Unique token string (base64 encoded)
    """
    # Generate a cryptographically secure random token
    # Format: random_bytes(16) + contact_id + email
    random_part = secrets.token_bytes(16)
    token_data = f"{random_part.hex()}:{contact_id}:{email}"
    token = base64.urlsafe_b64encode(token_data.encode('utf-8')).decode('utf-8')

    # Store token in database
    token_record = UnsubscribeToken(
        token=token,
        contact_id=contact_id,
        campaign_id=campaign_id,
        is_used=False,
    )

    db.add(token_record)
    await db.commit()
    await db.refresh(token_record)

    logger.info(f"Generated unsubscribe token for contact {contact_id}")

    return token


async def validate_and_use_token(
    token: str,
    db: AsyncSession,
) -> dict:
    """
    Validate an unsubscribe token and mark as used.

    Args:
        token: Unsubscribe token string
        db: Database session

    Returns:
        Dict with validation result and contact info

    Raises:
        ValueError: If token is invalid or already used
    """
    # Look up token in database
    result = await db.execute(
        select(UnsubscribeToken).where(UnsubscribeToken.token == token)
    )
    token_record = result.scalar_one_or_none()

    if not token_record:
        logger.warning(f"Invalid unsubscribe token attempted: {token[:16]}...")
        raise ValueError("Invalid unsubscribe token")

    if token_record.is_used:
        logger.warning(f"Already used unsubscribe token attempted: {token[:16]}...")
        raise ValueError("This unsubscribe link has already been used")

    # Load contact
    contact_result = await db.execute(
        select(Contact).where(Contact.id == token_record.contact_id)
    )
    contact = contact_result.scalar_one_or_none()

    if not contact:
        logger.error(f"Contact not found for token: {token_record.contact_id}")
        raise ValueError("Contact not found")

    return {
        "contact_id": token_record.contact_id,
        "email": contact.email,
        "contact_name": f"{contact.first_name or ''} {contact.last_name or ''}".strip(),
        "campaign_id": token_record.campaign_id,
        "token_record": token_record,
    }


async def process_unsubscribe(
    token: str,
    db: AsyncSession,
) -> dict:
    """
    Process an unsubscribe request.

    1. Validates token
    2. Marks token as used
    3. Adds email to local suppression list
    4. Adds email to Mailgun suppression list

    Args:
        token: Unsubscribe token string
        db: Database session

    Returns:
        Dict with unsubscribe result

    Raises:
        ValueError: If token is invalid or already used
    """
    # Validate token and get contact info
    validation_result = await validate_and_use_token(token, db)

    contact_id = validation_result["contact_id"]
    email = validation_result["email"]
    token_record = validation_result["token_record"]

    # Mark token as used
    token_record.is_used = True
    token_record.used_at = datetime.now(timezone.utc)
    await db.commit()

    # Add to local suppression list
    await add_to_suppression(
        email=email,
        suppression_type=SuppressionType.UNSUBSCRIBE,
        reason="One-click unsubscribe via email link",
        db=db,
    )

    # Add to Mailgun suppression list
    try:
        from app.services.mailgun_service import get_mailgun_service
        import httpx

        mailgun = get_mailgun_service()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{mailgun.base_url}/unsubscribes",
                auth=mailgun.auth,
                data={"address": email, "tag": "one-click-unsubscribe"},
                timeout=10.0,
            )
            response.raise_for_status()

            logger.info(f"Added {email} to Mailgun unsubscribe list")

    except Exception as e:
        logger.error(f"Failed to add {email} to Mailgun suppression list: {e}")
        # Don't fail the entire operation - local suppression is enough

    logger.info(f"Successfully unsubscribed {email} (contact {contact_id})")

    return {
        "success": True,
        "email": email,
        "contact_id": str(contact_id),
        "contact_name": validation_result["contact_name"],
        "campaign_id": str(validation_result["campaign_id"]) if validation_result["campaign_id"] else None,
    }
