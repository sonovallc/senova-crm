"""Schemas for contact activity timeline responses."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ContactActivityBase(BaseModel):
    """Shared ContactActivity fields."""

    id: UUID
    contact_id: UUID
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    activity_type: str
    created_at: datetime
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = Field(default=None)
    is_deleted: bool = False

    class Config:
        from_attributes = True


class ContactActivityRead(ContactActivityBase):
    """Read model for contact activities."""

    pass


class ContactActivityList(BaseModel):
    """Paginated contact activity response."""

    items: List[ContactActivityRead]
    total: int
    page: int
    page_size: int
