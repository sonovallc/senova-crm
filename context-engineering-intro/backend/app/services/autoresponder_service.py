"""
Autoresponder Service

Handles automatic email sending based on triggers, sequences, and schedules.
"""

import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy import select, update, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config.database import AsyncSessionLocal
from app.models.autoresponder import (
    Autoresponder,
    AutoresponderSequence,
    AutoresponderExecution,
    TriggerType,
    ExecutionStatus,
)
from app.models.contact import Contact
from app.models.user import User
from app.models.email_templates import EmailTemplate
from app.models.tag import Tag
from app.services.email_campaign_service import replace_template_variables
from app.services.mailgun_service import MailgunService

logger = logging.getLogger(__name__)


async def check_and_queue_autoresponders(
    trigger_type: TriggerType,
    contact_id: UUID,
    trigger_data: Optional[Dict[str, Any]] = None,
    db: Optional[AsyncSession] = None
) -> int:
    """
    Check for active autoresponders matching the trigger and queue them.

    Args:
        trigger_type: Type of trigger (new_contact, tag_added, etc.)
        contact_id: Contact that triggered the autoresponder
        trigger_data: Additional trigger data (e.g., tag_id for tag_added)
        db: Database session (optional, will create new if not provided)

    Returns:
        Number of autoresponders queued
    """
    should_close_db = False
    if db is None:
        db = AsyncSessionLocal()
        should_close_db = True

    try:
        # Find active autoresponders for this trigger type
        query = select(Autoresponder).where(
            and_(
                Autoresponder.is_active == True,
                Autoresponder.trigger_type == trigger_type
            )
        ).options(selectinload(Autoresponder.sequences))

        result = await db.execute(query)
        autoresponders = result.scalars().all()

        queued_count = 0

        for autoresponder in autoresponders:
            # Check if trigger config matches
            if not await _check_trigger_match(autoresponder, trigger_data, db):
                continue

            # Check if already executed for this contact (prevent duplicates)
            existing_query = select(AutoresponderExecution).where(
                and_(
                    AutoresponderExecution.autoresponder_id == autoresponder.id,
                    AutoresponderExecution.contact_id == contact_id,
                    AutoresponderExecution.sequence_step == 0  # Main email
                )
            )
            existing_result = await db.execute(existing_query)
            if existing_result.scalar_one_or_none():
                logger.info(f"Autoresponder {autoresponder.id} already executed for contact {contact_id}")
                continue

            # Queue the autoresponder
            await queue_autoresponder(autoresponder.id, contact_id, db)
            queued_count += 1

        return queued_count

    finally:
        if should_close_db:
            await db.close()


async def _check_trigger_match(
    autoresponder: Autoresponder,
    trigger_data: Optional[Dict[str, Any]],
    db: AsyncSession
) -> bool:
    """
    Check if trigger configuration matches the event.

    Args:
        autoresponder: Autoresponder to check
        trigger_data: Trigger event data
        db: Database session

    Returns:
        True if trigger matches
    """
    if autoresponder.trigger_type == TriggerType.NEW_CONTACT:
        # Always match for new contacts
        return True

    elif autoresponder.trigger_type == TriggerType.TAG_ADDED:
        # Check if tag_id matches
        if not trigger_data or 'tag_id' not in trigger_data:
            return False
        required_tag_id = autoresponder.trigger_config.get('tag_id')
        return str(trigger_data['tag_id']) == str(required_tag_id)

    elif autoresponder.trigger_type == TriggerType.DATE_BASED:
        # Date-based triggers are checked by scheduled task, not here
        return False

    elif autoresponder.trigger_type in (TriggerType.APPOINTMENT_BOOKED, TriggerType.APPOINTMENT_COMPLETED):
        # Appointment triggers would be checked here
        # For now, always match
        return True

    return False


