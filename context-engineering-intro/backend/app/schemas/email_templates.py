"""Email Templates Pydantic schemas for request/response validation"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Email Template Base Schemas
class EmailTemplateBase(BaseModel):
    """Base email template schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Template name for selection")
    category: str = Field(..., min_length=1, max_length=100, description="Category (e.g., Welcome, Appointment, Follow-up)")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject line with variable placeholders")
    body_html: str = Field(..., min_length=1, description="HTML body with variable placeholders")
    thumbnail_url: Optional[str] = Field(None, max_length=500, description="Optional preview image URL")
    variables: Optional[List[str]] = Field(default_factory=list, description="List of variables used in template")


class EmailTemplateCreate(EmailTemplateBase):
    """Schema for creating an email template"""
    is_system: Optional[bool] = Field(default=False, description="Mark as system template (admin only)")


class EmailTemplateUpdate(BaseModel):
    """Schema for updating an email template (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    body_html: Optional[str] = Field(None, min_length=1)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    variables: Optional[List[str]] = None


class EmailTemplateResponse(EmailTemplateBase):
    """Schema for email template response"""
    id: UUID
    user_id: UUID
    is_system: bool
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmailTemplateListItem(BaseModel):
    """Compact template info for list views"""
    id: UUID
    name: str
    category: str
    subject: str
    is_system: bool
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime
    thumbnail_url: Optional[str] = None

    model_config = {"from_attributes": True}


class EmailTemplateList(BaseModel):
    """Paginated list of email templates"""
    items: List[EmailTemplateListItem]
    total: int
    skip: int
    limit: int


# Preview Schemas
class TemplatePreviewRequest(BaseModel):
    """Schema for previewing template with sample data"""
    contact_data: Optional[dict] = Field(
        default_factory=dict,
        description="Sample contact data for variable replacement"
    )
    extra_variables: Optional[dict] = Field(
        default_factory=dict,
        description="Additional variables (e.g., appointment_date, appointment_time)"
    )


class TemplatePreviewResponse(BaseModel):
    """Schema for template preview result"""
    subject: str = Field(..., description="Rendered subject with variables replaced")
    body_html: str = Field(..., description="Rendered HTML body with variables replaced")
    missing_variables: List[str] = Field(
        default_factory=list,
        description="List of variables that were in template but not provided in data"
    )


# Category Schema
class CategoryResponse(BaseModel):
    """Schema for available template categories"""
    categories: List[str] = Field(..., description="List of available template categories")
