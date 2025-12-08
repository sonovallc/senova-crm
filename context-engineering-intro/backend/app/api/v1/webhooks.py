"""
Webhook handlers for external services

Features:
- Bandwidth.com message delivery webhooks
- Mailgun email delivery webhooks
- Automatic retry handling
- Status updates in database
"""

from typing import Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import json
import hmac
import hashlib
import logging

from app.config.database import get_db
from app.config.settings import get_settings
from app.models.communication import Communication, CommunicationType, CommunicationDirection, CommunicationStatus
from app.models.contact import Contact, ContactSource
from app.models.payment import Payment, PaymentStatus
from app.services.stripe_service import StripeService
from app.services.local_storage_service import upload_file
from app.core.exceptions import NotFoundError, PaymentError
from app.utils.webhook_security import verify_mailgun_signature, is_timestamp_valid, sanitize_html

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)
settings = get_settings()


# ==================== HELPER FUNCTIONS ====================


async def _find_contact_by_email(sender_email: str, db: AsyncSession) -> Optional[Contact]:
    """
    Find contact by checking email fields in priority order.

    Priority:
    1. Verified emails (personal_verified_email and variants)
    2. Unverified personal emails (personal_email and variants)
    3. Primary email (email field)
    4. SHA256 hashes

    Args:
        sender_email: Email address to search for
        db: Database session

    Returns:
        Contact if found, None otherwise
    """
    # Step 1: Check verified emails first (highest priority)
    verified_conditions = [Contact.personal_verified_email == sender_email]
    for i in range(2, 31):
        field_name = f"personal_verified_email_{i}"
        if hasattr(Contact, field_name):
            verified_conditions.append(getattr(Contact, field_name) == sender_email)

    result = await db.execute(
        select(Contact).where(or_(*verified_conditions))
    )
    contact = result.scalar_one_or_none()
    if contact:
        return contact

    # Step 2: Check unverified personal emails second
    personal_conditions = [Contact.personal_email == sender_email]
    for i in range(1, 31):
        field_name = f"personal_email_{i}"
        if hasattr(Contact, field_name):
            personal_conditions.append(getattr(Contact, field_name) == sender_email)

    result = await db.execute(
        select(Contact).where(or_(*personal_conditions))
    )
    contact = result.scalar_one_or_none()
    if contact:
        return contact

    # Step 3: Check primary email field last
    result = await db.execute(
        select(Contact).where(Contact.email == sender_email)
    )
    contact = result.scalar_one_or_none()
    if contact:
        return contact

    # Step 4: Try SHA256 hash matching
    sender_hash = hashlib.sha256(sender_email.encode()).hexdigest()
    hash_conditions = [Contact.sha256_personal_email == sender_hash]
    for i in range(1, 31):
        field_name = f"sha256_personal_email_{i}"
        if hasattr(Contact, field_name):
            hash_conditions.append(getattr(Contact, field_name) == sender_hash)

    result = await db.execute(
        select(Contact).where(or_(*hash_conditions))
    )
    return result.scalar_one_or_none()


