"""
Unsubscribe Token Model

Stores unique tokens for one-click unsubscribe (RFC 8058 compliance).
Each token is tied to a specific contact and optionally a campaign.
"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.config.database import Base


class UnsubscribeToken(Base):
    """
    Unsubscribe token for one-click unsubscribe compliance.

    Each token is unique and tied to a specific contact.
    Optionally tied to a specific campaign for tracking.
    """

    __tablename__ = "unsubscribe_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Unique token (base64 encoded)
    token = Column(String(255), nullable=False, unique=True, index=True)

    # Contact who can unsubscribe with this token
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)

    # Optional: Campaign this token was sent for (tracking purposes)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("email_campaigns.id", ondelete="SET NULL"), nullable=True, index=True)

    # Whether token has been used
    is_used = Column(Boolean, default=False, nullable=False, index=True)

    # When token was used (NULL if not used)
    used_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    contact = relationship("Contact", backref="unsubscribe_tokens")
    campaign = relationship("EmailCampaign", backref="unsubscribe_tokens")

    # Indexes for performance
    __table_args__ = (
        Index('idx_unsubscribe_token', 'token'),
        Index('idx_unsubscribe_contact', 'contact_id'),
        Index('idx_unsubscribe_campaign', 'campaign_id'),
        Index('idx_unsubscribe_used', 'is_used'),
    )

    def __repr__(self):
        return f"<UnsubscribeToken {self.token[:16]}... contact={self.contact_id} used={self.is_used}>"
