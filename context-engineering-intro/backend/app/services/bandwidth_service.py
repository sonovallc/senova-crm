"""
Bandwidth.com API integration for SMS/MMS and Voice

CRITICAL NOTES:
- Message text NOT stored after delivery by Bandwidth
- Media files stored free for 48 hours only
- Webhooks retry for 24 hours
- Always return HTTP 2xx to acknowledge webhook receipt
"""

import httpx
from typing import Dict, List, Optional
from datetime import datetime, timezone
from uuid import UUID

from app.config.settings import get_settings
from app.core.exceptions import IntegrationError

settings = get_settings()


class BandwidthService:
    """
    Bandwidth.com API client for SMS/MMS and Voice communications

    Features:
    - SMS/MMS sending with media support
    - Voice calling
    - Message status tracking
    - Media upload handling
    """

    def __init__(self):
        self.account_id = settings.bandwidth_account_id
        self.username = settings.bandwidth_username
        self.password = settings.bandwidth_password
        self.application_id = settings.bandwidth_application_id
        self.from_number = settings.bandwidth_from_number

        self.messaging_base_url = f"https://messaging.bandwidth.com/api/v2/users/{self.account_id}"
        self.voice_base_url = f"https://voice.bandwidth.com/api/v2/accounts/{self.account_id}"

        # HTTP client with auth
        self.auth = (self.username, self.password)

    async def send_sms(
        self,
        to_number: str,
        text: str,
        from_number: Optional[str] = None,
        tag: Optional[str] = None,
    ) -> Dict:
        """
        Send SMS message

        Args:
            to_number: Recipient phone number (E.164 format: +1XXXXXXXXXX)
            text: Message text content
            from_number: Sender number (defaults to configured number)
            tag: Optional tag for tracking

        Returns:
            Dict with message ID and status

        Raises:
            IntegrationError: If API call fails
        """
        payload = {
            "from": from_number or self.from_number,
            "to": [to_number],
            "text": text,
            "applicationId": self.application_id,
        }

        if tag:
            payload["tag"] = tag

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.messaging_base_url}/messages",
                    auth=self.auth,
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "message_id": data.get("id"),
                    "status": "accepted",
                    "segment_count": data.get("segmentCount", 1),
                    "to": to_number,
                    "from": from_number or self.from_number,
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Bandwidth SMS API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to send SMS via Bandwidth: {str(e)}")

    async def send_mms(
        self,
        to_number: str,
        text: str,
        media_urls: List[str],
        from_number: Optional[str] = None,
        tag: Optional[str] = None,
    ) -> Dict:
        """
        Send MMS message with media attachments

        Args:
            to_number: Recipient phone number (E.164 format)
            text: Message text content
            media_urls: List of media URLs (up to 3.75MB per file)
            from_number: Sender number (defaults to configured number)
            tag: Optional tag for tracking

        Returns:
            Dict with message ID and status

        Raises:
            IntegrationError: If API call fails
        """
        payload = {
            "from": from_number or self.from_number,
            "to": [to_number],
            "text": text,
            "media": media_urls,
            "applicationId": self.application_id,
        }

        if tag:
            payload["tag"] = tag

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.messaging_base_url}/messages",
                    auth=self.auth,
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "message_id": data.get("id"),
                    "status": "accepted",
                    "segment_count": 1,  # MMS is always 1 segment
                    "media_count": len(media_urls),
                    "to": to_number,
                    "from": from_number or self.from_number,
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Bandwidth MMS API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to send MMS via Bandwidth: {str(e)}")

    async def get_message(self, message_id: str) -> Dict:
        """
        Get message metadata

        CRITICAL: Message text NOT returned (privacy)
        Only metadata available after delivery

        Args:
            message_id: Bandwidth message ID

        Returns:
            Dict with message metadata
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.messaging_base_url}/messages/{message_id}",
                    auth=self.auth,
                    timeout=10.0,
                )
                response.raise_for_status()

                return response.json()

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Bandwidth get message error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to get message from Bandwidth: {str(e)}")

    async def upload_media(
        self,
        file_content: bytes,
        filename: str,
        content_type: str,
    ) -> str:
        """
        Upload media file to Bandwidth

        CRITICAL: Media stored free for 48 hours only

        Args:
            file_content: File bytes
            filename: Original filename
            content_type: MIME type (e.g., "image/jpeg")

        Returns:
            Media URL for use in MMS

        Raises:
            IntegrationError: If upload fails
        """
        try:
            async with httpx.AsyncClient() as client:
                files = {
                    "file": (filename, file_content, content_type)
                }

                response = await client.post(
                    f"{self.messaging_base_url}/media",
                    auth=self.auth,
                    files=files,
                    timeout=60.0,
                )
                response.raise_for_status()

                data = response.json()
                return data.get("url")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Bandwidth media upload error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to upload media to Bandwidth: {str(e)}")

    async def initiate_call(
        self,
        to_number: str,
        from_number: Optional[str] = None,
        answer_url: Optional[str] = None,
    ) -> Dict:
        """
        Initiate outbound voice call

        Args:
            to_number: Recipient phone number (E.164 format)
            from_number: Caller ID number (defaults to configured number)
            answer_url: Callback URL for BXML instructions

        Returns:
            Dict with call ID and status

        Raises:
            IntegrationError: If API call fails
        """
        payload = {
            "from": from_number or self.from_number,
            "to": to_number,
            "applicationId": self.application_id,
        }

        if answer_url:
            payload["answerUrl"] = answer_url

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.voice_base_url}/calls",
                    auth=self.auth,
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "call_id": data.get("callId"),
                    "status": "initiated",
                    "to": to_number,
                    "from": from_number or self.from_number,
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Bandwidth voice API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to initiate call via Bandwidth: {str(e)}")

    async def get_call(self, call_id: str) -> Dict:
        """
        Get call status and metadata

        Args:
            call_id: Bandwidth call ID

        Returns:
            Dict with call metadata
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.voice_base_url}/calls/{call_id}",
                    auth=self.auth,
                    timeout=10.0,
                )
                response.raise_for_status()

                return response.json()

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Bandwidth get call error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to get call from Bandwidth: {str(e)}")


# Singleton instance
_bandwidth_service: Optional[BandwidthService] = None


def get_bandwidth_service() -> BandwidthService:
    """Get or create Bandwidth service instance"""
    global _bandwidth_service
    if _bandwidth_service is None:
        _bandwidth_service = BandwidthService()
    return _bandwidth_service
