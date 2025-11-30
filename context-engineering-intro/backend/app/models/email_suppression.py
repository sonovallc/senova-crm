"""
Email Suppression List Model

Manages bounces, unsubscribes, and complaints for GDPR/CAN-SPAM compliance.
Synced from Mailgun suppression lists.
"""

from sqlalchemy import Column, String, DateTime, Text, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class SuppressionType(str, enum.Enum):
    """Type of email suppression"""
    BOUNCE = "bounce"
    UNSUBSCRIBE = "unsubscribe"
    COMPLAINT = "complaint"


class EmailSuppression(Base):
    """
    Email suppression list for GDPR/CAN-SPAM compliance.

    Tracks bounces, unsubscribes, and spam complaints.
    Prevents sending to suppressed emails.
    """

    __tablename__ = "email_suppressions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Suppressed email address (unique)
    email = Column(String(255), nullable=False, unique=True, index=True)

    # Type of suppression
    suppression_type = Column(SQLEnum(SuppressionType), nullable=False, index=True)

    # Reason for suppression
    reason = Column(Text, nullable=True)

    # When Mailgun created this suppression
    mailgun_created_at = Column(DateTime(timezone=True), nullable=True)

    # When we last synced from Mailgun
    synced_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes for performance
    __table_args__ = (
        Index('idx_email_suppression_email', 'email'),
        Index('idx_email_suppression_type', 'suppression_type'),
        Index('idx_email_suppression_email_type', 'email', 'suppression_type'),  # Common query pattern
    )

    def __repr__(self):
        return f"<EmailSuppression {self.email} ({self.suppression_type})>"
