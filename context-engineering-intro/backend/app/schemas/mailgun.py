"""Mailgun Pydantic schemas for request/response validation"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Mailgun Settings Schemas
class MailgunSettingsBase(BaseModel):
    """Base Mailgun settings schema"""
    domain: str = Field(..., min_length=1, description="Mailgun domain (e.g., mg.senovallc.com)")
    region: str = Field(default="us", description="Mailgun region: 'us' or 'eu'")
    from_email: EmailStr = Field(..., description="Default from email address")
    from_name: str = Field(..., min_length=1, description="Default from name")

    @field_validator("region")
    @classmethod
    def validate_region(cls, v: str) -> str:
        """Validate region is either 'us' or 'eu'"""
        if v not in ("us", "eu"):
            raise ValueError("Region must be 'us' or 'eu'")
        return v


class MailgunSettingsCreate(MailgunSettingsBase):
    """Schema for creating Mailgun settings"""
    api_key: str = Field(..., min_length=1, description="Mailgun API key")


class MailgunSettingsUpdate(BaseModel):
    """Schema for updating Mailgun settings (all fields optional)"""
    api_key: Optional[str] = Field(None, min_length=1, description="Mailgun API key")
    domain: Optional[str] = Field(None, min_length=1, description="Mailgun domain")
    region: Optional[str] = Field(None, description="Mailgun region: 'us' or 'eu'")
    from_email: Optional[EmailStr] = Field(None, description="Default from email address")
    from_name: Optional[str] = Field(None, min_length=1, description="Default from name")
    rate_limit_per_hour: Optional[int] = Field(None, ge=1, le=10000, description="Rate limit per hour (admin/owner only)")

    @field_validator("region")
    @classmethod
    def validate_region(cls, v: Optional[str]) -> Optional[str]:
        """Validate region is either 'us' or 'eu'"""
        if v is not None and v not in ("us", "eu"):
            raise ValueError("Region must be 'us' or 'eu'")
        return v


class MailgunSettingsResponse(MailgunSettingsBase):
    """Schema for Mailgun settings response (excludes decrypted API key)"""
    id: UUID
    user_id: UUID
    api_key_masked: str = Field(..., description="Masked API key (only last 4 chars visible)")
    is_active: bool
    verified_at: Optional[datetime] = None
    rate_limit_per_hour: int
    created_at: datetime
    updated_at: datetime
    verified_addresses: List["VerifiedEmailResponse"] = []

    model_config = {"from_attributes": True}


# Verified Email Address Schemas
class VerifiedEmailBase(BaseModel):
    """Base verified email schema"""
    email_address: EmailStr = Field(..., description="Verified email address")
    display_name: Optional[str] = Field(None, description="Display name for this email")


class VerifiedEmailCreate(VerifiedEmailBase):
    """Schema for creating a verified email address"""
    is_default: bool = Field(default=False, description="Set as default from address")


class VerifiedEmailUpdate(BaseModel):
    """Schema for updating a verified email address"""
    display_name: Optional[str] = Field(None, description="Display name for this email")
    is_default: Optional[bool] = Field(None, description="Set as default from address")


class VerifiedEmailResponse(VerifiedEmailBase):
    """Schema for verified email response"""
    id: UUID
    mailgun_settings_id: UUID
    is_default: bool
    verified_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# Mailgun Test Connection Schemas
class MailgunTestRequest(BaseModel):
    """Schema for testing Mailgun connection"""
    send_test_email: bool = Field(default=False, description="Send a test email to verify")
    test_recipient: Optional[EmailStr] = Field(None, description="Recipient for test email (if send_test_email is True)")


class MailgunTestResponse(BaseModel):
    """Schema for Mailgun test connection result"""
    success: bool
    message: str
    verified_at: Optional[datetime] = None
    error_details: Optional[str] = None
