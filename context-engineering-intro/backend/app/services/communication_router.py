"""
Communication router for multi-channel message routing

Features:
- Route messages to appropriate channel (SMS, email, web chat)
- Thread management by contact
- AI response integration
- Fallback logic if primary channel fails
"""

from typing import Dict, Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import (
    Communication,
    CommunicationType,
    CommunicationDirection,
    CommunicationStatus,
)
from app.models.contact import Contact
from app.models.user import User
from app.tasks.email_tasks import send_email_task, send_template_email_task
from app.tasks.sms_tasks import send_sms_task, send_mms_task
from app.services.websocket_service import get_connection_manager
from app.core.exceptions import ValidationError, NotFoundError


class CommunicationRouter:
    """
    Routes communications to appropriate channels

    Features:
    - Multi-channel routing (SMS, email, web chat, phone)
    - Thread management
    - Channel preference logic
    - AI integration hooks
    """

    def __init__(self):
        self.connection_manager = get_connection_manager()

    async def route_message(
        self,
        contact_id: UUID,
        message_body: str,
        user_id: Optional[UUID] = None,
        channel: Optional[CommunicationType] = None,
        subject: Optional[str] = None,
        media_urls: Optional[List[str]] = None,
        thread_id: Optional[UUID] = None,
        db: Optional[AsyncSession] = None,
    ) -> Communication:
        """
        Route message to appropriate channel

        Args:
            contact_id: Contact to send to
            message_body: Message content
            user_id: User sending the message (if manual)
            channel: Preferred channel (auto-selects if None)
            subject: Email subject (if email)
            media_urls: Media attachments (if MMS)
            thread_id: Conversation thread ID
            db: Database session

        Returns:
            Communication record

        Raises:
            NotFoundError: Contact not found
            ValidationError: Invalid channel for contact
        """
        if not db:
            raise ValidationError("Database session required")

        # Get contact
        contact = await db.get(Contact, contact_id)
        if not contact:
            raise NotFoundError(f"Contact {contact_id} not found")

        # Auto-select channel if not specified
        if not channel:
            channel = self._select_channel(contact)

        # Validate contact has required info for channel
        self._validate_channel(contact, channel)

        # Create thread if needed
        if not thread_id:
            thread_id = await self._get_or_create_thread(contact_id, channel, db)

        # Create communication record
        communication = Communication(
            type=channel,
            direction=CommunicationDirection.OUTBOUND,
            contact_id=contact_id,
            user_id=user_id,
            subject=subject,
            body=message_body,
            media_urls=media_urls or [],
            status=CommunicationStatus.PENDING,
            thread_id=thread_id,
        )

        db.add(communication)
        await db.commit()
        await db.refresh(communication)

        # Queue for delivery
        await self._queue_delivery(communication, contact)

        return communication

    def _select_channel(self, contact: Contact) -> CommunicationType:
        """
        Auto-select best communication channel for contact

        Priority:
        1. Web chat (if online)
        2. SMS (if has phone)
        3. Email (if has email)

        Args:
            contact: Contact object

        Returns:
            Selected channel type
        """
        # Check if contact is online for web chat
        if self.connection_manager.is_user_online(str(contact.id)):
            return CommunicationType.WEB_CHAT

        # Prefer SMS for instant messaging
        if contact.phone:
            return CommunicationType.SMS

        # Fallback to email
        if contact.email:
            return CommunicationType.EMAIL

        raise ValidationError(
            "Contact has no phone or email - cannot send message"
        )

    def _validate_channel(
        self,
        contact: Contact,
        channel: CommunicationType,
    ):
        """
        Validate contact has required info for channel

        Args:
            contact: Contact object
            channel: Communication channel

        Raises:
            ValidationError: Missing required contact info
        """
        if channel == CommunicationType.EMAIL and not contact.email:
            raise ValidationError("Contact has no email address")

        if channel in [CommunicationType.SMS, CommunicationType.MMS] and not contact.phone:
            raise ValidationError("Contact has no phone number")

        if channel == CommunicationType.PHONE and not contact.phone:
            raise ValidationError("Contact has no phone number")

    async def _get_or_create_thread(
        self,
        contact_id: UUID,
        channel: CommunicationType,
        db: AsyncSession,
    ) -> UUID:
        """
        Get existing thread or create new one

        Args:
            contact_id: Contact ID
            channel: Communication channel
            db: Database session

        Returns:
            Thread ID
        """
        # Find most recent thread for this contact and channel
        result = await db.execute(
            select(Communication)
            .where(
                Communication.contact_id == contact_id,
                Communication.type == channel,
            )
            .order_by(Communication.created_at.desc())
            .limit(1)
        )

        recent_comm = result.scalar_one_or_none()

        if recent_comm and recent_comm.thread_id:
            # Check if thread is recent (within 24 hours)
            age = datetime.now(timezone.utc) - recent_comm.created_at
            if age.total_seconds() < 86400:  # 24 hours
                return recent_comm.thread_id

        # Create new thread
        from uuid import uuid4

        return uuid4()

    async def _queue_delivery(
        self,
        communication: Communication,
        contact: Contact,
    ):
        """
        Queue communication for delivery via appropriate service

        Args:
            communication: Communication record
            contact: Contact object
        """
        if communication.type == CommunicationType.EMAIL:
            send_email_task.delay(
                communication_id=str(communication.id),
                to_email=contact.email,
                subject=communication.subject or "Message from Eve Beauty MA",
                html_body=communication.body,
                tags=[f"contact_{contact.id}"],
            )

        elif communication.type == CommunicationType.SMS:
            send_sms_task.delay(
                communication_id=str(communication.id),
                to_number=contact.phone,
                text=communication.body,
                tag=f"contact_{contact.id}",
            )

        elif communication.type == CommunicationType.MMS:
            send_mms_task.delay(
                communication_id=str(communication.id),
                to_number=contact.phone,
                text=communication.body,
                media_urls=communication.media_urls,
                tag=f"contact_{contact.id}",
            )

        elif communication.type == CommunicationType.WEB_CHAT:
            # Send via WebSocket immediately
            message_data = {
                "type": "new_message",
                "communication_id": str(communication.id),
                "contact_id": str(contact.id),
                "body": communication.body,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            await self.connection_manager.send_contact_message(
                message_data,
                str(contact.id),
            )

    async def broadcast_to_contact_team(
        self,
        contact_id: UUID,
        message: Dict,
        exclude_user_id: Optional[UUID] = None,
    ):
        """
        Broadcast message to all users assigned to a contact

        Used for real-time notifications when contact receives message

        Args:
            contact_id: Contact ID
            message: Message data to broadcast
            exclude_user_id: User ID to exclude (e.g., sender)
        """
        await self.connection_manager.send_contact_message(
            message,
            str(contact_id),
            exclude_user_id=str(exclude_user_id) if exclude_user_id else None,
        )


# Singleton instance
_communication_router: Optional[CommunicationRouter] = None


def get_communication_router() -> CommunicationRouter:
    """Get or create communication router instance"""
    global _communication_router
    if _communication_router is None:
        _communication_router = CommunicationRouter()
    return _communication_router
