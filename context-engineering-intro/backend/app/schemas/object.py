"""Pydantic schemas for Objects feature"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# ============= Object Schemas =============

class ObjectBase(BaseModel):
    """Base schema for Object"""
    name: str = Field(..., min_length=1, max_length=255, description="Object/Organization name")
    type: str = Field(default="company", max_length=50, description="Type of object (company, organization, department, etc.)")
    company_info: Dict[str, Any] = Field(default_factory=dict, description="Company details in JSONB format")


class ObjectCreate(ObjectBase):
    """Schema for creating a new Object"""
    pass


class ObjectUpdate(BaseModel):
    """Schema for updating an Object"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, max_length=50)
    company_info: Optional[Dict[str, Any]] = Field(None)


class ObjectInDB(ObjectBase):
    """Schema for Object from database"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    created_by: UUID
    updated_at: Optional[datetime]
    deleted: bool = False
    deleted_at: Optional[datetime] = None


class ObjectResponse(ObjectInDB):
    """Schema for Object API response"""
    contact_count: Optional[int] = Field(default=0, description="Number of contacts in this object")
    user_count: Optional[int] = Field(default=0, description="Number of users with access to this object")
    website_count: Optional[int] = Field(default=0, description="Number of websites for this object")
    is_primary: Optional[bool] = Field(default=False, description="Is this the user's primary object")


class ObjectListResponse(BaseModel):
    """Schema for paginated Object list response"""
    objects: List[ObjectResponse]
    total: int
    skip: int
    limit: int


# ============= ObjectContact Schemas =============

class ObjectContactBase(BaseModel):
    """Base schema for ObjectContact junction"""
    object_id: UUID
    contact_id: UUID
    role: Optional[str] = Field(None, max_length=100, description="Contact's role in the organization")
    department: Optional[str] = Field(None, max_length=100, description="Contact's department")
    is_primary_contact: bool = Field(default=False, description="Is this the primary contact for the object")


class ObjectContactCreate(ObjectContactBase):
    """Schema for assigning a contact to an object"""
    pass


class ObjectContactUpdate(BaseModel):
    """Schema for updating contact-object relationship"""
    role: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    is_primary_contact: Optional[bool] = None


class ObjectContactInDB(ObjectContactBase):
    """Schema for ObjectContact from database"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assigned_at: datetime
    assigned_by: UUID


class ObjectContactResponse(ObjectContactInDB):
    """Schema for ObjectContact API response with expanded info"""
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    assigner_name: Optional[str] = None


# ============= ObjectUser Schemas =============

class PermissionSet(BaseModel):
    """Schema for user permissions on an object"""
    can_view: bool = Field(default=True, description="Can view object and its contacts")
    can_manage_contacts: bool = Field(default=False, description="Can add/remove/edit contacts")
    can_manage_company_info: bool = Field(default=False, description="Can edit company details")
    can_manage_websites: bool = Field(default=False, description="Can manage hosted websites")
    can_assign_users: bool = Field(default=False, description="Can add/remove users from object")
    can_delete_object: bool = Field(default=False, description="Can delete the entire object")
    manageable_fields: List[str] = Field(default_factory=list, description="Specific fields user can edit")
    view_only_fields: List[str] = Field(default_factory=list, description="Fields user can view but not edit")
    custom_permissions: Dict[str, Any] = Field(default_factory=dict, description="Additional app-specific permissions")


class ObjectUserBase(BaseModel):
    """Base schema for ObjectUser junction"""
    object_id: UUID
    user_id: UUID
    permissions: PermissionSet = Field(default_factory=PermissionSet)
    role_name: Optional[str] = Field(None, max_length=100, description="User's role in the object context")


class ObjectUserCreate(ObjectUserBase):
    """Schema for assigning a user to an object"""
    pass


class ObjectUserUpdate(BaseModel):
    """Schema for updating user-object relationship"""
    permissions: Optional[PermissionSet] = None
    role_name: Optional[str] = Field(None, max_length=100)


