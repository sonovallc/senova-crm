"""Communication model - Unified inbox for all message types"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class CommunicationType(str, enum.Enum):
    """Type of communication channel"""
    SMS = "sms"
    MMS = "mms"
    EMAIL = "email"
    PHONE = "phone"
    WEB_CHAT = "web_chat"


class CommunicationDirection(str, enum.Enum):
    """Direction of communication"""
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class CommunicationStatus(str, enum.Enum):
    """Status of communication"""
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    READ = "READ"
    ARCHIVED = "ARCHIVED"


class Communication(Base):
    """Unified communications table for all message types (SMS, email, phone, chat)"""

    __tablename__ = "communications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Message Classification
    type = Column(SQLEnum(CommunicationType), nullable=False, index=True)
    direction = Column(SQLEnum(CommunicationDirection), nullable=False)
    status = Column(SQLEnum(CommunicationStatus), default=CommunicationStatus.PENDING)

    # Participants
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # Staff member (if outbound)

    # Content
    subject = Column(String(500))  # For email
    body = Column(Text, nullable=False)

    # Channel-Specific Data
    from_address = Column(String(255))  # Phone number or email address
    to_address = Column(String(255))    # Phone number or email address

    # Media Attachments (URLs to stored files)
    media_urls = Column(JSONB, default=list)
    # Example: ["https://storage.example.com/message-media/abc123.jpg", "https://..."]

    # External Service IDs (for tracking with providers)
    external_id = Column(String(255), index=True)  # Bandwidth message ID, Mailgun ID, etc.

    # AI Processing
    ai_generated = Column(Boolean, default=False)
    ai_confidence_score = Column(Integer)  # 0-100 confidence level
    closebot_processed = Column(Boolean, default=False)

    # Threading (conversation grouping)
    # All messages with same thread_id belong to same conversation
    thread_id = Column(UUID(as_uuid=True), index=True)

    # Metadata Timestamps
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    read_at = Column(DateTime(timezone=True))
    failed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)

    # Provider-specific metadata (for debugging, billing, analytics)
    provider_metadata = Column(JSONB, default=dict)
    # Example: {"segment_count": 2, "cost": 0.0075, "provider": "bandwidth", "webhook_timestamp": "..."}

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    contact = relationship("Contact", back_populates="communications")
    user = relationship("User", back_populates="sent_communications")

    # Indexes for inbox queries and performance
    __table_args__ = (
        Index('idx_comm_contact_created', 'contact_id', 'created_at'),
        Index('idx_comm_type_status', 'type', 'status'),
        Index('idx_comm_thread', 'thread_id', 'created_at'),
        Index('idx_comm_external_id', 'external_id'),
        Index('idx_comm_direction', 'direction'),
    )

    def __repr__(self):
        return f"<Communication {self.type} {self.direction} - {self.status}>"

    @property
    def is_inbound(self) -> bool:
        """Check if message is inbound"""
        return self.direction == CommunicationDirection.INBOUND

    @property
    def is_outbound(self) -> bool:
        """Check if message is outbound"""
        return self.direction == CommunicationDirection.OUTBOUND

    @property
    def has_media(self) -> bool:
        """Check if message has media attachments"""
        return bool(self.media_urls) if self.media_urls else False
