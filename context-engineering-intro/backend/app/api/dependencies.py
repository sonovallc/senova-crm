"""
Shared API dependencies for authentication and database sessions

Following research/fastapi/04-jwt-authentication.md patterns
"""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.database import get_db
from app.core.security import decode_token, verify_token_type
from app.core.exceptions import AuthenticationError
from app.models.user import User

# OAuth2 scheme for JWT token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """
    Get current authenticated user from JWT token

    Args:
        token: JWT token from Authorization header
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: 401 if token invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    # Verify token type
    if not verify_token_type(payload, "access"):
        raise credentials_exception

    # Get user email from token
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    # Fetch user from database
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


async def get_current_user_optional(
    token: Annotated[str | None, Depends(oauth2_scheme_optional)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User | None:
    """
    Get current authenticated user from JWT token (optional)

    Returns None if no token provided or token is invalid

    Args:
        token: Optional JWT token from Authorization header
        db: Database session

    Returns:
        User | None: Current authenticated user or None
    """
    if not token:
        return None

    try:
        # Decode token
        payload = decode_token(token)
        if payload is None:
            return None

        # Verify token type
        if not verify_token_type(payload, "access"):
            return None

        # Get user email from token
        email: str = payload.get("sub")
        if email is None:
            return None

        # Fetch user from database
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None or not user.is_active:
            return None

        return user
    except Exception:
        return None


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Ensure current user is active

    Args:
        current_user: User from get_current_user dependency

    Returns:
        User: Active user

    Raises:
        HTTPException: 403 if user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Ensure current user has admin role

    Args:
        current_user: User from get_current_active_user dependency

    Returns:
        User: Admin user

    Raises:
        HTTPException: 403 if user is not admin
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Type aliases for cleaner endpoint signatures
CurrentUser = Annotated[User, Depends(get_current_active_user)]
AdminUser = Annotated[User, Depends(get_current_admin_user)]
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
