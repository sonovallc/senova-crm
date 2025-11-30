"""
Email Campaign Service

Handles batch email sending for mass campaigns with rate limiting,
tracking, and error handling.
"""

import asyncio
import logging
import re
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
import base64

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import AsyncSessionLocal
from app.models.email_campaign import EmailCampaign, CampaignRecipient, CampaignStatus, CampaignRecipientStatus
from app.models.contact import Contact
from app.models.user import User
from app.models.mailgun_settings import MailgunSettings
from app.services.mailgun_service import MailgunService

logger = logging.getLogger(__name__)


def generate_unsubscribe_token(contact_id: UUID, email: str) -> str:
    """
    Generate unsubscribe token for contact.

    Format: base64(contact_id:email)
    """
    token_data = f"{contact_id}:{email}"
    token = base64.b64encode(token_data.encode('utf-8')).decode('utf-8')
    return token


def generate_tracking_pixel(campaign_id: UUID, recipient_id: UUID) -> str:
    """
    Generate tracking pixel HTML for open tracking.

    Returns HTML image tag with tracking URL.
    """
    # This would typically point to your tracking endpoint
    tracking_url = f"http://localhost:3004/api/v1/campaigns/track/open/{campaign_id}/{recipient_id}"

    pixel_html = f'<img src="{tracking_url}" width="1" height="1" style="display:none" alt="" />'
    return pixel_html


def add_tracking_to_email(
    html_content: str,
    campaign_id: UUID,
    recipient_id: UUID,
    unsubscribe_token: str
) -> str:
    """
    Add tracking pixel and unsubscribe link to email HTML.

    Args:
        html_content: Original email HTML
        campaign_id: Campaign ID
        recipient_id: Recipient ID
        unsubscribe_token: Unsubscribe token

    Returns:
        Modified HTML with tracking
    """
    if not html_content:
        return ""

    # Add tracking pixel before closing body tag
    tracking_pixel = generate_tracking_pixel(campaign_id, recipient_id)

    # Add unsubscribe link
    # TODO: Replace with actual domain from settings
    unsubscribe_url = f"https://crm.senovallc.com/api/v1/unsubscribe/{unsubscribe_token}"
    unsubscribe_html = f'''
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
        <p>If you no longer wish to receive these emails, you can <a href="{unsubscribe_url}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.</p>
    </div>
    '''

    # Insert before closing body tag
    if '</body>' in html_content.lower():
        html_content = html_content.replace('</body>', f'{tracking_pixel}{unsubscribe_html}</body>')
    else:
        # No body tag, append to end
        html_content = html_content + tracking_pixel + unsubscribe_html

    return html_content


def replace_template_variables(
    template_html: str,
    contact: Contact,
    user: Optional[User] = None,
) -> str:
    """
    Replace template variables with actual contact data.

    Supported variables:
    - {{contact_name}} - Full name
    - {{first_name}} - First name
    - {{last_name}} - Last name
    - {{email}} - Email address
    - {{phone}} - Phone number
    - {{company}} - Company name
    - {{company_name}} - Company name (alias)
    """
    if not template_html:
        return ""

    rendered = template_html

    # Contact variables
    replacements = {
        '{{first_name}}': contact.first_name or '',
        '{{last_name}}': contact.last_name or '',
        '{{email}}': contact.email or '',
        '{{phone}}': contact.phone or '',
        '{{company}}': contact.company or '',
        '{{company_name}}': contact.company or '',
    }

    # Construct full name
    first = contact.first_name or ''
    last = contact.last_name or ''
    contact_name = f"{first} {last}".strip() if first or last else ''
    replacements['{{contact_name}}'] = contact_name

    # User variables (if available)
    if user:
        replacements['{{user_name}}'] = user.full_name or f"{user.first_name or ''} {user.last_name or ''}".strip()
        replacements['{{user_email}}'] = user.email or ''

    # Perform replacements
    for var_key, value in replacements.items():
        rendered = rendered.replace(var_key, value)

    return rendered


async def send_single_email(
    mailgun_service: MailgunService,
    campaign: EmailCampaign,
    recipient: CampaignRecipient,
    contact: Contact,
    user: User,
    db: AsyncSession,
) -> bool:
    """
    Send single email to recipient.

    Returns True if successful, False otherwise.
    Updates recipient status in database.
    """
    try:
        # GDPR/CAN-SPAM: Check if email is suppressed
        from app.services.suppression_sync import is_suppressed
        from app.services.unsubscribe_service import generate_unsubscribe_token as generate_token_db

        if await is_suppressed(contact.email, db):
            logger.info(f"Skipping suppressed email: {contact.email}")
            recipient.status = CampaignRecipientStatus.FAILED
            recipient.error_message = "Email is in suppression list (bounce/unsubscribe/complaint)"
            campaign.failed_count += 1
            await db.commit()
            return False

        # Replace variables in HTML
        html_content = replace_template_variables(
            campaign.body_html,
            contact,
            user
        )

        # Replace variables in subject
        subject = replace_template_variables(
            campaign.subject,
            contact,
            user
        )

        # Generate unsubscribe token (stored in database for RFC 8058 compliance)
        unsubscribe_token = await generate_token_db(
            contact_id=contact.id,
            email=contact.email,
            campaign_id=campaign.id,
            db=db
        )

        # Build unsubscribe URL for List-Unsubscribe header
        # TODO: Replace with actual domain from settings
        unsubscribe_url = f"https://crm.senovallc.com/api/v1/unsubscribe/{unsubscribe_token}"

        # Add tracking pixel and unsubscribe link
        html_content = add_tracking_to_email(
            html_content,
            campaign.id,
            recipient.id,
            unsubscribe_token
        )

        # Send via Mailgun with List-Unsubscribe headers
        result = await mailgun_service.send_email(
            to_email=contact.email,
            subject=subject,
            html_body=html_content,
            text_body=campaign.body_text or "",
            tags=[f"campaign:{campaign.id}", "bulk"],
            unsubscribe_url=unsubscribe_url,
            unsubscribe_email=f"unsubscribe@{mailgun_service.domain}",
        )

        if result.get('message_id'):
            # Update recipient status
            recipient.status = CampaignRecipientStatus.SENT
            recipient.sent_at = datetime.utcnow()
            recipient.mailgun_message_id = result.get('message_id')

            # Increment campaign sent count
            campaign.sent_count += 1

            await db.commit()

            logger.info(f"Email sent successfully to {contact.email} for campaign {campaign.id}")
            return True
        else:
            # Update recipient status to failed
            recipient.status = CampaignRecipientStatus.FAILED
            recipient.error_message = result.get('error', 'Unknown error')

            # Increment campaign failed count
            campaign.failed_count += 1

            await db.commit()

            logger.error(f"Failed to send email to {contact.email}: {result.get('error')}")
            return False

    except Exception as e:
        logger.error(f"Exception sending email to {contact.email}: {str(e)}")

        # Update recipient status to failed
        recipient.status = CampaignRecipientStatus.FAILED
        recipient.error_message = str(e)

        # Increment campaign failed count
        campaign.failed_count += 1

        await db.commit()

        return False


