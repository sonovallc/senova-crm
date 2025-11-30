"""Contact activity and deleted-contact read APIs."""

from __future__ import annotations

import csv
import io
import json
from datetime import datetime
from typing import List, Optional, Sequence
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DatabaseSession
from app.core.exceptions import NotFoundError
from app.models.contact import Contact
from app.models.contact_activity import ContactActivity
from app.models.user import UserRole
from app.schemas.contact import DeletedContactList, DeletedContactSummary
from app.schemas.contact_activity import ContactActivityList, ContactActivityRead
from app.utils.permissions import can_view_contact

router = APIRouter(tags=["Contact Activities"])


@router.get("/contacts/{contact_id}/activities", response_model=ContactActivityList)
async def list_contact_activities(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    activity_types: Optional[List[str]] = Query(None, alias="type"),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
):
    """
    Return newest-first activity timeline for a contact.

    RBAC: Mirrors contact detail permissions.
    """
    contact = await db.get(Contact, contact_id)

    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    if not await can_view_contact(current_user, contact, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contact",
        )

    normalized_types = _normalize_type_filter(activity_types)
    filters = [ContactActivity.contact_id == contact_id]
    filters.extend(_activity_filter_clauses(normalized_types, from_date, to_date))

    return await _paginate_activities(db, filters, page, page_size)


@router.get("/activities", response_model=ContactActivityList)
async def list_activities(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    activity_types: Optional[List[str]] = Query(None, alias="type"),
    user_id: Optional[UUID] = Query(None),
    contact_id: Optional[UUID] = Query(None),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    include_deleted: bool = Query(False),
):
    """
    Return paginated activity log (owner/admin only).
    """
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value not in {UserRole.OWNER.value, UserRole.ADMIN.value}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can view system-wide activity logs",
        )

    normalized_types = _normalize_type_filter(activity_types)
    filters = _activity_filter_clauses(normalized_types, from_date, to_date)

    if user_id:
        filters.append(ContactActivity.user_id == user_id)

    if contact_id:
        filters.append(ContactActivity.contact_id == contact_id)

    if not include_deleted:
        filters.append(ContactActivity.is_deleted.is_(False))

    return await _paginate_activities(db, filters, page, page_size)


@router.get("/activities/export")
async def export_activities(
    db: DatabaseSession,
    current_user: CurrentUser,
    activity_types: Optional[List[str]] = Query(None, alias="type"),
    user_id: Optional[UUID] = Query(None),
    contact_id: Optional[UUID] = Query(None),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    include_deleted: bool = Query(False),
):
    """
    Export activities as CSV with the same filters as list_activities.
    """
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value not in {UserRole.OWNER.value, UserRole.ADMIN.value}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can export activities",
        )

    normalized_types = _normalize_type_filter(activity_types)
    filters = _activity_filter_clauses(normalized_types, from_date, to_date)

    if user_id:
        filters.append(ContactActivity.user_id == user_id)

    if contact_id:
        filters.append(ContactActivity.contact_id == contact_id)

    if not include_deleted:
        filters.append(ContactActivity.is_deleted.is_(False))

    query = (
        select(ContactActivity)
        .where(*filters)
        .order_by(ContactActivity.created_at.desc())
    )
    result = await db.execute(query)
    activities = result.scalars().all()

    def row_generator():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "id",
                "contact_id",
                "contact_name",
                "contact_email",
                "activity_type",
                "created_at",
                "user_id",
                "user_name",
                "via",
                "details",
                "is_deleted",
            ]
        )
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)

        for activity in activities:
            details = activity.details or {}
            writer.writerow(
                [
                    str(activity.id),
                    str(activity.contact_id),
                    activity.contact_name or "",
                    activity.contact_email or "",
                    activity.activity_type,
                    activity.created_at.isoformat(),
                    str(activity.user_id) if activity.user_id else "",
                    activity.user_name or "",
                    details.get("via") if isinstance(details, dict) else "",
                    json.dumps(details),
                    str(activity.is_deleted).lower(),
                ]
            )
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

    filename = "contact-activities.csv"
    return StreamingResponse(
        row_generator(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/contacts/deleted", response_model=DeletedContactList)
async def list_deleted_contacts(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
):
    """
    Return paginated list of soft-deleted contacts (owner only).
    """
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can view deleted contacts",
        )

    filters = [Contact.is_deleted.is_(True)]
    count_result = await db.execute(select(func.count()).select_from(Contact).where(*filters))
    total = count_result.scalar_one()

    query = (
        select(Contact)
        .where(*filters)
        .order_by(Contact.deleted_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    contacts = result.scalars().all()
    items = [DeletedContactSummary.model_validate(contact) for contact in contacts]

    return DeletedContactList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


async def _paginate_activities(
    db: DatabaseSession,
    filters: Sequence,
    page: int,
    page_size: int,
) -> ContactActivityList:
    filters = list(filters or [])
    count_query = select(func.count()).select_from(ContactActivity)
    if filters:
        count_query = count_query.where(*filters)
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    query = (
        select(ContactActivity)
        .order_by(ContactActivity.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    if filters:
        query = query.where(*filters)
    result = await db.execute(query)
    activities = result.scalars().all()

    return ContactActivityList(
        items=[ContactActivityRead.model_validate(activity) for activity in activities],
        total=total,
        page=page,
        page_size=page_size,
    )


def _normalize_type_filter(values: Optional[List[str]]) -> List[str]:
    if not values:
        return []
    normalized: List[str] = []
    for value in values:
        if not value:
            continue
        for token in value.split(","):
            token = token.strip()
            if token:
                normalized.append(token)
    return normalized


def _activity_filter_clauses(
    activity_types: List[str],
    from_date: Optional[datetime],
    to_date: Optional[datetime],
) -> List:
    filters = []
    if activity_types:
        filters.append(ContactActivity.activity_type.in_(activity_types))
    if from_date:
        filters.append(ContactActivity.created_at >= from_date)
    if to_date:
        filters.append(ContactActivity.created_at <= to_date)
    return filters
