"""Contact activity timeline model."""

from sqlalchemy import Column, String, DateTime, Boolean, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class ContactActivity(Base):
    """Immutable history of actions performed on a contact."""

    __tablename__ = "contact_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    activity_type = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(255), nullable=True)
    details = Column(JSONB, default=dict)
    is_deleted = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_contact_activities_contact_id_created_at", "contact_id", "created_at"),
        Index("ix_contact_activities_activity_type", "activity_type"),
        Index("ix_contact_activities_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<ContactActivity contact={self.contact_id} type={self.activity_type}>"
