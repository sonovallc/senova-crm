"""Autoresponder models for automated email sequences and triggers"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class TriggerType(str, enum.Enum):
    """Types of autoresponder triggers"""
    NEW_CONTACT = "new_contact"
    TAG_ADDED = "tag_added"
    DATE_BASED = "date_based"
    APPOINTMENT_BOOKED = "appointment_booked"
    APPOINTMENT_COMPLETED = "appointment_completed"


class ExecutionStatus(str, enum.Enum):
    """Status of autoresponder execution"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


class TimingMode(str, enum.Enum):
    """Timing modes for autoresponder sequences"""
    FIXED_DURATION = "fixed_duration"
    WAIT_FOR_TRIGGER = "wait_for_trigger"
    EITHER_OR = "either_or"
    BOTH = "both"


class Autoresponder(Base):
    """
    Automated email responder triggered by specific events.
    Supports single emails and multi-step sequences.
    """

    __tablename__ = "autoresponders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Trigger Configuration
    trigger_type = Column(SQLEnum(TriggerType), nullable=False, index=True)
    trigger_config = Column(JSONB, nullable=False, default=dict)
    # Examples:
    # - tag_added: {"tag_id": "uuid"}
    # - date_based: {"field": "birthday", "days_before": 7}
    # - new_contact: {}

    # Status
    is_active = Column(Boolean, default=False, nullable=False, index=True)

    # Email Content (optional - can use template instead)
    template_id = Column(UUID(as_uuid=True), ForeignKey("email_templates.id"), nullable=True, index=True)
    subject = Column(String(500), nullable=True)  # Required if no template
    body_html = Column(Text, nullable=True)  # Required if no template

    # Sending Configuration
    send_from_user = Column(Boolean, default=True, nullable=False)  # Use contact's assigned user email

    # Sequences
    sequence_enabled = Column(Boolean, default=False, nullable=False)

    # Ownership
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Statistics (cached)
    total_executions = Column(Integer, default=0, nullable=False)
    total_sent = Column(Integer, default=0, nullable=False)
    total_failed = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", backref="autoresponders")
    template = relationship("EmailTemplate", backref="autoresponders")
    sequences = relationship("AutoresponderSequence", back_populates="autoresponder", cascade="all, delete-orphan", order_by="AutoresponderSequence.sequence_order")
    executions = relationship("AutoresponderExecution", back_populates="autoresponder", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_autoresponder_created_by', 'created_by'),
        Index('idx_autoresponder_trigger_type', 'trigger_type'),
        Index('idx_autoresponder_is_active', 'is_active'),
        Index('idx_autoresponder_template_id', 'template_id'),
        Index('idx_autoresponder_active_trigger', 'is_active', 'trigger_type'),  # Common query pattern
    )

    def __repr__(self):
        return f"<Autoresponder {self.name} ({self.trigger_type})>"

    @property
    def is_editable(self) -> bool:
        """Autoresponders can be edited even when active"""
        return True

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage"""
        if self.total_executions == 0:
            return 0.0
        return (self.total_sent / self.total_executions) * 100


class AutoresponderSequence(Base):
    """
    Multi-step email sequence for an autoresponder.
    Each step is sent with a delay after the previous one.
    """

    __tablename__ = "autoresponder_sequences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent autoresponder
    autoresponder_id = Column(UUID(as_uuid=True), ForeignKey("autoresponders.id"), nullable=False, index=True)

    # Sequence configuration
    sequence_order = Column(Integer, nullable=False)  # 1, 2, 3, etc.

    # Timing mode configuration
    timing_mode = Column(SQLEnum(TimingMode), nullable=False, default=TimingMode.FIXED_DURATION, index=True)

    # For FIXED_DURATION and EITHER_OR modes
    delay_days = Column(Integer, nullable=False, default=0)  # Days after previous email
    delay_hours = Column(Integer, nullable=False, default=0)  # Additional hours

    # For WAIT_FOR_TRIGGER and EITHER_OR modes
    wait_trigger_type = Column(String(50), nullable=True)  # 'tag_added', 'status_changed', 'appointment_booked'
    wait_trigger_config = Column(JSONB, nullable=True, default=dict)
    # Examples:
    # - tag_added: {"tag_id": "uuid"}
    # - status_changed: {"from_status": "LEAD", "to_status": "CUSTOMER"}
    # - appointment_booked: {}

    # Email Content (optional - can use template)
    template_id = Column(UUID(as_uuid=True), ForeignKey("email_templates.id"), nullable=True, index=True)
    subject = Column(String(500), nullable=True)  # Required if no template
    body_html = Column(Text, nullable=True)  # Required if no template

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    autoresponder = relationship("Autoresponder", back_populates="sequences")
    template = relationship("EmailTemplate", backref="sequence_steps")

    # Indexes
    __table_args__ = (
        Index('idx_autoresponder_sequence_autoresponder_id', 'autoresponder_id'),
        Index('idx_autoresponder_sequence_template_id', 'template_id'),
        Index('idx_autoresponder_sequence_order', 'autoresponder_id', 'sequence_order'),  # Ordering
        Index('idx_autoresponder_sequence_timing_mode', 'timing_mode'),  # For filtering by timing mode
    )

    def __repr__(self):
        return f"<AutoresponderSequence {self.autoresponder_id} - Step {self.sequence_order}>"

    @property
    def total_delay_hours(self) -> int:
        """Total delay in hours"""
        return (self.delay_days * 24) + self.delay_hours


class AutoresponderExecution(Base):
    """
    Individual execution record for an autoresponder.
    Tracks when an autoresponder was triggered for a specific contact.
    """

    __tablename__ = "autoresponder_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent autoresponder
    autoresponder_id = Column(UUID(as_uuid=True), ForeignKey("autoresponders.id"), nullable=False, index=True)

    # Target contact
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False, index=True)

    # Sequence tracking
    sequence_step = Column(Integer, default=0, nullable=False)  # 0 = main email, 1+ = sequence steps

    # Timing
    triggered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    scheduled_for = Column(DateTime(timezone=True), nullable=False, index=True)  # When to send
    executed_at = Column(DateTime(timezone=True), nullable=True)  # When actually sent

    # Status
    status = Column(SQLEnum(ExecutionStatus), default=ExecutionStatus.PENDING, nullable=False, index=True)

    # Mailgun tracking
    mailgun_message_id = Column(String(255), nullable=True, index=True)

    # Error tracking
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    autoresponder = relationship("Autoresponder", back_populates="executions")
    contact = relationship("Contact", backref="autoresponder_executions")

    # Indexes
    __table_args__ = (
        Index('idx_autoresponder_execution_autoresponder_id', 'autoresponder_id'),
        Index('idx_autoresponder_execution_contact_id', 'contact_id'),
        Index('idx_autoresponder_execution_status', 'status'),
        Index('idx_autoresponder_execution_scheduled_for', 'scheduled_for'),
        Index('idx_autoresponder_execution_mailgun_id', 'mailgun_message_id'),
        Index('idx_autoresponder_execution_pending', 'status', 'scheduled_for'),  # For queue processing
        Index('idx_autoresponder_execution_contact_autoresponder', 'contact_id', 'autoresponder_id'),  # Prevent duplicates
    )

    def __repr__(self):
        return f"<AutoresponderExecution {self.contact_id} - {self.status}>"

    @property
    def is_pending(self) -> bool:
        """Check if execution is pending"""
        return self.status == ExecutionStatus.PENDING

    @property
    def is_complete(self) -> bool:
        """Check if execution completed successfully"""
        return self.status == ExecutionStatus.SENT
