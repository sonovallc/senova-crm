"""
Email Campaign Schemas for Mass Email Sending

Pydantic models for campaign creation, updates, and responses
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum


class CampaignStatusEnum(str, Enum):
    """Campaign execution status"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class RecipientStatusEnum(str, Enum):
    """Individual recipient status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"
    UNSUBSCRIBED = "unsubscribed"


# Campaign Schemas
class CampaignBase(BaseModel):
    """Base campaign fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Campaign name")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject line")
    template_id: Optional[UUID] = Field(None, description="Template ID to use (optional)")
    body_html: Optional[str] = Field(None, description="HTML content (required if no template)")
    body_text: Optional[str] = Field(None, description="Plain text content (optional)")
    recipient_filter: Dict[str, Any] = Field(default_factory=dict, description="Recipient filter criteria")
    scheduled_at: Optional[datetime] = Field(None, description="When to send (null = send now)")

    @validator('body_html')
    def validate_content(cls, v, values):
        """Ensure either template_id or body_html is provided"""
        if not values.get('template_id') and not v:
            raise ValueError('Either template_id or body_html must be provided')
        return v


class CampaignCreate(CampaignBase):
    """Create new campaign"""
    pass


class CampaignUpdate(BaseModel):
    """Update existing campaign (only drafts can be updated)"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    template_id: Optional[UUID] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    recipient_filter: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None


class CampaignResponse(BaseModel):
    """Campaign response with full details"""
    id: UUID
    user_id: UUID
    name: str
    subject: str
    template_id: Optional[UUID]
    body_html: Optional[str]
    body_text: Optional[str]
    recipient_filter: Dict[str, Any]
    recipient_count: int
    status: CampaignStatusEnum
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    failed_count: int
    unsubscribed_count: int
    created_at: datetime
    updated_at: datetime

    # Computed properties
    delivery_rate: Optional[float] = Field(None, description="Delivery rate percentage")
    open_rate: Optional[float] = Field(None, description="Open rate percentage")
    click_rate: Optional[float] = Field(None, description="Click rate percentage")
    bounce_rate: Optional[float] = Field(None, description="Bounce rate percentage")

    class Config:
        from_attributes = True


class CampaignListItem(BaseModel):
    """Campaign list item (summary)"""
    id: UUID
    name: str
    subject: str
    status: CampaignStatusEnum
    recipient_count: int
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    # Computed rates
    delivery_rate: Optional[float]
    open_rate: Optional[float]
    click_rate: Optional[float]

    class Config:
        from_attributes = True


class CampaignList(BaseModel):
    """Paginated campaign list"""
    campaigns: List[CampaignListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# Recipient Schemas
class RecipientResponse(BaseModel):
    """Campaign recipient details"""
    id: UUID
    campaign_id: UUID
    contact_id: UUID
    email: str
    status: RecipientStatusEnum
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    opened_at: Optional[datetime]
    clicked_at: Optional[datetime]
    bounced_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecipientList(BaseModel):
    """Paginated recipient list"""
    recipients: List[RecipientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Contact Filter Schemas
class ContactFilterRequest(BaseModel):
    """Filter contacts for campaign recipients"""
    tags: Optional[List[str]] = Field(None, description="Filter by tag names")
    tag_ids: Optional[List[UUID]] = Field(None, description="Filter by tag IDs")
    status: Optional[str] = Field(None, description="Filter by contact status")
    date_added_start: Optional[datetime] = Field(None, description="Created after date")
    date_added_end: Optional[datetime] = Field(None, description="Created before date")
    assigned_user_id: Optional[UUID] = Field(None, description="Filter by assigned user")
    has_email: bool = Field(True, description="Only contacts with email")
    exclude_unsubscribed: bool = Field(True, description="Exclude unsubscribed contacts")


class ContactFilterResponse(BaseModel):
    """Filtered contact results"""
    total_count: int
    preview: List[Dict[str, Any]] = Field(description="First 10 contacts preview")


# Campaign Execution Schemas
class ScheduleCampaignRequest(BaseModel):
    """Schedule campaign for later"""
    scheduled_at: datetime = Field(..., description="When to send campaign")


class SendCampaignRequest(BaseModel):
    """Send campaign now"""
    batch_size: int = Field(50, ge=1, le=100, description="Batch size (1-100)")


class CampaignStatsResponse(BaseModel):
    """Detailed campaign statistics"""
    campaign_id: UUID
    campaign_name: str
    status: CampaignStatusEnum

    # Recipient counts
    total_recipients: int
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    failed_count: int
    unsubscribed_count: int
    pending_count: int

    # Rates
    delivery_rate: float
    open_rate: float
    click_rate: float
    bounce_rate: float

    # Timing
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")

    # Progress
    progress_percentage: float = Field(description="Progress percentage (0-100)")


# Unsubscribe Schemas
class UnsubscribeRequest(BaseModel):
    """Unsubscribe from campaigns"""
    token: str = Field(..., description="Unsubscribe token")


class UnsubscribeResponse(BaseModel):
    """Unsubscribe confirmation"""
    success: bool
    message: str
    email: Optional[str] = None
