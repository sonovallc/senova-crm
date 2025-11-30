"""User Pydantic schemas for request/response validation"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
import uuid


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "user"


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response (excludes password)"""
    id: uuid.UUID
    full_name: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    permissions: List[str] = []
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """Schema for JWT token"""
    access_token: str
    token_type: str = "bearer"


class TokenResponse(BaseModel):
    """Schema for login response with tokens and user info"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