async def queue_autoresponder(
    autoresponder_id: UUID,
    contact_id: UUID,
    db: Optional[AsyncSession] = None,
    sequence_step: int = 0,
    scheduled_for: Optional[datetime] = None
) -> AutoresponderExecution:
    """
    Queue an autoresponder execution for a contact.

    Args:
        autoresponder_id: Autoresponder to execute
        contact_id: Target contact
        db: Database session (optional)
        sequence_step: Sequence step number (0 = main email)
        scheduled_for: When to send (None = immediate)

    Returns:
        Created execution record
    """
    should_close_db = False
    if db is None:
        db = AsyncSessionLocal()
        should_close_db = True

    try:
        if scheduled_for is None:
            scheduled_for = datetime.utcnow()

        execution = AutoresponderExecution(
            autoresponder_id=autoresponder_id,
            contact_id=contact_id,
            sequence_step=sequence_step,
            triggered_at=datetime.utcnow(),
            scheduled_for=scheduled_for,
            status=ExecutionStatus.PENDING
        )

        db.add(execution)
        await db.commit()
        await db.refresh(execution)

        logger.info(f"Queued autoresponder {autoresponder_id} for contact {contact_id}")

        return execution

    finally:
        if should_close_db:
            await db.close()


async def process_autoresponder_queue(batch_size: int = 50) -> Dict[str, int]:
    """
    Process pending autoresponder executions.

    Args:
        batch_size: Number of executions to process in one batch

    Returns:
        Statistics dict with sent, failed, skipped counts
    """
    async with AsyncSessionLocal() as db:
        stats = {"sent": 0, "failed": 0, "skipped": 0}

        # Get pending executions that are due
        query = select(AutoresponderExecution).where(
            and_(
                AutoresponderExecution.status == ExecutionStatus.PENDING,
                AutoresponderExecution.scheduled_for <= datetime.utcnow()
            )
        ).limit(batch_size).options(
            selectinload(AutoresponderExecution.autoresponder).selectinload(Autoresponder.sequences),
            selectinload(AutoresponderExecution.contact)
        )

        result = await db.execute(query)
        executions = result.scalars().all()

        logger.info(f"Processing {len(executions)} pending autoresponder executions")

        for execution in executions:
            try:
                # Send the email
                success = await send_autoresponder_email(execution.id, db)

                if success:
                    stats["sent"] += 1

                    # If sequences enabled, schedule next step
                    if execution.autoresponder.sequence_enabled and execution.sequence_step == 0:
                        await _schedule_sequence_steps(execution, db)
                else:
                    stats["failed"] += 1

            except Exception as e:
                logger.error(f"Error processing execution {execution.id}: {e}")
                stats["failed"] += 1
                # Mark as failed
                execution.status = ExecutionStatus.FAILED
                execution.error_message = str(e)
                await db.commit()

        return stats


