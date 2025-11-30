"""Email campaigns and campaign recipients models for mass email sending"""

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class CampaignStatus(str, enum.Enum):
    """Campaign execution status"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class CampaignRecipientStatus(str, enum.Enum):
    """Individual recipient email status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"
    UNSUBSCRIBED = "unsubscribed"


class EmailCampaign(Base):
    """
    Mass email campaign for sending to multiple contacts.
    Supports filtering recipients, scheduling, and tracking.
    """

    __tablename__ = "email_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Ownership - who created this campaign
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Campaign Details
    name = Column(String(255), nullable=False)  # Campaign name for identification
    subject = Column(String(500), nullable=False)  # Email subject line

    # Template reference (optional)
    template_id = Column(UUID(as_uuid=True), ForeignKey("email_templates.id"), nullable=True, index=True)

    # Email Content (if not using template)
    body_html = Column(Text, nullable=True)  # HTML email content
    body_text = Column(Text, nullable=True)  # Plain text email content (optional)

    # Recipient Selection
    recipient_filter = Column(JSONB, nullable=False, default=dict)
    # Example: {
    #   "tags": ["vip", "interested-in-botox"],
    #   "status": "CUSTOMER",
    #   "date_range": {"field": "created_at", "start": "2024-01-01", "end": "2024-12-31"},
    #   "assigned_user_id": "uuid",
    #   "has_email": true
    # }

    recipient_count = Column(Integer, default=0, nullable=False)  # Cached count of recipients

    # Campaign Status
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False, index=True)

    # Scheduling
    scheduled_at = Column(DateTime(timezone=True), nullable=True)  # When to send (null = send now)
    started_at = Column(DateTime(timezone=True), nullable=True)  # When sending began
    completed_at = Column(DateTime(timezone=True), nullable=True)  # When sending finished

    # Statistics (cached for performance)
    sent_count = Column(Integer, default=0, nullable=False)
    delivered_count = Column(Integer, default=0, nullable=False)
    opened_count = Column(Integer, default=0, nullable=False)
    clicked_count = Column(Integer, default=0, nullable=False)
    bounced_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    unsubscribed_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="email_campaigns")
    template = relationship("EmailTemplate", backref="campaigns")
    recipients = relationship("CampaignRecipient", back_populates="campaign", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_email_campaign_user_id', 'user_id'),
        Index('idx_email_campaign_status', 'status'),
        Index('idx_email_campaign_template_id', 'template_id'),
        Index('idx_email_campaign_scheduled_at', 'scheduled_at'),
        Index('idx_email_campaign_user_status', 'user_id', 'status'),  # Common query pattern
    )

    def __repr__(self):
        return f"<EmailCampaign {self.name} ({self.status})>"

    @property
    def is_editable(self) -> bool:
        """Check if campaign can be edited (only drafts can be edited)"""
        return self.status == CampaignStatus.DRAFT

    @property
    def is_sendable(self) -> bool:
        """Check if campaign can be sent"""
        return self.status in (CampaignStatus.DRAFT, CampaignStatus.PAUSED)

    @property
    def is_cancellable(self) -> bool:
        """Check if campaign can be cancelled"""
        return self.status in (CampaignStatus.SCHEDULED, CampaignStatus.SENDING)

    @property
    def delivery_rate(self) -> float:
        """Calculate delivery rate percentage"""
        if self.sent_count == 0:
            return 0.0
        return (self.delivered_count / self.sent_count) * 100

    @property
    def open_rate(self) -> float:
        """Calculate open rate percentage"""
        if self.delivered_count == 0:
            return 0.0
        return (self.opened_count / self.delivered_count) * 100

    @property
    def click_rate(self) -> float:
        """Calculate click rate percentage"""
        if self.opened_count == 0:
            return 0.0
        return (self.clicked_count / self.opened_count) * 100


class CampaignRecipient(Base):
    """
    Individual recipient record for a campaign.
    Tracks sending and engagement status for each contact.
    """

    __tablename__ = "campaign_recipients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Campaign relationship
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("email_campaigns.id"), nullable=False, index=True)

    # Contact relationship
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False, index=True)

    # Recipient email (cached for performance and history)
    email = Column(String(255), nullable=False, index=True)

    # Sending status
    status = Column(SQLEnum(CampaignRecipientStatus), default=CampaignRecipientStatus.PENDING, nullable=False, index=True)

    # Event timestamps
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    bounced_at = Column(DateTime(timezone=True), nullable=True)

    # Error tracking
    error_message = Column(Text, nullable=True)  # If sending failed

    # Mailgun tracking
    mailgun_message_id = Column(String(255), nullable=True, index=True)  # For webhook tracking

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    campaign = relationship("EmailCampaign", back_populates="recipients")
    contact = relationship("Contact", backref="campaign_recipients")

    # Indexes for performance
    __table_args__ = (
        Index('idx_campaign_recipient_campaign_id', 'campaign_id'),
        Index('idx_campaign_recipient_contact_id', 'contact_id'),
        Index('idx_campaign_recipient_status', 'status'),
        Index('idx_campaign_recipient_email', 'email'),
        Index('idx_campaign_recipient_mailgun_id', 'mailgun_message_id'),
        Index('idx_campaign_recipient_campaign_status', 'campaign_id', 'status'),  # Common query pattern
    )

    def __repr__(self):
        return f"<CampaignRecipient {self.email} ({self.status})>"

    @property
    def is_engaged(self) -> bool:
        """Check if recipient has opened or clicked"""
        return self.status in (CampaignRecipientStatus.OPENED, CampaignRecipientStatus.CLICKED)
