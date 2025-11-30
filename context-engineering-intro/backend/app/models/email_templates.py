"""Email templates model for reusable email compositions"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class EmailTemplate(Base):
    """
    Email templates for quick composition with variable substitution.
    Supports both user-created and system templates.
    """

    __tablename__ = "email_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Ownership - who created this template (nullable for system templates)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Template Details
    name = Column(String(255), nullable=False)  # Template name for selection
    category = Column(String(100), nullable=False, index=True)  # "Welcome", "Appointment", "Follow-up", "Promotion", "Newsletter", "General"

    # Email Content with Variable Support
    subject = Column(String(500), nullable=False)  # Subject line with variables like {{contact_name}}
    body_html = Column(Text, nullable=False)  # HTML body with variable placeholders

    # Preview and Display
    thumbnail_url = Column(String(500))  # Optional preview image URL

    # Template Type and Status
    is_system = Column(Boolean, default=False, index=True)  # True for pre-built templates
    is_active = Column(Boolean, default=True, index=True)  # Soft delete flag

    # Variable Tracking
    # List of variables used in this template
    # Example: ["{{contact_name}}", "{{company_name}}", "{{appointment_date}}"]
    variables = Column(JSONB, default=list)

    # Usage Analytics
    usage_count = Column(Integer, default=0, nullable=False)  # Track how many times template is used

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="email_templates")

    # Indexes for performance
    __table_args__ = (
        Index('idx_email_template_user_id', 'user_id'),
        Index('idx_email_template_category', 'category'),
        Index('idx_email_template_is_system', 'is_system'),
        Index('idx_email_template_is_active', 'is_active'),
        Index('idx_email_template_user_active', 'user_id', 'is_active'),  # Common query pattern
        Index('idx_email_template_category_active', 'category', 'is_active'),  # Filter by category and active
    )

    def __repr__(self):
        return f"<EmailTemplate {self.name} ({self.category})>"

    @property
    def is_system_template(self) -> bool:
        """Check if this is a pre-built system template"""
        return self.is_system

    @property
    def variable_list(self) -> list:
        """Get list of variables used in this template"""
        return self.variables if self.variables else []

    def increment_usage(self):
        """Increment usage count when template is used"""
        self.usage_count += 1


# Supported template variables documentation:
"""
Variable Replacement Support:
- {{contact_name}} - Contact first + last name combined
- {{first_name}} - Contact first name only
- {{last_name}} - Contact last name only
- {{email}} - Contact email address
- {{phone}} - Contact phone number
- {{company_name}} - Contact company name
- {{appointment_date}} - Appointment date (for appointment reminders)
- {{appointment_time}} - Appointment time (for appointment reminders)
- {{user_name}} - Current user's full name
- {{user_email}} - Current user's email address

Example template subject:
"Welcome to {{company_name}}, {{first_name}}!"

Example template body:
"<p>Hi {{first_name}},</p>
<p>Thank you for choosing {{company_name}}. We're excited to work with you!</p>
<p>Best regards,<br>{{user_name}}</p>"
"""
