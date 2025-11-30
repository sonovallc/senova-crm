"""
Celery tasks for AI and enrichment background processing

Features:
- Async contact enrichment
- Batch enrichment processing
- Auto-response generation
- Conversation summarization
"""

import asyncio
from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta

from celery import Task
from celery.utils.log import get_task_logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_app import celery_app
from app.config.database import AsyncSessionLocal
from app.models.contact import Contact
from app.models.communication import Communication, CommunicationDirection, CommunicationType
from app.services.closebot_service import get_closebot_service
from app.services.audiencelab_service import get_audiencelab_service
from app.core.exceptions import IntegrationError

logger = get_task_logger(__name__)


class AITask(Task):
    """Base task with retry configuration for AI operations"""

    autoretry_for = (IntegrationError,)
    retry_kwargs = {"max_retries": 2}
    retry_backoff = True
    retry_backoff_max = 300  # Max 5 minutes


@celery_app.task(base=AITask, bind=True)
def enrich_contact_task(self, contact_id: str) -> Dict:
    """
    Enrich contact with AudienceLab data (async task)

    Args:
        contact_id: Contact ID to enrich

    Returns:
        Dict with enrichment result
    """
    logger.info(f"Enriching contact {contact_id}")

    async def _enrich():
        async with AsyncSessionLocal() as db:
            # Get contact
            contact = await db.get(Contact, UUID(contact_id))

            if not contact:
                logger.warning(f"Contact {contact_id} not found")
                return {"status": "not_found"}

            # Check if enrichment needed
            if not contact.needs_enrichment:
                logger.info(f"Contact {contact_id} already enriched recently")
                return {"status": "skipped", "reason": "recent_enrichment"}

            audiencelab = get_audiencelab_service()

            try:
                # Enrich contact
                enrichment_data = await audiencelab.enrich_contact(
                    email=contact.email,
                    phone=contact.phone,
                    first_name=contact.first_name,
                    last_name=contact.last_name,
                    company=contact.company,
                )

                # Update contact
                contact.enrichment_data = enrichment_data
                contact.last_enriched_at = datetime.now(timezone.utc)

                await db.commit()

                logger.info(f"Contact {contact_id} enriched successfully")

                return {
                    "status": "enriched",
                    "contact_id": contact_id,
                    "confidence_score": enrichment_data.get("confidence_score", 0.0),
                }

            except IntegrationError as e:
                logger.error(f"Failed to enrich contact {contact_id}: {str(e)}")
                raise

    return asyncio.run(_enrich())


@celery_app.task
def batch_enrich_contacts_task(contact_ids: Optional[List[str]] = None, max_contacts: int = 100) -> Dict:
    """
    Batch enrich multiple contacts

    Args:
        contact_ids: Specific contact IDs (None = all needing enrichment)
        max_contacts: Maximum contacts to enrich in batch

    Returns:
        Dict with batch results
    """
    logger.info(f"Starting batch enrichment (max: {max_contacts})")

    async def _batch_enrich():
        async with AsyncSessionLocal() as db:
            if contact_ids:
                # Enrich specific contacts
                result = await db.execute(
                    select(Contact).where(Contact.id.in_([UUID(cid) for cid in contact_ids]))
                )
                contacts = result.scalars().all()
            else:
                # Find contacts needing enrichment
                cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
                result = await db.execute(
                    select(Contact)
                    .where(
                        (Contact.last_enriched_at is None)
                        | (Contact.last_enriched_at < cutoff_date)
                    )
                    .limit(max_contacts)
                )
                contacts = result.scalars().all()

            # Queue enrichment tasks
            queued_count = 0
            for contact in contacts:
                enrich_contact_task.delay(str(contact.id))
                queued_count += 1

            logger.info(f"Queued {queued_count} contacts for enrichment")

            return {
                "status": "queued",
                "queued_count": queued_count,
            }

    return asyncio.run(_batch_enrich())


