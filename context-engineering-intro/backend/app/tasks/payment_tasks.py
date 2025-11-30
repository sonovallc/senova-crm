"""
Celery tasks for async payment processing

Features:
- Async payment status checking
- Delayed payment capture
- Subscription billing
- Payment reconciliation
"""

import asyncio
from typing import Dict, Optional
from uuid import UUID
from datetime import datetime, timezone

from celery import Task
from celery.utils.log import get_task_logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_app import celery_app
from app.config.database import AsyncSessionLocal
from app.models.payment import Payment, PaymentStatus
from app.services.payment_router import get_payment_router
from app.core.exceptions import PaymentError

logger = get_task_logger(__name__)


class PaymentTask(Task):
    """Base task with retry configuration for payments"""

    autoretry_for = (PaymentError,)
    retry_kwargs = {"max_retries": 2}
    retry_backoff = True
    retry_backoff_max = 300  # Max 5 minutes


@celery_app.task(base=PaymentTask, bind=True)
def check_payment_status_task(self, payment_id: str) -> Dict:
    """
    Check payment status with gateway

    Useful for reconciliation and status updates

    Args:
        payment_id: Payment record ID

    Returns:
        Dict with status check result
    """
    logger.info(f"Checking payment status for {payment_id}")

    async def _check_status():
        async with AsyncSessionLocal() as db:
            # Get payment
            result = await db.execute(
                select(Payment).where(Payment.id == UUID(payment_id))
            )
            payment = result.scalar_one_or_none()

            if not payment:
                logger.warning(f"Payment {payment_id} not found")
                return {"status": "not_found"}

            payment_router = get_payment_router()

            # Check status with gateway
            try:
                if payment.gateway.value == "stripe":
                    result_data = await payment_router.stripe.get_payment_intent(
                        payment.external_id
                    )
                elif payment.gateway.value == "square":
                    result_data = await payment_router.square.get_payment(
                        payment.external_id
                    )
                elif payment.gateway.value == "paypal":
                    result_data = await payment_router.paypal.get_order(
                        payment.external_id
                    )
                elif payment.gateway.value == "cash_app":
                    result_data = await payment_router.cashapp.get_payment(
                        payment.external_id
                    )
                else:
                    return {"status": "unsupported_gateway"}

                logger.info(f"Payment {payment_id} status: {result_data.get('status')}")

                return {
                    "status": "checked",
                    "payment_id": payment_id,
                    "gateway_status": result_data.get("status"),
                }

            except Exception as e:
                logger.error(f"Failed to check payment status: {str(e)}")
                raise

    return asyncio.run(_check_status())


@celery_app.task(base=PaymentTask, bind=True)
def capture_payment_task(self, payment_id: str) -> Dict:
    """
    Capture authorized payment

    Used for delayed capture workflows

    Args:
        payment_id: Payment record ID

    Returns:
        Dict with capture result
    """
    logger.info(f"Capturing payment {payment_id}")

    async def _capture_payment():
        async with AsyncSessionLocal() as db:
            # Get payment
            result = await db.execute(
                select(Payment).where(Payment.id == UUID(payment_id))
            )
            payment = result.scalar_one_or_none()

            if not payment:
                logger.warning(f"Payment {payment_id} not found")
                return {"status": "not_found"}

            if payment.status != PaymentStatus.APPROVED:
                logger.warning(
                    f"Payment {payment_id} not in APPROVED status (status: {payment.status})"
                )
                return {"status": "invalid_status"}

            payment_router = get_payment_router()

            try:
                # Capture based on gateway
                if payment.gateway.value == "stripe":
                    result_data = await payment_router.stripe.capture_payment_intent(
                        payment.external_id
                    )
                    payment.status = PaymentStatus.COMPLETED

                elif payment.gateway.value == "square":
                    result_data = await payment_router.square.complete_payment(
                        payment.external_id
                    )
                    payment.status = PaymentStatus.COMPLETED

                else:
                    return {"status": "unsupported_gateway"}

                await db.commit()

                logger.info(f"Payment {payment_id} captured successfully")

                return {
                    "status": "captured",
                    "payment_id": payment_id,
                    "amount": payment.amount,
                }

            except Exception as e:
                logger.error(f"Failed to capture payment: {str(e)}")
                payment.status = PaymentStatus.FAILED
                await db.commit()
                raise

    return asyncio.run(_capture_payment())


@celery_app.task
def reconcile_payments_task(hours: int = 24) -> Dict:
    """
    Reconcile payments from last N hours

    Checks payment statuses with gateways for accuracy

    Args:
        hours: Number of hours to look back

    Returns:
        Dict with reconciliation results
    """
    logger.info(f"Reconciling payments from last {hours} hours")

    async def _reconcile():
        from datetime import timedelta

        async with AsyncSessionLocal() as db:
            # Get pending payments from last N hours
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

            result = await db.execute(
                select(Payment).where(
                    Payment.created_at >= cutoff_time,
                    Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.APPROVED]),
                )
            )
            payments = result.scalars().all()

            reconciled_count = 0
            updated_count = 0

            for payment in payments:
                # Queue status check
                check_payment_status_task.delay(str(payment.id))
                reconciled_count += 1

            logger.info(
                f"Queued {reconciled_count} payments for status reconciliation"
            )

            return {
                "status": "completed",
                "reconciled_count": reconciled_count,
                "hours": hours,
            }

    return asyncio.run(_reconcile())
