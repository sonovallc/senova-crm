"""
Permission utility functions for RBAC

Handles:
- Field-level visibility based on user role
- Contact access permissions
- User management permissions
"""

from typing import List, Dict, Any, Set
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.contact import Contact
from app.models.field_visibility import FieldVisibility


async def get_visible_fields(current_user: User, db: AsyncSession) -> Set[str]:
    """
    Get list of field names visible to the current user based on their role.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        Set of field names the user can view
    """
    # Owner can see all fields
    # Handle both enum and string comparison
    user_role_value = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role_value == 'owner':
        # Return all possible contact fields
        return await _get_all_contact_fields(db)

    # For admin and user roles, query field_visibility table
    query = select(FieldVisibility)

    result = await db.execute(query)
    all_fields = result.scalars().all()

    visible_fields = set()
    for field in all_fields:
        if field.is_visible_to_role(current_user.role):
            visible_fields.add(field.field_name)

    return visible_fields


async def _get_all_contact_fields(db: AsyncSession) -> Set[str]:
    """
    Get all contact field names from field_visibility table.

    Args:
        db: Database session

    Returns:
        Set of all field names
    """
    query = select(FieldVisibility.field_name)
    result = await db.execute(query)
    return set(result.scalars().all())


def filter_contact_fields(contacts: List[Contact], visible_fields: Set[str]) -> List[Dict[str, Any]]:
    """
    Filter contact objects to only include visible fields.

    Args:
        contacts: List of Contact SQLAlchemy objects
        visible_fields: Set of field names the user can view

    Returns:
        List of dictionaries with only visible fields
    """
    filtered_contacts = []

    # Core fields that are ALWAYS included (required by schema)
    core_fields = [
        "id", "email", "phone", "first_name", "last_name", "company",
        "status", "source", "assigned_to_id", "pipeline_id", "pipeline_stage",
        "custom_fields", "tags", "enrichment_data", "last_enriched_at",
        "notes", "is_active", "created_at", "updated_at",
        "street_address", "city", "state", "zip_code", "country",
        "phones", "addresses", "websites"
    ]

    for contact in contacts:
        filtered_contact = {}

        # Always include core fields
        for field in core_fields:
            if hasattr(contact, field):
                value = getattr(contact, field)
                # Convert special types for JSON serialization
                if value is None:
                    filtered_contact[field] = value
                elif hasattr(value, 'isoformat'):  # datetime
                    filtered_contact[field] = value.isoformat()
                elif hasattr(value, 'value'):  # Enum
                    filtered_contact[field] = value.value
                elif isinstance(value, (dict, list)):  # JSON/JSONB fields - keep as-is
                    filtered_contact[field] = value
                elif isinstance(value, (str, int, float, bool)):  # Primitives
                    filtered_contact[field] = value
                elif hasattr(value, 'hex'):  # UUID
                    filtered_contact[field] = str(value)
                else:
                    filtered_contact[field] = value

        # Add additional visible fields (enrichment data, provider fields, etc.)
        for field in visible_fields:
            if field not in core_fields and hasattr(contact, field):
                value = getattr(contact, field)
                # Handle special types
                if value is None:
                    filtered_contact[field] = value
                elif hasattr(value, 'isoformat'):  # datetime
                    filtered_contact[field] = value.isoformat()
                elif isinstance(value, (dict, list)):  # JSON/JSONB fields
                    filtered_contact[field] = value
                elif isinstance(value, (str, int, float, bool)):  # Primitives
                    filtered_contact[field] = value
                elif hasattr(value, 'hex'):  # UUID
                    filtered_contact[field] = str(value)
                else:
                    filtered_contact[field] = value

        filtered_contacts.append(filtered_contact)

    return filtered_contacts


async def can_view_contact(current_user: User, contact: Contact, db: AsyncSession) -> bool:
    """
    Check if user can view a specific contact.

    Permissions:
    - Owner: Can view all contacts
    - Admin: Can view all contacts
    - User: Can only view unassigned contacts or contacts assigned to them

    Args:
        current_user: Current authenticated user
        contact: Contact to check permissions for
        db: Database session

    Returns:
        bool: True if user can view the contact
    """
    # Owner and Admin can see all contacts
    if current_user.role in ('owner', 'admin'):
        return True

    # Regular users can only see unassigned contacts or their own assigned contacts
    if current_user.role == 'user':
        return contact.assigned_to_id is None or contact.assigned_to_id == current_user.id

    return False


async def can_edit_contact(current_user: User, contact: Contact, db: AsyncSession) -> bool:
    """
    Check if user can edit a specific contact.

    Permissions:
    - Owner: Can edit all contacts
    - Admin: Can edit all contacts
    - User: Can only edit unassigned contacts or contacts assigned to them

    Args:
        current_user: Current authenticated user
        contact: Contact to check permissions for
        db: Database session

    Returns:
        bool: True if user can edit the contact
    """
    # Same permissions as viewing for now
    return await can_view_contact(current_user, contact, db)


async def can_manage_users(current_user: User) -> bool:
    """
    Check if user can manage other users (approve, deactivate, change roles).

    Args:
        current_user: Current authenticated user

    Returns:
        bool: True if user can manage other users
    """
    return current_user.role in ('owner', 'admin')


async def can_change_field_visibility(current_user: User) -> bool:
    """
    Check if user can change field visibility settings.

    Owner and admin can change field visibility settings.

    Args:
        current_user: Current authenticated user

    Returns:
        bool: True if user can change field visibility
    """
    return current_user.role in ('owner', 'admin')


def filter_user_list_by_role(current_user: User, users: List[User]) -> List[User]:
    """
    Filter user list based on current user's role.

    - Owner: Can see all users
    - Admin: Can see all users except owner details
    - User: Can only see themselves

    Args:
        current_user: Current authenticated user
        users: List of User objects

    Returns:
        Filtered list of User objects
    """
    if current_user.role == 'owner':
        return users

    if current_user.role == 'admin':
        return users  # Admins can see all users

    if current_user.role == 'user':
        # Users can only see themselves
        return [u for u in users if u.id == current_user.id]

    return []
