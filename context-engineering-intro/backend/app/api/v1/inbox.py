"""
Inbox API endpoints for email management

Features:
- Send composed emails via Mailgun
- Support for CC, BCC, attachments
- User-specific Mailgun configuration
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import json

from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.mailgun_settings import MailgunSettings
from app.utils.encryption import decrypt_api_key
from app.core.exceptions import NotFoundError, ValidationError, IntegrationError

router = APIRouter(prefix="/inbox", tags=["Inbox"])


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
    attachments: Optional[List[UploadFile]] = File(None, description="File attachments"),
):
    """
    Send a composed email via Mailgun.

    - Requires user to have Mailgun settings configured and verified
    - Supports TO, CC, BCC recipients
    - Supports file attachments
    - Validates all email addresses
    - Returns success/error response

    Requires authentication
    """
    # Get user's Mailgun settings
    query = select(MailgunSettings).where(
        MailgunSettings.user_id == current_user.id,
        MailgunSettings.is_active == True
    )
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mailgun not configured. Please configure and verify your Mailgun settings first."
        )

    if not settings.verified_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mailgun settings not verified. Please test your connection first."
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

    # Decrypt API key
    try:
        decrypted_api_key = decrypt_api_key(settings.api_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decrypt Mailgun API key: {str(e)}"
        )

    # Send email via Mailgun
    try:
        result = await send_email_via_mailgun(
            domain=settings.domain,
            api_key=decrypted_api_key,
            region=settings.region,
            to=to_list,
            subject=subject,
            body_html=body_html,
            cc=cc_list if cc_list else None,
            bcc=bcc_list if bcc_list else None,
            from_email=settings.from_email,
            from_name=settings.from_name,
            attachments=attachments,
        )

        return {
            "success": True,
            "message": "Email sent successfully",
            "message_id": result.get("message_id"),
            "recipients": {
                "to": to_list,
                "cc": cc_list,
                "bcc": bcc_list,
            }
        }

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
