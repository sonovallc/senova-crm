"""User model for authentication and staff accounts"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, Index, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class UserRole(str, enum.Enum):
    """User role enum for RBAC"""
    OWNER = "owner"
    ADMIN = "admin"
    USER = "user"

    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive lookups"""
        if isinstance(value, str):
            value = value.lower()
            for member in cls:
                if member.value == value:
                    return member
        return None


class User(Base):
    """User/staff account model with role-based permissions"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(500), nullable=False)

    # Profile
    first_name = Column(String(100))
    last_name = Column(String(100))
    full_name = Column(String(200))
    department = Column(String(100))
    avatar_url = Column(String(500))

    # RBAC Role (owner/admin/user) - stored as ENUM in DB
    role = Column(SQLEnum(UserRole, name='user_role', values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.USER, index=True)

    # Permissions (JSONB for flexible permission structure - legacy)
    permissions = Column(JSONB, default=list)
    # Example: ["contacts:read", "contacts:write", "payments:process"]

    # Refresh tokens for JWT rotation
    refresh_tokens = Column(JSONB, default=list)

    # Status and Approval
    is_active = Column(Boolean, default=True, index=True)
    is_approved = Column(Boolean, default=False, index=True)
    is_verified = Column(Boolean, default=False)

    # Approval tracking
    approved_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Deactivation tracking
    deactivated_at = Column(DateTime(timezone=True), nullable=True)
    deactivated_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Object (Organization) permissions
    assigned_object_ids = Column(ARRAY(UUID(as_uuid=True)), default=[], server_default='{}')  # Objects user has access to
    object_permissions = Column(JSONB, default={}, server_default='{}')  # Global object-related permissions

    # Metadata
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    assigned_contacts = relationship("Contact", back_populates="assigned_to", foreign_keys="Contact.assigned_to_id")
    sent_communications = relationship("Communication", back_populates="user")

    # Self-referential relationships for approval tracking
    approved_by = relationship("User", remote_side=[id], foreign_keys=[approved_by_user_id], backref="users_approved")
    deactivated_by = relationship("User", remote_side=[id], foreign_keys=[deactivated_by_user_id], backref="users_deactivated")

    # Indexes
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_role', 'role'),
        Index('idx_user_active', 'is_active'),
        Index('idx_user_approved', 'is_approved'),
    )

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

    @property
    def role_enum(self) -> UserRole:
        """Get role as UserRole enum"""
        if self.role == 'owner':
            return UserRole.OWNER
        elif self.role == 'admin':
            return UserRole.ADMIN
        else:
            return UserRole.USER

    @property
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return self.role in ('admin', 'owner')

    @property
    def is_owner(self) -> bool:
        """Check if user is the owner"""
        return self.role == 'owner'

    def can_manage_users(self) -> bool:
        """Check if user can manage other users"""
        return self.role in ('owner', 'admin')

    def can_view_sensitive_fields(self) -> bool:
        """Check if user can view sensitive contact fields"""
        return self.role == 'owner'
