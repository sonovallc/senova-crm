"""
Contact API endpoints

Features:
- Create contacts (public endpoint for website forms)
- List contacts (authenticated with RBAC)
- Get contact details (authenticated with RBAC)
- Update contact (authenticated with RBAC)
- Delete contact (authenticated with RBAC)
"""

from typing import Any, List, Optional
from uuid import UUID
from enum import Enum
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.contact import Contact, ContactStatus, ContactSource
from app.models.user import UserRole
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactList,
)
from app.core.exceptions import NotFoundError, ValidationError
from app.utils.permissions import (
    get_visible_fields,
    filter_contact_fields,
    can_view_contact,
    can_edit_contact,
)
from sqlalchemy.exc import IntegrityError
from app.services.contact_dedupe import (
    explode_emails,
    explode_phones,
    normalize_email,
    normalize_phone,
    find_contacts_by_identifiers,
    apply_normalized_identifiers,
    detect_identifier_conflicts,
)
from app.services.activity_logger import ActivityLogger
from app.services.autoresponder_service import check_and_queue_autoresponders
from app.models.autoresponder import TriggerType

router = APIRouter(prefix="/contacts", tags=["Contacts"])


async def populate_tags_from_relational(contacts: List[Contact], db: AsyncSession) -> List[Contact]:
    """
    Populate the tags field for each contact from the relational contact_tags table.

    This replaces the legacy JSONB tags column data with data from the new relational structure.
    """
    from app.models.contact_tag import ContactTag
    from app.models.tag import Tag

    # If no contacts, return early
    if not contacts:
        return contacts

    # Get all contact IDs
    contact_ids = [contact.id for contact in contacts]

    # Fetch all tags for these contacts in one query
    query = (
        select(ContactTag.contact_id, Tag.name)
        .join(Tag, ContactTag.tag_id == Tag.id)
        .where(ContactTag.contact_id.in_(contact_ids))
    )

    result = await db.execute(query)
    rows = result.all()

    # Build a map of contact_id -> list of tag names
    contact_tags_map = {}
    for contact_id, tag_name in rows:
        if contact_id not in contact_tags_map:
            contact_tags_map[contact_id] = []
        contact_tags_map[contact_id].append(tag_name)

    # Update each contact's tags field
    for contact in contacts:
        contact.tags = contact_tags_map.get(contact.id, [])

    return contacts


# ==================== Advanced Filter Models ====================

class FilterOperator(str, Enum):
    """Filter operators for contact search"""
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    GT = "gt"  # Greater than
    GTE = "gte"  # Greater than or equal
    LT = "lt"  # Less than
    LTE = "lte"  # Less than or equal
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"
    IN = "in"  # Value in list


class ContactFilter(BaseModel):
    """Single filter condition"""
    field: str = Field(..., description="Contact field name (e.g., 'status', 'first_name', 'email')")
    operator: FilterOperator = Field(..., description="Filter operator")
    value: Optional[str] = Field(None, description="Filter value (not required for is_empty/is_not_empty)")


class ContactFilterRequest(BaseModel):
    """Request for advanced contact filtering"""
    filters: List[ContactFilter] = Field(default_factory=list, description="List of filter conditions")
    logic: str = Field("and", description="Logical operator: 'and' or 'or'")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=2000, description="Items per page")
    include_deleted: bool = Field(False, description="Include soft-deleted contacts in results")


@router.post("/search", response_model=ContactList)
async def search_contacts(
    request: ContactFilterRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Advanced contact search with filter builder support.

    Supports multiple filter conditions with AND/OR logic.

    Filter operators:
    - equals, not_equals: Exact match
    - contains, not_contains: Substring match (case-insensitive)
    - starts_with, ends_with: Prefix/suffix match
    - gt, gte, lt, lte: Numeric/date comparisons
    - is_empty, is_not_empty: NULL checks
    - in: Value in comma-separated list

    RBAC Rules:
    - Owner/Admin: Can search all contacts
    - User: Can only search unassigned contacts or contacts assigned to them

    Requires authentication
    """
    from sqlalchemy import cast, String, Date, Integer, Float

    # Build base query
    query = select(Contact)

    # Start with base filters
    filters = []

    # Exclude soft-deleted contacts unless explicitly included
    if not request.include_deleted:
        filters.append(Contact.is_deleted.is_(False))

    # RBAC: Filter contacts based on user role with strict multi-tenant segregation
    user_role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    # Owner role sees ALL contacts (no filter applied)
    if user_role_str != 'owner':
        if user_role_str == 'user':
            # User role: can ONLY see contacts assigned to them
            filters.append(Contact.assigned_to_id == current_user.id)
        elif user_role_str == 'admin':
            # Admin role: can ONLY see contacts in objects they have access to
            from app.models.object import ObjectContact, ObjectUser

            # Subquery to get contact IDs from objects the admin has access to
            admin_contacts_subquery = (
                select(ObjectContact.contact_id)
                .join(ObjectUser, ObjectContact.object_id == ObjectUser.object_id)
                .where(ObjectUser.user_id == current_user.id)
            )

            # Filter contacts to only those in the admin's objects
            filters.append(Contact.id.in_(admin_contacts_subquery))
        else:
            # Unknown role: no contacts visible
            filters.append(False)

    # Build filter conditions
    filter_conditions = []

    for contact_filter in request.filters:
        field_name = contact_filter.field
        operator = contact_filter.operator
        value = contact_filter.value

        # Get the SQLAlchemy column attribute
        if not hasattr(Contact, field_name):
            # Skip invalid field names
            continue

        column = getattr(Contact, field_name)

        # Build condition based on operator
        # Skip empty string values (they should not be used for filtering)
        if value is not None and isinstance(value, str) and value.strip() == '' and operator not in (FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY):
            continue

        if operator == FilterOperator.EQUALS:
            if value is not None and value.strip():
                # Use case-insensitive comparison for string fields
                # Cast ENUM fields to String to enable ILIKE
                from sqlalchemy import String
                try:
                    filter_conditions.append(column.cast(String).ilike(value))
                except (AttributeError, TypeError):
                    # Fallback to exact match for non-string fields
                    filter_conditions.append(column == value)

        elif operator == FilterOperator.NOT_EQUALS:
            if value is not None:
                # Use case-insensitive comparison for string fields
                # Cast ENUM fields to String to enable ILIKE
                from sqlalchemy import String
                try:
                    filter_conditions.append(~column.cast(String).ilike(value))
                except (AttributeError, TypeError):
                    # Fallback to exact match for non-string fields
                    filter_conditions.append(column != value)

        elif operator == FilterOperator.CONTAINS:
            if value is not None:
                filter_conditions.append(column.ilike(f"%{value}%"))

        elif operator == FilterOperator.NOT_CONTAINS:
            if value is not None:
                filter_conditions.append(~column.ilike(f"%{value}%"))

        elif operator == FilterOperator.STARTS_WITH:
            if value is not None:
                filter_conditions.append(column.ilike(f"{value}%"))

        elif operator == FilterOperator.ENDS_WITH:
            if value is not None:
                filter_conditions.append(column.ilike(f"%{value}"))

        elif operator == FilterOperator.GT:
            if value is not None:
                # Try to convert to appropriate type
                try:
                    # Try as number first
                    numeric_value = float(value)
                    filter_conditions.append(cast(column, Float) > numeric_value)
                except ValueError:
                    # Try as date
                    try:
                        date_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        filter_conditions.append(column > date_value)
                    except ValueError:
                        # Fallback to string comparison
                        filter_conditions.append(column > value)

        elif operator == FilterOperator.GTE:
            if value is not None:
                try:
                    numeric_value = float(value)
                    filter_conditions.append(cast(column, Float) >= numeric_value)
                except ValueError:
                    try:
                        date_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        filter_conditions.append(column >= date_value)
                    except ValueError:
                        filter_conditions.append(column >= value)

        elif operator == FilterOperator.LT:
            if value is not None:
                try:
                    numeric_value = float(value)
                    filter_conditions.append(cast(column, Float) < numeric_value)
                except ValueError:
                    try:
                        date_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        filter_conditions.append(column < date_value)
                    except ValueError:
                        filter_conditions.append(column < value)

        elif operator == FilterOperator.LTE:
            if value is not None:
                try:
                    numeric_value = float(value)
                    filter_conditions.append(cast(column, Float) <= numeric_value)
                except ValueError:
                    try:
                        date_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        filter_conditions.append(column <= date_value)
                    except ValueError:
                        filter_conditions.append(column <= value)

        elif operator == FilterOperator.IS_EMPTY:
            # Handle boolean fields differently from string fields
            # Boolean fields: only check for NULL
            # String/Text fields: check for NULL or empty string
            from sqlalchemy.types import Boolean
            column_type = column.type
            if isinstance(column_type, Boolean):
                # For boolean fields, IS_EMPTY means NULL only
                filter_conditions.append(column.is_(None))
            else:
                # For string/text fields, IS_EMPTY means NULL or empty string
                filter_conditions.append(or_(column.is_(None), column == ''))

        elif operator == FilterOperator.IS_NOT_EMPTY:
            # Handle boolean fields differently from string fields
            # Boolean fields: only check for NOT NULL
            # String/Text fields: check for NOT NULL and not empty string
            from sqlalchemy.types import Boolean
            column_type = column.type
            if isinstance(column_type, Boolean):
                # For boolean fields, IS_NOT_EMPTY means NOT NULL
                filter_conditions.append(column.isnot(None))
            else:
                # For string/text fields, IS_NOT_EMPTY means NOT NULL and not empty string
                filter_conditions.append(and_(column.isnot(None), column != ''))

        elif operator == FilterOperator.IN:
            if value is not None:
                # Split comma-separated values and filter out empty strings
                values = [v.strip() for v in value.split(',') if v.strip()]
                if values:  # Only add filter if there are valid values
                    filter_conditions.append(column.in_(values))

    # Combine filter conditions with AND/OR logic
    if filter_conditions:
        if request.logic.lower() == "or":
            filters.append(or_(*filter_conditions))
        else:  # Default to AND
            filters.append(and_(*filter_conditions))

    # Apply all filters
    if filters:
        query = query.where(*filters)

    # Order by newest first
    query = query.order_by(Contact.created_at.desc())

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(Contact).where(*filters if filters else [])
    )
    total = count_result.scalar()

    # Calculate pagination
    skip = (request.page - 1) * request.page_size
    pages = (total + request.page_size - 1) // request.page_size

    # Apply pagination
    query = query.offset(skip).limit(request.page_size)

    # Execute query
    result = await db.execute(query)
    contacts = result.scalars().all()

    # Populate tags from relational contact_tags table
    contacts = await populate_tags_from_relational(list(contacts), db)

    # Get visible fields for this user's role
    visible_fields = await get_visible_fields(current_user, db)

    # Filter contact fields based on visibility
    filtered_contacts = filter_contact_fields(contacts, visible_fields)

    return ContactList(
        items=filtered_contacts,
        total=total,
        page=request.page,
        page_size=request.page_size,
        pages=pages,
    )


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    data: ContactCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create new contact - PUBLIC ENDPOINT (no authentication required)

    Used by website contact forms and chat widget to capture leads.
    """
    # Map frontend source values to backend enum values
    source_mapping = {
        "website_contact_form": ContactSource.WEBSITE,
        "website_chat": ContactSource.WEBSITE,
        "website": ContactSource.WEBSITE,
    }

    # Use mapped source if available, otherwise use the provided value
    if isinstance(data.source, str) and data.source in source_mapping:
        source = source_mapping[data.source]
    else:
        source = data.source

    payload = data.model_dump(exclude_unset=True)
    payload["source"] = source
    payload["status"] = payload.get("status") or ContactStatus.LEAD
    payload["assigned_to_id"] = payload.get("assigned_to_id")
    payload["is_active"] = True

    if payload.get("email"):
        payload["email"] = normalize_email(payload["email"])
    if payload.get("phone"):
        payload["normalized_phone"] = normalize_phone(payload["phone"])

    payload = apply_normalized_identifiers(payload)

    def build_identifier_lists() -> tuple[list[str], list[str]]:
        emails = explode_emails(data.email) if data.email else []
        if payload.get("email"):
            emails = list(dict.fromkeys(emails + [payload["email"]]))

        phones = explode_phones(data.phone) if data.phone else []
        if payload.get("normalized_phone"):
            phones.append(payload["normalized_phone"])
        phones = list(dict.fromkeys(phones))
        return emails, phones

    email_candidates, phone_candidates = build_identifier_lists()
    matches = await find_contacts_by_identifiers(db, email_candidates, phone_candidates)

    async def merge_contact(contact: Contact) -> Contact:
        snapshot = {
            "email": payload.get("email") or contact.email,
            "phone": payload.get("phone") or contact.phone,
            "normalized_phone": payload.get("normalized_phone") or contact.normalized_phone,
        }
        conflicts = await detect_identifier_conflicts(db, contact.id, snapshot)
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Another contact already owns one or more identifiers.",
                    "conflicts": conflicts,
                    "target_contact_id": str(contact.id),
                },
            )

        for field, value in payload.items():
            if field in ["tags", "custom_fields"]:
                continue
            if value is None:
                continue
            if isinstance(value, str) and value.strip() == "":
                continue
            setattr(contact, field, value)

        if data.custom_fields:
            existing_fields = contact.custom_fields or {}
            existing_fields.update(data.custom_fields)
            contact.custom_fields = existing_fields

        if data.tags:
            existing_tags = set(contact.tags or [])
            contact.tags = list(existing_tags.union(data.tags))

        await db.commit()
        await db.refresh(contact)
        return contact

    if matches:
        updated_contact = await merge_contact(matches[0])
        return ContactResponse.model_validate(updated_contact)

    conflicts = await detect_identifier_conflicts(db, None, payload)
    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "A contact already exists with this email or phone.",
                "conflicts": conflicts,
            },
        )

    new_contact = Contact(**payload)
    db.add(new_contact)

    try:
        await db.commit()
        await db.refresh(new_contact)
        await ActivityLogger.log_contact_created(
            db,
            contact=new_contact,
        )

        # Trigger new_contact autoresponders
        try:
            await check_and_queue_autoresponders(
                trigger_type=TriggerType.NEW_CONTACT,
                contact_id=new_contact.id,
                trigger_data=None,
                db=db
            )
        except Exception as e:
            # Don't fail contact creation if autoresponder fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error triggering autoresponders for new contact {new_contact.id}: {e}")

        return ContactResponse.model_validate(new_contact)
    except IntegrityError:
        await db.rollback()
        matches = await find_contacts_by_identifiers(db, email_candidates, phone_candidates)
        if not matches:
            raise
        updated_contact = await merge_contact(matches[0])
        return ContactResponse.model_validate(updated_contact)


