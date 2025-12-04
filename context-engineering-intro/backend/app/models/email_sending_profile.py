"""Email sending profiles linked to Objects with multi-domain support"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class EmailSendingProfile(Base):
    """Email profiles that can be assigned to users for sending emails.

    Profiles can specify which Mailgun configuration to use via mailgun_settings_id.
    If mailgun_settings_id is NULL, the object's default Mailgun config is used.
    """

    __tablename__ = "email_sending_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to Object (optional for backward compatibility)
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"),
                      nullable=True, index=True)

    # Link to specific Mailgun configuration (optional - uses object default if NULL)
    mailgun_settings_id = Column(UUID(as_uuid=True),
                                  ForeignKey("object_mailgun_settings.id", ondelete="SET NULL"),
                                  nullable=True, index=True)

    # Email configuration
    local_part = Column(String(64), nullable=True)  # e.g., "jeff" -> jeff@domain
    email_address = Column(String(255), nullable=False)  # Full email for backward compatibility
    display_name = Column(String(255), nullable=False)
    reply_to_address = Column(String(255), nullable=False)

    # Signature
    signature_html = Column(Text, nullable=True)

    # Status
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
                       nullable=False)

    # Relationships
    object = relationship("Object", backref="email_profiles")
    mailgun_settings = relationship("ObjectMailgunSettings", back_populates="email_profiles")
    user_assignments = relationship("UserEmailProfileAssignment", back_populates="profile",
                                   cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_email_profile_object', 'object_id'),
        Index('idx_email_profile_active', 'is_active'),
        Index('idx_email_profile_mailgun', 'mailgun_settings_id'),
    )

    @property
    def computed_email_address(self):
        """Get the actual email address based on mailgun settings."""
        # If we have a specific mailgun_settings linked, use that domain
        if self.mailgun_settings_id and hasattr(self, 'mailgun_settings') and self.mailgun_settings:
            return f"{self.local_part}@{self.mailgun_settings.sending_domain}"

        # Otherwise, check if object has default mailgun settings
        if self.object_id and self.local_part and hasattr(self, 'object') and self.object:
            if hasattr(self.object, 'mailgun_settings') and self.object.mailgun_settings:
                # Find the default one, or use the first one
                for settings in self.object.mailgun_settings:
                    if settings.is_default:
                        return f"{self.local_part}@{settings.sending_domain}"
                # If no default, use the first one
                if len(self.object.mailgun_settings) > 0:
                    return f"{self.local_part}@{self.object.mailgun_settings[0].sending_domain}"

        return self.email_address

    def get_mailgun_settings(self):
        """Get the Mailgun settings to use for sending emails from this profile."""
        # If we have a specific mailgun_settings linked, use that
        if self.mailgun_settings_id and hasattr(self, 'mailgun_settings') and self.mailgun_settings:
            return self.mailgun_settings

        # Otherwise, find the object's default mailgun settings
        if self.object_id and hasattr(self, 'object') and self.object:
            if hasattr(self.object, 'mailgun_settings') and self.object.mailgun_settings:
                for settings in self.object.mailgun_settings:
                    if settings.is_default:
                        return settings
                # If no default, use the first one
                if len(self.object.mailgun_settings) > 0:
                    return self.object.mailgun_settings[0]

        return None

    def __repr__(self):
        return f"<EmailSendingProfile {self.email_address}>"


class UserEmailProfileAssignment(Base):
    """Links users to email sending profiles they can use"""

    __tablename__ = "user_email_profile_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Links
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("email_sending_profiles.id", ondelete="CASCADE"),
                       nullable=False, index=True)

    # Settings
    is_default = Column(Boolean, nullable=False, default=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    profile = relationship("EmailSendingProfile", back_populates="user_assignments")
    user = relationship("User", backref="email_profile_assignments")

    # Ensure unique user-profile pairs
    __table_args__ = (
        UniqueConstraint('user_id', 'profile_id', name='uq_user_email_profile'),
        Index('idx_user_email_profile_user', 'user_id'),
        Index('idx_user_email_profile_default', 'user_id', 'is_default'),
    )

    def __repr__(self):
        return f"<UserEmailProfileAssignment user={self.user_id} profile={self.profile_id}>"