"""
Mailgun API integration for email sending

Features:
- Transactional email sending
- Template support
- Batch sending
- Delivery tracking via webhooks
"""

import httpx
from typing import Dict, List, Optional
from datetime import datetime, timezone

from app.config.settings import get_settings
from app.core.exceptions import IntegrationError

settings = get_settings()


class MailgunService:
    """
    Mailgun API client for email communications

    Features:
    - HTML and plain text emails
    - Template support
    - Attachments
    - Batch sending
    - Webhook delivery tracking
    """

    def __init__(self):
        self.api_key = settings.mailgun_api_key
        self.domain = settings.mailgun_domain
        self.from_email = settings.mailgun_from_email
        self.from_name = settings.mailgun_from_name

        # Mailgun API base URL (US or EU)
        self.base_url = f"https://api.mailgun.net/v3/{self.domain}"

        # HTTP client with auth
        self.auth = ("api", self.api_key)

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: Optional[str] = None,
        text_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[str]] = None,
        custom_data: Optional[Dict] = None,
        unsubscribe_url: Optional[str] = None,
        unsubscribe_email: Optional[str] = None,
    ) -> Dict:
        """
        Send transactional email

        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_body: HTML email content
            text_body: Plain text email content
            from_email: Sender email (defaults to configured)
            from_name: Sender name (defaults to configured)
            reply_to: Reply-to email address
            tags: Tags for tracking (max 3)
            custom_data: Custom variables for webhooks

        Returns:
            Dict with message ID and status

        Raises:
            IntegrationError: If API call fails
        """
        # Build from address
        sender_email = from_email or self.from_email
        sender_name = from_name or self.from_name
        from_address = f"{sender_name} <{sender_email}>"

        # Build form data
        data = {
            "from": from_address,
            "to": to_email,
            "subject": subject,
        }

        if html_body:
            data["html"] = html_body

        if text_body:
            data["text"] = text_body

        if reply_to:
            data["h:Reply-To"] = reply_to

        # Add tags (max 3)
        if tags:
            for tag in tags[:3]:
                data.setdefault("o:tag", []).append(tag)

        # Add custom variables
        if custom_data:
            for key, value in custom_data.items():
                data[f"v:{key}"] = str(value)

        # Add List-Unsubscribe headers (RFC 8058 compliance)
        if unsubscribe_url or unsubscribe_email:
            list_unsub_parts = []

            if unsubscribe_url:
                list_unsub_parts.append(f"<{unsubscribe_url}>")

            if unsubscribe_email:
                list_unsub_parts.append(f"<mailto:{unsubscribe_email}>")

            if list_unsub_parts:
                data["h:List-Unsubscribe"] = ", ".join(list_unsub_parts)

                # Add List-Unsubscribe-Post for one-click (RFC 8058)
                if unsubscribe_url:
                    data["h:List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    auth=self.auth,
                    data=data,
                    timeout=30.0,
                )
                response.raise_for_status()

                result = response.json()

                return {
                    "message_id": result.get("id"),
                    "status": "accepted",
                    "to": to_email,
                    "from": from_address,
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Mailgun API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to send email via Mailgun: {str(e)}")

    async def send_template_email(
        self,
        to_email: str,
        template_name: str,
        template_variables: Dict,
        subject: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict:
        """
        Send email using Mailgun template

        Args:
            to_email: Recipient email address
            template_name: Mailgun template name
            template_variables: Variables to substitute in template
            subject: Email subject (can override template)
            from_email: Sender email (defaults to configured)
            from_name: Sender name (defaults to configured)
            tags: Tags for tracking (max 3)

        Returns:
            Dict with message ID and status

        Raises:
            IntegrationError: If API call fails
        """
        sender_email = from_email or self.from_email
        sender_name = from_name or self.from_name
        from_address = f"{sender_name} <{sender_email}>"

        data = {
            "from": from_address,
            "to": to_email,
            "template": template_name,
        }

        if subject:
            data["subject"] = subject

        # Add template variables
        for key, value in template_variables.items():
            data[f"v:{key}"] = str(value)

        # Add tags
        if tags:
            for tag in tags[:3]:
                data.setdefault("o:tag", []).append(tag)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    auth=self.auth,
                    data=data,
                    timeout=30.0,
                )
                response.raise_for_status()

                result = response.json()

                return {
                    "message_id": result.get("id"),
                    "status": "accepted",
                    "template": template_name,
                    "to": to_email,
                    "from": from_address,
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Mailgun template API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(
                f"Failed to send template email via Mailgun: {str(e)}"
            )

    async def send_batch_email(
        self,
        recipients: List[Dict[str, str]],  # [{"email": "...", "name": "..."}]
        subject: str,
        html_body: Optional[str] = None,
        text_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict:
        """
        Send batch email to multiple recipients

        CRITICAL: Use recipient variables for personalization
        Max 1000 recipients per batch

        Args:
            recipients: List of recipient dicts with email and name
            subject: Email subject line
            html_body: HTML email content (use %recipient.variable% for personalization)
            text_body: Plain text email content
            from_email: Sender email (defaults to configured)
            from_name: Sender name (defaults to configured)
            tags: Tags for tracking (max 3)

        Returns:
            Dict with batch status

        Raises:
            IntegrationError: If API call fails
        """
        if len(recipients) > 1000:
            raise IntegrationError("Batch email limited to 1000 recipients")

        sender_email = from_email or self.from_email
        sender_name = from_name or self.from_name
        from_address = f"{sender_name} <{sender_email}>"

        # Build recipient variables for personalization
        recipient_variables = {}
        to_addresses = []

        for recipient in recipients:
            email = recipient["email"]
            to_addresses.append(email)
            recipient_variables[email] = {
                "name": recipient.get("name", ""),
                "email": email,
            }

        data = {
            "from": from_address,
            "to": to_addresses,
            "subject": subject,
            "recipient-variables": str(recipient_variables),
        }

        if html_body:
            data["html"] = html_body

        if text_body:
            data["text"] = text_body

        # Add tags
        if tags:
            for tag in tags[:3]:
                data.setdefault("o:tag", []).append(tag)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    auth=self.auth,
                    data=data,
                    timeout=60.0,  # Longer timeout for batch
                )
                response.raise_for_status()

                result = response.json()

                return {
                    "message_id": result.get("id"),
                    "status": "accepted",
                    "recipient_count": len(recipients),
                    "from": from_address,
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Mailgun batch API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to send batch email via Mailgun: {str(e)}")

    async def validate_email(self, email: str) -> Dict:
        """
        Validate email address using Mailgun validation API

        Args:
            email: Email address to validate

        Returns:
            Dict with validation results

        Raises:
            IntegrationError: If API call fails
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.mailgun.net/v4/address/validate",
                    auth=self.auth,
                    params={"address": email},
                    timeout=10.0,
                )
                response.raise_for_status()

                result = response.json()

                return {
                    "is_valid": result.get("result") == "deliverable",
                    "email": email,
                    "risk": result.get("risk", "unknown"),
                    "reason": result.get("reason", ""),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Mailgun validation error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to validate email: {str(e)}")


# Singleton instance
_mailgun_service: Optional[MailgunService] = None


def get_mailgun_service() -> MailgunService:
    """Get or create Mailgun service instance"""
    global _mailgun_service
    if _mailgun_service is None:
        _mailgun_service = MailgunService()
    return _mailgun_service