class ObjectUserInDB(ObjectUserBase):
    """Schema for ObjectUser from database"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assigned_at: datetime
    assigned_by: UUID


class ObjectUserResponse(ObjectUserInDB):
    """Schema for ObjectUser API response with expanded info"""
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    assigner_name: Optional[str] = None


# ============= ObjectWebsite Schemas =============

class WebsiteContent(BaseModel):
    """Schema for website content structure"""
    pages: List[Dict[str, Any]] = Field(default_factory=list, description="List of pages with content")
    theme: Dict[str, Any] = Field(default_factory=dict, description="Theme configuration")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Website settings")
    forms: List[Dict[str, Any]] = Field(default_factory=list, description="Form configurations")
    integrations: Dict[str, Any] = Field(default_factory=dict, description="Third-party integrations")


class ObjectWebsiteBase(BaseModel):
    """Base schema for ObjectWebsite"""
    object_id: UUID
    name: str = Field(..., min_length=1, max_length=255, description="Website name")
    slug: str = Field(..., min_length=1, max_length=255, description="URL slug for the website")
    custom_domain: Optional[str] = Field(None, max_length=255, description="Optional custom domain")
    content: WebsiteContent = Field(default_factory=WebsiteContent, description="Website content and configuration")
    published: bool = Field(default=False, description="Is the website published")


class ObjectWebsiteCreate(BaseModel):
    """Schema for creating a website for an object"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    custom_domain: Optional[str] = Field(None, max_length=255)
    content: Optional[WebsiteContent] = Field(default_factory=WebsiteContent)


class ObjectWebsiteUpdate(BaseModel):
    """Schema for updating a website"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    custom_domain: Optional[str] = None
    content: Optional[WebsiteContent] = None
    published: Optional[bool] = None


class ObjectWebsiteInDB(ObjectWebsiteBase):
    """Schema for ObjectWebsite from database"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ssl_provisioned: bool = False
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime] = None


class ObjectWebsiteResponse(ObjectWebsiteInDB):
    """Schema for ObjectWebsite API response"""
    url: Optional[str] = Field(None, description="Full URL to access the website")
    object_name: Optional[str] = Field(None, description="Name of the parent object")


# ============= Bulk Operation Schemas =============

class BulkContactAssignment(BaseModel):
    """Schema for bulk assigning contacts to an object"""
    object_id: UUID
    contact_ids: List[UUID] = Field(..., min_items=1, description="List of contact IDs to assign")
    role: Optional[str] = Field(None, max_length=100, description="Default role for all contacts")
    department: Optional[str] = Field(None, max_length=100, description="Default department for all contacts")


class BulkUserAssignment(BaseModel):
    """Schema for bulk assigning users to an object"""
    object_id: UUID
    user_ids: List[UUID] = Field(..., min_items=1, description="List of user IDs to assign")
    permissions: PermissionSet = Field(default_factory=PermissionSet, description="Default permissions for all users")
    role_name: Optional[str] = Field(None, max_length=100, description="Default role name for all users")


class BulkOperationResult(BaseModel):
    """Schema for bulk operation results"""
    success: bool
    total: int
    succeeded: int
    failed: int
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="List of errors if any")


# ============= Search and Filter Schemas =============

class ObjectSearchParams(BaseModel):
    """Schema for object search parameters"""
    query: Optional[str] = Field(None, description="Search query for name or company info")
    type: Optional[str] = Field(None, description="Filter by object type")
    has_contacts: Optional[bool] = Field(None, description="Filter objects with/without contacts")
    has_websites: Optional[bool] = Field(None, description="Filter objects with/without websites")
    created_after: Optional[datetime] = Field(None, description="Filter objects created after this date")
    created_before: Optional[datetime] = Field(None, description="Filter objects created before this date")


class ObjectWithRelations(ObjectResponse):
    """Schema for object with all relations loaded"""
    contacts: List[ObjectContactResponse] = Field(default_factory=list)
    users: List[ObjectUserResponse] = Field(default_factory=list)
    websites: List[ObjectWebsiteResponse] = Field(default_factory=list)