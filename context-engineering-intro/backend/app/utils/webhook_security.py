"""
Webhook security utilities for Mailgun integration
"""
import hmac
import hashlib
import time
from typing import Optional
import bleach

# Allowed HTML tags for email body sanitization
ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'div', 'span']
ALLOWED_ATTRIBUTES = {'a': ['href', 'title']}

def constant_time_compare(val1: str, val2: str) -> bool:
    """Compare two strings in constant time to prevent timing attacks"""
    return hmac.compare_digest(val1.encode(), val2.encode())

def verify_mailgun_signature(signing_key: str, timestamp: str, token: str, signature: str) -> bool:
    """
    Verify Mailgun webhook signature using HMAC-SHA256

    Mailgun sends: timestamp + token, hashed with signing key
    We recreate the hash and compare
    """
    if not all([signing_key, timestamp, token, signature]):
        return False

    # Concatenate timestamp and token
    data = f"{timestamp}{token}"

    # Create HMAC-SHA256 hash
    expected_signature = hmac.new(
        key=signing_key.encode(),
        msg=data.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    return constant_time_compare(expected_signature, signature)

def is_timestamp_valid(timestamp: str, max_age_seconds: int = 300) -> bool:
    """
    Check if timestamp is within acceptable range (default 5 minutes)
    Prevents replay attacks
    """
    try:
        webhook_time = int(timestamp)
        current_time = int(time.time())
        return abs(current_time - webhook_time) <= max_age_seconds
    except (ValueError, TypeError):
        return False

def sanitize_html(html_content: Optional[str]) -> str:
    """
    Sanitize HTML content using bleach to prevent XSS
    Only allows safe tags for email display
    """
    if not html_content:
        return ""

    return bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )