"""
Workflow automation models

⚠️ WARNING: Workflow automation is NOT CURRENTLY ACTIVE
- Models are defined but execution system is dormant
- No triggers are configured to execute workflows on contact creation or tag addition
- See backend/app/tasks/workflow_tasks.py for execution logic (not currently called)
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class WorkflowTriggerType(str, enum.Enum):
    """Types of workflow triggers"""
    FORM_SUBMISSION = "form_submission"
    NEW_CONTACT = "new_contact"
    COMMUNICATION_RECEIVED = "communication_received"
    PIPELINE_STAGE_CHANGE = "pipeline_stage_change"
    TIME_BASED = "time_based"
    PAYMENT_COMPLETED = "payment_completed"
    TAG_ADDED = "tag_added"
    MANUAL = "manual"


class WorkflowActionType(str, enum.Enum):
    """Types of workflow actions"""
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    CREATE_TASK = "create_task"
    ASSIGN_USER = "assign_user"
    UPDATE_PIPELINE_STAGE = "update_pipeline_stage"
    ADD_TAG = "add_tag"
    REMOVE_TAG = "remove_tag"
    ENRICH_CONTACT = "enrich_contact"
    AI_RESPONSE = "ai_response"
    WEBHOOK = "webhook"


class Workflow(Base):
    """Automation workflow definitions"""

    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(200), nullable=False)
    description = Column(Text)

    # Trigger Configuration
    trigger_type = Column(SQLEnum(WorkflowTriggerType), nullable=False)
    trigger_config = Column(JSONB, default=dict)
    # Example: {"form_id": "contact-form", "field_conditions": {"interest": "Botox"}}

    # Actions to Execute (array of action configurations)
    actions = Column(JSONB, nullable=False)
    # Example: [
    #   {"type": "send_email", "template_id": "welcome", "delay_minutes": 0},
    #   {"type": "add_tag", "tag": "new-lead", "delay_minutes": 0},
    #   {"type": "enrich_contact", "delay_minutes": 5}
    # ]

    # Conditions (when to execute - AND logic between conditions)
    conditions = Column(JSONB, default=dict)
    # Example: {"contact_status": ["lead", "prospect"], "tags_any": ["interested"], "tags_all": ["qualified"]}

    # Status
    is_active = Column(Boolean, default=True)

    # Execution Statistics
    execution_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime(timezone=True))

    # Metadata
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    created_by = relationship("User")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_workflow_trigger', 'trigger_type', 'is_active'),
        Index('idx_workflow_active', 'is_active'),
    )

    def __repr__(self):
        return f"<Workflow {self.name} - {self.trigger_type}>"

    @property
    def success_rate(self) -> float:
        """Calculate workflow success rate"""
        if self.execution_count == 0:
            return 0.0
        return (self.success_count / self.execution_count) * 100


class WorkflowExecution(Base):
    """Workflow execution history and logs"""

    __tablename__ = "workflow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False, index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False, index=True)

    # Execution Details
    triggered_by = Column(String(200))  # Event that triggered execution
    status = Column(String(50))  # "success", "partial_failure", "failure", "in_progress"

    # Actions Executed
    actions_completed = Column(JSONB, default=list)  # List of successfully completed actions
    actions_failed = Column(JSONB, default=list)     # List of failed actions with errors

    # Execution Logs (for debugging)
    execution_log = Column(JSONB, default=list)
    # Example: [{"timestamp": "...", "action": "send_email", "status": "success", "details": "..."}]

    error_message = Column(Text)

    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    contact = relationship("Contact", back_populates="workflow_executions")

    # Indexes
    __table_args__ = (
        Index('idx_execution_workflow', 'workflow_id', 'started_at'),
        Index('idx_execution_contact', 'contact_id', 'started_at'),
        Index('idx_execution_status', 'status'),
    )

    def __repr__(self):
        return f"<WorkflowExecution {self.workflow_id} - {self.status}>"