async def send_campaign_batch(
    campaign_id: str,
    batch_size: int = 50,
):
    """
    Send campaign emails in batches.

    This function runs as a background task and sends emails in batches
    to respect rate limits.

    Args:
        campaign_id: Campaign UUID string
        batch_size: Number of emails to send per batch (default 50)
    """
    logger.info(f"Starting batch send for campaign {campaign_id}, batch size: {batch_size}")

    # Get async database session
    async with AsyncSessionLocal() as db:
        try:
            # Load campaign
            campaign_query = select(EmailCampaign).where(EmailCampaign.id == UUID(campaign_id))
            campaign_result = await db.execute(campaign_query)
            campaign = campaign_result.scalar_one_or_none()

            if not campaign:
                logger.error(f"Campaign {campaign_id} not found")
                return

            # Check if campaign is still in sending status
            if campaign.status != CampaignStatus.SENDING:
                logger.warning(f"Campaign {campaign_id} is not in SENDING status (current: {campaign.status})")
                return

            # Load user
            user_query = select(User).where(User.id == campaign.user_id)
            user_result = await db.execute(user_query)
            user = user_result.scalar_one_or_none()

            if not user:
                logger.error(f"User {campaign.user_id} not found for campaign {campaign_id}")
                return

            # Load Mailgun settings
            mailgun_query = select(MailgunSettings).where(MailgunSettings.user_id == user.id)
            mailgun_result = await db.execute(mailgun_query)
            mailgun_settings = mailgun_result.scalar_one_or_none()

            if not mailgun_settings:
                logger.error(f"Mailgun settings not found for user {user.id}")
                campaign.status = CampaignStatus.CANCELLED
                await db.commit()
                return

            # Initialize Mailgun service (custom initialization for campaigns)
            # We'll create a simple wrapper since MailgunService uses settings
            from app.services.mailgun_service import MailgunService as BaseMailgunService

            class CampaignMailgunService(BaseMailgunService):
                def __init__(self, api_key, domain, from_email, from_name):
                    self.api_key = api_key
                    self.domain = domain
                    self.from_email = from_email
                    self.from_name = from_name
                    self.base_url = f"https://api.mailgun.net/v3/{self.domain}"
                    self.auth = ("api", self.api_key)

            mailgun_service = CampaignMailgunService(
                api_key=mailgun_settings.api_key,
                domain=mailgun_settings.domain,
                from_email=mailgun_settings.from_email,
                from_name=mailgun_settings.from_name or user.full_name or "CRM"
            )

            # Get pending recipients
            pending_query = select(CampaignRecipient).where(
                CampaignRecipient.campaign_id == campaign.id,
                CampaignRecipient.status == CampaignRecipientStatus.PENDING
            ).limit(batch_size)

            pending_result = await db.execute(pending_query)
            pending_recipients = pending_result.scalars().all()

            if not pending_recipients:
                # All emails sent, mark campaign as complete
                campaign.status = CampaignStatus.SENT
                campaign.completed_at = datetime.utcnow()
                await db.commit()
                logger.info(f"Campaign {campaign_id} completed successfully")
                return

            logger.info(f"Processing {len(pending_recipients)} recipients for campaign {campaign_id}")

            # Send emails
            for recipient in pending_recipients:
                # Check if campaign is still sending (might be paused)
                await db.refresh(campaign)
                if campaign.status != CampaignStatus.SENDING:
                    logger.info(f"Campaign {campaign_id} paused or cancelled, stopping batch send")
                    return

                # Load contact
                contact_query = select(Contact).where(Contact.id == recipient.contact_id)
                contact_result = await db.execute(contact_query)
                contact = contact_result.scalar_one_or_none()

                if not contact:
                    logger.warning(f"Contact {recipient.contact_id} not found, skipping")
                    recipient.status = CampaignRecipientStatus.FAILED
                    recipient.error_message = "Contact not found"
                    campaign.failed_count += 1
                    await db.commit()
                    continue

                # Send email
                await send_single_email(
                    mailgun_service,
                    campaign,
                    recipient,
                    contact,
                    user,
                    db
                )

                # Small delay to respect rate limits (Mailgun allows ~300/hour on free plan)
                await asyncio.sleep(0.2)  # 5 emails per second = 300/minute

            # Refresh campaign to get updated counts
            await db.refresh(campaign)

            # Check if more emails to send
            remaining_query = select(func.count()).select_from(
                select(CampaignRecipient).where(
                    CampaignRecipient.campaign_id == campaign.id,
                    CampaignRecipient.status == CampaignRecipientStatus.PENDING
                ).subquery()
            )
            remaining_count = await db.scalar(remaining_query)

            if remaining_count > 0:
                # Schedule next batch
                logger.info(f"Scheduling next batch for campaign {campaign_id}, {remaining_count} remaining")
                # Recursively call for next batch (in production, use Celery or similar)
                await asyncio.sleep(1)  # Small delay between batches
                await send_campaign_batch(campaign_id, batch_size)
            else:
                # All done
                campaign.status = CampaignStatus.SENT
                campaign.completed_at = datetime.utcnow()
                await db.commit()
                logger.info(f"Campaign {campaign_id} completed successfully")

        except Exception as e:
            logger.error(f"Error in batch send for campaign {campaign_id}: {str(e)}", exc_info=True)
            # Don't update campaign status on error, allow retry


# Import func for count query
from sqlalchemy import func
