"""
Inbox API endpoints for email management

Features:
- Send composed emails via Mailgun using Email Sending Profiles
- Support for CC, BCC, attachments
- Organization-wide Mailgun configuration with owner-managed profiles
- Email tracking via communications table
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select, and_, text
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import json
import logging

from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
# from app.models.email_sending_profile import EmailSendingProfile, UserEmailProfileAssignment
from app.models.communication import Communication, CommunicationType, CommunicationDirection, CommunicationStatus
from app.models.contact import Contact
from app.config.settings import get_settings
from app.core.exceptions import NotFoundError, ValidationError, IntegrationError
from app.utils.encryption import decrypt_api_key

router = APIRouter(prefix="/inbox", tags=["Inbox"])
logger = logging.getLogger(__name__)
settings = get_settings()


async def send_email_via_mailgun(
    domain: str,
    api_key: str,
    region: str,
    to: List[str],
    subject: str,
    body_html: str,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    reply_to: Optional[str] = None,
    attachments: Optional[List[UploadFile]] = None,
) -> dict:
    """
    Send email via Mailgun API with full support for CC, BCC, and attachments.

    Args:
        domain: Mailgun domain
        api_key: Mailgun API key (plain text)
        region: Mailgun region ('us' or 'eu')
        to: List of recipient email addresses
        subject: Email subject
        body_html: HTML body content
        cc: Optional list of CC recipients
        bcc: Optional list of BCC recipients
        from_email: Sender email address
        from_name: Sender display name
        reply_to: Reply-To address (for routing replies to Mailgun)
        attachments: Optional list of file uploads

    Returns:
        dict with message_id and status

    Raises:
        IntegrationError: If Mailgun API call fails
    """
    # Determine Mailgun API base URL based on region
    if region == "eu":
        base_url = "https://api.eu.mailgun.net/v3"
    else:
        base_url = "https://api.mailgun.net/v3"

    url = f"{base_url}/{domain}/messages"

    # Build from address
    from_address = f"{from_name} <{from_email}>" if from_name else from_email

    # Build form data
    data = {
        "from": from_address,
        "to": to,
        "subject": subject,
        "html": body_html,
    }

    # Add CC recipients
    if cc and len(cc) > 0:
        data["cc"] = cc

    # Add BCC recipients
    if bcc and len(bcc) > 0:
        data["bcc"] = bcc

    # Add Reply-To header (routes replies to Mailgun receiving domain)
    if reply_to:
        data["h:Reply-To"] = reply_to

    # Prepare files for upload
    files_data = []
    if attachments:
        for attachment in attachments:
            # Read file content
            await attachment.seek(0)
            file_content = await attachment.read()

            # Add to files list (Mailgun expects 'attachment' field)
            files_data.append(
                ("attachment", (attachment.filename, file_content, attachment.content_type))
            )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                auth=("api", api_key),
                data=data,
                files=files_data if files_data else None,
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "message_id": result.get("id"),
                    "status": "sent",
                    "message": result.get("message", "Queued. Thank you."),
                }
            elif response.status_code == 401:
                raise IntegrationError("Invalid Mailgun API credentials")
            elif response.status_code == 400:
                error_text = response.text
                raise IntegrationError(f"Mailgun validation error: {error_text}")
            else:
                raise IntegrationError(
                    f"Mailgun API error: {response.status_code} - {response.text}"
                )

    except httpx.TimeoutException:
        raise IntegrationError("Request to Mailgun timed out. Please try again.")
    except IntegrationError:
        raise
    except Exception as e:
        raise IntegrationError(f"Failed to send email via Mailgun: {str(e)}")


@router.post("/send-email", status_code=status.HTTP_200_OK)
async def send_composed_email(
    current_user: CurrentUser,
    db: DatabaseSession,
    to: str = Form(..., description="Comma-separated list of recipient emails"),
    subject: str = Form(..., description="Email subject"),
    body_html: str = Form(..., description="HTML email body"),
    cc: Optional[str] = Form(None, description="Comma-separated list of CC emails"),
    bcc: Optional[str] = Form(None, description="Comma-separated list of BCC emails"),
    profile_id: Optional[str] = Form(None, description="Email sending profile UUID"),
    attachments: Optional[List[UploadFile]] = File(None, description="File attachments"),
):
    """
    Send a composed email via Mailgun using Email Sending Profiles.

    - Uses organization's global Mailgun configuration
    - Requires user to have access to selected email sending profile
    - Supports TO, CC, BCC recipients
    - Supports file attachments
    - Stores sent email in communications table for tracking

    Requires authentication
    """
    # Note: We now use per-object Mailgun settings instead of global settings
    # The settings are fetched from the email profile's associated Mailgun configuration

    # Get and validate email sending profile
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sending profile is required. Please select a profile."
        )

    try:
        profile_uuid = UUID(profile_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid profile ID format"
        )

    # Verify user has access to this profile using raw SQL (model doesn't exist)
    assignment_query = text("""
        SELECT 1 FROM user_email_profile_assignments
        WHERE user_id = :user_id AND profile_id = :profile_id
    """)
    assignment_result = await db.execute(assignment_query, {"user_id": current_user.id, "profile_id": profile_uuid})
    assignment = assignment_result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this email sending profile"
        )

    # Get the profile and its Mailgun settings using raw SQL
    profile_query = text("""
        SELECT
            esp.id,
            esp.email_address,
            esp.display_name,
            esp.reply_to_address,
            esp.is_active,
            esp.mailgun_settings_id,
            oms.api_key as mailgun_api_key,
            oms.sending_domain as mailgun_domain,
            oms.region as mailgun_region
        FROM email_sending_profiles esp
        LEFT JOIN object_mailgun_settings oms ON esp.mailgun_settings_id = oms.id
        WHERE esp.id = :profile_id
    """)
    profile_result = await db.execute(profile_query, {"profile_id": profile_uuid})
    profile_row = profile_result.fetchone()

    if not profile_row or not profile_row.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected email sending profile is not available"
        )

    # Create a simple object to hold profile data (since we don't have the ORM model)
    class ProfileData:
        def __init__(self, row):
            self.id = row.id
            self.email_address = row.email_address
            self.display_name = row.display_name
            self.reply_to_address = row.reply_to_address
            self.is_active = row.is_active
            self.mailgun_settings_id = row.mailgun_settings_id
            # Decrypt the API key since it's stored encrypted in the database
            self.mailgun_api_key = decrypt_api_key(row.mailgun_api_key) if row.mailgun_api_key else None
            self.mailgun_domain = row.mailgun_domain
            self.mailgun_region = row.mailgun_region

    profile = ProfileData(profile_row)

    # Validate that Mailgun settings are configured for this profile
    if not profile.mailgun_api_key or not profile.mailgun_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email profile selected and no personal Mailgun settings configured"
        )

    # Parse email addresses (comma-separated)
    def parse_emails(email_string: Optional[str]) -> List[str]:
        """Parse comma-separated email string into list"""
        if not email_string:
            return []
        return [email.strip() for email in email_string.split(",") if email.strip()]

    to_list = parse_emails(to)
    cc_list = parse_emails(cc) if cc else []
    bcc_list = parse_emails(bcc) if bcc else []

    # Validate that we have at least one recipient
    if not to_list:
        raise ValidationError("At least one recipient (TO) email address is required")

    # Basic email validation (simple check)
    def is_valid_email(email: str) -> bool:
        """Basic email validation"""
        if "@" not in email:
            return False
        parts = email.split("@")
        if len(parts) != 2:
            return False
        user, domain = parts
        if not user or not domain:
            return False
        return "." in domain

    all_emails = to_list + cc_list + bcc_list
    for email in all_emails:
        if not is_valid_email(email):
            raise ValidationError(f"Invalid email address: {email}")

    # Validate attachments (max 10MB each, max 10 files)
    if attachments:
        if len(attachments) > 10:
            raise ValidationError("Maximum 10 attachments allowed")

        max_size = 10 * 1024 * 1024  # 10MB
        for attachment in attachments:
            await attachment.seek(0, 2)  # Seek to end
            file_size = attachment.tell()
            await attachment.seek(0)  # Reset to beginning

            if file_size > max_size:
                raise ValidationError(f"Attachment {attachment.filename} exceeds 10MB limit")

    # Find or create contact by email for tracking
    contact_id = None
    primary_recipient = to_list[0] if to_list else None
    if primary_recipient:
        # Try to find existing contact
        contact_query = select(Contact).where(Contact.email == primary_recipient)
        contact_result = await db.execute(contact_query)
        contact = contact_result.scalar_one_or_none()

        if contact:
            contact_id = contact.id
        else:
            # Create new contact for tracking (like inbound email handling)
            logger.info(f"Creating new contact for recipient: {primary_recipient}")
            new_contact = Contact(
                email=primary_recipient,
                first_name=primary_recipient.split('@')[0],  # Use email prefix as name
                last_name='',
                source='EMAIL',
                status='LEAD'
            )
            db.add(new_contact)
            await db.flush()  # Get the ID without committing
            contact_id = new_contact.id

    # Send email via Mailgun using global config + profile settings
    try:
        logger.info(f"Sending email via profile {profile.email_address} to {to_list}")

        # Use profile's reply_to_address for Reply-To header
        # This routes replies to @mg.senovallc.com where Mailgun can receive them
        reply_to = profile.reply_to_address if profile.reply_to_address else profile.email_address

        result = await send_email_via_mailgun(
            domain=profile.mailgun_domain,
            api_key=profile.mailgun_api_key,
            region=profile.mailgun_region.lower() if profile.mailgun_region else "us",
            to=to_list,
            subject=subject,
            body_html=body_html,
            cc=cc_list if cc_list else None,
            bcc=bcc_list if bcc_list else None,
            from_email=profile.email_address,
            from_name=profile.display_name,
            reply_to=reply_to,
            attachments=attachments,
        )

        message_id = result.get("message_id")

        # Store in communications table for tracking
        communication = Communication(
            type=CommunicationType.EMAIL,
            direction=CommunicationDirection.OUTBOUND,
            contact_id=contact_id,
            user_id=current_user.id,
            subject=subject,
            body=body_html,
            from_address=profile.email_address,
            to_address=", ".join(to_list),
            status=CommunicationStatus.SENT,
            sent_at=datetime.now(timezone.utc),
            external_id=message_id,
            provider_metadata={
                "provider": "mailgun",
                "message_id": message_id,
                "profile_id": str(profile.id),
                "profile_email": profile.email_address,
                "cc": cc_list,
                "bcc": bcc_list,
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        db.add(communication)
        await db.commit()
        await db.refresh(communication)

        logger.info(f"Email sent successfully: {message_id} to {to_list}, communication_id: {communication.id}")

        return {
            "success": True,
            "message": "Email sent successfully",
            "message_id": message_id,
            "communication_id": str(communication.id),
            "recipients": {
                "to": to_list,
                "cc": cc_list,
                "bcc": bcc_list,
            }
        }

    except IntegrationError as e:
        logger.error(f"Mailgun integration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
