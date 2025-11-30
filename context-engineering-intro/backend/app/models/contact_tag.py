"""ContactTag join table for many-to-many contact-tag relationship"""

from sqlalchemy import Column, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class ContactTag(Base):
    """
    ContactTag join table for many-to-many relationship between contacts and tags

    Tracks which tags are assigned to which contacts, along with audit info.
    """

    __tablename__ = "contact_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)

    # Audit Fields
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    contact = relationship("Contact", backref="contact_tags")
    tag = relationship("Tag", back_populates="contact_tags")
    added_by_user = relationship("User", foreign_keys=[added_by])

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('contact_id', 'tag_id', name='uq_contact_tag'),
        Index('idx_contact_tags_contact', 'contact_id'),
        Index('idx_contact_tags_tag', 'tag_id'),
    )

    def __repr__(self):
        return f"<ContactTag contact_id={self.contact_id} tag_id={self.tag_id}>"
