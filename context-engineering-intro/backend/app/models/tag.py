"""Tag model for contact categorization and segmentation"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Tag(Base):
    """
    Tag model for categorizing and segmenting contacts

    Tags are system-wide (shared across all users) and have a name + color.
    Multiple tags can be assigned to each contact via the ContactTag join table.
    """

    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Tag Information
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), nullable=False)  # Hex color format: #FF5733

    # Audit Fields
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    created_by_user = relationship("User", foreign_keys=[created_by])
    contact_tags = relationship("ContactTag", back_populates="tag", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_tag_name', 'name'),
        Index('idx_tag_created_by', 'created_by'),
    )

    def __repr__(self):
        return f"<Tag {self.name} ({self.color})>"
