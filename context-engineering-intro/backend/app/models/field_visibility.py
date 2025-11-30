"""Field visibility model for RBAC field-level permissions"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class FieldVisibility(Base):
    """Field visibility configuration for contact fields"""

    __tablename__ = "field_visibility"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Field identification
    field_name = Column(String(100), nullable=False, unique=True, index=True)
    field_label = Column(String(255), nullable=False)
    field_category = Column(String(50), nullable=True)
    field_type = Column(String(20), nullable=False, default='string')  # Field data type for proper rendering

    # Visibility settings
    visible_to_admin = Column(Boolean, nullable=False, default=True)
    visible_to_user = Column(Boolean, nullable=False, default=False)
    is_sensitive = Column(Boolean, nullable=False, default=False)

    # Audit tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    updated_by = relationship("User", foreign_keys=[updated_by_user_id])

    # Indexes
    __table_args__ = (
        Index('idx_field_visibility_field_name', 'field_name', unique=True),
        Index('idx_field_visibility_category', 'field_category'),
    )

    def __repr__(self):
        return f"<FieldVisibility {self.field_name} (admin:{self.visible_to_admin}, user:{self.visible_to_user})>"

    def is_visible_to_role(self, role) -> bool:
        """
        Check if field is visible to a given role.

        Args:
            role: User role string ('owner', 'admin', 'user')

        Returns:
            bool: True if field is visible to the role
        """
        if role == 'owner':
            return True  # Owner sees everything
        elif role == 'admin':
            return self.visible_to_admin
        elif role == 'user':
            return self.visible_to_user
        return False