@router.get("/", response_model=ContactList)
async def list_contacts(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=2000, description="Items per page"),
    status_filter: Optional[ContactStatus] = Query(None, alias="status"),
    source_filter: Optional[ContactSource] = Query(None, alias="source"),
    assigned_to_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None, description="Comma-separated tag IDs to filter by (OR logic)"),
    include_deleted: bool = Query(False, description="Include soft-deleted contacts"),
):
    """
    List all contacts with pagination and filtering.

    RBAC Rules:
    - Owner/Admin: Can view all contacts
    - User: Can only view unassigned contacts or contacts assigned to them

    Tag Filtering:
    - Pass comma-separated tag IDs in tags parameter
    - Returns contacts that have ANY of the specified tags (OR logic)

    Requires authentication
    """
    from app.models.contact_tag import ContactTag

    # Build base query
    query = select(Contact)

    # Apply filters
    filters = []

    # Exclude soft-deleted contacts unless requested
    if not include_deleted:
        filters.append(Contact.is_deleted.is_(False))

    # RBAC: Filter contacts based on user role with strict multi-tenant segregation
    # Convert enum to string value for safe comparison
    user_role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    # Owner role sees ALL contacts (no filter applied)
    if user_role_str != 'owner':
        if user_role_str == 'user':
            # User role: can ONLY see contacts assigned to them
            filters.append(Contact.assigned_to_id == current_user.id)
        elif user_role_str == 'admin':
            # Admin role: can ONLY see contacts in objects they have access to
            from app.models.object import ObjectContact, ObjectUser

            # Subquery to get contact IDs from objects the admin has access to
            admin_contacts_subquery = (
                select(ObjectContact.contact_id)
                .join(ObjectUser, ObjectContact.object_id == ObjectUser.object_id)
                .where(ObjectUser.user_id == current_user.id)
            )

            # Filter contacts to only those in the admin's objects
            filters.append(Contact.id.in_(admin_contacts_subquery))
        else:
            # Unknown role: no contacts visible
            filters.append(False)

    if status_filter:
        filters.append(Contact.status == status_filter)

    if source_filter:
        filters.append(Contact.source == source_filter)

    if assigned_to_id:
        filters.append(Contact.assigned_to_id == assigned_to_id)

    if search:
        search_pattern = f"%{search}%"
        filters.append(
            or_(
                Contact.first_name.ilike(search_pattern),
                Contact.last_name.ilike(search_pattern),
                Contact.email.ilike(search_pattern),
                Contact.phone.ilike(search_pattern),
                Contact.company.ilike(search_pattern),
            )
        )

    # Tag filtering (OR logic - show contacts with ANY of the selected tags)
    if tags:
        tag_ids = []
        for tag_id in tags.split(","):
            tag_id = tag_id.strip()
            if not tag_id:
                continue
            try:
                tag_ids.append(UUID(tag_id))
            except ValueError:
                continue

        if tag_ids:
            tag_subquery = select(ContactTag.contact_id).where(ContactTag.tag_id.in_(tag_ids))
            filters.append(Contact.id.in_(tag_subquery))

    if filters:
        query = query.where(*filters)

    # Order by newest first
    query = query.order_by(Contact.created_at.desc())

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(Contact).where(*filters if filters else [])
    )
    total = count_result.scalar()

    # Calculate pagination
    skip = (page - 1) * page_size
    pages = (total + page_size - 1) // page_size

    # Apply pagination
    query = query.offset(skip).limit(page_size)

    # Execute query
    result = await db.execute(query)
    contacts = result.scalars().all()

    # Populate tags from relational contact_tags table
    contacts = await populate_tags_from_relational(list(contacts), db)

    # Get visible fields for this user's role
    visible_fields = await get_visible_fields(current_user, db)

    # Filter contact fields based on visibility
    filtered_contacts = filter_contact_fields(contacts, visible_fields)

    return ContactList(
        items=filtered_contacts,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/fields")
async def get_contact_fields(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get all contact field definitions with visibility based on user role.

    Returns list of fields that the current user can see and edit.

    RBAC Rules:
    - Owner: Sees all fields
    - Admin: Sees fields marked visible_to_admin
    - User: Sees fields marked visible_to_user

    Requires authentication
    """
    from app.models.field_visibility import FieldVisibility

    # Fetch all field visibility settings
    result = await db.execute(select(FieldVisibility))
    all_fields = result.scalars().all()

    # Filter fields based on role
    visible_fields = []
    # Convert enum to string value for comparison
    user_role_value = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    for field in all_fields:
        if field.is_visible_to_role(user_role_value):
            visible_fields.append({
                'field_name': field.field_name,
                'field_label': field.field_label,
                'field_category': field.field_category,
                'is_sensitive': field.is_sensitive,
                'field_type': field.field_type
            })

    return {'fields': visible_fields}


class ContactObjectInfo(BaseModel):
    """Object info for contact detail page"""
    id: UUID
    name: str
    type: str
    role: Optional[str] = None
    department: Optional[str] = None
    assigned_at: Optional[datetime] = None


class ContactObjectsResponse(BaseModel):
    """Response for contact objects endpoint"""
    items: List[ContactObjectInfo]
    total: int


@router.get("/{contact_id}/objects", response_model=ContactObjectsResponse)
async def get_contact_objects(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get all objects that a contact is assigned to.

    Returns a list of objects with the contact's role and department in each.

    RBAC Rules:
    - Owner/Admin: Can view objects for any contact
    - User: Can only view objects they have access to

    Requires authentication
    """
    from app.models.object import Object, ObjectContact

    # First check that the contact exists and user has permission to view it
    contact = await db.get(Contact, contact_id)
    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    if not await can_view_contact(current_user, contact, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contact"
        )

    # Query ObjectContact joined with Object to get all objects for this contact
    query = (
        select(ObjectContact, Object)
        .join(Object, ObjectContact.object_id == Object.id)
        .where(ObjectContact.contact_id == contact_id)
        .where(Object.deleted == False)
    )

    result = await db.execute(query)
    rows = result.all()

    # Build response
    items = []
    for object_contact, obj in rows:
        items.append(ContactObjectInfo(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            role=object_contact.role,
            department=object_contact.department,
            assigned_at=object_contact.assigned_at
        ))

    return ContactObjectsResponse(
        items=items,
        total=len(items)
    )


@router.get("/{contact_id}")
async def get_contact(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get single contact by ID with field-level filtering.

    RBAC Rules:
    - Owner/Admin: Can view any contact
    - User: Can only view unassigned contacts or contacts assigned to them

    Requires authentication
    """
    contact = await db.get(Contact, contact_id)

    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    # Check if user has permission to view this contact
    if not await can_view_contact(current_user, contact, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contact"
        )

    # Populate tags from relational contact_tags table
    await populate_tags_from_relational([contact], db)

    # Get visible fields for this user's role
    visible_fields = await get_visible_fields(current_user, db)

    # Filter contact fields based on visibility
    filtered_contacts = filter_contact_fields([contact], visible_fields)

    return filtered_contacts[0] if filtered_contacts else {}


@router.put("/{contact_id}")
async def update_contact(
    contact_id: UUID,
    data: ContactUpdate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update contact with RBAC permission checks.

    RBAC Rules:
    - Owner/Admin: Can edit any contact
    - User: Can only edit unassigned contacts or contacts assigned to them

    Requires authentication
    """
    contact = await db.get(Contact, contact_id)

    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    # Check if user has permission to edit this contact
    if not await can_edit_contact(current_user, contact, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this contact"
        )

    # Get visible fields for this user's role
    visible_fields = await get_visible_fields(current_user, db)

    # Core fields that can ALWAYS be edited (required for basic contact management)
    core_editable_fields = {
        "first_name", "last_name", "email", "phone", "company",
        "notes", "street_address", "city", "state", "zip_code", "country",
        "source", "status", "assigned_to_id", "pipeline_id", "pipeline_stage",
        "custom_fields", "tags"
    }
    allowed_fields = set(visible_fields).union(core_editable_fields)

    # Update fields
    update_data = data.model_dump(exclude_unset=True)

    # Sanitize data: convert empty strings to None, handle booleans
    boolean_fields = {
        'homeowner', 'married', 'direct_number_dnc', 'mobile_phone_dnc',
        'personal_phone_dnc', 'skiptrace_dnc'
    }

    sanitized_data = {}
    for field, value in update_data.items():
        if value == '' or value == []:
            # Convert empty strings and empty lists to None
            sanitized_data[field] = None
        elif field in boolean_fields:
            # Convert boolean-like values
            if isinstance(value, str):
                if value.lower() in ('true', '1', 'yes'):
                    sanitized_data[field] = True
                elif value.lower() in ('false', '0', 'no'):
                    sanitized_data[field] = False
                else:
                    sanitized_data[field] = None
            else:
                sanitized_data[field] = value
        else:
            sanitized_data[field] = value

    def snapshot(val):
        if isinstance(val, dict):
            return dict(val)
        if isinstance(val, list):
            return list(val)
        return val

    original_values = {
        field: snapshot(getattr(contact, field))
        for field in sanitized_data.keys()
        if hasattr(contact, field)
    }

    updated_values: dict[str, Any] = {}

    for field, value in sanitized_data.items():
        # Only allow updating fields that the user can see
        if field not in allowed_fields:
            continue

        new_value = None

        if field == "custom_fields" and value is not None:
            # Merge custom fields instead of replacing
            existing_fields = dict(contact.custom_fields or {})
            existing_fields.update(value)
            setattr(contact, field, existing_fields)
            new_value = existing_fields
        elif field == "tags" and value is not None:
            # Merge tags instead of replacing
            existing_tags = list(contact.tags or [])
            new_tags = [tag for tag in value if tag not in existing_tags]
            updated_tags = existing_tags + new_tags
            setattr(contact, field, updated_tags)
            new_value = updated_tags
        else:
            setattr(contact, field, value)
            new_value = getattr(contact, field)

        updated_values[field] = snapshot(new_value)

    await db.commit()
    await db.refresh(contact)
    await populate_tags_from_relational([contact], db)
    changes = ActivityLogger.diff_fields(original_values, updated_values)

    if changes:
        await ActivityLogger.log_contact_updated(
            db,
            contact=contact,
            user=current_user,
            changes=changes,
        )

        if "assigned_to_id" in changes:
            await ActivityLogger.log_assignment_changed(
                db,
                contact=contact,
                old_user=changes["assigned_to_id"]["old"],
                new_user=changes["assigned_to_id"]["new"],
                user=current_user,
            )

        if "status" in changes:
            old_status = changes["status"]["old"]
            new_status = changes["status"]["new"]
            await ActivityLogger.log_status_changed(
                db,
                contact=contact,
                old_status=old_status.value if hasattr(old_status, "value") else old_status,
                new_status=new_status.value if hasattr(new_status, "value") else new_status,
                user=current_user,
            )

    # Return filtered contact
    filtered_contacts = filter_contact_fields([contact], visible_fields)
    return filtered_contacts[0] if filtered_contacts else {}


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete contact (soft delete - sets is_active=False).

    RBAC Rules:
    - Owner/Admin: Can delete any contact
    - User: Can only delete unassigned contacts or contacts assigned to them

    Requires authentication
    """
    contact = await db.get(Contact, contact_id)

    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    # Check if user has permission to delete this contact
    if not await can_edit_contact(current_user, contact, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this contact"
        )

    # Soft delete
    now = datetime.now(timezone.utc)
    contact.is_active = False
    contact.is_deleted = True
    contact.deleted_at = now
    contact.deleted_by = current_user.id
    await db.commit()
    await db.refresh(contact)

    await ActivityLogger.log_contact_deleted(
        db,
        contact=contact,
        user=current_user,
        soft=True,
    )

    return None


@router.post("/{contact_id}/restore", response_model=ContactResponse)
async def restore_contact(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Restore a soft-deleted contact. Owner only.
    """
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can restore contacts",
        )

    contact = await db.get(Contact, contact_id)

    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")
    previous_assignment = contact.assigned_to_id

    if not contact.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact is not deleted",
        )

    previous_state = {
        "is_deleted": contact.is_deleted,
        "deleted_at": contact.deleted_at,
        "deleted_by": contact.deleted_by,
        "is_active": contact.is_active,
    }

    contact.is_deleted = False
    contact.is_active = True
    contact.deleted_at = None
    contact.deleted_by = None

    await db.commit()
    await db.refresh(contact)

    state_changes = ActivityLogger.diff_fields(
        previous_state,
        {
            "is_deleted": contact.is_deleted,
            "deleted_at": contact.deleted_at,
            "deleted_by": contact.deleted_by,
            "is_active": contact.is_active,
        },
    )

    if state_changes:
        await ActivityLogger.log_contact_updated(
            db,
            contact=contact,
            user=current_user,
            changes=state_changes,
            details={"action": "restore"},
        )

    return ContactResponse.model_validate(contact)


@router.delete("/{contact_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanent_delete_contact(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Permanently delete a contact. Owner only.
    """
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can permanently delete contacts",
        )

    contact = await db.get(Contact, contact_id)

    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    await ActivityLogger.log_contact_deleted(
        db,
        contact=contact,
        user=current_user,
        soft=False,
        details={"permanent": True},
    )

    await db.delete(contact)
    await db.commit()

    return None


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete operation"""
    contact_ids: List[UUID]


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_contacts(
    request: BulkDeleteRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Bulk delete contacts (soft delete - sets is_active=False).

    **OPTIMIZED:** Uses single bulk UPDATE query instead of looping through contacts.
    This changes 12,846 individual queries to 1-2 bulk queries (100-1000x faster).

    RBAC Rules:
    - Owner/Admin: Can delete any contacts (fast path: single bulk query)
    - User: Can only delete unassigned contacts or contacts assigned to them

    Requires authentication

    Returns:
        dict: Summary of deletion results
    """
    from sqlalchemy import update, select

    now = datetime.now(timezone.utc)

    # Fast path for owner/admin: bulk delete all at once with single UPDATE query
    if current_user.role in ('owner', 'admin'):
        # Single bulk UPDATE: UPDATE contacts SET is_active=false WHERE id IN (...)
        result = await db.execute(
            update(Contact)
            .where(Contact.id.in_(request.contact_ids))
            .values(
                is_active=False,
                is_deleted=True,
                deleted_at=now,
                deleted_by=current_user.id,
            )
        )
        await db.commit()

        # Get count of affected rows
        deleted_count = result.rowcount if result.rowcount else 0
        failed_count = len(request.contact_ids) - deleted_count

        return {
            "deleted": deleted_count,
            "failed": failed_count,
            "errors": None
        }

    # For regular users: check permissions first, then bulk delete allowed ones
    else:
        # Fetch all contacts in one query (SELECT ... WHERE id IN (...))
        result = await db.execute(
            select(Contact).where(Contact.id.in_(request.contact_ids))
        )
        contacts = result.scalars().all()

        # Separate allowed and denied IDs
        allowed_ids = []
        errors = []

        for contact in contacts:
            if await can_edit_contact(current_user, contact, db):
                allowed_ids.append(contact.id)
            else:
                errors.append({"contact_id": str(contact.id), "error": "Permission denied"})

        # Bulk delete allowed contacts with single UPDATE query
        deleted_count = 0
        if allowed_ids:
            result = await db.execute(
                update(Contact)
                .where(Contact.id.in_(allowed_ids))
                .values(
                    is_active=False,
                    is_deleted=True,
                    deleted_at=now,
                    deleted_by=current_user.id,
                )
            )
            await db.commit()
            deleted_count = result.rowcount if result.rowcount else 0

        # Calculate not found contacts
        found_ids = {c.id for c in contacts}
        not_found_ids = set(request.contact_ids) - found_ids

        for contact_id in not_found_ids:
            errors.append({"contact_id": str(contact_id), "error": "Contact not found"})

        failed_count = len(errors)

        return {
            "deleted": deleted_count,
            "failed": failed_count,
            "errors": errors if errors else None
        }


class ContactAssignment(BaseModel):
    """Schema for assigning contacts"""
    assigned_to_id: Optional[UUID] = None


@router.post("/{contact_id}/assign", status_code=status.HTTP_200_OK)
async def assign_contact(
    contact_id: UUID,
    assignment: ContactAssignment,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Assign or reassign contact to a staff member.

    RBAC Rules:
    - Owner/Admin: Can assign any contact to any staff member
    - User: Can only assign unassigned contacts or contacts assigned to them

    Set assigned_to_id to None to unassign.

    Requires authentication
    """
    from app.models.user import User
    from pydantic import BaseModel

    contact = await db.get(Contact, contact_id)

    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    # Check if user has permission to edit this contact
    if not await can_edit_contact(current_user, contact, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to assign this contact"
        )

    # If assigning to a user, validate that user exists and is active
    if assignment.assigned_to_id:
        assigned_user = await db.get(User, assignment.assigned_to_id)
        if not assigned_user:
            raise NotFoundError(f"User {assignment.assigned_to_id} not found")
        if not assigned_user.is_active:
            raise ValidationError("Cannot assign to inactive user")

    # Update assignment
    contact.assigned_to_id = assignment.assigned_to_id
    await db.commit()
    await db.refresh(contact)

    if previous_assignment != contact.assigned_to_id:
        await ActivityLogger.log_assignment_changed(
            db,
            contact=contact,
            old_user=previous_assignment,
            new_user=contact.assigned_to_id,
            user=current_user,
        )

    # Get visible fields for this user's role
    visible_fields = await get_visible_fields(current_user, db)

    # Filter contact fields based on visibility
    filtered_contacts = filter_contact_fields([contact], visible_fields)
    return filtered_contacts[0] if filtered_contacts else {}