async def send_autoresponder_email(
    execution_id: UUID,
    db: Optional[AsyncSession] = None
) -> bool:
    """
    Send an individual autoresponder email.

    Args:
        execution_id: Execution record ID
        db: Database session (optional)

    Returns:
        True if sent successfully
    """
    should_close_db = False
    if db is None:
        db = AsyncSessionLocal()
        should_close_db = True

    try:
        # Load execution with relationships
        query = select(AutoresponderExecution).where(
            AutoresponderExecution.id == execution_id
        ).options(
            selectinload(AutoresponderExecution.autoresponder).selectinload(Autoresponder.template),
            selectinload(AutoresponderExecution.autoresponder).selectinload(Autoresponder.sequences),
            selectinload(AutoresponderExecution.contact).selectinload(Contact.assigned_to)
        )

        result = await db.execute(query)
        execution = result.scalar_one_or_none()

        if not execution:
            logger.error(f"Execution {execution_id} not found")
            return False

        autoresponder = execution.autoresponder
        contact = execution.contact

        # Check if contact is unsubscribed
        if hasattr(contact, 'unsubscribed') and contact.unsubscribed:
            logger.info(f"Contact {contact.id} is unsubscribed, skipping")
            execution.status = ExecutionStatus.SKIPPED
            await db.commit()
            return False

        # Check if contact has email
        if not contact.email:
            logger.warning(f"Contact {contact.id} has no email, skipping")
            execution.status = ExecutionStatus.SKIPPED
            await db.commit()
            return False

        # GDPR/CAN-SPAM: Check if email is suppressed
        from app.services.suppression_sync import is_suppressed

        if await is_suppressed(contact.email, db):
            logger.info(f"Skipping suppressed email: {contact.email}")
            execution.status = ExecutionStatus.SKIPPED
            await db.commit()
            return False

        # Determine email content (main email or sequence step)
        if execution.sequence_step == 0:
            # Main email
            subject = autoresponder.subject
            body_html = autoresponder.body_html
            template = autoresponder.template
        else:
            # Sequence step
            sequence = next(
                (s for s in autoresponder.sequences if s.sequence_order == execution.sequence_step),
                None
            )
            if not sequence:
                logger.error(f"Sequence step {execution.sequence_step} not found")
                execution.status = ExecutionStatus.FAILED
                execution.error_message = "Sequence step not found"
                await db.commit()
                return False

            subject = sequence.subject
            body_html = sequence.body_html
            template = sequence.template

        # Get template content if using template
        if template:
            subject = template.subject
            body_html = template.body_html

        # Get sender user
        sender_user = None
        if autoresponder.send_from_user and contact.assigned_to:
            sender_user = contact.assigned_to
        else:
            # Get autoresponder creator
            creator_query = select(User).where(User.id == autoresponder.created_by)
            creator_result = await db.execute(creator_query)
            sender_user = creator_result.scalar_one_or_none()

        # Replace variables
        body_html = replace_template_variables(body_html, contact, sender_user)
        subject = replace_template_variables(subject, contact, sender_user)

        # Get Mailgun settings
        mailgun_query = select(MailgunSettings).where(
            MailgunSettings.user_id == (sender_user.id if sender_user else autoresponder.created_by)
        )
        mailgun_result = await db.execute(mailgun_query)
        mailgun_settings = mailgun_result.scalar_one_or_none()

        if not mailgun_settings or not mailgun_settings.api_key:
            logger.error("Mailgun settings not configured")
            execution.status = ExecutionStatus.FAILED
            execution.error_message = "Mailgun not configured"
            await db.commit()
            return False

        # Send via Mailgun
        mailgun_service = MailgunService(
            api_key=mailgun_settings.api_key,
            domain=mailgun_settings.domain
        )

        from_email = sender_user.email if sender_user else mailgun_settings.from_email

        tags = [
            f"autoresponder:{autoresponder.id}",
            f"sequence:{execution.sequence_step}"
        ]

        response = await mailgun_service.send_email(
            to=contact.email,
            subject=subject,
            html=body_html,
            from_email=from_email,
            tags=tags
        )

        if response.get('id'):
            # Success
            execution.status = ExecutionStatus.SENT
            execution.executed_at = datetime.utcnow()
            execution.mailgun_message_id = response.get('id')

            # Update autoresponder stats
            autoresponder.total_sent += 1
            autoresponder.total_executions += 1

            await db.commit()
            logger.info(f"Sent autoresponder {autoresponder.id} to {contact.email}")
            return True
        else:
            # Failed
            execution.status = ExecutionStatus.FAILED
            execution.error_message = "Mailgun send failed"
            autoresponder.total_failed += 1
            autoresponder.total_executions += 1
            await db.commit()
            return False

    except Exception as e:
        logger.error(f"Error sending autoresponder email: {e}")
        return False

    finally:
        if should_close_db:
            await db.close()


async def _schedule_sequence_steps(
    execution: AutoresponderExecution,
    db: AsyncSession
) -> None:
    """
    Schedule follow-up sequence steps after main email is sent.

    Args:
        execution: Main email execution record
        db: Database session
    """
    autoresponder = execution.autoresponder

    if not autoresponder.sequences:
        return

    base_time = datetime.utcnow()

    for sequence in autoresponder.sequences:
        # Calculate scheduled time
        delay_hours = (sequence.delay_days * 24) + sequence.delay_hours
        scheduled_for = base_time + timedelta(hours=delay_hours)

        # Create execution record
        sequence_execution = AutoresponderExecution(
            autoresponder_id=autoresponder.id,
            contact_id=execution.contact_id,
            sequence_step=sequence.sequence_order,
            triggered_at=datetime.utcnow(),
            scheduled_for=scheduled_for,
            status=ExecutionStatus.PENDING
        )

        db.add(sequence_execution)

    await db.commit()
    logger.info(f"Scheduled {len(autoresponder.sequences)} sequence steps for contact {execution.contact_id}")


