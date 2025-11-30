"""Service utilities for recording contact activities."""

from __future__ import annotations

from datetime import datetime
import enum
from typing import Any, Dict, Mapping, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import Contact
from app.models.contact_activity import ContactActivity
from app.models.tag import Tag
from app.models.user import User


class ActivityLogger:
    """Centralized helper for persisting immutable contact activity records."""

    @classmethod
    async def log(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        activity_type: str,
        user: Optional[User] = None,
        details: Optional[Dict[str, Any]] = None,
        at: Optional[datetime] = None,
        is_deleted: bool = False,
    ) -> ContactActivity:
        """
        Persist a contact activity record, capturing snapshots of contact/user state.
        """
        if not contact:
            raise ValueError("contact is required for activity logging")

        # Extract user_id without triggering lazy loads
        user_id = None
        if user is not None:
            # Access ID directly from the object's __dict__ to avoid lazy loading
            user_id = user.__dict__.get("id") or (user.id if hasattr(user, "id") else None)

        payload = ContactActivity(
            contact_id=contact.id,
            contact_name=cls._contact_name(contact),
            contact_email=contact.email,
            activity_type=activity_type[:100],
            user_id=user_id,
            user_name=cls._user_name(user),
            details=dict(details or {}),
            is_deleted=is_deleted,
        )

        if at:
            payload.created_at = at

        db.add(payload)
        await db.commit()
        await db.refresh(payload)
        return payload

    @classmethod
    async def log_contact_created(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        user: Optional[User] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> ContactActivity:
        """Record that a contact was created."""
        return await cls.log(
            db,
            contact=contact,
            activity_type="Contact Created",
            user=user,
            details=details,
            is_deleted=contact.is_deleted,
        )

    @classmethod
    async def log_contact_updated(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        changes: Dict[str, Dict[str, Any]],
        user: Optional[User] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Optional[ContactActivity]:
        """Record field-level changes for a contact."""
        if not changes:
            return None

        payload = {"changes": changes}
        if details:
            payload.update(details)

        return await cls.log(
            db,
            contact=contact,
            activity_type="Contact Updated",
            user=user,
            details=payload,
            is_deleted=contact.is_deleted,
        )

    @classmethod
    async def log_contact_deleted(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        user: Optional[User] = None,
        soft: bool = True,
        details: Optional[Dict[str, Any]] = None,
    ) -> ContactActivity:
        """Record a soft or permanent deletion."""
        payload = {
            "soft": soft,
            **(details or {}),
        }
        at = contact.deleted_at if soft and contact.deleted_at else None
        return await cls.log(
            db,
            contact=contact,
            activity_type="Contact Deleted" if soft else "Contact Permanently Deleted",
            user=user,
            details=payload,
            at=at,
            is_deleted=True,
        )

    @classmethod
    async def log_tag_added(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        tag: Tag,
        user: Optional[User] = None,
    ) -> ContactActivity:
        """Record tag addition."""
        return await cls.log(
            db,
            contact=contact,
            activity_type="Tag Added",
            user=user,
            details=cls._tag_details(tag),
            is_deleted=contact.is_deleted,
        )

    @classmethod
    async def log_tag_removed(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        tag: Tag,
        user: Optional[User] = None,
    ) -> ContactActivity:
        """Record tag removal."""
        return await cls.log(
            db,
            contact=contact,
            activity_type="Tag Removed",
            user=user,
            details=cls._tag_details(tag),
            is_deleted=contact.is_deleted,
        )

    @classmethod
    async def log_assignment_changed(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        old_user: Optional[User | UUID],
        new_user: Optional[User | UUID],
        user: Optional[User] = None,
    ) -> ContactActivity:
        """Record assignment change."""
        return await cls.log(
            db,
            contact=contact,
            activity_type="Assignment Changed",
            user=user,
            details={
                "old_assignment": cls._user_reference(old_user),
                "new_assignment": cls._user_reference(new_user),
            },
            is_deleted=contact.is_deleted,
        )

    @classmethod
    async def log_status_changed(
        cls,
        db: AsyncSession,
        *,
        contact: Contact,
        old_status: Optional[str],
        new_status: Optional[str],
        user: Optional[User] = None,
    ) -> ContactActivity:
        """Record status changes."""
        return await cls.log(
            db,
            contact=contact,
            activity_type="Status Changed",
            user=user,
            details={
                "old_status": old_status,
                "new_status": new_status,
            },
            is_deleted=contact.is_deleted,
        )

    @staticmethod
    def diff_fields(old_obj: Mapping[str, Any] | Any, new_dict: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Return dictionary of changed fields with old/new values (skips unchanged)."""
        changes: Dict[str, Dict[str, Any]] = {}

        if not new_dict:
            return changes

        for field, new_value in new_dict.items():
            old_value = ActivityLogger._resolve_field(old_obj, field)

            if new_value is None and old_value is None:
                continue

            if ActivityLogger._snapshot_value(old_value) == ActivityLogger._snapshot_value(new_value):
                continue

            changes[field] = {
                "old": ActivityLogger._snapshot_value(old_value),
                "new": ActivityLogger._snapshot_value(new_value),
            }

        return changes

    @staticmethod
    def _resolve_field(source: Mapping[str, Any] | Any, field: str) -> Any:
        if isinstance(source, Mapping):
            return source.get(field)
        return getattr(source, field, None)

    @staticmethod
    def _snapshot_value(value: Any) -> Any:
        if isinstance(value, enum.Enum):
            return value.value
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, dict):
            return dict(value)
        if isinstance(value, list):
            return list(value)
        return value

    @staticmethod
    def _contact_name(contact: Optional[Contact]) -> Optional[str]:
        if not contact:
            return None
        parts = [contact.first_name or "", contact.last_name or ""]
        composed = " ".join(part for part in parts if part).strip()
        return composed or contact.company or contact.email or None

    @staticmethod
    def _user_name(user: Optional[User]) -> Optional[str]:
        if not user:
            return None
        parts = [user.first_name or "", user.last_name or ""]
        composed = " ".join(part for part in parts if part).strip()
        return composed or getattr(user, "full_name", None) or user.email

    @staticmethod
    def _user_reference(user: Optional[User | UUID]) -> Optional[Dict[str, Any]]:
        if user is None:
            return None
        if isinstance(user, UUID):
            return {"id": str(user)}
        if isinstance(user, User):
            return {"id": str(user.id), "name": ActivityLogger._user_name(user)}
        return {"id": str(getattr(user, "id", user))}

    @staticmethod
    def _tag_details(tag: Tag) -> Dict[str, Any]:
        return {
            "tag_id": str(tag.id),
            "tag_name": tag.name,
        }
