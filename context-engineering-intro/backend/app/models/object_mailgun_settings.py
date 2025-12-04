"""Object-level Mailgun email configuration with multi-domain support"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class ObjectMailgunSettings(Base):
    """Per-object Mailgun configuration for sending emails.

    Objects can have MULTIPLE Mailgun configurations (domains).
    One configuration per object should be marked as is_default=True.
    """

    __tablename__ = "object_mailgun_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Object relationship - objects can have MULTIPLE Mailgun configs
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"),
                      nullable=False, index=True)  # No longer unique!

    # Display name for this configuration (e.g., "Primary Domain" or domain name)
    name = Column(String(255), nullable=False)

    # Whether this is the default configuration for the object
    is_default = Column(Boolean, default=False, nullable=False)

    # Mailgun credentials (api_key is encrypted)
    api_key = Column(String(500), nullable=False)  # Encrypted with Fernet
    sending_domain = Column(String(255), nullable=False)  # e.g., "senovallc.com"
    receiving_domain = Column(String(255), nullable=False)  # e.g., "mg.senovallc.com"
    region = Column(String(10), nullable=False, default="us")  # "us" or "eu"

    # Webhook configuration
    webhook_signing_key = Column(String(255), nullable=True)

    # Status and verification
    is_active = Column(Boolean, default=False, index=True)
    verified_at = Column(DateTime(timezone=True))  # Set when connection successfully tested

    # Rate limiting
    rate_limit_per_hour = Column(Integer, default=100, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    object = relationship("Object", backref="mailgun_settings")
    email_profiles = relationship("EmailSendingProfile", back_populates="mailgun_settings")

    # Indexes for performance
    __table_args__ = (
        Index('idx_object_mailgun_object_id', 'object_id'),
        Index('idx_object_mailgun_active', 'is_active'),
        Index('idx_object_mailgun_name', 'name'),
        Index('idx_object_mailgun_default', 'object_id', 'is_default'),
    )

    def __repr__(self):
        return f"<ObjectMailgunSettings {self.name} ({self.sending_domain}) for object {self.object_id}>"

    @property
    def is_verified(self) -> bool:
        """Check if Mailgun connection has been successfully tested"""
        return self.verified_at is not None