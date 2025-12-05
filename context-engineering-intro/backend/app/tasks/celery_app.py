"""
Celery application configuration

CRITICAL NOTES:
- Use Redis as broker for simplicity
- Set task timeouts to prevent hanging workers
- Implement task result expiration
- Use async task execution with proper error handling
"""

from celery import Celery
from kombu import Queue

from app.config.settings import get_settings

settings = get_settings()

# Create Celery app
celery_app = Celery(
    "senova_crm",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.email_tasks",
        "app.tasks.sms_tasks",
        "app.tasks.workflow_tasks",
        "app.tasks.autoresponder_tasks",
    ],
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task execution
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard timeout
    task_soft_time_limit=240,  # 4 minutes soft timeout
    # Results
    result_expires=3600,  # 1 hour
    result_backend_transport_options={"master_name": "mymaster"},
    # Retry policy
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,
    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    # Queues
    task_queues=(
        Queue("default", routing_key="default"),
        Queue("email", routing_key="email"),
        Queue("sms", routing_key="sms"),
        Queue("workflows", routing_key="workflows"),
        Queue("autoresponders", routing_key="autoresponders"),
    ),
    task_default_queue="default",
    task_default_exchange="tasks",
    task_default_routing_key="default",
    # Error handling
    task_send_error_emails=False,
)

# Task routes
celery_app.conf.task_routes = {
    "app.tasks.email_tasks.*": {"queue": "email"},
    "app.tasks.sms_tasks.*": {"queue": "sms"},
    "app.tasks.workflow_tasks.*": {"queue": "workflows"},
    "app.tasks.autoresponder_tasks.*": {"queue": "autoresponders"},
}

# Celery Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    # Process autoresponder queue every 5 minutes
    "process-autoresponder-queue": {
        "task": "autoresponder.process_queue",
        "schedule": 300.0,  # 5 minutes in seconds
    },
    # Check date-based triggers daily at midnight
    "check-date-triggers": {
        "task": "autoresponder.check_date_triggers",
        "schedule": "crontab(hour=0, minute=0)",  # Midnight UTC
    },
    # Cleanup old executions weekly
    "cleanup-old-executions": {
        "task": "autoresponder.cleanup_old_executions",
        "schedule": "crontab(day_of_week=0, hour=2, minute=0)",  # Sunday 2am UTC
        "kwargs": {"days": 90},
    },
}


@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery"""
    print(f"Request: {self.request!r}")
    return {"status": "success", "task_id": self.request.id}
