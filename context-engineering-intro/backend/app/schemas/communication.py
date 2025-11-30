"""Communication Pydantic schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.models.communication import CommunicationType, CommunicationDirection, CommunicationStatus


class CommunicationBase(BaseModel):
    """Base communication schema"""
    type: CommunicationType
    contact_id: uuid.UUID
    subject: Optional[str] = None
    body: str
    to_address: Optional[str] = None


class CommunicationCreate(CommunicationBase):
    """Schema for creating communication (sending message)"""
    media_urls: List[str] = []
    thread_id: Optional[uuid.UUID] = None


class CommunicationResponse(CommunicationBase):
    """Schema for communication response"""
    id: uuid.UUID
    direction: CommunicationDirection
    status: CommunicationStatus
    user_id: Optional[uuid.UUID] = None
    from_address: Optional[str] = None
    media_urls: List[str] = []
    external_id: Optional[str] = None
    ai_generated: bool = False
    ai_confidence_score: Optional[int] = None
    closebot_processed: bool = False
    thread_id: Optional[uuid.UUID] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    provider_metadata: Dict[str, Any] = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunicationList(BaseModel):
    """Schema for paginated communication list"""
    items: List[CommunicationResponse]
    total: int
    page: int
    page_size: int
    pages: int
