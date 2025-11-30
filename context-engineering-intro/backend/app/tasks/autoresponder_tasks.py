"""
Celery tasks for autoresponder processing.

Background tasks:
- Process autoresponder queue (send pending executions)
- Check date-based triggers
- Process sequences
"""

import logging
from celery import shared_task
from datetime import datetime

from app.services.autoresponder_service import (
    process_autoresponder_queue,
    check_date_based_triggers,
)

logger = logging.getLogger(__name__)


@shared_task(name="autoresponder.process_queue")
def process_queue():
    """
    Process pending autoresponder executions.

    Runs every 5 minutes to send due emails.
    """
    logger.info("Processing autoresponder queue...")

    try:
        import asyncio
        stats = asyncio.run(process_autoresponder_queue(batch_size=100))

        logger.info(
            f"Autoresponder queue processed: "
            f"{stats['sent']} sent, "
            f"{stats['failed']} failed, "
            f"{stats['skipped']} skipped"
        )

        return stats

    except Exception as e:
        logger.error(f"Error processing autoresponder queue: {e}", exc_info=True)
        raise


@shared_task(name="autoresponder.check_date_triggers")
def check_date_triggers():
    """
    Check for date-based trigger matches.

    Runs daily at midnight to check birthdays, anniversaries, etc.
    """
    logger.info("Checking date-based autoresponder triggers...")

    try:
        import asyncio
        queued_count = asyncio.run(check_date_based_triggers())

        logger.info(f"Date-based triggers checked: {queued_count} autoresponders queued")

        return {"queued_count": queued_count}

    except Exception as e:
        logger.error(f"Error checking date-based triggers: {e}", exc_info=True)
        raise


@shared_task(name="autoresponder.cleanup_old_executions")
def cleanup_old_executions(days: int = 90):
    """
    Clean up old execution records.

    Removes execution records older than specified days to keep database clean.

    Args:
        days: Number of days to keep (default 90)
    """
    logger.info(f"Cleaning up autoresponder executions older than {days} days...")

    try:
        from datetime import timedelta
        from app.config.database import AsyncSessionLocal
        from app.models.autoresponder import AutoresponderExecution
        from sqlalchemy import and_, delete

        async def cleanup():
            async with AsyncSessionLocal() as db:
                cutoff_date = datetime.utcnow() - timedelta(days=days)

                # Delete old completed/failed executions
                delete_stmt = delete(AutoresponderExecution).where(
                    and_(
                        AutoresponderExecution.created_at < cutoff_date,
                        AutoresponderExecution.status.in_(['sent', 'failed', 'skipped'])
                    )
                )

                result = await db.execute(delete_stmt)
                await db.commit()

                deleted_count = result.rowcount
                logger.info(f"Cleaned up {deleted_count} old autoresponder executions")

                return deleted_count

        import asyncio
        deleted_count = asyncio.run(cleanup())

        return {"deleted_count": deleted_count}

    except Exception as e:
        logger.error(f"Error cleaning up old executions: {e}", exc_info=True)
        raise
