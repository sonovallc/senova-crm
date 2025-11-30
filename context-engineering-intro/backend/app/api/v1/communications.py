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
from app.schemas.communication import (
    CommunicationCreate,
    CommunicationResponse,
    CommunicationList,
)
from app.tasks.email_tasks import send_email_task
from app.tasks.sms_tasks import send_sms_task, send_mms_task
from app.services.websocket_service import get_connection_manager
from app.services.local_storage_service import upload_files
from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import create_widget_token, decode_token
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

    Returns paginated list of communications with filtering options
    """
    # Build query
    query = select(Communication).options(
        selectinload(Communication.contact),
        selectinload(Communication.user),
    )

    # Apply filters
    filters = []

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
    # Build WHERE clause based on status filter for the LATEST message
    where_clause = ""
    if status and status.upper() == "ARCHIVED":
        where_clause = "WHERE status = 'ARCHIVED'"
    elif not status or status.lower() != "all":
        # Default behavior: exclude archived threads
        where_clause = "WHERE status != 'ARCHIVED'"
    # If status == 'all', no WHERE clause (show everything)

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
            ORDER BY contact_id, created_at DESC
        )
        SELECT * FROM latest_messages
        {where_clause}
    """)

    result = await db.execute(query)
    threads = result.fetchall()

    # Enrich with contact data
    thread_list = []
    for thread in threads:
        contact = await db.get(Contact, thread.contact_id)
        if contact:
            thread_list.append({
                "contact": {
                    "id": str(contact.id),
                    "email": contact.email,
                    "phone": contact.phone,
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "company": contact.company,
                    "created_at": contact.created_at.isoformat() if hasattr(contact, 'created_at') else None,
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
        # Get user's Mailgun settings for email reply
        from app.models.mailgun_settings import MailgunSettings
        from app.utils.encryption import decrypt_api_key

        mg_result = await db.execute(
            select(MailgunSettings).where(
                MailgunSettings.user_id == current_user.id,
                MailgunSettings.is_active == True
            )
        )
        mailgun_settings = mg_result.scalar_one_or_none()

        if not mailgun_settings:
            raise ValidationError("Mailgun not configured. Please configure in Settings.")

        # Determine recipient email (priority: contact.email > personal_email > business_email)
        to_email = contact.email or contact.personal_email or contact.business_email
        if not to_email:
            raise ValidationError("Contact has no email address")

        # Update communication with from/to addresses
        communication.from_address = mailgun_settings.from_email
        communication.to_address = to_email
        await db.commit()

        # Queue email with user's Mailgun settings
        send_email_task.delay(
            communication_id=str(communication.id),
            to_email=to_email,
            subject=data.subject,
            html_body=data.body,
            from_email=mailgun_settings.from_email,
            from_name=mailgun_settings.from_name,
            tags=["crm_reply", f"contact_{contact.id}", f"user_{current_user.id}"],
            user_id=str(current_user.id),  # Pass user_id for per-user Mailgun config
        )

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

    Maximum file size: 10MB per file
    Supported formats: images (jpg, png, gif, webp), PDF, documents
    """
    # Validate file count
    if len(files) > 10:
        raise ValidationError("Maximum 10 files allowed per upload")

    # Validate file sizes (10MB max)
    max_size = 10 * 1024 * 1024  # 10MB in bytes
    for file in files:
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()  # Get position (file size)
        file.file.seek(0)  # Reset to beginning

        if file_size > max_size:
            raise ValidationError(f"File {file.filename} exceeds 10MB limit")

    # Upload files to local storage (dev) or cloud storage (prod)
    try:
        urls = await upload_files(files, subfolder="chat")
        return {"urls": urls}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )
