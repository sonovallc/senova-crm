"""Contact Pydantic schemas"""

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.models.contact import ContactStatus, ContactSource


class PhoneNumber(BaseModel):
    """Phone number with type label"""
    type: str  # e.g., "mobile", "home", "work", "other", or custom
    number: str


class Address(BaseModel):
    """Full address with type label"""
    type: str  # e.g., "home", "work", or custom
    street: str
    city: str
    state: str
    zip: str
    country: Optional[str] = "USA"


class ContactBase(BaseModel):
    """Base contact schema"""
    # Use str instead of EmailStr for lenient validation - CRM systems need to preserve
    # slightly malformed emails (e.g., "name.@domain.com") that users provide
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    status: Optional[ContactStatus] = ContactStatus.LEAD
    source: Optional[ContactSource] = None

    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        """Accept both uppercase and lowercase status values"""
        if v is None:
            return ContactStatus.LEAD
        if isinstance(v, str):
            v_upper = v.upper()
            # Map to enum value
            if v_upper in ContactStatus.__members__:
                return ContactStatus(v_upper)
        return v


class ContactCreate(ContactBase):
    """Schema for creating contact"""
    # Override source to accept flexible string values from frontend
    source: str = "website"  # Will be mapped to enum in endpoint handler
    assigned_to_id: Optional[uuid.UUID] = None
    object_id: Optional[uuid.UUID] = None  # For assigning contact to an object from public forms
    custom_fields: Dict[str, Any] = {}
    tags: List[str] = []
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: str = "USA"
    notes: Optional[str] = None

    # Enhanced contact fields (multiple values)
    phones: List[PhoneNumber] = []
    addresses: List[Address] = []
    websites: List[str] = []


class ContactUpdate(BaseModel):
    """Schema for updating contact - allows dynamic provider fields"""
    email: Optional[str] = None  # CRITICAL: Was missing - email updates now work!
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    status: Optional[ContactStatus] = None
    assigned_to_id: Optional[uuid.UUID] = None
    pipeline_id: Optional[uuid.UUID] = None
    pipeline_stage: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None  # Added: Ensures country updates work
    notes: Optional[str] = None

    # Enhanced contact fields (multiple values)
    phones: Optional[List[PhoneNumber]] = None
    addresses: Optional[List[Address]] = None
    websites: Optional[List[str]] = None

    # Allow extra fields for dynamic provider fields (company_name, personal_address, etc.)
    model_config = {"extra": "allow"}

    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        """Accept both uppercase and lowercase status values"""
        if v is None:
            return None
        if isinstance(v, str):
            v_upper = v.upper()
            # Map to enum value
            if v_upper in ContactStatus.__members__:
                return ContactStatus(v_upper)
        return v


