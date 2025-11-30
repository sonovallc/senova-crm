"""Contact/Customer model - Core CRM entity"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Index, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class ContactStatus(str, enum.Enum):
    """Contact status in CRM pipeline"""
    LEAD = "LEAD"
    PROSPECT = "PROSPECT"
    CUSTOMER = "CUSTOMER"
    INACTIVE = "INACTIVE"


class ContactSource(str, enum.Enum):
    """Source of contact acquisition"""
    WEBSITE = "WEBSITE"
    REFERRAL = "REFERRAL"
    SOCIAL_MEDIA = "SOCIAL_MEDIA"
    PHONE_CALL = "PHONE_CALL"
    WALK_IN = "WALK_IN"
    EMAIL = "EMAIL"
    OTHER = "OTHER"


class Contact(Base):
    """Customer/Lead contact record with flexible custom fields"""

    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    # Note: email is nullable to support contacts with phone-only (lenient import strategy)
    # Partial unique index in database ensures uniqueness ONLY for ACTIVE contacts
    # This allows soft-deleted contacts to remain in DB without blocking re-imports
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), index=True)
    normalized_phone = Column(String(20), index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    company = Column(String(200))

    # Status and Classification
    status = Column(SQLEnum(ContactStatus), default=ContactStatus.LEAD, index=True)
    source = Column(SQLEnum(ContactSource), nullable=False)

    # CRM Assignment
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("pipelines.id"), nullable=True)
    pipeline_stage = Column(String(100))

    # Flexible Custom Fields (JSONB for medical aesthetics specific data)
    custom_fields = Column(JSONB, default=dict)
    # Example: {"preferred_treatments": ["Botox", "Fillers"], "skin_type": "combination", "allergies": []}

    # Tags for segmentation
    tags = Column(JSONB, default=list)
    # Example: ["vip", "interested-in-botox", "new-lead"]

    # AudienceLab Enrichment Data (behavioral insights)
    # CRITICAL: Never expose "AudienceLab" name in UI - use generic terms
    enrichment_data = Column(JSONB, default=dict)
    # Example: {"intent_score": 85, "interests": ["anti-aging", "skin-care"], "segments": ["high-intent"]}
    last_enriched_at = Column(DateTime(timezone=True))

    # Address (Single - for backward compatibility)
    street_address = Column(String(200))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100), default="USA")

    # Provider Fields - Dynamic contact enrichment data from data provider
    provider_uuid = Column(UUID(as_uuid=True))

    # Personal Information
    personal_address = Column(String(255))
    personal_city = Column(String(100))
    personal_state = Column(String(2))
    personal_zip = Column(String(10))
    personal_zip4 = Column(String(4))
    age_range = Column(String(20))
    children = Column(String(50))
    gender = Column(String(20))
    homeowner = Column(Boolean)
    married = Column(Boolean)
    net_worth = Column(String(50))
    income_range = Column(String(50))

    # Contact Numbers
    direct_number = Column(String(20))
    direct_number_dnc = Column(Boolean)
    direct_number_2 = Column(String(20))
    direct_number_2_dnc = Column(Boolean)
    direct_number_3 = Column(String(20))
    direct_number_3_dnc = Column(Boolean)
    direct_number_4 = Column(String(20))
    direct_number_4_dnc = Column(Boolean)
    direct_number_5 = Column(String(20))
    direct_number_5_dnc = Column(Boolean)

    mobile_phone = Column(String(20))
    mobile_phone_dnc = Column(Boolean)
    mobile_phone_2 = Column(String(20))
    mobile_phone_2_dnc = Column(Boolean)
    mobile_phone_3 = Column(String(20))
    mobile_phone_3_dnc = Column(Boolean)
    mobile_phone_4 = Column(String(20))
    mobile_phone_4_dnc = Column(Boolean)
    mobile_phone_5 = Column(String(20))
    mobile_phone_5_dnc = Column(Boolean)

    personal_phone = Column(String(20))
    personal_phone_dnc = Column(Boolean)
    personal_phone_2 = Column(String(20))
    personal_phone_2_dnc = Column(Boolean)
    personal_phone_3 = Column(String(20))
    personal_phone_3_dnc = Column(Boolean)
    personal_phone_4 = Column(String(20))
    personal_phone_4_dnc = Column(Boolean)
    personal_phone_5 = Column(String(20))
    personal_phone_5_dnc = Column(Boolean)

    # Mobile Phone overflow 6-30
    mobile_phone_6 = Column(String(20))
    mobile_phone_6_dnc = Column(Boolean)
    mobile_phone_7 = Column(String(20))
    mobile_phone_7_dnc = Column(Boolean)
    mobile_phone_8 = Column(String(20))
    mobile_phone_8_dnc = Column(Boolean)
    mobile_phone_9 = Column(String(20))
    mobile_phone_9_dnc = Column(Boolean)
    mobile_phone_10 = Column(String(20))
    mobile_phone_10_dnc = Column(Boolean)
    mobile_phone_11 = Column(String(20))
    mobile_phone_11_dnc = Column(Boolean)
    mobile_phone_12 = Column(String(20))
    mobile_phone_12_dnc = Column(Boolean)
    mobile_phone_13 = Column(String(20))
    mobile_phone_13_dnc = Column(Boolean)
    mobile_phone_14 = Column(String(20))
    mobile_phone_14_dnc = Column(Boolean)
    mobile_phone_15 = Column(String(20))
    mobile_phone_15_dnc = Column(Boolean)
    mobile_phone_16 = Column(String(20))
    mobile_phone_16_dnc = Column(Boolean)
    mobile_phone_17 = Column(String(20))
    mobile_phone_17_dnc = Column(Boolean)
    mobile_phone_18 = Column(String(20))
    mobile_phone_18_dnc = Column(Boolean)
    mobile_phone_19 = Column(String(20))
    mobile_phone_19_dnc = Column(Boolean)
    mobile_phone_20 = Column(String(20))
    mobile_phone_20_dnc = Column(Boolean)
    mobile_phone_21 = Column(String(20))
    mobile_phone_21_dnc = Column(Boolean)
    mobile_phone_22 = Column(String(20))
    mobile_phone_22_dnc = Column(Boolean)
    mobile_phone_23 = Column(String(20))
    mobile_phone_23_dnc = Column(Boolean)
    mobile_phone_24 = Column(String(20))
    mobile_phone_24_dnc = Column(Boolean)
    mobile_phone_25 = Column(String(20))
    mobile_phone_25_dnc = Column(Boolean)
    mobile_phone_26 = Column(String(20))
    mobile_phone_26_dnc = Column(Boolean)
    mobile_phone_27 = Column(String(20))
    mobile_phone_27_dnc = Column(Boolean)
    mobile_phone_28 = Column(String(20))
    mobile_phone_28_dnc = Column(Boolean)
    mobile_phone_29 = Column(String(20))
    mobile_phone_29_dnc = Column(Boolean)
    mobile_phone_30 = Column(String(20))
    mobile_phone_30_dnc = Column(Boolean)

    # Personal Phone overflow 6-30
    personal_phone_6 = Column(String(20))
    personal_phone_6_dnc = Column(Boolean)
    personal_phone_7 = Column(String(20))
    personal_phone_7_dnc = Column(Boolean)
    personal_phone_8 = Column(String(20))
    personal_phone_8_dnc = Column(Boolean)
    personal_phone_9 = Column(String(20))
    personal_phone_9_dnc = Column(Boolean)
    personal_phone_10 = Column(String(20))
    personal_phone_10_dnc = Column(Boolean)
    personal_phone_11 = Column(String(20))
    personal_phone_11_dnc = Column(Boolean)
    personal_phone_12 = Column(String(20))
    personal_phone_12_dnc = Column(Boolean)
    personal_phone_13 = Column(String(20))
    personal_phone_13_dnc = Column(Boolean)
    personal_phone_14 = Column(String(20))
    personal_phone_14_dnc = Column(Boolean)
    personal_phone_15 = Column(String(20))
    personal_phone_15_dnc = Column(Boolean)
    personal_phone_16 = Column(String(20))
    personal_phone_16_dnc = Column(Boolean)
    personal_phone_17 = Column(String(20))
    personal_phone_17_dnc = Column(Boolean)
    personal_phone_18 = Column(String(20))
    personal_phone_18_dnc = Column(Boolean)
    personal_phone_19 = Column(String(20))
    personal_phone_19_dnc = Column(Boolean)
    personal_phone_20 = Column(String(20))
    personal_phone_20_dnc = Column(Boolean)
    personal_phone_21 = Column(String(20))
    personal_phone_21_dnc = Column(Boolean)
    personal_phone_22 = Column(String(20))
    personal_phone_22_dnc = Column(Boolean)
    personal_phone_23 = Column(String(20))
    personal_phone_23_dnc = Column(Boolean)
    personal_phone_24 = Column(String(20))
    personal_phone_24_dnc = Column(Boolean)
    personal_phone_25 = Column(String(20))
    personal_phone_25_dnc = Column(Boolean)
    personal_phone_26 = Column(String(20))
    personal_phone_26_dnc = Column(Boolean)
    personal_phone_27 = Column(String(20))
    personal_phone_27_dnc = Column(Boolean)
    personal_phone_28 = Column(String(20))
    personal_phone_28_dnc = Column(Boolean)
    personal_phone_29 = Column(String(20))
    personal_phone_29_dnc = Column(Boolean)
    personal_phone_30 = Column(String(20))
    personal_phone_30_dnc = Column(Boolean)

    # Direct Number overflow 6-30
    direct_number_6 = Column(String(20))
    direct_number_6_dnc = Column(Boolean)
    direct_number_7 = Column(String(20))
    direct_number_7_dnc = Column(Boolean)
    direct_number_8 = Column(String(20))
    direct_number_8_dnc = Column(Boolean)
    direct_number_9 = Column(String(20))
    direct_number_9_dnc = Column(Boolean)
    direct_number_10 = Column(String(20))
    direct_number_10_dnc = Column(Boolean)
    direct_number_11 = Column(String(20))
    direct_number_11_dnc = Column(Boolean)
    direct_number_12 = Column(String(20))
    direct_number_12_dnc = Column(Boolean)
    direct_number_13 = Column(String(20))
    direct_number_13_dnc = Column(Boolean)
    direct_number_14 = Column(String(20))
    direct_number_14_dnc = Column(Boolean)
    direct_number_15 = Column(String(20))
    direct_number_15_dnc = Column(Boolean)
    direct_number_16 = Column(String(20))
    direct_number_16_dnc = Column(Boolean)
    direct_number_17 = Column(String(20))
    direct_number_17_dnc = Column(Boolean)
    direct_number_18 = Column(String(20))
    direct_number_18_dnc = Column(Boolean)
    direct_number_19 = Column(String(20))
    direct_number_19_dnc = Column(Boolean)
    direct_number_20 = Column(String(20))
    direct_number_20_dnc = Column(Boolean)
    direct_number_21 = Column(String(20))
    direct_number_21_dnc = Column(Boolean)
    direct_number_22 = Column(String(20))
    direct_number_22_dnc = Column(Boolean)
    direct_number_23 = Column(String(20))
    direct_number_23_dnc = Column(Boolean)
    direct_number_24 = Column(String(20))
    direct_number_24_dnc = Column(Boolean)
    direct_number_25 = Column(String(20))
    direct_number_25_dnc = Column(Boolean)
    direct_number_26 = Column(String(20))
    direct_number_26_dnc = Column(Boolean)
    direct_number_27 = Column(String(20))
    direct_number_27_dnc = Column(Boolean)
    direct_number_28 = Column(String(20))
    direct_number_28_dnc = Column(Boolean)
    direct_number_29 = Column(String(20))
    direct_number_29_dnc = Column(Boolean)
    direct_number_30 = Column(String(20))
    direct_number_30_dnc = Column(Boolean)

    # Company Phone overflow 2-30
    company_phone_2 = Column(String(20))
    company_phone_2_dnc = Column(Boolean)
    company_phone_3 = Column(String(20))
    company_phone_3_dnc = Column(Boolean)
    company_phone_4 = Column(String(20))
    company_phone_4_dnc = Column(Boolean)
    company_phone_5 = Column(String(20))
    company_phone_5_dnc = Column(Boolean)
    company_phone_6 = Column(String(20))
    company_phone_6_dnc = Column(Boolean)
    company_phone_7 = Column(String(20))
    company_phone_7_dnc = Column(Boolean)
    company_phone_8 = Column(String(20))
    company_phone_8_dnc = Column(Boolean)
    company_phone_9 = Column(String(20))
    company_phone_9_dnc = Column(Boolean)
    company_phone_10 = Column(String(20))
    company_phone_10_dnc = Column(Boolean)
    company_phone_11 = Column(String(20))
    company_phone_11_dnc = Column(Boolean)
    company_phone_12 = Column(String(20))
    company_phone_12_dnc = Column(Boolean)
    company_phone_13 = Column(String(20))
    company_phone_13_dnc = Column(Boolean)
    company_phone_14 = Column(String(20))
    company_phone_14_dnc = Column(Boolean)
    company_phone_15 = Column(String(20))
    company_phone_15_dnc = Column(Boolean)
    company_phone_16 = Column(String(20))
    company_phone_16_dnc = Column(Boolean)
    company_phone_17 = Column(String(20))
    company_phone_17_dnc = Column(Boolean)
    company_phone_18 = Column(String(20))
    company_phone_18_dnc = Column(Boolean)
    company_phone_19 = Column(String(20))
    company_phone_19_dnc = Column(Boolean)
    company_phone_20 = Column(String(20))
    company_phone_20_dnc = Column(Boolean)
    company_phone_21 = Column(String(20))
    company_phone_21_dnc = Column(Boolean)
    company_phone_22 = Column(String(20))
    company_phone_22_dnc = Column(Boolean)
    company_phone_23 = Column(String(20))
    company_phone_23_dnc = Column(Boolean)
    company_phone_24 = Column(String(20))
    company_phone_24_dnc = Column(Boolean)
    company_phone_25 = Column(String(20))
    company_phone_25_dnc = Column(Boolean)
    company_phone_26 = Column(String(20))
    company_phone_26_dnc = Column(Boolean)
    company_phone_27 = Column(String(20))
    company_phone_27_dnc = Column(Boolean)
    company_phone_28 = Column(String(20))
    company_phone_28_dnc = Column(Boolean)
    company_phone_29 = Column(String(20))
    company_phone_29_dnc = Column(Boolean)
    company_phone_30 = Column(String(20))
    company_phone_30_dnc = Column(Boolean)

    valid_phones = Column(Text)

    # Email Information
    business_email = Column(String(255))
    personal_email = Column(String(255))  # Base field for personal_email overflow
    personal_emails = Column(Text)
    personal_verified_email = Column(String(255))  # Base field for personal_verified_email overflow
    personal_verified_emails = Column(Text)
    business_verified_email = Column(String(255))  # Base field for business_verified_email overflow
    business_verified_emails = Column(Text)
    sha256_personal_email = Column(String(64))
    sha256_business_email = Column(String(64))

    # Personal Email overflow 1-30
    personal_email_1 = Column(String(255))
    personal_email_2 = Column(String(255))
    personal_email_3 = Column(String(255))
    personal_email_4 = Column(String(255))
    personal_email_5 = Column(String(255))
    personal_email_6 = Column(String(255))
    personal_email_7 = Column(String(255))
    personal_email_8 = Column(String(255))
    personal_email_9 = Column(String(255))
    personal_email_10 = Column(String(255))
    personal_email_11 = Column(String(255))
    personal_email_12 = Column(String(255))
    personal_email_13 = Column(String(255))
    personal_email_14 = Column(String(255))
    personal_email_15 = Column(String(255))
    personal_email_16 = Column(String(255))
    personal_email_17 = Column(String(255))
    personal_email_18 = Column(String(255))
    personal_email_19 = Column(String(255))
    personal_email_20 = Column(String(255))
    personal_email_21 = Column(String(255))
    personal_email_22 = Column(String(255))
    personal_email_23 = Column(String(255))
    personal_email_24 = Column(String(255))
    personal_email_25 = Column(String(255))
    personal_email_26 = Column(String(255))
    personal_email_27 = Column(String(255))
    personal_email_28 = Column(String(255))
    personal_email_29 = Column(String(255))
    personal_email_30 = Column(String(255))

    # Business Email overflow 2-30
    business_email_2 = Column(String(255))
    business_email_3 = Column(String(255))
    business_email_4 = Column(String(255))
    business_email_5 = Column(String(255))
    business_email_6 = Column(String(255))
    business_email_7 = Column(String(255))
    business_email_8 = Column(String(255))
    business_email_9 = Column(String(255))
    business_email_10 = Column(String(255))
    business_email_11 = Column(String(255))
    business_email_12 = Column(String(255))
    business_email_13 = Column(String(255))
    business_email_14 = Column(String(255))
    business_email_15 = Column(String(255))
    business_email_16 = Column(String(255))
    business_email_17 = Column(String(255))
    business_email_18 = Column(String(255))
    business_email_19 = Column(String(255))
    business_email_20 = Column(String(255))
    business_email_21 = Column(String(255))
    business_email_22 = Column(String(255))
    business_email_23 = Column(String(255))
    business_email_24 = Column(String(255))
    business_email_25 = Column(String(255))
    business_email_26 = Column(String(255))
    business_email_27 = Column(String(255))
    business_email_28 = Column(String(255))
    business_email_29 = Column(String(255))
    business_email_30 = Column(String(255))

    # SHA256 Personal Email overflow 1-30
    sha256_personal_email_1 = Column(String(64))
    sha256_personal_email_2 = Column(String(64))
    sha256_personal_email_3 = Column(String(64))
    sha256_personal_email_4 = Column(String(64))
    sha256_personal_email_5 = Column(String(64))
    sha256_personal_email_6 = Column(String(64))
    sha256_personal_email_7 = Column(String(64))
    sha256_personal_email_8 = Column(String(64))
    sha256_personal_email_9 = Column(String(64))
    sha256_personal_email_10 = Column(String(64))
    sha256_personal_email_11 = Column(String(64))
    sha256_personal_email_12 = Column(String(64))
    sha256_personal_email_13 = Column(String(64))
    sha256_personal_email_14 = Column(String(64))
    sha256_personal_email_15 = Column(String(64))
    sha256_personal_email_16 = Column(String(64))
    sha256_personal_email_17 = Column(String(64))
    sha256_personal_email_18 = Column(String(64))
    sha256_personal_email_19 = Column(String(64))
    sha256_personal_email_20 = Column(String(64))
    sha256_personal_email_21 = Column(String(64))
    sha256_personal_email_22 = Column(String(64))
    sha256_personal_email_23 = Column(String(64))
    sha256_personal_email_24 = Column(String(64))
    sha256_personal_email_25 = Column(String(64))
    sha256_personal_email_26 = Column(String(64))
    sha256_personal_email_27 = Column(String(64))
    sha256_personal_email_28 = Column(String(64))
    sha256_personal_email_29 = Column(String(64))
    sha256_personal_email_30 = Column(String(64))

    # SHA256 Business Email overflow 1-30
    sha256_business_email_1 = Column(String(64))
    sha256_business_email_2 = Column(String(64))
    sha256_business_email_3 = Column(String(64))
    sha256_business_email_4 = Column(String(64))
    sha256_business_email_5 = Column(String(64))
    sha256_business_email_6 = Column(String(64))
    sha256_business_email_7 = Column(String(64))
    sha256_business_email_8 = Column(String(64))
    sha256_business_email_9 = Column(String(64))
    sha256_business_email_10 = Column(String(64))
    sha256_business_email_11 = Column(String(64))
    sha256_business_email_12 = Column(String(64))
    sha256_business_email_13 = Column(String(64))
    sha256_business_email_14 = Column(String(64))
    sha256_business_email_15 = Column(String(64))
    sha256_business_email_16 = Column(String(64))
    sha256_business_email_17 = Column(String(64))
    sha256_business_email_18 = Column(String(64))
    sha256_business_email_19 = Column(String(64))
    sha256_business_email_20 = Column(String(64))
    sha256_business_email_21 = Column(String(64))
    sha256_business_email_22 = Column(String(64))
    sha256_business_email_23 = Column(String(64))
    sha256_business_email_24 = Column(String(64))
    sha256_business_email_25 = Column(String(64))
    sha256_business_email_26 = Column(String(64))
    sha256_business_email_27 = Column(String(64))
    sha256_business_email_28 = Column(String(64))
    sha256_business_email_29 = Column(String(64))
    sha256_business_email_30 = Column(String(64))

    # Personal Verified Email overflow 2-30
    personal_verified_email_2 = Column(String(255))
    personal_verified_email_3 = Column(String(255))
    personal_verified_email_4 = Column(String(255))
    personal_verified_email_5 = Column(String(255))
    personal_verified_email_6 = Column(String(255))
    personal_verified_email_7 = Column(String(255))
    personal_verified_email_8 = Column(String(255))
    personal_verified_email_9 = Column(String(255))
    personal_verified_email_10 = Column(String(255))
    personal_verified_email_11 = Column(String(255))
    personal_verified_email_12 = Column(String(255))
    personal_verified_email_13 = Column(String(255))
    personal_verified_email_14 = Column(String(255))
    personal_verified_email_15 = Column(String(255))
    personal_verified_email_16 = Column(String(255))
    personal_verified_email_17 = Column(String(255))
    personal_verified_email_18 = Column(String(255))
    personal_verified_email_19 = Column(String(255))
    personal_verified_email_20 = Column(String(255))
    personal_verified_email_21 = Column(String(255))
    personal_verified_email_22 = Column(String(255))
    personal_verified_email_23 = Column(String(255))
    personal_verified_email_24 = Column(String(255))
    personal_verified_email_25 = Column(String(255))
    personal_verified_email_26 = Column(String(255))
    personal_verified_email_27 = Column(String(255))
    personal_verified_email_28 = Column(String(255))
    personal_verified_email_29 = Column(String(255))
    personal_verified_email_30 = Column(String(255))

    # Business Verified Email overflow 2-30
    business_verified_email_2 = Column(String(255))
    business_verified_email_3 = Column(String(255))
    business_verified_email_4 = Column(String(255))
    business_verified_email_5 = Column(String(255))
    business_verified_email_6 = Column(String(255))
    business_verified_email_7 = Column(String(255))
    business_verified_email_8 = Column(String(255))
    business_verified_email_9 = Column(String(255))
    business_verified_email_10 = Column(String(255))
    business_verified_email_11 = Column(String(255))
    business_verified_email_12 = Column(String(255))
    business_verified_email_13 = Column(String(255))
    business_verified_email_14 = Column(String(255))
    business_verified_email_15 = Column(String(255))
    business_verified_email_16 = Column(String(255))
    business_verified_email_17 = Column(String(255))
    business_verified_email_18 = Column(String(255))
    business_verified_email_19 = Column(String(255))
    business_verified_email_20 = Column(String(255))
    business_verified_email_21 = Column(String(255))
    business_verified_email_22 = Column(String(255))
    business_verified_email_23 = Column(String(255))
    business_verified_email_24 = Column(String(255))
    business_verified_email_25 = Column(String(255))
    business_verified_email_26 = Column(String(255))
    business_verified_email_27 = Column(String(255))
    business_verified_email_28 = Column(String(255))
    business_verified_email_29 = Column(String(255))
    business_verified_email_30 = Column(String(255))

    # Professional Information
    job_title = Column(String(255))
    headline = Column(Text)
    department = Column(String(100))
    seniority_level = Column(String(50))
    inferred_years_experience = Column(Integer)  # Fixed: Changed from String(20) to Integer to match database schema
    company_name_history = Column(Text)
    job_title_history = Column(Text)
    education_history = Column(Text)
    skills = Column(Text)

    # Company Information
    company_address = Column(String(255))
    company_description = Column(Text)
    company_domain = Column(String(255))
    company_employee_count = Column(Integer)  # Fixed: Changed from String(50) to Integer to match database schema
    company_linkedin_url = Column(String(500))
    company_name = Column(String(255))
    company_phone = Column(String(20))
    company_revenue = Column(Integer)  # Fixed: Changed from String(50) to Integer to match database schema
    company_sic = Column(String(10))
    company_naics = Column(String(10))
    company_city = Column(String(100))
    company_state = Column(String(2))
    company_zip = Column(String(10))
    company_industry = Column(String(100))

    # Social Media
    linkedin_url = Column(String(500))
    facebook_url = Column(String(500))
    twitter_url = Column(String(500))

    # Skiptrace Information
    skiptrace_match_score = Column(Integer)  # Fixed: Changed from String(20) to Integer to match database schema
    skiptrace_name = Column(String(255))
    skiptrace_address = Column(String(255))
    skiptrace_city = Column(String(100))
    skiptrace_state = Column(String(2))
    skiptrace_zip = Column(String(10))
    skiptrace_landline_numbers = Column(Text)
    skiptrace_wireless_numbers = Column(Text)
    skiptrace_credit_rating = Column(String(20))
    skiptrace_dnc = Column(Boolean)
    skiptrace_exact_age = Column(Integer)  # Fixed: Changed from String(20) to Integer to match database schema
    skiptrace_ethnic_code = Column(String(10))
    skiptrace_language_code = Column(String(10))
    skiptrace_ip = Column(String(45))
    skiptrace_b2b_address = Column(String(255))
    skiptrace_b2b_phone = Column(String(20))
    skiptrace_b2b_source = Column(String(100))
    skiptrace_b2b_website = Column(String(255))

    # Additional CRM Fields
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    creation_source = Column(String(100))
    initial_notes = Column(Text)
    interests = Column(Text)
    lead_score = Column(Integer)  # Fixed: Changed from String(20) to Integer to match database schema
    referral_source = Column(String(255))
    social_connections = Column(Integer)  # Fixed: Changed from Text to Integer to match database schema
    source_form_id = Column(String(100))
    source_form_name = Column(String(255))
    utm_source = Column(String(100))
    utm_medium = Column(String(100))
    utm_campaign = Column(String(255))
    utm_term = Column(String(255))
    utm_content = Column(String(255))

    # Enhanced Contact Fields (Multiple Values)
    phones = Column(JSONB, default=list)
    # Example: [{"type": "mobile", "number": "555-1234"}, {"type": "work", "number": "555-5678"}]

    addresses = Column(JSONB, default=list)
    # Example: [{"type": "home", "street": "123 Main St", "city": "Boston", "state": "MA", "zip": "02101", "country": "USA"}]

    websites = Column(JSONB, default=list)
    # Example: ["https://example.com", "https://business.com"]

    # Overflow Data - Stores additional comma-delimited values from imports
    overflow_data = Column(JSONB, default=dict, server_default='{}')
    # Example: {"email": ["email2@test.com", "email3@test.com"], "mobile_phone": ["+19492222222", "+19493333333"]}
    # When CSV has "email1@test.com, email2@test.com, email3@test.com":
    # - email field gets "email1@test.com" (first value)
    # - overflow_data['email'] gets ["email2@test.com", "email3@test.com"] (additional values)

    # Email Marketing Status
    unsubscribed = Column(Boolean, default=False, nullable=False, index=True)  # Email unsubscribe status
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)  # When user unsubscribed

    # Object (Organization) relationships
    object_ids = Column(ARRAY(UUID(as_uuid=True)), default=[], server_default='{}')  # Array of associated object IDs
    primary_object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id", ondelete="SET NULL"), nullable=True)  # Primary organization
    assigned_user_ids = Column(ARRAY(UUID(as_uuid=True)), default=[], server_default='{}')  # Users who can access this contact

    # Metadata
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_contacts")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    primary_object = relationship("Object", foreign_keys=[primary_object_id], backref="primary_contacts")
    communications = relationship("Communication", back_populates="contact", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="contact", cascade="all, delete-orphan")
    workflow_executions = relationship("WorkflowExecution", back_populates="contact", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_contact_email', 'email'),
        Index('idx_contact_phone', 'phone'),
        Index('idx_contact_assigned', 'assigned_to_id', 'status'),
        Index('idx_contact_pipeline', 'pipeline_id', 'pipeline_stage'),
        Index('idx_contact_status', 'status'),
        Index('idx_contact_created', 'created_at'),
        Index('idx_contact_is_deleted', 'is_deleted'),
    )

    def __repr__(self):
        return f"<Contact {self.email} ({self.status})>"

    @property
    def full_name(self) -> str:
        """Get full name from first and last name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return self.email

    @property
    def needs_enrichment(self) -> bool:
        """Check if contact needs data enrichment (> 7 days old or never enriched)"""
        if not self.last_enriched_at:
            return True
        from datetime import datetime, timezone
        days_since = (datetime.now(timezone.utc) - self.last_enriched_at).days
        return days_since >= 7