@router.post("/bandwidth/messaging")
async def bandwidth_messaging_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Bandwidth.com messaging webhook handler

    Handles:
    - Message delivery status updates
    - Inbound SMS/MMS messages
    - Message failures

    CRITICAL: Must return HTTP 2xx to acknowledge receipt
    Bandwidth retries for 24 hours if not acknowledged
    """
    try:
        # Parse webhook payload
        payload = await request.json()

        # Bandwidth sends array of events
        events = payload if isinstance(payload, list) else [payload]

        for event in events:
            event_type = event.get("type")
            message = event.get("message", {})

            if event_type == "message-received":
                # Inbound SMS/MMS
                await _handle_inbound_message(event, db)

            elif event_type == "message-delivered":
                # Message successfully delivered
                await _handle_delivery_status(event, CommunicationStatus.DELIVERED, db)

            elif event_type == "message-failed":
                # Message delivery failed
                await _handle_delivery_status(event, CommunicationStatus.FAILED, db)

        # Return 200 to acknowledge
        return {"status": "received"}

    except Exception as e:
        # Log error but still return 200 to prevent retries
        print(f"Bandwidth webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


async def _handle_inbound_message(event: Dict, db: AsyncSession):
    """
    Handle inbound SMS/MMS from Bandwidth

    Args:
        event: Webhook event data
        db: Database session
    """
    message = event.get("message", {})

    from_number = message.get("from")
    to_number = message.get("to", [None])[0]
    text = message.get("text", "")
    media_urls = message.get("media", [])
    message_id = message.get("id")
    message_time = message.get("time")

    # Find or create contact by phone number
    result = await db.execute(
        select(Contact).where(Contact.phone == from_number)
    )
    contact = result.scalar_one_or_none()

    if not contact:
        # Create new lead
        contact = Contact(
            phone=from_number,
            first_name="Unknown",
            last_name="",
            status="lead",
            source="sms",
        )
        db.add(contact)
        await db.commit()
        await db.refresh(contact)

    # Determine type (SMS or MMS)
    comm_type = CommunicationType.MMS if media_urls else CommunicationType.SMS

    # Create communication record
    communication = Communication(
        type=comm_type,
        direction=CommunicationDirection.INBOUND,
        contact_id=contact.id,
        from_address=from_number,
        to_address=to_number,
        body=text,
        media_urls=media_urls,
        status=CommunicationStatus.DELIVERED,
        external_id=message_id,
        delivered_at=datetime.fromisoformat(message_time.replace("Z", "+00:00"))
        if message_time
        else datetime.now(timezone.utc),
        provider_metadata={
            "provider": "bandwidth",
            "message_id": message_id,
            "event_type": "message-received",
        },
    )

    db.add(communication)
    await db.commit()

    # TODO: Trigger AI auto-response via Closebot if configured
    # TODO: Notify users via WebSocket


async def _handle_delivery_status(
    event: Dict,
    status: CommunicationStatus,
    db: AsyncSession,
):
    """
    Update communication delivery status

    Args:
        event: Webhook event data
        status: New communication status
        db: Database session
    """
    message = event.get("message", {})
    message_id = message.get("id")

    # Find communication by external_id
    result = await db.execute(
        select(Communication).where(Communication.external_id == message_id)
    )
    communication = result.scalar_one_or_none()

    if communication:
        communication.status = status

        if status == CommunicationStatus.DELIVERED:
            communication.delivered_at = datetime.now(timezone.utc)
        elif status == CommunicationStatus.FAILED:
            communication.failed_at = datetime.now(timezone.utc)

        # Update provider metadata
        communication.provider_metadata = {
            **communication.provider_metadata,
            "event_type": event.get("type"),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        await db.commit()


@router.post("/bandwidth/voice")
async def bandwidth_voice_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Bandwidth.com voice webhook handler

    Handles:
    - Call status updates
    - Call recordings
    - Call transcriptions
    """
    try:
        payload = await request.json()

        # Handle different voice events
        event_type = payload.get("eventType")

        if event_type in ["answer", "hangup", "recording-available"]:
            # Update call record
            call_id = payload.get("callId")

            result = await db.execute(
                select(Communication).where(
                    Communication.external_id == call_id,
                    Communication.type == CommunicationType.PHONE,
                )
            )
            communication = result.scalar_one_or_none()

            if communication:
                if event_type == "answer":
                    communication.status = CommunicationStatus.DELIVERED
                    communication.delivered_at = datetime.now(timezone.utc)
                elif event_type == "hangup":
                    communication.provider_metadata = {
                        **communication.provider_metadata,
                        "duration": payload.get("duration"),
                        "hangup_cause": payload.get("cause"),
                    }
                elif event_type == "recording-available":
                    communication.media_urls.append(payload.get("recordingUrl"))

                await db.commit()

        return {"status": "received"}

    except Exception as e:
        print(f"Bandwidth voice webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.post("/mailgun/events", status_code=status.HTTP_200_OK)
async def handle_mailgun_delivery_events(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle delivery status events from Mailgun

    Events: delivered, opened, clicked, failed, bounced, complained, unsubscribed

    Mailgun sends JSON with:
    - signature: {timestamp, token, signature}
    - event-data: {event, message: {headers: {message-id}}, ...}
    """
    try:
        # Parse JSON body
        payload = await request.json()

        # Extract signature
        sig_data = payload.get("signature", {})
        timestamp = str(sig_data.get("timestamp", ""))
        token = sig_data.get("token", "")
        signature = sig_data.get("signature", "")

        # Extract event data
        event_data = payload.get("event-data", {})
        event_type = event_data.get("event", "unknown")

        # Log attempt
        logger.info(f"Delivery event webhook: type={event_type}")

        # SECURITY: Verify signature
        if settings.mailgun_webhook_signing_key:
            if not verify_mailgun_signature(
                settings.mailgun_webhook_signing_key,
                timestamp,
                token,
                signature
            ):
                logger.warning(f"Invalid webhook signature for event {event_type}")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid signature")

            if not is_timestamp_valid(timestamp):
                logger.warning(f"Webhook timestamp too old for event {event_type}")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Request expired")
        else:
            logger.warning("MAILGUN_WEBHOOK_SIGNING_KEY not configured - skipping signature verification")

        # Extract message ID to find original communication
        message_headers = event_data.get("message", {}).get("headers", {})
        message_id = message_headers.get("message-id", "")

        if not message_id:
            logger.warning(f"No message-id in event {event_type}")
            return {"status": "ok", "processed": False}

        # Find original communication
        result = await db.execute(
            select(Communication).where(Communication.external_id == message_id)
        )
        communication = result.scalar_one_or_none()

        if not communication:
            logger.warning(f"Communication not found for message_id: {message_id}")
            return {"status": "ok", "processed": False}

        # Process event based on type
        now = datetime.now(timezone.utc)

        if event_type == "delivered":
            communication.status = CommunicationStatus.DELIVERED
            communication.delivered_at = now
            logger.info(f"Email delivered: {communication.id}")

        elif event_type == "opened":
            communication.opened_at = now
            # Update metadata
            open_count = communication.provider_metadata.get("open_count", 0) + 1
            communication.provider_metadata = {
                **communication.provider_metadata,
                "open_count": open_count,
                "last_opened_at": now.isoformat()
            }
            logger.info(f"Email opened: {communication.id}, count={open_count}")

        elif event_type == "clicked":
            click_url = event_data.get("url", "")
            click_count = communication.provider_metadata.get("click_count", 0) + 1
            communication.provider_metadata = {
                **communication.provider_metadata,
                "click_count": click_count,
                "last_clicked_at": now.isoformat(),
                "last_clicked_url": click_url
            }
            logger.info(f"Email clicked: {communication.id}, url={click_url}")

        elif event_type in ["failed", "bounced"]:
            communication.status = CommunicationStatus.FAILED
            error_message = event_data.get("delivery-status", {}).get("message", "Delivery failed")
            communication.provider_metadata = {
                **communication.provider_metadata,
                "error": error_message,
                "failed_at": now.isoformat()
            }
            logger.warning(f"Email failed: {communication.id}, error={error_message}")

        elif event_type == "complained":
            communication.status = CommunicationStatus.COMPLAINED
            communication.provider_metadata = {
                **communication.provider_metadata,
                "complained_at": now.isoformat()
            }
            # Flag contact for suppression
            if communication.contact_id:
                await flag_contact_suppressed(db, communication.contact_id, "complained")
            logger.warning(f"Email complained: {communication.id}")

        elif event_type == "unsubscribed":
            communication.provider_metadata = {
                **communication.provider_metadata,
                "unsubscribed_at": now.isoformat()
            }
            # Flag contact as unsubscribed
            if communication.contact_id:
                await flag_contact_unsubscribed(db, communication.contact_id)
            logger.info(f"Email unsubscribed: {communication.id}")

        await db.commit()

        return {"status": "ok", "event": event_type, "processed": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delivery event webhook error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "error", "message": "Processing failed"}
        )


@router.post("/mailgun/inbound", status_code=status.HTTP_200_OK)
async def handle_mailgun_inbound_email(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle inbound emails from Mailgun

    Mailgun sends POST with form data containing:
    - sender: From email address
    - recipient: To email address
    - subject: Email subject
    - body-plain: Plain text body
    - body-html: HTML body
    - Message-Id: Unique message identifier
    - In-Reply-To: Original message ID (if reply)
    - timestamp, token, signature: For verification
    """
    try:
        # Parse form data
        form_data = await request.form()

        # Extract signature fields
        timestamp = form_data.get("timestamp", "")
        token = form_data.get("token", "")
        signature = form_data.get("signature", "")

        # Log attempt (without sensitive data)
        sender = form_data.get("sender", "unknown")
        recipient = form_data.get("recipient", "unknown")
        logger.info(f"Inbound webhook: from={sender}, to={recipient}")

        # DEBUG: Log signature details for troubleshooting
        logger.info(f"Webhook signature debug: timestamp={timestamp}, token_len={len(token) if token else 0}, sig_len={len(signature) if signature else 0}")

        # SECURITY: Verify signature
        if settings.mailgun_webhook_signing_key:
            # DEBUG: Log expected signature calculation
            import hmac as hmac_debug
            import hashlib as hashlib_debug
            if timestamp and token:
                expected = hmac_debug.new(
                    key=settings.mailgun_webhook_signing_key.encode(),
                    msg=(str(timestamp) + str(token)).encode(),
                    digestmod=hashlib_debug.sha256
                ).hexdigest()
                logger.info(f"Signature verification: expected={expected[:20]}..., received={signature[:20] if signature else 'None'}...")

            if not verify_mailgun_signature(
                settings.mailgun_webhook_signing_key,
                timestamp,
                token,
                signature
            ):
                logger.warning(f"Invalid webhook signature from {sender}. timestamp={timestamp}, token={token[:10] if token else 'None'}...")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid signature")

            # SECURITY: Validate timestamp (prevent replay attacks)
            if not is_timestamp_valid(timestamp):
                logger.warning(f"Webhook timestamp too old from {sender}")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Request expired")
        else:
            logger.warning("MAILGUN_WEBHOOK_SIGNING_KEY not configured - skipping signature verification")

        # Extract email data
        subject = form_data.get("subject", "")
        body_plain = form_data.get("body-plain", "")
        body_html = form_data.get("body-html", "")
        message_id = form_data.get("Message-Id", "")
        in_reply_to = form_data.get("In-Reply-To", "")

        # SECURITY: Sanitize HTML body
        sanitized_html = sanitize_html(body_html) if body_html else body_plain

        # Find or create contact
        contact = await find_or_create_contact(db, sender)

        # Check for reply threading
        original_communication_id = None
        if in_reply_to:
            original_communication_id = await find_original_communication(db, in_reply_to)

        # Process attachments from Mailgun
        # Mailgun sends attachments as "attachment-1", "attachment-2", etc.
        attachment_urls = []
        attachment_count = int(form_data.get("attachment-count", "0"))

        for i in range(1, attachment_count + 1):
            attachment_key = f"attachment-{i}"
            attachment_file = form_data.get(attachment_key)

            if attachment_file:
                try:
                    # Save attachment using local storage service
                    file_url = await upload_file(attachment_file, subfolder="email-attachments")
                    attachment_urls.append(file_url)
                    logger.info(f"Saved inbound email attachment: {attachment_file.filename} -> {file_url}")
                except Exception as e:
                    logger.error(f"Failed to save attachment {attachment_file.filename}: {str(e)}")

        # Store in communications table
        communication = Communication(
            type=CommunicationType.EMAIL,
            direction=CommunicationDirection.INBOUND,
            contact_id=contact.id,
            subject=subject,
            body=sanitized_html,
            from_address=sender,
            to_address=recipient,
            media_urls=attachment_urls,  # Add attachment URLs
            status=CommunicationStatus.RECEIVED,
            external_id=message_id,
            received_at=datetime.now(timezone.utc),
            provider_metadata={
                "provider": "mailgun",
                "message_id": message_id,
                "in_reply_to": in_reply_to,
                "original_communication_id": str(original_communication_id) if original_communication_id else None,
                "attachment_count": len(attachment_urls),
            }
        )

        db.add(communication)
        await db.commit()

        logger.info(f"Inbound email stored: id={communication.id}, contact={contact.id}")

        return {"status": "ok", "communication_id": str(communication.id)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inbound webhook error: {str(e)}")
        # Return 200 to prevent Mailgun retries for processing errors
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "error", "message": "Processing failed"}
        )


# =============================================================================
# HELPER FUNCTIONS FOR MAILGUN WEBHOOKS
# =============================================================================

async def find_or_create_contact(db: AsyncSession, email: str) -> Contact:
    """Find existing contact by email or create new one"""
    # Clean email (handle "Name <email@example.com>" format)
    if "<" in email and ">" in email:
        email = email.split("<")[1].split(">")[0]
    email = email.strip().lower()

    result = await db.execute(
        select(Contact).where(Contact.email == email)
    )
    contact = result.scalar_one_or_none()

    if not contact:
        # Create new contact
        name_part = email.split("@")[0]
        contact = Contact(
            email=email,
            first_name=name_part.capitalize(),
            last_name="",
            source=ContactSource.EMAIL,
            status="LEAD"
        )
        db.add(contact)
        await db.flush()
        logger.info(f"Created new contact from inbound email: {email}")

    return contact


async def find_original_communication(db: AsyncSession, in_reply_to: str) -> Optional[UUID]:
    """Find original communication ID from In-Reply-To header"""
    # Clean the message ID
    in_reply_to = in_reply_to.strip().strip("<>")

    result = await db.execute(
        select(Communication.id).where(Communication.external_id.contains(in_reply_to))
    )
    original = result.scalar_one_or_none()
    return original


async def flag_contact_suppressed(db: AsyncSession, contact_id: UUID, reason: str):
    """Flag contact for email suppression"""
    contact = await db.get(Contact, contact_id)
    if contact:
        # Add to suppression list (store in metadata or separate table)
        logger.info(f"Contact {contact_id} suppressed: {reason}")
        # Note: You may want a separate email_suppressions table for this


async def flag_contact_unsubscribed(db: AsyncSession, contact_id: UUID):
    """Flag contact as unsubscribed from emails"""
    contact = await db.get(Contact, contact_id)
    if contact:
        logger.info(f"Contact {contact_id} unsubscribed")
        # Note: You may want to add an email_unsubscribed field to Contact


# ==================== TELNYX WEBHOOKS ====================


@router.post("/telnyx/messaging")
async def telnyx_messaging_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Telnyx messaging webhook handler

    Handles:
    - Inbound SMS/MMS (message.received)
    - Delivery status updates (message.finalized)

    CRITICAL: Must return HTTP 2xx to acknowledge receipt
    """
    try:
        # Parse webhook payload
        payload = await request.json()

        # Telnyx sends data in "data" envelope
        data = payload.get("data", {})
        event_type = data.get("event_type", "")
        event_payload = data.get("payload", {})

        logger.info(f"Telnyx webhook: type={event_type}")

        if event_type == "message.received":
            # Inbound SMS/MMS
            await _handle_telnyx_inbound_message(event_payload, db)

        elif event_type == "message.finalized":
            # Delivery status update (sent, delivered, failed)
            await _handle_telnyx_delivery_status(event_payload, db)

        elif event_type == "message.sent":
            # Message accepted for delivery
            await _handle_telnyx_message_sent(event_payload, db)

        return {"status": "received"}

    except Exception as e:
        logger.error(f"Telnyx webhook error: {str(e)}")
        # Still return 200 to prevent retries
        return {"status": "error", "message": str(e)}


async def _handle_telnyx_inbound_message(payload: Dict, db: AsyncSession):
    """
    Handle inbound SMS/MMS from Telnyx

    Args:
        payload: Webhook payload
        db: Database session
    """
    from_number = payload.get("from", {}).get("phone_number")
    to_number = payload.get("to", [{}])[0].get("phone_number") if payload.get("to") else None
    text = payload.get("text", "")
    media_urls = [m.get("url") for m in payload.get("media", []) if m.get("url")]
    message_id = payload.get("id")
    received_at = payload.get("received_at")

    if not from_number:
        logger.warning("Telnyx inbound message missing from_number")
        return

    # Find or create contact by phone number
    # Check multiple phone fields
    result = await db.execute(
        select(Contact).where(
            or_(
                Contact.phone == from_number,
                Contact.mobile_phone == from_number,
            )
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        # Create new lead
        contact = Contact(
            phone=from_number,
            first_name="Unknown",
            last_name="",
            status="LEAD",
            source="SMS",
        )
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
        logger.info(f"Created new contact from Telnyx SMS: {from_number}")

    # Determine type (SMS or MMS)
    comm_type = CommunicationType.MMS if media_urls else CommunicationType.SMS

    # Parse received_at timestamp
    received_datetime = datetime.now(timezone.utc)
    if received_at:
        try:
            received_datetime = datetime.fromisoformat(received_at.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            pass

    # Create communication record
    communication = Communication(
        type=comm_type,
        direction=CommunicationDirection.INBOUND,
        contact_id=contact.id,
        from_address=from_number,
        to_address=to_number,
        body=text,
        media_urls=media_urls,
        status=CommunicationStatus.RECEIVED,
        external_id=message_id,
        received_at=received_datetime,
        provider_metadata={
            "provider": "telnyx",
            "message_id": message_id,
            "event_type": "message.received",
            "media_count": len(media_urls),
        },
    )

    db.add(communication)
    await db.commit()

    logger.info(f"Telnyx inbound message stored: id={communication.id}, contact={contact.id}")


async def _handle_telnyx_delivery_status(payload: Dict, db: AsyncSession):
    """
    Handle Telnyx delivery status update

    Args:
        payload: Webhook payload
        db: Database session
    """
    message_id = payload.get("id")
    to_status = payload.get("to", [{}])[0].get("status") if payload.get("to") else None

    if not message_id:
        return

    # Find communication by external_id
    result = await db.execute(
        select(Communication).where(Communication.external_id == message_id)
    )
    communication = result.scalar_one_or_none()

    if not communication:
        logger.debug(f"Communication not found for Telnyx message: {message_id}")
        return

    now = datetime.now(timezone.utc)

    # Map Telnyx status to our status
    if to_status == "delivered":
        communication.status = CommunicationStatus.DELIVERED
        communication.delivered_at = now
    elif to_status == "sent":
        communication.status = CommunicationStatus.SENT
        communication.sent_at = now
    elif to_status in ["sending_failed", "delivery_failed", "undelivered"]:
        communication.status = CommunicationStatus.FAILED

    # Update metadata
    communication.provider_metadata = {
        **communication.provider_metadata,
        "to_status": to_status,
        "finalized_at": now.isoformat(),
    }

    await db.commit()
    logger.info(f"Telnyx delivery status updated: {communication.id} -> {to_status}")


async def _handle_telnyx_message_sent(payload: Dict, db: AsyncSession):
    """
    Handle Telnyx message sent confirmation

    Args:
        payload: Webhook payload
        db: Database session
    """
    message_id = payload.get("id")

    if not message_id:
        return

    result = await db.execute(
        select(Communication).where(Communication.external_id == message_id)
    )
    communication = result.scalar_one_or_none()

    if communication and communication.status == CommunicationStatus.PENDING:
        communication.status = CommunicationStatus.SENT
        communication.sent_at = datetime.now(timezone.utc)
        await db.commit()


# ==================== PAYMENT WEBHOOKS ====================


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Stripe webhook handler

    Handles:
    - Payment intent succeeded
    - Payment intent failed
    - Charge succeeded
    - Charge refunded
    - Customer subscription events
    """
    try:
        # Get request body and signature
        payload = await request.body()
        signature = request.headers.get("stripe-signature")

        # Verify webhook signature
        from app.config.settings import settings

        event = StripeService.verify_webhook_signature(
            payload=payload,
            signature=signature,
            webhook_secret=settings.stripe_webhook_secret,
        )

        event_type = event["type"]
        event_data = event["data"]["object"]

        # Handle different event types
        if event_type == "payment_intent.succeeded":
            # Payment completed successfully
            payment_intent_id = event_data["id"]

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_intent_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.COMPLETED
                payment.gateway_response = {
                    **payment.gateway_response,
                    "webhook_event": event_type,
                }
                await db.commit()

        elif event_type == "payment_intent.payment_failed":
            # Payment failed
            payment_intent_id = event_data["id"]

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_intent_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.FAILED
                payment.gateway_response = {
                    **payment.gateway_response,
                    "webhook_event": event_type,
                    "failure_message": event_data.get("last_payment_error", {}).get("message"),
                }
                await db.commit()

        elif event_type == "charge.refunded":
            # Refund processed
            charge_id = event_data["id"]
            payment_intent_id = event_data.get("payment_intent")

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_intent_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                refund_amount = event_data["amount_refunded"]
                payment.refunded_amount = refund_amount

                if refund_amount >= payment.amount:
                    payment.status = PaymentStatus.REFUNDED
                else:
                    payment.status = PaymentStatus.PARTIAL_REFUND

                await db.commit()

        return {"status": "received"}

    except PaymentError as e:
        return {"status": "error", "message": str(e)}
    except Exception as e:
        print(f"Stripe webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.post("/square")
async def square_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Square webhook handler

    Handles:
    - Payment created
    - Payment updated
    - Refund created
    - Refund updated
    """
    try:
        payload = await request.json()

        event_type = payload.get("type")
        event_data = payload.get("data", {}).get("object", {})

        if event_type == "payment.created":
            # New payment created
            payment_id = event_data.get("payment", {}).get("id")
            status = event_data.get("payment", {}).get("status")

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                # Map Square status to our status
                if status == "COMPLETED":
                    payment.status = PaymentStatus.COMPLETED
                elif status == "APPROVED":
                    payment.status = PaymentStatus.APPROVED
                elif status == "FAILED":
                    payment.status = PaymentStatus.FAILED
                elif status == "CANCELED":
                    payment.status = PaymentStatus.CANCELLED

                await db.commit()

        elif event_type == "payment.updated":
            # Payment status updated
            payment_id = event_data.get("payment", {}).get("id")
            status = event_data.get("payment", {}).get("status")

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_id)
            )
            payment = result.scalar_one_or_none()

            if payment and status:
                if status == "COMPLETED":
                    payment.status = PaymentStatus.COMPLETED
                elif status == "FAILED":
                    payment.status = PaymentStatus.FAILED

                await db.commit()

        elif event_type == "refund.created":
            # Refund created
            refund = event_data.get("refund", {})
            payment_id = refund.get("payment_id")
            refund_amount = refund.get("amount_money", {}).get("amount", 0)

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.refunded_amount = refund_amount

                if refund_amount >= payment.amount:
                    payment.status = PaymentStatus.REFUNDED
                else:
                    payment.status = PaymentStatus.PARTIAL_REFUND

                await db.commit()

        return {"status": "received"}

    except Exception as e:
        print(f"Square webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.post("/paypal")
async def paypal_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    PayPal webhook handler

    Handles:
    - Payment capture completed
    - Payment capture denied
    - Payment refund completed
    """
    try:
        payload = await request.json()

        event_type = payload.get("event_type")
        resource = payload.get("resource", {})

        if event_type == "PAYMENT.CAPTURE.COMPLETED":
            # Payment captured successfully
            capture_id = resource.get("id")

            result = await db.execute(
                select(Payment).where(Payment.external_id == capture_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.COMPLETED
                await db.commit()

        elif event_type == "PAYMENT.CAPTURE.DENIED":
            # Payment capture denied
            capture_id = resource.get("id")

            result = await db.execute(
                select(Payment).where(Payment.external_id == capture_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.FAILED
                await db.commit()

        elif event_type == "PAYMENT.CAPTURE.REFUNDED":
            # Payment refunded
            capture_id = resource.get("id")
            refund_amount_value = resource.get("amount", {}).get("value", "0")
            refund_amount_cents = int(float(refund_amount_value) * 100)

            result = await db.execute(
                select(Payment).where(Payment.external_id == capture_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.refunded_amount = refund_amount_cents

                if refund_amount_cents >= payment.amount:
                    payment.status = PaymentStatus.REFUNDED
                else:
                    payment.status = PaymentStatus.PARTIAL_REFUND

                await db.commit()

        return {"status": "received"}

    except Exception as e:
        print(f"PayPal webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.post("/cashapp")
async def cashapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Cash App Pay webhook handler

    Handles:
    - Payment completed
    - Payment failed
    - Payment refunded
    """
    try:
        payload = await request.json()

        event_type = payload.get("event_type")
        payment_data = payload.get("payment", {})

        if event_type == "payment.completed":
            # Payment completed
            payment_id = payment_data.get("id")

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.COMPLETED
                await db.commit()

        elif event_type == "payment.failed":
            # Payment failed
            payment_id = payment_data.get("id")

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.FAILED
                await db.commit()

        elif event_type == "payment.refunded":
            # Payment refunded
            payment_id = payment_data.get("id")
            refund_amount = payment_data.get("refund_amount", 0)

            result = await db.execute(
                select(Payment).where(Payment.external_id == payment_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.refunded_amount = refund_amount

                if refund_amount >= payment.amount:
                    payment.status = PaymentStatus.REFUNDED
                else:
                    payment.status = PaymentStatus.PARTIAL_REFUND

                await db.commit()

        return {"status": "received"}

    except Exception as e:
        print(f"Cash App webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}
