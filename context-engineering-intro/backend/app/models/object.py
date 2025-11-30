"""Object model - Organizations/Companies that contain contacts with hierarchical access control"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Object(Base):
    """Organizational entities (companies, organizations) that serve as containers for contacts"""

    __tablename__ = "objects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(50), nullable=False, default='company', index=True)  # company, organization, department, etc.

    # Company details stored as JSONB for flexibility
    company_info = Column(JSONB, default={})
    # Expected structure:
    # {
    #     "industry": "Technology",
    #     "size": "50-100",
    #     "website": "https://example.com",
    #     "phone": "+1234567890",
    #     "address": {
    #         "street": "123 Main St",
    #         "city": "San Francisco",
    #         "state": "CA",
    #         "country": "USA",
    #         "postal_code": "94102"
    #     },
    #     "social_media": {
    #         "linkedin": "https://linkedin.com/company/example",
    #         "twitter": "@example"
    #     },
    #     "custom_fields": {...}
    # }

    # Timestamps and audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Soft delete support
    deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True))

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], backref="created_objects")
    contacts = relationship("ObjectContact", back_populates="object", cascade="all, delete-orphan")
    user_permissions = relationship("ObjectUser", back_populates="object", cascade="all, delete-orphan")
    websites = relationship("ObjectWebsite", back_populates="object", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_objects_name_type', 'name', 'type'),
        Index('idx_objects_created_by', 'created_by'),
        Index('idx_objects_deleted', 'deleted'),
    )


class ObjectContact(Base):
    """Junction table linking objects to contacts with assignment metadata"""

    __tablename__ = "object_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)

    # Assignment metadata
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Role/position within the object (optional)
    role = Column(String(100))  # e.g., "CEO", "Manager", "Employee"
    department = Column(String(100))  # e.g., "Engineering", "Sales"
    is_primary_contact = Column(Boolean, default=False)

    # Relationships
    object = relationship("Object", back_populates="contacts")
    contact = relationship("Contact", backref="object_associations")
    assigner = relationship("User", foreign_keys=[assigned_by])

    # Ensure unique object-contact pairs
    __table_args__ = (
        UniqueConstraint('object_id', 'contact_id', name='uq_object_contact'),
        Index('idx_object_contacts_primary', 'object_id', 'is_primary_contact'),
    )


class ObjectUser(Base):
    """Junction table linking objects to users with granular permissions"""

    __tablename__ = "object_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Permission structure
    permissions = Column(JSONB, default={}, nullable=False)
    # Expected structure:
    # {
    #     "can_view": true,                          # View object and its contacts
    #     "can_manage_contacts": false,              # Add/remove/edit contacts
    #     "can_manage_company_info": true,           # Edit company details
    #     "can_manage_websites": false,              # Manage hosted websites
    #     "can_assign_users": false,                 # Add/remove users from object
    #     "can_delete_object": false,                # Delete the entire object
    #     "manageable_fields": ["address", "phone"], # Specific fields user can edit
    #     "view_only_fields": ["revenue", "size"],   # Fields user can view but not edit
    #     "custom_permissions": {...}                # Additional app-specific permissions
    # }

    # Assignment metadata
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Role within the object context
    role_name = Column(String(100))  # e.g., "Account Manager", "Viewer", "Administrator"

    # Relationships
    object = relationship("Object", back_populates="user_permissions")
    user = relationship("User", foreign_keys=[user_id], backref="object_user_permissions")
    assigner = relationship("User", foreign_keys=[assigned_by])

    # Ensure unique object-user pairs
    __table_args__ = (
        UniqueConstraint('object_id', 'user_id', name='uq_object_user'),
        Index('idx_object_users_permissions', 'object_id', 'user_id'),
    )


class ObjectWebsite(Base):
    """Hosted websites/landing pages for objects"""

    __tablename__ = "object_websites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Key
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"), nullable=False, index=True)

    # Website configuration
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)  # URL slug for the website
    custom_domain = Column(String(255), unique=True, nullable=True)  # Optional custom domain

    # Content and configuration stored as JSONB
    content = Column(JSONB, default={})
    # Expected structure:
    # {
    #     "pages": [
    #         {
    #             "path": "/",
    #             "title": "Home",
    #             "content": "...",
    #             "meta": {...}
    #         }
    #     ],
    #     "theme": {
    #         "colors": {...},
    #         "fonts": {...}
    #     },
    #     "settings": {
    #         "analytics_id": "UA-xxx",
    #         "favicon": "url",
    #         "logo": "url"
    #     },
    #     "forms": [...],
    #     "integrations": {...}
    # }

    # Publishing status
    published = Column(Boolean, default=False, index=True)
    ssl_provisioned = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))

    # Relationships
    object = relationship("Object", back_populates="websites")

    # Indexes for performance
    __table_args__ = (
        Index('idx_object_websites_published', 'published'),
        Index('idx_object_websites_object', 'object_id'),
    )