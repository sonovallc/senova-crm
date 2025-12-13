"""
SMS sending profiles linked to Objects with phone number support.

Mirrors the EmailSendingProfile pattern for consistent UX.
Profiles link to Telnyx phone numbers and can be assigned to users.
"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class SMSSendingProfile(Base):
    """
    SMS profiles that can be assigned to users for sending SMS/MMS.

    Similar to EmailSendingProfile, but links to a Telnyx phone number
    instead of a Mailgun domain.
    """

    __tablename__ = "sms_sending_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to Object (tenant)
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"),
                      nullable=False, index=True)

    # Link to specific phone number
    phone_number_id = Column(UUID(as_uuid=True),
                            ForeignKey("telnyx_phone_numbers.id", ondelete="CASCADE"),
                            nullable=False, index=True)

    # Profile Configuration
    display_name = Column(String(255), nullable=False)  # Friendly name for UI

    # Default SMS signature (appended to messages)
    signature = Column(Text, nullable=True)  # e.g., "- John from Acme Corp"

    # Rate limiting (optional, per profile)
    max_messages_per_day = Column(String(10), nullable=True)  # None = no limit

    # Status
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
                       nullable=False)

    # Relationships
    object = relationship("Object", backref="sms_profiles")
    phone_number = relationship("TelnyxPhoneNumber", back_populates="sms_profiles")
    user_assignments = relationship("UserSMSProfileAssignment", back_populates="profile",
                                   cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_sms_profile_object', 'object_id'),
        Index('idx_sms_profile_active', 'is_active'),
        Index('idx_sms_profile_phone', 'phone_number_id'),
    )

    @property
    def formatted_phone_number(self):
        """Get the phone number in a readable format."""
        if self.phone_number:
            # Format +1234567890 as (123) 456-7890
            num = self.phone_number.phone_number
            if num.startswith('+1') and len(num) == 12:
                return f"({num[2:5]}) {num[5:8]}-{num[8:]}"
            return num
        return None

    def __repr__(self):
        return f"<SMSSendingProfile {self.display_name}>"


class UserSMSProfileAssignment(Base):
    """
    Links users to SMS sending profiles they can use.

    Same pattern as UserEmailProfileAssignment for consistent behavior.
    """

    __tablename__ = "user_sms_profile_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Links
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("sms_sending_profiles.id", ondelete="CASCADE"),
                       nullable=False, index=True)

    # Settings
    is_default = Column(Boolean, nullable=False, default=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    profile = relationship("SMSSendingProfile", back_populates="user_assignments")
    user = relationship("User", backref="sms_profile_assignments")

    # Ensure unique user-profile pairs
    __table_args__ = (
        UniqueConstraint('user_id', 'profile_id', name='uq_user_sms_profile'),
        Index('idx_user_sms_profile_user', 'user_id'),
        Index('idx_user_sms_profile_default', 'user_id', 'is_default'),
    )

    def __repr__(self):
        return f"<UserSMSProfileAssignment user={self.user_id} profile={self.profile_id}>"
