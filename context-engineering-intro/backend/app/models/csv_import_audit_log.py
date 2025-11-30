"""
CSV Import Audit Log Model

Tracks all user decisions and actions during the CSV import process.
Used for audit trail, history, and compliance purposes.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.config.database import Base


class CSVImportAuditLog(Base):
    """Audit log for CSV import decisions and actions"""

    __tablename__ = "csv_import_audit_log"

    id = Column(Integer, primary_key=True)
    validation_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    file_id = Column(String(255), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Action details
    action_type = Column(String(50), nullable=False)  # 'decision', 'import', 'bulk_action'
    duplicate_group_id = Column(String(255), nullable=True)
    decision = Column(String(50), nullable=True)  # 'skip', 'keep', 'merge'
    rows_affected = Column(Integer, nullable=True)

    # Additional context stored as JSON
    details = Column(JSONB, default=dict, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    # Indexes
    __table_args__ = (
        Index('idx_audit_log_validation_id', 'validation_id'),
        Index('idx_audit_log_user_id', 'user_id'),
        Index('idx_audit_log_action_type', 'action_type'),
        Index('idx_audit_log_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<CSVImportAuditLog(id={self.id}, validation_id={self.validation_id}, action={self.action_type}, decision={self.decision})>"
