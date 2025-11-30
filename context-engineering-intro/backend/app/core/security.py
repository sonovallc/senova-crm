"""
Security utilities for JWT authentication and password hashing

Following research/fastapi/04-jwt-authentication.md patterns
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.config.settings import settings

# Initialize password hasher with Argon2 (recommended by pwdlib)
password_hash = PasswordHash.recommended()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password

    Args:
        plain_password: Plain text password
        hashed_password: Argon2 hashed password

    Returns:
        bool: True if password matches, False otherwise
    """
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a plaintext password using Argon2

    Args:
        password: Plain text password

    Returns:
        str: Argon2 hashed password
    """
    return password_hash.hash(password)


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token

    Args:
        data: Data to encode in token (typically {"sub": user_email})
        expires_delta: Optional custom expiration time

    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: Dict) -> str:
    """
    Create JWT refresh token (longer expiration)

    Args:
        data: Data to encode in token (typically {"sub": user_email})

    Returns:
        str: Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode and validate JWT token

    Args:
        token: JWT token string

    Returns:
        Optional[Dict]: Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except InvalidTokenError:
        return None


def verify_token_type(payload: Dict, expected_type: str) -> bool:
    """
    Verify token type (access or refresh)

    Args:
        payload: Decoded JWT payload
        expected_type: Expected token type ("access" or "refresh")

    Returns:
        bool: True if token type matches
    """
    token_type = payload.get("type")
    return token_type == expected_type


def create_widget_token(contact_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT token for widget authentication

    Args:
        contact_id: Contact UUID string
        expires_delta: Optional custom expiration time (default 30 days)

    Returns:
        str: Encoded JWT token for widget
    """
    to_encode = {"sub": contact_id, "type": "widget"}

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Widget tokens expire in 30 days (for returning visitors)
        expire = datetime.now(timezone.utc) + timedelta(days=30)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt
