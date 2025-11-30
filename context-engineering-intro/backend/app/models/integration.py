"""Integration model for encrypted API credentials storage"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class IntegrationType(str, enum.Enum):
    """Types of third-party integrations"""
    BANDWIDTH = "bandwidth"
    MAILGUN = "mailgun"
    STRIPE = "stripe"
    SQUARE = "square"
    PAYPAL = "paypal"
    CASH_APP = "cashapp"
    AUDIENCELAB = "audiencelab"
    CLOSEBOT = "closebot"
    CLOUDFLARE = "cloudflare"
    HETZNER = "hetzner"


class Integration(Base):
    """
    Encrypted API credentials storage for third-party integrations

    CRITICAL: Credentials are encrypted using Fernet encryption
    """

    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    type = Column(SQLEnum(IntegrationType), unique=True, nullable=False)

    # Encrypted Credentials (use Fernet encryption from cryptography library)
    credentials_encrypted = Column(Text, nullable=False)
    # Decrypted structure (example):
    # {
    #   "api_key": "...",
    #   "api_secret": "...",
    #   "account_id": "...",
    #   "username": "...",
    #   "password": "..."
    # }

    # Configuration (non-sensitive settings)
    config = Column(JSONB, default=dict)
    # Example: {"enabled": true, "webhook_url": "https://...", "from_number": "+1..."}

    # Status
    is_active = Column(Boolean, default=False)
    last_verified_at = Column(DateTime(timezone=True))
    verification_error = Column(Text)

    # Usage Statistics (for monitoring and billing)
    api_calls_today = Column(Integer, default=0)
    api_calls_month = Column(Integer, default=0)
    last_api_call_at = Column(DateTime(timezone=True))

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_integration_type', 'type'),
        Index('idx_integration_active', 'is_active'),
    )

    def __repr__(self):
        return f"<Integration {self.type} - {'active' if self.is_active else 'inactive'}>"
