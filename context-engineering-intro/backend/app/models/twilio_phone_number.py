"""Twilio phone numbers management"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, UniqueConstraint, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class TwilioPhoneNumber(Base):
    """
    Twilio phone numbers purchased and managed by objects.
    Tracks ownership, assignment, and billing information.
    """

    __tablename__ = "twilio_phone_numbers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Object ownership
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id"), nullable=False, index=True)

    # Twilio settings reference
    twilio_settings_id = Column(UUID(as_uuid=True), ForeignKey("twilio_settings.id"), nullable=False, index=True)

    # Phone number details
    phone_number = Column(String(20), nullable=False)  # E.164 format
    twilio_sid = Column(String(34), nullable=False, unique=True)  # Starts with PN...
    friendly_name = Column(String(100), nullable=True)
    messaging_service_sid = Column(String(34), nullable=True)  # For SMS

    # Capabilities
    sms_capable = Column(Boolean, default=True)
    mms_capable = Column(Boolean, default=False)
    voice_capable = Column(Boolean, default=True)

    # Assignment - can be assigned to a specific contact or user
    assigned_contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True, index=True)
    assigned_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Billing
    monthly_cost = Column(Numeric(10, 2), default=1.15)  # Default Twilio phone number cost

    # Purchase tracking
    purchased_at = Column(DateTime(timezone=True), nullable=False)
    purchased_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Status
    status = Column(String(20), nullable=False, default='active')  # active, suspended, released

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    object = relationship("Object", backref="twilio_phone_numbers")
    twilio_settings = relationship("TwilioSettings", back_populates="phone_numbers")
    assigned_contact = relationship("Contact", foreign_keys=[assigned_contact_id], backref="assigned_phone_numbers")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id], backref="assigned_phone_numbers")
    purchased_by = relationship("User", foreign_keys=[purchased_by_id], backref="purchased_phone_numbers")

    # Indexes and constraints
    __table_args__ = (
        # Unique phone number per object
        UniqueConstraint('object_id', 'phone_number', name='uq_object_phone_number'),
        Index('idx_twilio_phone_numbers_object_id', 'object_id'),
        Index('idx_twilio_phone_numbers_status', 'status'),
        Index('idx_twilio_phone_numbers_assigned_contact', 'assigned_contact_id'),
        Index('idx_twilio_phone_numbers_assigned_user', 'assigned_user_id'),
    )

    def __repr__(self):
        return f"<TwilioPhoneNumber {self.phone_number} ({self.status})>"