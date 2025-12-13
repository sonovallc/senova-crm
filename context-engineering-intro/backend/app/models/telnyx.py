"""
Telnyx SMS/MMS integration models

Models for:
- Tenant-level Telnyx API settings
- Phone number inventory
- 10DLC Brand registration
- 10DLC Campaign registration
"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class TelnyxBrandStatus(str, enum.Enum):
    """Status of 10DLC brand registration"""
    DRAFT = "draft"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    FAILED = "failed"


class TelnyxCampaignStatus(str, enum.Enum):
    """Status of 10DLC campaign registration"""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class TelnyxPhoneNumberStatus(str, enum.Enum):
    """Status of phone number"""
    ACTIVE = "active"
    PENDING = "pending"
    RELEASED = "released"
    FAILED = "failed"


class ObjectTelnyxSettings(Base):
    """
    Telnyx API settings per Object (tenant).

    Stores encrypted API keys and configuration for Telnyx integration.
    Each Object can have its own Telnyx account.
    """
    __tablename__ = "object_telnyx_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to Object (tenant)
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"),
                      nullable=False, index=True)

    # Telnyx API credentials (encrypted)
    api_key = Column(Text, nullable=False)  # Encrypted using encryption_key

    # Messaging Profile ID (required for sending)
    messaging_profile_id = Column(String(255), nullable=True)

    # Webhook configuration
    webhook_secret = Column(String(255), nullable=True)  # For signature verification

    # Status
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
                       nullable=False)

    # Relationships
    object = relationship("Object", backref="telnyx_settings")
    phone_numbers = relationship("TelnyxPhoneNumber", back_populates="telnyx_settings",
                                cascade="all, delete-orphan")
    brands = relationship("TelnyxBrand", back_populates="telnyx_settings",
                         cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_telnyx_settings_object', 'object_id'),
        Index('idx_telnyx_settings_active', 'is_active'),
    )

    def __repr__(self):
        return f"<ObjectTelnyxSettings object_id={self.object_id}>"


class TelnyxPhoneNumber(Base):
    """
    Phone numbers owned via Telnyx.

    Tracks phone numbers purchased through Telnyx API for SMS/MMS.
    """
    __tablename__ = "telnyx_phone_numbers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to Object (tenant)
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"),
                      nullable=False, index=True)

    # Link to Telnyx settings
    telnyx_settings_id = Column(UUID(as_uuid=True),
                                ForeignKey("object_telnyx_settings.id", ondelete="CASCADE"),
                                nullable=False, index=True)

    # Phone number details
    phone_number = Column(String(20), nullable=False, unique=True)  # E.164 format: +1234567890
    external_id = Column(String(255), nullable=True, index=True)  # Telnyx phone number ID

    # Telnyx-specific fields
    messaging_profile_id = Column(String(255), nullable=True)  # Assigned messaging profile
    phone_number_type = Column(String(50), nullable=True)  # local, toll-free, etc.

    # Capabilities (what this number can do)
    capabilities = Column(JSONB, default=dict)
    # Example: {"sms": {"domestic_two_way": true}, "mms": {"domestic_two_way": true}, "voice": true}

    # 10DLC campaign assignment
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("telnyx_campaigns.id", ondelete="SET NULL"),
                        nullable=True, index=True)

    # Display name for UI
    friendly_name = Column(String(255), nullable=True)

    # Status
    status = Column(SQLEnum(TelnyxPhoneNumberStatus), default=TelnyxPhoneNumberStatus.PENDING)

    # Timestamps
    purchased_at = Column(DateTime(timezone=True), nullable=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
                       nullable=False)

    # Relationships
    object = relationship("Object", backref="telnyx_phone_numbers")
    telnyx_settings = relationship("ObjectTelnyxSettings", back_populates="phone_numbers")
    campaign = relationship("TelnyxCampaign", back_populates="phone_numbers")
    sms_profiles = relationship("SMSSendingProfile", back_populates="phone_number",
                               cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_phone_number_object', 'object_id'),
        Index('idx_phone_number_status', 'status'),
        Index('idx_phone_number_campaign', 'campaign_id'),
    )

    def __repr__(self):
        return f"<TelnyxPhoneNumber {self.phone_number}>"


class TelnyxBrand(Base):
    """
    10DLC Brand registration for A2P SMS compliance.

    Required for sending SMS in the US. Brands must be vetted
    before campaigns can be created.
    """
    __tablename__ = "telnyx_brands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to Object (tenant)
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="CASCADE"),
                      nullable=False, index=True)

    # Link to Telnyx settings
    telnyx_settings_id = Column(UUID(as_uuid=True),
                                ForeignKey("object_telnyx_settings.id", ondelete="CASCADE"),
                                nullable=False, index=True)

    # Telnyx external ID
    external_brand_id = Column(String(255), nullable=True, index=True)  # From Telnyx API

    # Company Information (required for registration)
    company_name = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=True)  # Shown to recipients
    ein = Column(String(20), nullable=True)  # Employer Identification Number

    # Contact Information
    website = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)

    # Address
    street = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(2), nullable=False, default="US")  # ISO country code

    # Business Details
    vertical = Column(String(100), nullable=True)  # Industry vertical
    entity_type = Column(String(50), nullable=True)  # PRIVATE, PUBLIC, NON_PROFIT, GOVERNMENT
    stock_symbol = Column(String(10), nullable=True)  # If public company
    stock_exchange = Column(String(50), nullable=True)

    # Registration Status
    status = Column(SQLEnum(TelnyxBrandStatus), default=TelnyxBrandStatus.DRAFT)

    # Vetting Results
    vetting_status = Column(String(50), nullable=True)
    vetting_score = Column(String(10), nullable=True)  # e.g., "A", "B", "C"
    vetting_date = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Raw response from Telnyx (for debugging)
    provider_metadata = Column(JSONB, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
                       nullable=False)

    # Relationships
    object = relationship("Object", backref="telnyx_brands")
    telnyx_settings = relationship("ObjectTelnyxSettings", back_populates="brands")
    campaigns = relationship("TelnyxCampaign", back_populates="brand",
                           cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_brand_object', 'object_id'),
        Index('idx_brand_status', 'status'),
        Index('idx_brand_external', 'external_brand_id'),
    )

    def __repr__(self):
        return f"<TelnyxBrand {self.company_name}>"


class TelnyxCampaign(Base):
    """
    10DLC Campaign registration for A2P SMS compliance.

    Campaigns are tied to brands and define the use case for messaging.
    Phone numbers must be assigned to approved campaigns.
    """
    __tablename__ = "telnyx_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to Brand
    brand_id = Column(UUID(as_uuid=True), ForeignKey("telnyx_brands.id", ondelete="CASCADE"),
                     nullable=False, index=True)

    # Telnyx external ID
    external_campaign_id = Column(String(255), nullable=True, index=True)  # From Telnyx API

    # Campaign Details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Use Case (required)
    use_case = Column(String(100), nullable=False)
    # Options: ACCOUNT_NOTIFICATION, CUSTOMER_CARE, DELIVERY_NOTIFICATION,
    # FRAUD_ALERT, HIGHER_EDUCATION, MARKETING, MIXED, POLLING_VOTING,
    # PUBLIC_SERVICE_ANNOUNCEMENT, SECURITY_ALERT, 2FA

    # Sub Use Case (optional, more specific)
    sub_use_case = Column(String(100), nullable=True)

    # Sample Messages (required for review)
    sample_messages = Column(JSONB, default=list)
    # Example: ["Your order has shipped!", "Your verification code is {code}"]

    # Keywords configuration
    opt_in_keywords = Column(JSONB, default=list)  # e.g., ["START", "YES"]
    opt_out_keywords = Column(JSONB, default=list)  # e.g., ["STOP", "UNSUBSCRIBE"]
    help_keywords = Column(JSONB, default=list)  # e.g., ["HELP", "INFO"]

    # Message Templates
    opt_in_message = Column(Text, nullable=True)  # Sent when user opts in
    opt_out_message = Column(Text, nullable=True)  # Sent when user opts out
    help_message = Column(Text, nullable=True)  # Sent when user texts HELP

    # Campaign Attributes
    subscriber_optin = Column(Boolean, default=True)  # Opt-in required?
    subscriber_optout = Column(Boolean, default=True)  # Opt-out available?
    subscriber_help = Column(Boolean, default=True)  # Help available?
    number_pool = Column(Boolean, default=False)  # Multiple numbers in campaign?
    direct_lending = Column(Boolean, default=False)  # Direct lending messages?
    embedded_link = Column(Boolean, default=False)  # Links in messages?
    embedded_phone = Column(Boolean, default=False)  # Phone numbers in messages?
    affiliate_marketing = Column(Boolean, default=False)  # Affiliate marketing?
    age_gated = Column(Boolean, default=False)  # Age-restricted content?

    # Status
    status = Column(SQLEnum(TelnyxCampaignStatus), default=TelnyxCampaignStatus.DRAFT)
    rejection_reason = Column(Text, nullable=True)

    # Raw response from Telnyx (for debugging)
    provider_metadata = Column(JSONB, default=dict)

    # Timestamps
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
                       nullable=False)

    # Relationships
    brand = relationship("TelnyxBrand", back_populates="campaigns")
    phone_numbers = relationship("TelnyxPhoneNumber", back_populates="campaign")

    # Indexes
    __table_args__ = (
        Index('idx_campaign_brand', 'brand_id'),
        Index('idx_campaign_status', 'status'),
        Index('idx_campaign_external', 'external_campaign_id'),
    )

    def __repr__(self):
        return f"<TelnyxCampaign {self.name}>"
