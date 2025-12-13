"""Twilio Pydantic schemas for request/response validation"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


# Twilio Settings Schemas
class TwilioSettingsBase(BaseModel):
    """Base Twilio settings schema"""
    account_sid: str = Field(..., min_length=34, max_length=34, description="Twilio Account SID starting with AC")

    @field_validator("account_sid")
    @classmethod
    def validate_account_sid(cls, v: str) -> str:
        """Validate account SID starts with AC"""
        if not v.startswith("AC"):
            raise ValueError("Account SID must start with 'AC'")
        return v


class TwilioSettingsCreate(TwilioSettingsBase):
    """Schema for creating Twilio settings"""
    auth_token: str = Field(..., min_length=1, description="Twilio auth token")
    webhook_signing_secret: Optional[str] = Field(None, description="Webhook signing secret for validation")


class TwilioSettingsUpdate(BaseModel):
    """Schema for updating Twilio settings (all fields optional)"""
    account_sid: Optional[str] = Field(None, min_length=34, max_length=34, description="Twilio Account SID")
    auth_token: Optional[str] = Field(None, min_length=1, description="Twilio auth token")
    webhook_signing_secret: Optional[str] = Field(None, description="Webhook signing secret")
    is_active: Optional[bool] = Field(None, description="Enable/disable Twilio integration")

    @field_validator("account_sid")
    @classmethod
    def validate_account_sid(cls, v: Optional[str]) -> Optional[str]:
        """Validate account SID starts with AC if provided"""
        if v is not None and not v.startswith("AC"):
            raise ValueError("Account SID must start with 'AC'")
        return v


class TwilioSettingsResponse(TwilioSettingsBase):
    """Schema for Twilio settings response (excludes auth token)"""
    id: UUID
    object_id: UUID
    is_active: bool
    connection_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    phone_numbers_count: int = Field(default=0, description="Number of phone numbers configured")

    model_config = {"from_attributes": True}


class TwilioConnectionTestRequest(BaseModel):
    """Schema for testing Twilio connection"""
    send_test_sms: bool = Field(default=False, description="Send a test SMS to verify")
    test_recipient: Optional[str] = Field(None, description="Phone number for test SMS (E.164 format)")

    @field_validator("test_recipient")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number is in E.164 format"""
        if v is not None and not v.startswith("+"):
            raise ValueError("Phone number must be in E.164 format (starting with +)")
        return v


class TwilioConnectionTestResponse(BaseModel):
    """Schema for Twilio connection test result"""
    success: bool
    account_name: Optional[str] = None
    account_status: Optional[str] = None
    error: Optional[str] = None
    test_sms_sent: bool = False
    test_sms_sid: Optional[str] = None


# Twilio Phone Number Schemas
class TwilioPhoneNumberBase(BaseModel):
    """Base Twilio phone number schema"""
    phone_number: str = Field(..., description="Phone number in E.164 format")
    friendly_name: Optional[str] = Field(None, max_length=100, description="Friendly name for the phone number")

    @field_validator("phone_number")
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        """Validate phone number is in E.164 format"""
        if not v.startswith("+"):
            raise ValueError("Phone number must be in E.164 format (starting with +)")
        return v


class TwilioPhoneNumberPurchase(TwilioPhoneNumberBase):
    """Schema for purchasing a new Twilio phone number"""
    messaging_service_sid: Optional[str] = Field(None, description="Messaging service SID")
    assigned_contact_id: Optional[UUID] = Field(None, description="Contact to assign this number to")
    assigned_user_id: Optional[UUID] = Field(None, description="User to assign this number to")


class TwilioPhoneNumberUpdate(BaseModel):
    """Schema for updating a Twilio phone number"""
    friendly_name: Optional[str] = Field(None, max_length=100)
    messaging_service_sid: Optional[str] = None
    assigned_contact_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    status: Optional[str] = Field(None, pattern="^(active|suspended|released)$")


class TwilioPhoneNumberResponse(TwilioPhoneNumberBase):
    """Schema for Twilio phone number response"""
    id: UUID
    object_id: UUID
    twilio_settings_id: UUID
    twilio_sid: str
    messaging_service_sid: Optional[str] = None
    sms_capable: bool
    mms_capable: bool
    voice_capable: bool
    assigned_contact_id: Optional[UUID] = None
    assigned_user_id: Optional[UUID] = None
    monthly_cost: float
    status: str
    purchased_at: datetime
    purchased_by_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TwilioPhoneNumberSearchRequest(BaseModel):
    """Schema for searching available Twilio phone numbers"""
    area_code: Optional[str] = Field(None, min_length=3, max_length=3, description="3-digit area code")
    contains: Optional[str] = Field(None, description="Pattern to match in phone number")
    country: str = Field(default="US", description="ISO country code")
    sms_enabled: bool = Field(default=True)
    mms_enabled: bool = Field(default=False)
    voice_enabled: bool = Field(default=True)
    limit: int = Field(default=10, ge=1, le=50)


class TwilioAvailableNumber(BaseModel):
    """Schema for available phone numbers from Twilio"""
    phone_number: str
    friendly_name: str
    locality: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    sms_capable: bool
    mms_capable: bool
    voice_capable: bool
    monthly_cost: float