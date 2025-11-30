"""
Webhook handlers for external services

Features:
- Bandwidth.com message delivery webhooks
- Mailgun email delivery webhooks
- Automatic retry handling
- Status updates in database
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import json
import hmac
import hashlib
import bleach

from app.config.database import get_db
from app.models.communication import Communication, CommunicationType, CommunicationDirection, CommunicationStatus
from app.models.contact import Contact
from app.models.payment import Payment, PaymentStatus
from app.services.stripe_service import StripeService
from app.core.exceptions import NotFoundError, PaymentError

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


# ==================== HELPER FUNCTIONS ====================


def _verify_mailgun_signature(timestamp: str, token: str, signature: str) -> bool:
    """
    Verify Mailgun webhook signature to prevent spoofing

    Args:
        timestamp: Unix timestamp from webhook
        token: Random token from webhook
        signature: HMAC signature from webhook

    Returns:
        bool: True if signature is valid
    """
    from app.config.settings import get_settings
    settings = get_settings()

    # Mailgun sends webhook signing key (different from API key)
    signing_key = settings.mailgun_webhook_signing_key
    if not signing_key:
        # If not configured, skip verification (log warning)
        print("WARNING: Mailgun webhook signing key not configured - skipping signature verification")
        return True

    message = f"{timestamp}{token}".encode('utf-8')
    hmac_digest = hmac.new(
        key=signing_key.encode('utf-8'),
        msg=message,
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(hmac_digest, signature)


def _sanitize_html_email(html: str) -> str:
    """
    Remove dangerous HTML/JS while preserving safe formatting

    Args:
        html: Raw HTML email content

    Returns:
        str: Sanitized HTML safe for display
    """
    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'
    ]

    ALLOWED_ATTRIBUTES = {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title'],
    }

    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)


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


@router.post("/mailgun")
async def mailgun_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Mailgun webhook handler

    Handles:
    - Email delivery status
    - Email opens
    - Email clicks
    - Email bounces
    - Email complaints
    """
    try:
        # Mailgun sends form data
        form_data = await request.form()

        event_type = form_data.get("event")
        message_id = form_data.get("Message-Id", "").strip("<>")
        recipient = form_data.get("recipient")
        timestamp = form_data.get("timestamp")

        # Find communication by external_id
        result = await db.execute(
            select(Communication).where(Communication.external_id.contains(message_id))
        )
        communication = result.scalar_one_or_none()

        if communication:
            # Update status based on event type
            if event_type == "delivered":
                communication.status = CommunicationStatus.DELIVERED
                communication.delivered_at = datetime.fromtimestamp(int(timestamp))

            elif event_type == "opened":
                communication.status = CommunicationStatus.READ
                communication.read_at = datetime.fromtimestamp(int(timestamp))

            elif event_type == "clicked":
                # User clicked link in email
                communication.provider_metadata = {
                    **communication.provider_metadata,
                    "clicked": True,
                    "clicked_at": datetime.fromtimestamp(int(timestamp)).isoformat(),
                    "clicked_url": form_data.get("url"),
                }

            elif event_type in ["failed", "bounced"]:
                communication.status = CommunicationStatus.FAILED
                communication.failed_at = datetime.fromtimestamp(int(timestamp))
                communication.provider_metadata = {
                    **communication.provider_metadata,
                    "bounce_reason": form_data.get("reason"),
                    "bounce_code": form_data.get("code"),
                }

                # Add permanent bounces to suppression list
                severity = form_data.get("severity", "")
                if severity == "permanent" or event_type == "bounced":
                    from app.services.suppression_sync import add_to_suppression
                    from app.models.email_suppression import SuppressionType
                    bounce_reason = form_data.get("reason", "Permanent bounce")
                    await add_to_suppression(
                        email=recipient,
                        suppression_type=SuppressionType.BOUNCE,
                        reason=bounce_reason,
                        db=db
                    )

            elif event_type == "complained":
                # Spam complaint
                communication.provider_metadata = {
                    **communication.provider_metadata,
                    "spam_complaint": True,
                    "complained_at": datetime.fromtimestamp(int(timestamp)).isoformat(),
                }

                # Add to suppression list
                from app.services.suppression_sync import add_to_suppression
                from app.models.email_suppression import SuppressionType
                await add_to_suppression(
                    email=recipient,
                    suppression_type=SuppressionType.COMPLAINT,
                    reason="Spam complaint via webhook",
                    db=db
                )

            elif event_type == "unsubscribed":
                # User unsubscribed
                # Add to suppression list
                from app.services.suppression_sync import add_to_suppression
                from app.models.email_suppression import SuppressionType
                await add_to_suppression(
                    email=recipient,
                    suppression_type=SuppressionType.UNSUBSCRIBE,
                    reason="Unsubscribed via webhook",
                    db=db
                )

                # Also mark contact as unsubscribed if found
                result = await db.execute(
                    select(Contact).where(Contact.email == recipient)
                )
                contact = result.scalar_one_or_none()
                if contact:
                    contact.unsubscribed = True
                    contact.unsubscribed_at = datetime.fromtimestamp(int(timestamp))

            await db.commit()

        return {"status": "received"}

    except Exception as e:
        print(f"Mailgun webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.post("/mailgun/inbound")
async def mailgun_inbound_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Mailgun inbound email webhook handler

    Receives inbound emails sent to your domain

    Features:
    - Multi-field contact matching (verified emails prioritized)
    - Attachment handling with local storage
    - HTML sanitization for XSS prevention
    - Webhook signature verification
    - WebSocket notifications
    - SHA256 hash matching support
    """
    try:
        form_data = await request.form()

        # ===== SECURITY: Verify webhook signature =====
        timestamp = form_data.get("timestamp", "")
        token = form_data.get("token", "")
        signature = form_data.get("signature", "")

        if not _verify_mailgun_signature(timestamp, token, signature):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # ===== Extract email data =====
        from_email = form_data.get("from", "")
        to_email = form_data.get("to", "")
        subject = form_data.get("subject", "")
        body_plain = form_data.get("body-plain", "")
        body_html = form_data.get("body-html", "")
        message_id = form_data.get("Message-Id", "").strip("<>")

        # Extract sender email from "Name <email@domain.com>" format
        import re

        email_match = re.search(r"<(.+?)>", from_email)
        sender_email = email_match.group(1) if email_match else from_email
        sender_email = sender_email.lower().strip()

        # ===== SECURITY: Sanitize HTML email =====
        sanitized_body = _sanitize_html_email(body_html) if body_html else body_plain

        # ===== Multi-field contact matching with priority =====
        contact = await _find_contact_by_email(sender_email, db)

        if not contact:
            # Create new lead if not found
            contact = Contact(
                email=sender_email,
                first_name="Unknown",
                last_name="",
                status="LEAD",
                source="EMAIL",
            )
            db.add(contact)
            await db.commit()
            await db.refresh(contact)

        # ===== Handle email attachments =====
        attachments = []
        attachment_count = int(form_data.get("attachment-count", 0))

        for i in range(1, attachment_count + 1):
            attachment = form_data.get(f"attachment-{i}")
            if attachment and hasattr(attachment, 'file'):
                try:
                    # Upload using existing local storage service
                    from app.services.local_storage_service import upload_file
                    file_url = await upload_file(attachment, f"email-attachments/{contact.id}")
                    attachments.append(file_url)
                except Exception as e:
                    print(f"Failed to upload attachment {i}: {str(e)}")

        # ===== Create communication record =====
        communication = Communication(
            type=CommunicationType.EMAIL,
            direction=CommunicationDirection.INBOUND,
            contact_id=contact.id,
            from_address=sender_email,
            to_address=to_email,
            subject=subject,
            body=sanitized_body,
            media_urls=attachments,
            status=CommunicationStatus.DELIVERED,
            external_id=message_id,
            delivered_at=datetime.now(timezone.utc),
            provider_metadata={
                "provider": "mailgun",
                "message_id": message_id,
                "event_type": "inbound",
                "attachment_count": len(attachments),
            },
        )

        db.add(communication)
        await db.commit()
        await db.refresh(communication)

        # ===== WebSocket notification to CRM users =====
        try:
            from app.services.websocket_service import connection_manager
            await connection_manager.broadcast_to_staff({
                "type": "new_email",
                "contact_id": str(contact.id),
                "contact_name": f"{contact.first_name} {contact.last_name}",
                "communication_id": str(communication.id),
                "subject": subject,
                "sender_email": sender_email,
                "has_attachments": len(attachments) > 0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            # Don't fail webhook if WebSocket notification fails
            print(f"WebSocket notification failed: {str(e)}")

        # TODO: Trigger AI auto-response via Closebot if configured

        return {"status": "received"}

    except HTTPException:
        # Re-raise HTTP exceptions (like signature verification failure)
        raise
    except Exception as e:
        # Log error but still return 200 to prevent Mailgun retries
        print(f"Mailgun inbound webhook error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


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
