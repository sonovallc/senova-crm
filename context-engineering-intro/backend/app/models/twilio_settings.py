"""Twilio configuration and settings for Objects"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class TwilioSettings(Base):
    """
    Per-object Twilio configuration for SMS/voice communications.
    Each object can have its own Twilio account and credentials.
    """

    __tablename__ = "twilio_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Object relationship - each object can have one Twilio config
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id"), nullable=False, index=True, unique=True)

    # Twilio credentials
    account_sid = Column(String(34), nullable=False)  # Starts with AC... (not encrypted as it's not sensitive)
    auth_token_encrypted = Column(Text, nullable=False)  # Encrypted with Fernet
    webhook_signing_secret_encrypted = Column(Text, nullable=True)  # Encrypted, for webhook validation

    # Configuration
    is_active = Column(Boolean, default=True, index=True)
    connection_verified_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    object = relationship("Object", backref="twilio_settings")
    phone_numbers = relationship(
        "TwilioPhoneNumber",
        back_populates="twilio_settings",
        cascade="all, delete-orphan",
        lazy="selectin"  # Eager load to avoid async context errors
    )

    # Indexes
    __table_args__ = (
        Index('idx_twilio_settings_object_id', 'object_id'),
        Index('idx_twilio_settings_active', 'is_active'),
    )

    def __repr__(self):
        return f"<TwilioSettings {self.account_sid} for object {self.object_id}>"

    @property
    def is_verified(self) -> bool:
        """Check if Twilio connection has been successfully tested"""
        return self.connection_verified_at is not None