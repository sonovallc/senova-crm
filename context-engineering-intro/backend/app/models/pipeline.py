"""Pipeline model for sales/marketing funnels"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Pipeline(Base):
    """Sales/marketing pipeline (funnel) definitions"""

    __tablename__ = "pipelines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)  # 'sales', 'marketing', 'support', 'onboarding'
    description = Column(Text)

    # Pipeline Stages (ordered array)
    stages = Column(JSONB, nullable=False)
    # Example: [
    #   {
    #     "id": "stage1", "name": "New Lead", "order": 0, "description": "...",
    #     "automations": [{"trigger": "entry", "action": "send_email", "config": {...}}],
    #     "exit_criteria": ["contact_status == prospect"]
    #   }
    # ]

    # Status
    is_active = Column(Boolean, default=True)

    # Analytics (updated periodically)
    analytics = Column(JSONB, default=dict)
    # Example: {
    #   "total_contacts": 150,
    #   "conversion_rates": [
    #     {"from_stage": "New Lead", "to_stage": "Qualified", "rate": 45.5, "avg_time_days": 3.2}
    #   ]
    # }

    # Metadata
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    created_by = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_pipeline_type', 'type'),
        Index('idx_pipeline_active', 'is_active'),
    )

    def __repr__(self):
        return f"<Pipeline {self.name} - {self.type}>"
