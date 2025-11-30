"""Mailgun email configuration and verified addresses"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class MailgunSettings(Base):
    """
    Per-user Mailgun configuration for sending emails.
    Each user can have their own Mailgun domain and credentials.
    """

    __tablename__ = "mailgun_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User relationship - each user can have one Mailgun config
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True, unique=True)

    # Mailgun credentials (api_key is encrypted)
    api_key = Column(String(500), nullable=False)  # Encrypted with Fernet
    domain = Column(String(255), nullable=False)  # e.g., "mg.senovallc.com"
    region = Column(String(10), nullable=False, default="us")  # "us" or "eu"

    # Default sending configuration
    from_email = Column(String(255), nullable=False)  # e.g., "noreply@mg.senovallc.com"
    from_name = Column(String(255), nullable=False)  # e.g., "Eve Beauty MA"

    # Status and verification
    is_active = Column(Boolean, default=False, index=True)
    verified_at = Column(DateTime(timezone=True))  # Set when connection successfully tested

    # Rate limiting (only admin/owner can modify)
    rate_limit_per_hour = Column(Integer, default=100, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="mailgun_settings")
    verified_addresses = relationship("VerifiedEmailAddress", back_populates="mailgun_settings", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_mailgun_user_id', 'user_id'),
        Index('idx_mailgun_active', 'is_active'),
    )

    def __repr__(self):
        return f"<MailgunSettings {self.domain} for user {self.user_id}>"

    @property
    def is_verified(self) -> bool:
        """Check if Mailgun connection has been successfully tested"""
        return self.verified_at is not None


class VerifiedEmailAddress(Base):
    """
    Verified email addresses that can be used as 'from' addresses.
    Each Mailgun configuration can have multiple verified addresses.
    """

    __tablename__ = "verified_email_addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relationship to Mailgun settings
    mailgun_settings_id = Column(UUID(as_uuid=True), ForeignKey("mailgun_settings.id"), nullable=False, index=True)

    # Email details
    email_address = Column(String(255), nullable=False)
    display_name = Column(String(255))  # Optional display name

    # Status
    is_default = Column(Boolean, default=False)  # Default 'from' address for this config
    verified_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    mailgun_settings = relationship("MailgunSettings", back_populates="verified_addresses")

    # Indexes
    __table_args__ = (
        Index('idx_verified_email_mailgun', 'mailgun_settings_id'),
        Index('idx_verified_email_address', 'email_address'),
    )

    def __repr__(self):
        return f"<VerifiedEmailAddress {self.email_address}>"