async def check_date_based_triggers() -> int:
    """
    Check for date-based trigger matches and queue autoresponders.

    This should be run daily as a scheduled task.

    Returns:
        Number of autoresponders queued
    """
    async with AsyncSessionLocal() as db:
        # Get all active date-based autoresponders
        query = select(Autoresponder).where(
            and_(
                Autoresponder.is_active == True,
                Autoresponder.trigger_type == TriggerType.DATE_BASED
            )
        )

        result = await db.execute(query)
        autoresponders = result.scalars().all()

        queued_count = 0

        for autoresponder in autoresponders:
            trigger_config = autoresponder.trigger_config
            field = trigger_config.get('field')  # e.g., 'birthday', 'created_at'
            days_before = trigger_config.get('days_before', 0)

            # Calculate target date
            target_date = datetime.utcnow().date() + timedelta(days=days_before)

            # Find contacts matching the date
            # This is simplified - in production you'd query based on the field
            # For now, we'll skip this implementation as it requires more context
            # about which date fields exist on contacts

            logger.info(f"Checking date-based trigger for {autoresponder.name}")

        return queued_count


async def get_autoresponder_stats(
    autoresponder_id: UUID,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Get statistics for an autoresponder.

    Args:
        autoresponder_id: Autoresponder ID
        db: Database session

    Returns:
        Statistics dictionary
    """
    # Count executions by status
    total_query = select(func.count(AutoresponderExecution.id)).where(
        AutoresponderExecution.autoresponder_id == autoresponder_id
    )
    total_result = await db.execute(total_query)
    total_executions = total_result.scalar() or 0

    sent_query = select(func.count(AutoresponderExecution.id)).where(
        and_(
            AutoresponderExecution.autoresponder_id == autoresponder_id,
            AutoresponderExecution.status == ExecutionStatus.SENT
        )
    )
    sent_result = await db.execute(sent_query)
    total_sent = sent_result.scalar() or 0

    pending_query = select(func.count(AutoresponderExecution.id)).where(
        and_(
            AutoresponderExecution.autoresponder_id == autoresponder_id,
            AutoresponderExecution.status == ExecutionStatus.PENDING
        )
    )
    pending_result = await db.execute(pending_query)
    total_pending = pending_result.scalar() or 0

    failed_query = select(func.count(AutoresponderExecution.id)).where(
        and_(
            AutoresponderExecution.autoresponder_id == autoresponder_id,
            AutoresponderExecution.status == ExecutionStatus.FAILED
        )
    )
    failed_result = await db.execute(failed_query)
    total_failed = failed_result.scalar() or 0

    skipped_query = select(func.count(AutoresponderExecution.id)).where(
        and_(
            AutoresponderExecution.autoresponder_id == autoresponder_id,
            AutoresponderExecution.status == ExecutionStatus.SKIPPED
        )
    )
    skipped_result = await db.execute(skipped_query)
    total_skipped = skipped_result.scalar() or 0

    # Last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    last_7_query = select(func.count(AutoresponderExecution.id)).where(
        and_(
            AutoresponderExecution.autoresponder_id == autoresponder_id,
            AutoresponderExecution.created_at >= seven_days_ago
        )
    )
    last_7_result = await db.execute(last_7_query)
    executions_last_7_days = last_7_result.scalar() or 0

    # Last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    last_30_query = select(func.count(AutoresponderExecution.id)).where(
        and_(
            AutoresponderExecution.autoresponder_id == autoresponder_id,
            AutoresponderExecution.created_at >= thirty_days_ago
        )
    )
    last_30_result = await db.execute(last_30_query)
    executions_last_30_days = last_30_result.scalar() or 0

    success_rate = (total_sent / total_executions * 100) if total_executions > 0 else 0.0

    return {
        "total_executions": total_executions,
        "total_sent": total_sent,
        "total_pending": total_pending,
        "total_failed": total_failed,
        "total_skipped": total_skipped,
        "success_rate": round(success_rate, 2),
        "executions_last_7_days": executions_last_7_days,
        "executions_last_30_days": executions_last_30_days,
    }