class CSVDuplicateCache(Base):
    """Cache for CSV duplicate detection decisions"""

    __tablename__ = "csv_duplicate_cache"

    id = Column(Integer, primary_key=True)
    validation_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    duplicate_group_id = Column(String(255), nullable=False, index=True)
    duplicate_type = Column(String(20), nullable=False)  # 'internal' or 'external'
    duplicate_field = Column(String(100), nullable=False)
    duplicate_value = Column(Text, nullable=False)
    csv_row_index = Column(Integer, nullable=True)
    existing_contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    user_decision = Column(String(50), nullable=True)
    shown_to_user = Column(Boolean, default=True, nullable=False)
    cross_column_duplicate = Column(Boolean, default=False, nullable=False)
    cross_column_fields = Column(Text, nullable=True)
    hash_match_duplicate = Column(Boolean, default=False, nullable=False)
    data_completeness_score = Column(Integer, nullable=True)
    recommendation = Column(String(50), nullable=True)
    recommendation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    existing_contact = relationship("Contact", foreign_keys=[existing_contact_id])

    # Indexes
    __table_args__ = (
        Index('idx_csv_duplicate_cache_validation_id', 'validation_id'),
        Index('idx_csv_duplicate_cache_group_id', 'duplicate_group_id'),
        Index('idx_csv_duplicate_cache_row_index', 'csv_row_index'),
        Index('idx_csv_duplicate_cache_shown_to_user', 'shown_to_user'),
    )

    def __repr__(self):
        return f"<CSVDuplicateCache {self.duplicate_field}={self.duplicate_value} ({self.duplicate_type})>"