class ContactResponse(ContactBase):
    """Schema for contact response"""
    id: uuid.UUID
    assigned_to_id: Optional[uuid.UUID] = None
    pipeline_id: Optional[uuid.UUID] = None
    pipeline_stage: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []
    enrichment_data: Optional[Dict[str, Any]] = {}
    last_enriched_at: Optional[datetime] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = "USA"
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Enhanced contact fields (multiple values)
    phones: Optional[List[PhoneNumber]] = []
    addresses: Optional[List[Address]] = []
    websites: Optional[List[str]] = []

    # Multiple phone fields from CSV import
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    mobile_phone_3: Optional[str] = None
    mobile_phone_4: Optional[str] = None
    mobile_phone_5: Optional[str] = None
    personal_phone: Optional[str] = None
    personal_phone_2: Optional[str] = None
    personal_phone_3: Optional[str] = None
    personal_phone_4: Optional[str] = None
    personal_phone_5: Optional[str] = None
    company_phone: Optional[str] = None
    direct_number: Optional[str] = None
    direct_number_2: Optional[str] = None
    direct_number_3: Optional[str] = None
    direct_number_4: Optional[str] = None
    direct_number_5: Optional[str] = None

    # DNC (Do Not Call) flags for phone fields
    mobile_phone_dnc: Optional[bool] = None
    mobile_phone_2_dnc: Optional[bool] = None
    mobile_phone_3_dnc: Optional[bool] = None
    mobile_phone_4_dnc: Optional[bool] = None
    mobile_phone_5_dnc: Optional[bool] = None
    personal_phone_dnc: Optional[bool] = None
    personal_phone_2_dnc: Optional[bool] = None
    personal_phone_3_dnc: Optional[bool] = None
    personal_phone_4_dnc: Optional[bool] = None
    personal_phone_5_dnc: Optional[bool] = None
    direct_number_dnc: Optional[bool] = None
    direct_number_2_dnc: Optional[bool] = None
    direct_number_3_dnc: Optional[bool] = None
    direct_number_4_dnc: Optional[bool] = None
    direct_number_5_dnc: Optional[bool] = None

    # Multiple email fields from CSV import
    # Base email fields
    business_email: Optional[str] = None
    personal_email: Optional[str] = None
    personal_verified_email: Optional[str] = None
    business_verified_email: Optional[str] = None
    # Text fields for multiple emails (comma/newline separated)
    personal_emails: Optional[str] = None
    personal_verified_emails: Optional[str] = None
    business_verified_emails: Optional[str] = None
    # Personal email overflow fields (1-30)
    personal_email_1: Optional[str] = None
    personal_email_2: Optional[str] = None
    personal_email_3: Optional[str] = None
    personal_email_4: Optional[str] = None
    personal_email_5: Optional[str] = None
    personal_email_6: Optional[str] = None
    personal_email_7: Optional[str] = None
    personal_email_8: Optional[str] = None
    personal_email_9: Optional[str] = None
    personal_email_10: Optional[str] = None
    personal_email_11: Optional[str] = None
    personal_email_12: Optional[str] = None
    personal_email_13: Optional[str] = None
    personal_email_14: Optional[str] = None
    personal_email_15: Optional[str] = None
    personal_email_16: Optional[str] = None
    personal_email_17: Optional[str] = None
    personal_email_18: Optional[str] = None
    personal_email_19: Optional[str] = None
    personal_email_20: Optional[str] = None
    personal_email_21: Optional[str] = None
    personal_email_22: Optional[str] = None
    personal_email_23: Optional[str] = None
    personal_email_24: Optional[str] = None
    personal_email_25: Optional[str] = None
    personal_email_26: Optional[str] = None
    personal_email_27: Optional[str] = None
    personal_email_28: Optional[str] = None
    personal_email_29: Optional[str] = None
    personal_email_30: Optional[str] = None
    # Business email overflow fields (2-30, starts at 2)
    business_email_2: Optional[str] = None
    business_email_3: Optional[str] = None
    business_email_4: Optional[str] = None
    business_email_5: Optional[str] = None
    business_email_6: Optional[str] = None
    business_email_7: Optional[str] = None
    business_email_8: Optional[str] = None
    business_email_9: Optional[str] = None
    business_email_10: Optional[str] = None
    business_email_11: Optional[str] = None
    business_email_12: Optional[str] = None
    business_email_13: Optional[str] = None
    business_email_14: Optional[str] = None
    business_email_15: Optional[str] = None
    business_email_16: Optional[str] = None
    business_email_17: Optional[str] = None
    business_email_18: Optional[str] = None
    business_email_19: Optional[str] = None
    business_email_20: Optional[str] = None
    business_email_21: Optional[str] = None
    business_email_22: Optional[str] = None
    business_email_23: Optional[str] = None
    business_email_24: Optional[str] = None
    business_email_25: Optional[str] = None
    business_email_26: Optional[str] = None
    business_email_27: Optional[str] = None
    business_email_28: Optional[str] = None
    business_email_29: Optional[str] = None
    business_email_30: Optional[str] = None
    # Personal verified email overflow fields (2-30)
    personal_verified_email_2: Optional[str] = None
    personal_verified_email_3: Optional[str] = None
    personal_verified_email_4: Optional[str] = None
    personal_verified_email_5: Optional[str] = None
    personal_verified_email_6: Optional[str] = None
    personal_verified_email_7: Optional[str] = None
    personal_verified_email_8: Optional[str] = None
    personal_verified_email_9: Optional[str] = None
    personal_verified_email_10: Optional[str] = None
    personal_verified_email_11: Optional[str] = None
    personal_verified_email_12: Optional[str] = None
    personal_verified_email_13: Optional[str] = None
    personal_verified_email_14: Optional[str] = None
    personal_verified_email_15: Optional[str] = None
    personal_verified_email_16: Optional[str] = None
    personal_verified_email_17: Optional[str] = None
    personal_verified_email_18: Optional[str] = None
    personal_verified_email_19: Optional[str] = None
    personal_verified_email_20: Optional[str] = None
    personal_verified_email_21: Optional[str] = None
    personal_verified_email_22: Optional[str] = None
    personal_verified_email_23: Optional[str] = None
    personal_verified_email_24: Optional[str] = None
    personal_verified_email_25: Optional[str] = None
    personal_verified_email_26: Optional[str] = None
    personal_verified_email_27: Optional[str] = None
    personal_verified_email_28: Optional[str] = None
    personal_verified_email_29: Optional[str] = None
    personal_verified_email_30: Optional[str] = None
    # Business verified email overflow fields (2-30)
    business_verified_email_2: Optional[str] = None
    business_verified_email_3: Optional[str] = None
    business_verified_email_4: Optional[str] = None
    business_verified_email_5: Optional[str] = None
    business_verified_email_6: Optional[str] = None
    business_verified_email_7: Optional[str] = None
    business_verified_email_8: Optional[str] = None
    business_verified_email_9: Optional[str] = None
    business_verified_email_10: Optional[str] = None
    business_verified_email_11: Optional[str] = None
    business_verified_email_12: Optional[str] = None
    business_verified_email_13: Optional[str] = None
    business_verified_email_14: Optional[str] = None
    business_verified_email_15: Optional[str] = None
    business_verified_email_16: Optional[str] = None
    business_verified_email_17: Optional[str] = None
    business_verified_email_18: Optional[str] = None
    business_verified_email_19: Optional[str] = None
    business_verified_email_20: Optional[str] = None
    business_verified_email_21: Optional[str] = None
    business_verified_email_22: Optional[str] = None
    business_verified_email_23: Optional[str] = None
    business_verified_email_24: Optional[str] = None
    business_verified_email_25: Optional[str] = None
    business_verified_email_26: Optional[str] = None
    business_verified_email_27: Optional[str] = None
    business_verified_email_28: Optional[str] = None
    business_verified_email_29: Optional[str] = None
    business_verified_email_30: Optional[str] = None

    # Integer enrichment fields from CSV import
    company_employee_count: Optional[int] = None
    company_revenue: Optional[int] = None
    social_connections: Optional[int] = None
    inferred_years_experience: Optional[int] = None
    lead_score: Optional[int] = None
    skiptrace_match_score: Optional[int] = None
    skiptrace_exact_age: Optional[int] = None

    # Additional enrichment fields
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    company_domain: Optional[str] = None
    company_industry: Optional[str] = None
    company_description: Optional[str] = None
    company_linkedin_url: Optional[str] = None
    personal_address: Optional[str] = None
    personal_city: Optional[str] = None
    personal_state: Optional[str] = None
    personal_zip: Optional[str] = None

    # Overflow data for additional CSV fields
    overflow_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True, "extra": "allow"}


class ContactList(BaseModel):
    """Schema for paginated contact list"""
    items: List[ContactResponse]
    total: int
    page: int
    page_size: int
    pages: int


class DeletedContactSummary(BaseModel):
    """Summary information for soft-deleted contacts."""

    id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    deleted_at: datetime
    deleted_by: Optional[uuid.UUID] = None

    model_config = {"from_attributes": True}


class DeletedContactList(BaseModel):
    """Paginated list of deleted contacts."""

    items: List[DeletedContactSummary]
    total: int
    page: int
    page_size: int