@celery_app.task(base=AITask, bind=True)
def generate_auto_response_task(
    self,
    communication_id: str,
    auto_send: bool = False,
) -> Dict:
    """
    Generate AI auto-response for inbound message

    Args:
        communication_id: Inbound communication ID
        auto_send: Automatically send response (vs save as draft)

    Returns:
        Dict with generated response
    """
    logger.info(f"Generating auto-response for communication {communication_id}")

    async def _generate_response():
        async with AsyncSessionLocal() as db:
            # Get communication
            result = await db.execute(
                select(Communication).where(Communication.id == UUID(communication_id))
            )
            communication = result.scalar_one_or_none()

            if not communication:
                logger.warning(f"Communication {communication_id} not found")
                return {"status": "not_found"}

            # Only for inbound messages
            if communication.direction != CommunicationDirection.INBOUND:
                return {"status": "skipped", "reason": "not_inbound"}

            # Get contact
            contact = await db.get(Contact, communication.contact_id)

            # Get conversation history
            history_result = await db.execute(
                select(Communication)
                .where(Communication.contact_id == communication.contact_id)
                .order_by(Communication.created_at.desc())
                .limit(10)
            )
            recent_messages = history_result.scalars().all()

            conversation_history = [
                {
                    "direction": msg.direction.value,
                    "message": msg.body,
                    "timestamp": msg.created_at.isoformat(),
                }
                for msg in reversed(recent_messages)
            ]

            # Build contact context
            contact_context = None
            if contact:
                contact_context = {
                    "name": f"{contact.first_name} {contact.last_name}",
                    "company": contact.company,
                    "tags": contact.tags,
                }

            closebot = get_closebot_service()

            try:
                # Generate response
                result_data = await closebot.generate_response(
                    message=communication.body,
                    conversation_history=conversation_history,
                    contact_context=contact_context,
                    tone="professional",
                )

                # Mark communication as AI processed
                communication.ai_confidence_score = int(result_data["confidence_score"] * 100)
                communication.closebot_processed = True

                # TODO: If auto_send is True, create and send response communication
                # For now, just log the suggested response

                await db.commit()

                logger.info(
                    f"Generated auto-response for {communication_id} (confidence: {result_data['confidence_score']})"
                )

                return {
                    "status": "generated",
                    "communication_id": communication_id,
                    "response_text": result_data["response_text"],
                    "confidence_score": result_data["confidence_score"],
                    "requires_review": result_data["requires_human_review"],
                }

            except IntegrationError as e:
                logger.error(f"Failed to generate response: {str(e)}")
                raise

    return asyncio.run(_generate_response())


@celery_app.task(base=AITask, bind=True)
def analyze_conversation_sentiment_task(self, contact_id: str) -> Dict:
    """
    Analyze sentiment of recent conversation

    Args:
        contact_id: Contact ID

    Returns:
        Dict with sentiment analysis
    """
    logger.info(f"Analyzing conversation sentiment for contact {contact_id}")

    async def _analyze():
        async with AsyncSessionLocal() as db:
            # Get recent messages
            result = await db.execute(
                select(Communication)
                .where(Communication.contact_id == UUID(contact_id))
                .order_by(Communication.created_at.desc())
                .limit(20)
            )
            messages = result.scalars().all()

            if not messages:
                return {"status": "no_messages"}

            closebot = get_closebot_service()

            # Analyze each message
            sentiments = []

            for msg in messages:
                if msg.body:
                    try:
                        sentiment_result = await closebot.analyze_sentiment(msg.body)
                        sentiments.append(
                            {
                                "message_id": str(msg.id),
                                "sentiment": sentiment_result["sentiment"],
                                "score": sentiment_result["score"],
                            }
                        )
                    except IntegrationError:
                        continue

            # Calculate overall sentiment
            if sentiments:
                avg_score = sum(s["score"] for s in sentiments) / len(sentiments)
                positive_count = sum(1 for s in sentiments if s["sentiment"] == "positive")
                negative_count = sum(1 for s in sentiments if s["sentiment"] == "negative")

                overall_sentiment = "neutral"
                if avg_score > 0.3:
                    overall_sentiment = "positive"
                elif avg_score < -0.3:
                    overall_sentiment = "negative"

                logger.info(
                    f"Sentiment analysis complete for {contact_id}: {overall_sentiment} (score: {avg_score:.2f})"
                )

                return {
                    "status": "analyzed",
                    "contact_id": contact_id,
                    "overall_sentiment": overall_sentiment,
                    "average_score": avg_score,
                    "positive_count": positive_count,
                    "negative_count": negative_count,
                    "total_analyzed": len(sentiments),
                }

            return {"status": "no_sentiment_data"}

    return asyncio.run(_analyze())


@celery_app.task
def schedule_enrichment_refresh_task() -> Dict:
    """
    Scheduled task to refresh contact enrichments

    Run daily to keep contact data fresh

    Returns:
        Dict with refresh results
    """
    logger.info("Running scheduled enrichment refresh")

    async def _refresh():
        # Find contacts with enrichment older than 30 days
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Contact).where(
                    (Contact.last_enriched_at is not None) & (Contact.last_enriched_at < cutoff_date)
                )
                .limit(50)  # Refresh 50 per day
            )
            contacts = result.scalars().all()

            # Queue for enrichment
            queued_count = 0
            for contact in contacts:
                enrich_contact_task.delay(str(contact.id))
                queued_count += 1

            logger.info(f"Queued {queued_count} contacts for enrichment refresh")

            return {
                "status": "scheduled",
                "queued_count": queued_count,
            }

    return asyncio.run(_refresh())
