"""Pydantic schemas for autoresponders"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.autoresponder import TriggerType, ExecutionStatus, TimingMode


# Sequence Schemas
class AutoresponderSequenceBase(BaseModel):
    sequence_order: int = Field(..., ge=1, description="Order in sequence (1, 2, 3, ...)")
    timing_mode: str = Field(default="fixed_duration", description="Timing mode: fixed_duration, wait_for_trigger, or either_or")

    # For FIXED_DURATION and EITHER_OR modes
    delay_days: int = Field(default=0, ge=0, description="Days to wait after previous email")
    delay_hours: int = Field(default=0, ge=0, le=23, description="Additional hours to wait")

    # For WAIT_FOR_TRIGGER and EITHER_OR modes
    wait_trigger_type: Optional[str] = Field(None, description="Trigger event type: tag_added, status_changed, appointment_booked")
    wait_trigger_config: Dict[str, Any] = Field(default_factory=dict, description="Configuration for the trigger event")

    # Email content
    template_id: Optional[UUID] = None
    subject: Optional[str] = Field(None, max_length=500)
    body_html: Optional[str] = None

    @validator('subject')
    def validate_subject_or_template(cls, v, values):
        if not v and not values.get('template_id'):
            raise ValueError('Either subject or template_id must be provided')
        return v

    @validator('timing_mode')
    def validate_timing_mode(cls, v):
        valid_modes = ['fixed_duration', 'wait_for_trigger', 'either_or', 'both']
        if v not in valid_modes:
            raise ValueError(f'timing_mode must be one of: {", ".join(valid_modes)}')
        return v

    @validator('wait_trigger_type')
    def validate_wait_trigger(cls, v, values):
        timing_mode = values.get('timing_mode')
        if timing_mode in ['wait_for_trigger', 'either_or', 'both'] and not v:
            raise ValueError('wait_trigger_type is required when timing_mode is wait_for_trigger, either_or, or both')
        return v


class AutoresponderSequenceCreate(AutoresponderSequenceBase):
    pass


class AutoresponderSequenceUpdate(BaseModel):
    sequence_order: Optional[int] = Field(None, ge=1)
    timing_mode: Optional[str] = None
    delay_days: Optional[int] = Field(None, ge=0)
    delay_hours: Optional[int] = Field(None, ge=0, le=23)
    wait_trigger_type: Optional[str] = None
    wait_trigger_config: Optional[Dict[str, Any]] = None
    template_id: Optional[UUID] = None
    subject: Optional[str] = Field(None, max_length=500)
    body_html: Optional[str] = None


class AutoresponderSequenceResponse(AutoresponderSequenceBase):
    id: UUID
    autoresponder_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Autoresponder Schemas
class AutoresponderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: TriggerType
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = False
    template_id: Optional[UUID] = None
    subject: Optional[str] = Field(None, max_length=500)
    body_html: Optional[str] = None
    send_from_user: bool = True
    sequence_enabled: bool = False

    @validator('subject')
    def validate_subject_or_template(cls, v, values):
        if not v and not values.get('template_id'):
            raise ValueError('Either subject or template_id must be provided')
        return v

    @validator('trigger_config')
    def validate_trigger_config(cls, v, values):
        """Validate trigger_config based on trigger_type"""
        trigger_type = values.get('trigger_type')

        if trigger_type == TriggerType.TAG_ADDED:
            if 'tag_id' not in v:
                raise ValueError('tag_id required for tag_added trigger')
        elif trigger_type == TriggerType.DATE_BASED:
            if 'field' not in v or 'days_before' not in v:
                raise ValueError('field and days_before required for date_based trigger')

        return v


class AutoresponderCreate(AutoresponderBase):
    pass


class SequenceStepInput(BaseModel):
    """Schema for sequence step input from frontend"""
    sequence_order: int = Field(..., ge=1)
    timing_mode: str = Field(default="fixed_duration", description="Timing mode: fixed_duration, wait_for_trigger, either_or, or both")
    delay_days: int = Field(default=0, ge=0)
    delay_hours: int = Field(default=0, ge=0, le=23)
    wait_trigger_type: Optional[str] = Field(None, description="Trigger type: email_opened, link_clicked, email_replied, tag_added, status_changed, appointment_booked")
    wait_trigger_config: Dict[str, Any] = Field(default_factory=dict, description="Configuration for the trigger event")
    template_id: Optional[UUID] = None
    subject: Optional[str] = Field(None, max_length=500)
    body_html: Optional[str] = None


class AutoresponderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    trigger_type: Optional[TriggerType] = None
    trigger_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    template_id: Optional[UUID] = None
    subject: Optional[str] = Field(None, max_length=500)
    body_html: Optional[str] = None
    send_from_user: Optional[bool] = None
    sequence_enabled: Optional[bool] = None
    # BUG FIX: Add sequence_steps to allow updating sequences on edit
    sequence_steps: Optional[List[SequenceStepInput]] = None


class AutoresponderResponse(AutoresponderBase):
    id: UUID
    created_by: UUID
    total_executions: int
    total_sent: int
    total_pending: int = 0
    total_failed: int
    trigger_tag: Optional[str] = None
    trigger_date_field: Optional[str] = None
    trigger_days_offset: Optional[int] = None
    template_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sequences: List[AutoresponderSequenceResponse] = []

    class Config:
        from_attributes = True


class AutoresponderListResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    trigger_type: TriggerType
    is_active: bool
    sequence_enabled: bool
    total_executions: int
    total_sent: int
    total_failed: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Execution Schemas
class AutoresponderExecutionResponse(BaseModel):
    id: UUID
    autoresponder_id: UUID
    contact_id: UUID
    contact_name: str = ""
    contact_email: str = ""
    sequence_step: int
    status: str  # Changed from ExecutionStatus enum to string for frontend compatibility
    sent_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Statistics Schema
class AutoresponderStatsResponse(BaseModel):
    total_executions: int
    total_sent: int
    total_pending: int
    total_failed: int
    total_skipped: int
    success_rate: float
    executions_last_7_days: int
    executions_last_30_days: int


# Test Email Schema
class AutoresponderTestRequest(BaseModel):
    contact_id: Optional[UUID] = Field(None, description="Test with specific contact data")
