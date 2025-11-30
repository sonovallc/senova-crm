"""Feature flag Pydantic schemas"""

from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class FeatureFlagBase(BaseModel):
    key: str = Field(..., min_length=3, max_length=150, description="Machine-readable key (kebab or snake case)")
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class FeatureFlagCreate(FeatureFlagBase):
    pass


class FeatureFlagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    enabled: Optional[bool] = None


class FeatureFlagRead(BaseModel):
    id: UUID
    key: str
    name: str
    description: Optional[str]
    enabled: bool
    created_at: str
    updated_at: str
    created_by: Optional[UUID]
    updated_by: Optional[UUID]

    class Config:
        from_attributes = True


class FeatureFlagList(BaseModel):
    items: List[FeatureFlagRead]
    total: int
    page: int
    page_size: int
