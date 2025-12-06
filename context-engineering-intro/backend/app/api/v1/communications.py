"""
Communication API endpoints

Features:
- Unified inbox (all channels)
- Send messages (SMS, MMS, email, web chat)
- Message threading by contact
- Delivery status tracking
"""

from typing import List, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect, UploadFile, File, Request
from sqlalchemy import select, or_, and_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
import logging
import traceback

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.communication import Communication, CommunicationType, CommunicationDirection, CommunicationStatus
from app.models.contact import Contact
from app.models.user import User
from app.models.object import ObjectContact, ObjectUser
from app.schemas.communication import (
    CommunicationCreate,
    CommunicationResponse,
    CommunicationList,
)
from app.tasks.email_tasks import send_email_task
from app.tasks.sms_tasks import send_sms_task, send_mms_task
from app.services.mailgun_service import MailgunService
from app.config.settings import get_settings
from app.services.websocket_service import get_connection_manager
from app.services.local_storage_service import upload_files
from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import create_widget_token, decode_token
from app.utils.permissions import get_accessible_contact_ids
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/communications", tags=["Communications"])

logger = logging.getLogger(__name__)


@router.get("/inbox", response_model=CommunicationList)
async def get_unified_inbox(
    db: DatabaseSession,
    current_user: CurrentUser,
    contact_id: Optional[UUID] = Query(None, description="Filter by contact"),
    type: Optional[CommunicationType] = Query(None, description="Filter by type"),
    status: Optional[CommunicationStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Get unified inbox (all communication channels)

    Returns paginated list of communications with filtering options.

    Visibility rules:
    - Owner: Can see all message threads
    - Admin: Can only see threads for contacts assigned to objects they have access to
    - User: Can only see threads for contacts assigned to them
    """
    # Get accessible contact IDs based on user role
    accessible_contact_ids = await get_accessible_contact_ids(current_user, db)

    # Build query
    query = select(Communication).options(
        selectinload(Communication.contact),
        selectinload(Communication.user),
    )

    # Apply filters
    filters = []

    # Apply contact visibility filter based on user role
    # accessible_contact_ids is None for Owner (sees all), otherwise it's a set of contact IDs
    if accessible_contact_ids is not None:
        if len(accessible_contact_ids) == 0:
            # User has no accessible contacts - return empty result
            return CommunicationList(
                items=[],
                total=0,
                page=1,
                page_size=limit,
                pages=0,
            )
        filters.append(Communication.contact_id.in_(accessible_contact_ids))

    if contact_id:
        filters.append(Communication.contact_id == contact_id)

    if type:
        filters.append(Communication.type == type)

    if status:
        filters.append(Communication.status == status)

    if filters:
        query = query.where(and_(*filters))

    # Order by newest first
    query = query.order_by(Communication.created_at.desc())

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar()

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query)
    communications = result.scalars().all()

    # Calculate pagination values
    page = (skip // limit) + 1 if limit > 0 else 1
    pages = (total + limit - 1) // limit if limit > 0 else 1

    return CommunicationList(
        items=[CommunicationResponse.model_validate(c) for c in communications],
        total=total,
        page=page,
        page_size=limit,
        pages=pages,
    )


@router.get("/inbox/threads", response_model=List[Dict])
async def get_inbox_threads(
    db: DatabaseSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    sort_by: str = Query("recent_activity", regex="^(recent_activity|oldest_activity|recent_inbound|recent_outbound|newest|oldest)$"),
    status: Optional[str] = Query(None, description="Filter by status (ARCHIVED, READ, etc). Default excludes ARCHIVED."),
):
    """
    Get inbox grouped by contact threads

    Returns contacts with their latest message

    Visibility rules:
    - Owner: Can see all message threads
    - Admin: Can only see threads for contacts assigned to objects they have access to
    - User: Can only see threads for contacts assigned to them

    Sort options:
    - recent_activity: Most recent message (any direction) - default
    - oldest_activity: Oldest message first
    - recent_inbound: Most recent inbound message
    - recent_outbound: Most recent outbound message
    - newest: Newest contact created
    - oldest: Oldest contact created

    Status filtering:
    - If status is not provided, excludes ARCHIVED threads (shows active inbox)
    - Pass status='ARCHIVED' to show only archived threads
    - Pass status='all' to show all threads regardless of status
    """
    # Get accessible contact IDs based on user role
    accessible_contact_ids = await get_accessible_contact_ids(current_user, db)

    # If user has no accessible contacts, return empty list
    if accessible_contact_ids is not None and len(accessible_contact_ids) == 0:
        return []

    # Build WHERE clause based on status filter for the LATEST message
    where_clauses = []
    if status and status.upper() == "ARCHIVED":
        where_clauses.append("status = 'ARCHIVED'")
    elif not status or status.lower() != "all":
        # Default behavior: exclude archived threads (but include NULL status)
        # Note: In SQL, NULL != 'ARCHIVED' evaluates to NULL, so we must explicitly handle NULL
        where_clauses.append("(status != 'ARCHIVED' OR status IS NULL)")
    # If status == 'all', no status WHERE clause (show everything)

    # Build contact visibility filter
    # accessible_contact_ids is None for Owner (sees all), otherwise filter by contact IDs
    contact_filter = ""
    if accessible_contact_ids is not None:
        # Convert UUIDs to strings for SQL
        contact_id_list = ",".join([f"'{str(cid)}'" for cid in accessible_contact_ids])
        contact_filter = f"WHERE contact_id IN ({contact_id_list})"

    # Combine WHERE clauses for the outer query
    outer_where = ""
    if where_clauses:
        outer_where = "WHERE " + " AND ".join(where_clauses)

    # Get latest communication per contact using CTE
    # This ensures we FIRST get the latest message per contact,
    # THEN filter by that latest message's status
    # Cast enum columns to text to ensure consistent string output
    query = text(f"""
        WITH latest_messages AS (
            SELECT DISTINCT ON (contact_id)
                contact_id,
                id,
                type::text as type,
                direction::text as direction,
                subject,
                body,
                status::text as status,
                media_urls,
                created_at,
                sent_at
            FROM communications
            {contact_filter}
            ORDER BY contact_id, created_at DESC
        )
        SELECT * FROM latest_messages
        {outer_where}
    """)

    result = await db.execute(query)
    threads = result.fetchall()

    # Enrich with contact data
    thread_list = []
    for thread in threads:
        contact = await db.get(Contact, thread.contact_id)
        if contact:
            # Build comprehensive phones list from ALL available fields
            phones_list = []
            seen_phones = set()

            def add_phone(number, phone_type="mobile"):
                if number and number not in seen_phones:
                    seen_phones.add(number)
                    phones_list.append({"type": phone_type, "number": number})

            # Primary phone
            if contact.phone:
                add_phone(contact.phone, "primary")

            # JSONB phones array
            if contact.phones:
                for p in contact.phones:
                    if isinstance(p, dict):
                        add_phone(p.get("number"), p.get("type", "mobile"))
                    elif isinstance(p, str):
                        add_phone(p, "mobile")

            # Individual phone columns (mobile_phone, mobile_phone_2, ..., mobile_phone_30)
            for i in range(1, 31):
                suffix = "" if i == 1 else f"_{i}"
                for prefix in ["mobile_phone", "personal_phone", "direct_number"]:
                    col_name = f"{prefix}{suffix}" if i > 1 else prefix
                    phone_val = getattr(contact, col_name, None)
                    if phone_val:
                        add_phone(phone_val, prefix.replace("_", " "))

            # Build comprehensive emails list from ALL available fields
            emails_list = []
            seen_emails = set()

            def add_email(email_addr):
                if email_addr and "@" in str(email_addr) and email_addr not in seen_emails:
                    seen_emails.add(email_addr)
                    emails_list.append(email_addr)

            # Primary email
            if contact.email:
                add_email(contact.email)

            # Base email fields
            if hasattr(contact, 'business_email') and contact.business_email:
                add_email(contact.business_email)
            if hasattr(contact, 'personal_email') and contact.personal_email:
                add_email(contact.personal_email)
            if hasattr(contact, 'personal_verified_email') and contact.personal_verified_email:
                add_email(contact.personal_verified_email)
            if hasattr(contact, 'business_verified_email') and contact.business_verified_email:
                add_email(contact.business_verified_email)

            # Text fields containing multiple emails (comma or newline separated)
            for text_field in ['personal_emails', 'personal_verified_emails', 'business_verified_emails']:
                text_val = getattr(contact, text_field, None)
                if text_val:
                    # Split by common delimiters
                    for delimiter in [',', '\n', ';', '|']:
                        if delimiter in text_val:
                            for email in text_val.split(delimiter):
                                add_email(email.strip())
                            break
                    else:
                        # No delimiter found, try as single email
                        add_email(text_val.strip())

            # Individual email columns: personal_email_1 through personal_email_30
            for i in range(1, 31):
                col_name = f"personal_email_{i}"
                email_val = getattr(contact, col_name, None)
                if email_val:
                    add_email(email_val)

            # Individual email columns: business_email_2 through business_email_30 (note: starts at 2, not 1)
            for i in range(2, 31):
                col_name = f"business_email_{i}"
                email_val = getattr(contact, col_name, None)
                if email_val:
                    add_email(email_val)

            # Individual email columns: personal_verified_email_2 through personal_verified_email_30
            for i in range(2, 31):
                col_name = f"personal_verified_email_{i}"
                email_val = getattr(contact, col_name, None)
                if email_val:
                    add_email(email_val)

            # Individual email columns: business_verified_email_2 through business_verified_email_30
            for i in range(2, 31):
                col_name = f"business_verified_email_{i}"
                email_val = getattr(contact, col_name, None)
                if email_val:
                    add_email(email_val)

            thread_list.append({
                "contact": {
                    "id": str(contact.id),
                    "email": contact.email,
                    "phone": contact.phone,
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "company": contact.company,
                    "created_at": contact.created_at.isoformat() if hasattr(contact, 'created_at') else None,
                    # Include comprehensive phones/emails for compose recipient selection
                    "phones": phones_list,
                    "emails": emails_list,
                    "overflow_data": contact.overflow_data if hasattr(contact, 'overflow_data') else None,
                    "custom_fields": contact.custom_fields if hasattr(contact, 'custom_fields') else None,
                },
                "latest_message": {
                    "id": str(thread.id),
                    "type": thread.type,
                    "direction": thread.direction,
                    "subject": thread.subject,
                    "body": thread.body,
                    "status": thread.status,
                    "media_urls": thread.media_urls if thread.media_urls else [],
                    "created_at": thread.created_at.isoformat(),
                    "sent_at": thread.sent_at.isoformat() if thread.sent_at else None,
                },
            })

    # Apply sorting
    # Python's sort is stable, so we can use two-pass sorting for complex ordering:
    # 1. First sort by secondary key (date)
    # 2. Then sort by primary key (direction filter) - stable sort preserves date order
    if sort_by == "recent_activity":
        thread_list.sort(key=lambda x: x["latest_message"]["created_at"], reverse=True)
    elif sort_by == "oldest_activity":
        thread_list.sort(key=lambda x: x["latest_message"]["created_at"], reverse=False)
    elif sort_by == "recent_inbound":
        # Goal: Inbound messages first, sorted by most recent date within each group
        # Step 1: Sort all by date descending (most recent first)
        thread_list.sort(key=lambda x: x["latest_message"]["created_at"], reverse=True)
        # Step 2: Stable sort by direction priority (inbound=0 comes first)
        thread_list.sort(key=lambda x: 0 if x["latest_message"]["direction"] == "inbound" else 1)
    elif sort_by == "recent_outbound":
        # Goal: Outbound messages first, sorted by most recent date within each group
        # Step 1: Sort all by date descending (most recent first)
        thread_list.sort(key=lambda x: x["latest_message"]["created_at"], reverse=True)
        # Step 2: Stable sort by direction priority (outbound=0 comes first)
        thread_list.sort(key=lambda x: 0 if x["latest_message"]["direction"] == "outbound" else 1)
    elif sort_by == "newest":
        thread_list.sort(key=lambda x: x["contact"].get("created_at") or "", reverse=True)
    elif sort_by == "oldest":
        thread_list.sort(key=lambda x: x["contact"].get("created_at") or "", reverse=False)

    # Apply pagination after sorting
    paginated_threads = thread_list[skip:skip + limit]

    return paginated_threads


@router.post("/send", response_model=CommunicationResponse, status_code=status.HTTP_201_CREATED)
async def send_communication(
    request: Request,
    data: CommunicationCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Send communication (SMS, MMS, email, or web chat)

    Creates communication record and queues for delivery
    """
    # ENHANCED LOGGING: Track request source for debugging
    logger.info(
        f"[COMMUNICATIONS] POST /send - User: {current_user.email}, "
        f"Type: {data.type}, Contact: {data.contact_id}, "
        f"Has body: {bool(data.body)}, Referer: {request.headers.get('referer', 'N/A')}, "
        f"User-Agent: {request.headers.get('user-agent', 'N/A')[:100]}"
    )

    # Validate contact exists
    contact = await db.get(Contact, data.contact_id)
    if not contact:
        raise NotFoundError(f"Contact {data.contact_id} not found")

    # Validate based on type
    if data.type == CommunicationType.EMAIL:
        if not contact.email:
            raise ValidationError("Contact has no email address")
        if not data.subject or not data.body:
            raise ValidationError("Email requires subject and body")

    elif data.type in [CommunicationType.SMS, CommunicationType.MMS]:
        if not contact.phone:
            raise ValidationError("Contact has no phone number")
        if not data.body:
            raise ValidationError("SMS/MMS requires body")

    elif data.type == CommunicationType.WEB_CHAT:
        if not data.body:
            # ENHANCED LOGGING: Log the full call stack to identify where empty web chat requests come from
            logger.error(
                f"[COMMUNICATIONS] ValidationError: Web chat requires body. "
                f"User: {current_user.email}, Contact: {data.contact_id}, "
                f"Call stack:\n{''.join(traceback.format_stack())}"
            )
            raise ValidationError("Web chat requires body")

    # Auto-assign contact to staff member on first reply
    if not contact.assigned_to_id:
        contact.assigned_to_id = current_user.id
        db.add(contact)

    # Create communication record
    communication = Communication(
        type=data.type,
        direction=CommunicationDirection.OUTBOUND,
        contact_id=data.contact_id,
        user_id=current_user.id,
        subject=data.subject,
        body=data.body,
        media_urls=data.media_urls or [],
        status=CommunicationStatus.PENDING,
        thread_id=data.thread_id,
    )

    db.add(communication)
    await db.commit()
    await db.refresh(communication)

    # Queue for delivery based on type
    if data.type == CommunicationType.EMAIL:
        from app.models.email_sending_profile import EmailSendingProfile, UserEmailProfileAssignment
        from app.models.object_mailgun_settings import ObjectMailgunSettings
        from app.utils.encryption import decrypt_api_key

        # Get the email profile if provided
        from_email = None
        from_name = None
        mailgun_api_key = None
        mailgun_domain = None
        mailgun_region = "us"

        if data.profile_id:
            # Use the specified profile
            profile_result = await db.execute(
                select(EmailSendingProfile).where(
                    EmailSendingProfile.id == data.profile_id,
                    EmailSendingProfile.is_active == True
                )
            )
            profile = profile_result.scalar_one_or_none()

            if not profile:
                raise ValidationError("Email profile not found or inactive")

            # Check if user is assigned to this profile
            assignment_result = await db.execute(
                select(UserEmailProfileAssignment).where(
                    UserEmailProfileAssignment.user_id == current_user.id,
                    UserEmailProfileAssignment.profile_id == data.profile_id
                )
            )
            if not assignment_result.scalar_one_or_none():
                raise ValidationError("You are not assigned to this email profile")

            # Get the object's Mailgun settings
            if profile.object_id:
                mg_result = await db.execute(
                    select(ObjectMailgunSettings).where(
                        ObjectMailgunSettings.object_id == profile.object_id,
                        ObjectMailgunSettings.is_active == True
                    )
                )
                object_mailgun = mg_result.scalar_one_or_none()

                if object_mailgun:
                    from_email = f"{profile.local_part}@{object_mailgun.sending_domain}"
                    mailgun_api_key = decrypt_api_key(object_mailgun.api_key)
                    mailgun_domain = object_mailgun.receiving_domain
                    mailgun_region = object_mailgun.region
                else:
                    raise ValidationError("Email profile's object does not have Mailgun configured")
            else:
                # Legacy profile without object
                from_email = profile.email_address

            from_name = profile.display_name
        else:
            # Fallback to user's personal Mailgun settings (legacy)
            from app.models.mailgun_settings import MailgunSettings
            mg_result = await db.execute(
                select(MailgunSettings).where(
                    MailgunSettings.user_id == current_user.id,
                    MailgunSettings.is_active == True
                )
            )
            user_mailgun = mg_result.scalar_one_or_none()

            if user_mailgun:
                from_email = user_mailgun.from_email
                from_name = user_mailgun.from_name
                mailgun_api_key = decrypt_api_key(user_mailgun.api_key)
                mailgun_domain = user_mailgun.domain
                mailgun_region = user_mailgun.region

        if not from_email:
            raise ValidationError("No email profile selected and no personal Mailgun settings configured")

        # Determine recipient email (priority: contact.email > personal_email > business_email)
        to_email = contact.email or contact.personal_email or contact.business_email
        if not to_email:
            raise ValidationError("Contact has no email address")

        # Update communication with from/to addresses
        communication.from_address = from_email
        communication.to_address = to_email
        await db.commit()

        # Send email synchronously (no Celery/Redis required)
        # This approach works in development without running a Celery worker
        settings = get_settings()

        try:
            # Create MailgunService with object-level credentials
            mailgun = MailgunService()

            # Override with object-specific Mailgun credentials if available
            if mailgun_api_key and mailgun_domain:
                region = (mailgun_region or "us").lower()
                base_url = "https://api.mailgun.net" if region == "us" else "https://api.eu.mailgun.net"
                mailgun.api_key = mailgun_api_key
                mailgun.domain = mailgun_domain
                mailgun.base_url = f"{base_url}/v3/{mailgun_domain}"
                mailgun.auth = ("api", mailgun_api_key)
                logger.info(f"[EMAIL] Using Object-level Mailgun (domain: {mailgun_domain}, region: {region})")

            # Send email directly via Mailgun API
            result = await mailgun.send_email(
                to_email=to_email,
                subject=data.subject,
                html_body=data.body,
                from_email=from_email,
                from_name=from_name,
                tags=["crm_reply", f"contact_{contact.id}", f"user_{current_user.id}"],
            )

            # Update communication as SENT
            communication.status = CommunicationStatus.SENT
            communication.sent_at = datetime.now(timezone.utc)
            communication.external_id = result.get("message_id")
            communication.provider_metadata = {
                "provider": "mailgun",
                "message_id": result.get("message_id"),
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.commit()
            await db.refresh(communication)

            logger.info(f"[EMAIL] Sent successfully: {result.get('message_id')} to {to_email}")

        except Exception as e:
            # Update communication as FAILED
            logger.error(f"[EMAIL] Failed to send: {str(e)}")
            communication.status = CommunicationStatus.FAILED
            communication.failed_at = datetime.now(timezone.utc)
            communication.provider_metadata = {
                "provider": "mailgun",
                "error": str(e),
                "failed_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.commit()
            await db.refresh(communication)

            # Don't raise - return the communication with FAILED status
            # This allows the frontend to show the error appropriately

    elif data.type == CommunicationType.SMS:
        send_sms_task.delay(
            communication_id=str(communication.id),
            to_number=contact.phone,
            text=data.body,
            tag=f"contact_{contact.id}",
        )

    elif data.type == CommunicationType.MMS:
        if not data.media_urls:
            raise ValidationError("MMS requires media_urls")

        send_mms_task.delay(
            communication_id=str(communication.id),
            to_number=contact.phone,
            text=data.body,
            media_urls=data.media_urls,
            tag=f"contact_{contact.id}",
        )

    elif data.type == CommunicationType.WEB_CHAT:
        # Send via WebSocket immediately
        connection_manager = get_connection_manager()

        message_data = {
            "type": "new_message",
            "communication_id": str(communication.id),
            "contact_id": str(contact.id),
            "body": data.body,
            "media_urls": data.media_urls or [],
            "user_id": str(current_user.id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Send to contact (if online)
        await connection_manager.send_contact_message(
            message_data,
            str(contact.id),
            exclude_user_id=str(current_user.id),
        )

        # Update status immediately for web chat
        communication.status = CommunicationStatus.DELIVERED
        communication.delivered_at = datetime.now(timezone.utc)
        await db.commit()

    # Broadcast to staff for real-time updates (all message types)
    connection_manager = get_connection_manager()
    await connection_manager.broadcast_to_staff({
        "type": "message_sent" if data.type == CommunicationType.EMAIL else "new_message",
        "contact_id": str(contact.id),
        "communication_id": str(communication.id),
        "message_type": data.type.value,
    })

    return CommunicationResponse.model_validate(communication)


@router.get("/{communication_id}", response_model=CommunicationResponse)
async def get_communication(
    communication_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get single communication by ID"""
    communication = await db.get(Communication, communication_id)

    if not communication:
        raise NotFoundError(f"Communication {communication_id} not found")

    return CommunicationResponse.model_validate(communication)


@router.patch("/{communication_id}/read", response_model=CommunicationResponse)
async def mark_communication_as_read(
    communication_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Mark a communication as read

    Updates the status to 'read' and sets read_at timestamp
    """
    communication = await db.get(Communication, communication_id)

    if not communication:
        raise NotFoundError(f"Communication {communication_id} not found")

    # Only mark as read if not already read
    if communication.status != CommunicationStatus.READ:
        communication.status = CommunicationStatus.READ
        communication.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(communication)

    return CommunicationResponse.model_validate(communication)


@router.patch("/{communication_id}/archive", response_model=CommunicationResponse)
async def archive_communication(
    communication_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Archive a communication

    Updates the status to 'archived' - removes from main inbox view
    """
    communication = await db.get(Communication, communication_id)

    if not communication:
        raise NotFoundError(f"Communication {communication_id} not found")

    # Archive the communication
    communication.status = CommunicationStatus.ARCHIVED
    await db.commit()
    await db.refresh(communication)

    return CommunicationResponse.model_validate(communication)


@router.patch("/{communication_id}/unarchive", response_model=CommunicationResponse)
async def unarchive_communication(
    communication_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Unarchive a communication

    Restores communication from archived status:
    - If was previously read, restores to 'read' status
    - Otherwise, restores to 'delivered' status
    """
    communication = await db.get(Communication, communication_id)

    if not communication:
        raise NotFoundError(f"Communication {communication_id} not found")

    if communication.status != CommunicationStatus.ARCHIVED:
        raise ValidationError("Communication is not archived")

    # Restore to previous status - use 'read' if read_at is set, otherwise 'delivered'
    if communication.read_at:
        communication.status = CommunicationStatus.READ
    else:
        communication.status = CommunicationStatus.DELIVERED

    await db.commit()
    await db.refresh(communication)

    return CommunicationResponse.model_validate(communication)


@router.get("/contact/{contact_id}", response_model=CommunicationList)
async def get_contact_communications(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Get all communications for a specific contact

    Returns conversation history across all channels
    """
    # Validate contact exists
    contact = await db.get(Contact, contact_id)
    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    # Get communications
    query = (
        select(Communication)
        .options(selectinload(Communication.user))
        .where(Communication.contact_id == contact_id)
        .order_by(Communication.created_at.asc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    communications = result.scalars().all()

    # Get total count
    count_result = await db.execute(
        select(func.count()).where(Communication.contact_id == contact_id)
    )
    total = count_result.scalar()

    # Calculate pagination values
    page = (skip // limit) + 1 if limit > 0 else 1
    pages = (total + limit - 1) // limit if limit > 0 else 1

    return CommunicationList(
        items=[CommunicationResponse.model_validate(c) for c in communications],
        total=total,
        page=page,
        page_size=limit,
        pages=pages,
    )


@router.websocket("/ws/{token}")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: DatabaseSession,
):
    """
    WebSocket endpoint for real-time web chat

    REQUIRES AUTHENTICATION: Must provide valid widget token in URL path

    Features:
    - Token-based authentication
    - Real-time message delivery
    - Typing indicators
    - Presence updates
    """
    connection_manager = get_connection_manager()

    # Validate token BEFORE accepting connection
    payload = decode_token(token)
    if not payload or payload.get("type") != "widget":
        # Invalid token - reject connection
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    # Extract contact_id from token
    contact_id = payload.get("sub")
    if not contact_id:
        await websocket.close(code=4002, reason="Invalid token payload")
        return

    # Verify contact exists in database
    contact = await db.get(Contact, contact_id)
    if not contact:
        await websocket.close(code=4003, reason="Contact not found")
        return

    # Accept connection with contact_id as user_id
    await connection_manager.connect(websocket, contact_id)

    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_json()

            message_type = data.get("type")

            if message_type == "typing":
                # Handle typing indicator
                is_typing = data.get("is_typing", False)

                await connection_manager.set_typing_indicator(
                    user_id=contact_id,
                    contact_id=contact_id,
                    is_typing=is_typing,
                )

            elif message_type == "message":
                # Handle new message (will be processed via API endpoint)
                pass

            elif message_type == "ping":
                # Keepalive ping
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, contact_id)


@router.websocket("/ws/crm/{token}")
async def websocket_crm_endpoint(
    websocket: WebSocket,
    token: str,
):
    """
    WebSocket endpoint for CRM staff users

    REQUIRES AUTHENTICATION: Must provide valid staff access token in path parameter

    Features:
    - Real-time notifications for new messages
    - Cross-contact message updates
    - Typing indicators
    - Presence updates
    """
    connection_manager = get_connection_manager()

    # Validate staff token BEFORE accepting connection
    from app.core.security import decode_token, verify_token_type
    from app.api.dependencies import get_db

    payload = decode_token(token)
    if not payload or not verify_token_type(payload, "access"):
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    # Get user email from token
    email = payload.get("sub")
    if not email:
        await websocket.close(code=4002, reason="Invalid token payload")
        return

    # Manually create database session for authentication check only
    db_gen = get_db()
    db = await db_gen.__anext__()

    try:
        # Fetch user from database by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            await websocket.close(code=4003, reason="User not found")
            return

        if not user.is_active:
            await websocket.close(code=4004, reason="User account inactive")
            return

        # Allow owner, admin, and regular users to access CRM WebSocket
        if user.role not in ["owner", "admin", "user"]:
            await websocket.close(code=4005, reason="CRM user access required")
            return

        # Store user_email for later use
        user_email = user.email
    finally:
        # Close database session before entering WebSocket loop
        await db_gen.aclose()

    # Accept and register connection with user's email as identifier
    await connection_manager.connect(websocket, user_email)

    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_json()

            message_type = data.get("type")

            if message_type == "ping":
                # Keepalive ping
                await websocket.send_json({"type": "pong"})

            elif message_type == "subscribe":
                # Staff can subscribe to specific contacts
                contact_id = data.get("contact_id")
                # Handle subscription logic if needed

    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, user_email)


# Widget Authentication Schemas
class WidgetAuthRequest(BaseModel):
    """Widget authentication request"""
    name: str = Field(..., min_length=1, max_length=100, description="Visitor name")
    email: EmailStr = Field(..., description="Visitor email address")
    phone: Optional[str] = Field(None, max_length=20, description="Optional phone number")


class WidgetAuthResponse(BaseModel):
    """Widget authentication response"""
    token: str = Field(..., description="JWT token for widget authentication")
    contact_id: str = Field(..., description="Contact UUID")
    existing_messages: List[Dict] = Field(default_factory=list, description="Existing messages if returning visitor")


@router.post("/widget/auth", response_model=WidgetAuthResponse, status_code=status.HTTP_200_OK)
async def authenticate_widget(
    data: WidgetAuthRequest,
    db: DatabaseSession,
):
    """
    Authenticate widget visitor

    Public endpoint - does not require authentication.
    Used by widget to authenticate visitors before allowing chat.

    Flow:
    1. Check if email exists in contacts
    2. If exists: Load existing contact + messages
    3. If new: Create new contact
    4. Generate JWT token with contact_id
    5. Return token + contact_id + existing messages (if any)

    Token expires in 30 days (for returning visitors)
    """
    # Check if contact with this email exists
    stmt = select(Contact).where(Contact.email == data.email)
    result = await db.execute(stmt)
    contact = result.scalar_one_or_none()

    existing_messages = []

    if contact:
        # Returning visitor - load existing messages
        msg_stmt = (
            select(Communication)
            .where(Communication.contact_id == contact.id)
            .order_by(Communication.created_at.asc())
        )
        msg_result = await db.execute(msg_stmt)
        messages = msg_result.scalars().all()

        # Convert to dict format for widget
        existing_messages = [
            {
                "id": str(msg.id),
                "content": msg.body,
                "sender": "user" if msg.direction == CommunicationDirection.INBOUND else "agent",
                "timestamp": msg.created_at.isoformat(),
                "mediaUrls": msg.media_urls or [],
            }
            for msg in messages
        ]

        # Update contact info if changed
        if contact.first_name != data.name or contact.phone != data.phone:
            # Split name into first/last (simple split on first space)
            name_parts = data.name.strip().split(" ", 1)
            contact.first_name = name_parts[0]
            contact.last_name = name_parts[1] if len(name_parts) > 1 else ""
            contact.phone = data.phone
            await db.commit()
    else:
        # New visitor - create contact
        # Split name into first/last (simple split on first space)
        name_parts = data.name.strip().split(" ", 1)

        contact = Contact(
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
            email=data.email,
            phone=data.phone,
            source="WEBSITE",
            status="LEAD",
        )
        db.add(contact)
        await db.commit()
        await db.refresh(contact)

    # Generate JWT token
    token = create_widget_token(str(contact.id))

    return WidgetAuthResponse(
        token=token,
        contact_id=str(contact.id),
        existing_messages=existing_messages,
    )


@router.get("/widget/messages/{contact_id}", response_model=CommunicationList)
async def get_widget_messages(
    contact_id: UUID,
    db: DatabaseSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Get conversation history for widget (public endpoint)

    Public endpoint - does not require authentication.
    Used by website chat widget to load existing conversation history for returning visitors.
    """
    # Validate contact exists
    contact = await db.get(Contact, contact_id)
    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    # Get communications
    query = (
        select(Communication)
        .where(Communication.contact_id == contact_id)
        .order_by(Communication.created_at.asc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    communications = result.scalars().all()

    # Get total count
    count_result = await db.execute(
        select(func.count()).where(Communication.contact_id == contact_id)
    )
    total = count_result.scalar()

    # Calculate pagination values
    page = (skip // limit) + 1 if limit > 0 else 1
    pages = (total + limit - 1) // limit if limit > 0 else 1

    return CommunicationList(
        items=[CommunicationResponse.model_validate(c) for c in communications],
        total=total,
        page=page,
        page_size=limit,
        pages=pages,
    )


@router.post("/webchat", response_model=CommunicationResponse, status_code=status.HTTP_201_CREATED)
async def receive_webchat_message(
    data: CommunicationCreate,
    db: DatabaseSession,
):
    """
    Public endpoint for receiving webchat messages from website visitors

    Does not require authentication - used by website chat widget
    Creates INBOUND communication record
    """
    # Validate contact exists
    contact = await db.get(Contact, data.contact_id)
    if not contact:
        raise NotFoundError(f"Contact {data.contact_id} not found")

    # Validate message body
    if not data.body:
        raise ValidationError("Message body is required")

    # Create communication record as INBOUND (from contact to us)
    communication = Communication(
        type=CommunicationType.WEB_CHAT,
        direction=CommunicationDirection.INBOUND,
        contact_id=data.contact_id,
        user_id=None,  # No user association for public webchat
        subject=data.subject,
        body=data.body,
        media_urls=data.media_urls or [],
        status=CommunicationStatus.DELIVERED,  # Immediately delivered to inbox
        thread_id=data.thread_id,
        delivered_at=datetime.now(timezone.utc),
    )

    db.add(communication)
    await db.commit()
    await db.refresh(communication)

    # Notify staff via WebSocket (if they're online)
    connection_manager = get_connection_manager()

    message_data = {
        "type": "new_webchat_message",
        "communication_id": str(communication.id),
        "contact_id": str(contact.id),
        "contact_name": f"{contact.first_name} {contact.last_name}".strip() or contact.email,
        "body": data.body,
        "thread_id": str(data.thread_id) if data.thread_id else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Broadcast to all connected staff members
    await connection_manager.broadcast_to_staff(message_data)

    return CommunicationResponse.model_validate(communication)


@router.post("/upload", response_model=Dict[str, List[str]], status_code=status.HTTP_200_OK)
async def upload_communication_files(
    files: List[UploadFile] = File(...),
):
    """
    Upload files to Cloudinary for use in communications

    Public endpoint - accessible from website chat widget
    Returns array of secure URLs that can be used in media_urls

    Maximum file size: 25MB per file
    Supported formats: images (jpg, png, gif, webp), PDF, documents
    """
    # Validate file count
    if len(files) > 10:
        raise ValidationError("Maximum 10 files allowed per upload")

    # Validate file sizes (25MB max)
    max_size = 25 * 1024 * 1024  # 25MB in bytes
    for file in files:
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()  # Get position (file size)
        file.file.seek(0)  # Reset to beginning

        if file_size > max_size:
            raise ValidationError(f"File {file.filename} exceeds 25MB limit")

    # Upload files to local storage (dev) or cloud storage (prod)
    try:
        urls = await upload_files(files, subfolder="chat")
        return {"urls": urls}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )
