"""
Sentry error monitoring and performance tracking integration.
"""
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration


def init_sentry():
    """
    Initialize Sentry error monitoring.

    Features:
    - Error tracking and alerting
    - Performance monitoring
    - Release tracking
    - Environment separation
    """
    sentry_dsn = os.getenv("SENTRY_DSN")

    if not sentry_dsn:
        print("⚠️  Sentry DSN not found - error monitoring disabled")
        return

    environment = os.getenv("SENTRY_ENVIRONMENT", os.getenv("ENVIRONMENT", "development"))
    traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "1.0"))
    profiles_sample_rate = float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "1.0"))

    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,

        # Performance Monitoring
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,

        # Integrations
        integrations=[
            FastApiIntegration(transaction_style="url"),
            SqlalchemyIntegration(),
            RedisIntegration(),
            CeleryIntegration(),
        ],

        # Send PII (Personally Identifiable Information)
        send_default_pii=False,  # Set to True if you want to capture user data

        # Attach stack traces for pure messages
        attach_stacktrace=True,

        # Control what events are sent to Sentry
        before_send=before_send,

        # Release tracking (use git commit hash in production)
        # release=os.getenv("SENTRY_RELEASE", "eve-crm@1.0.0"),
    )

    print(f"✅ Sentry initialized - Environment: {environment}, Sample rate: {traces_sample_rate}")


def before_send(event, hint):
    """
    Filter or modify events before sending to Sentry.

    Use this to:
    - Remove sensitive data
    - Filter out certain errors
    - Add additional context
    """
    # Skip health check errors
    if event.get("transaction", "") == "/api/v1/health":
        return None

    # Filter out specific error types if needed
    if "exc_info" in hint:
        exc_type, exc_value, tb = hint["exc_info"]

        # Example: Don't send validation errors to Sentry
        # if isinstance(exc_value, ValidationError):
        #     return None

    return event


def capture_exception(error: Exception, **kwargs):
    """
    Manually capture an exception and send to Sentry.

    Usage:
        try:
            risky_operation()
        except Exception as e:
            capture_exception(e, extra={"user_id": 123})
            raise
    """
    sentry_sdk.capture_exception(error, **kwargs)


def capture_message(message: str, level: str = "info", **kwargs):
    """
    Capture a message (not an exception) and send to Sentry.

    Levels: "debug", "info", "warning", "error", "fatal"

    Usage:
        capture_message("Payment processed successfully", level="info", extra={"amount": 100})
    """
    sentry_sdk.capture_message(message, level=level, **kwargs)


def set_user(user_id: int = None, email: str = None, **kwargs):
    """
    Set user context for error tracking.

    Usage:
        set_user(user_id=123, email="user@example.com", role="admin")
    """
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        **kwargs
    })


def set_context(name: str, context: dict):
    """
    Add custom context to error reports.

    Usage:
        set_context("payment", {"gateway": "stripe", "amount": 100})
    """
    sentry_sdk.set_context(name, context)


def add_breadcrumb(message: str, category: str = "default", level: str = "info", **kwargs):
    """
    Add a breadcrumb to track user actions leading to an error.

    Usage:
        add_breadcrumb("User clicked checkout button", category="user_action", level="info")
    """
    sentry_sdk.add_breadcrumb({
        "message": message,
        "category": category,
        "level": level,
        **kwargs
    })
