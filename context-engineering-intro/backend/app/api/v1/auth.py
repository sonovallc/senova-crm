"""
Authentication API endpoints

Implements: register, login, refresh token, logout, get current user
Following research/fastapi/04-jwt-authentication.md patterns
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, Token
from app.models.user import User, UserRole
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.api.dependencies import get_db, get_current_active_user, get_current_user_optional, CurrentUser

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Register a new user

    - **email**: Valid email address (must be unique)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit)
    - **first_name**: Optional first name
    - **last_name**: Optional last name
    - **role**: User role (default: "user")

    If authenticated as owner/admin, can create users with roles.
    Public registration always creates "user" role.

    Returns access token, refresh token, and user information
    """
    # Role validation based on current user permissions
    if current_user:
        # Authenticated user creating another user
        if user_data.role == "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create owner role"
            )
        if user_data.role == "admin" and current_user.role != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owner can create admin users"
            )
        if current_user.role not in ["owner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owner and admin can create users"
            )
    else:
        # Public registration - force user role
        user_data.role = UserRole.USER.value

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)

    # Convert string role to UserRole enum
    role_enum = UserRole(user_data.role.lower())

    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        full_name=f"{user_data.first_name or ''} {user_data.last_name or ''}".strip() or user_data.email,
        role=role_enum,
        is_active=True,
        is_verified=False,  # Email verification can be added later
        is_approved=False if current_user else False,  # Requires approval
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate tokens
    access_token = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})

    # Store refresh token
    new_user.refresh_tokens = [refresh_token]
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password

    - **email**: User email address
    - **password**: User password

    Returns access token, refresh token, and user information
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    # Verify credentials
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Generate tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    # Store refresh token (append to existing list, limit to 5 tokens)
    existing_tokens = user.refresh_tokens or []
    existing_tokens.append(refresh_token)
    user.refresh_tokens = existing_tokens[-5:]  # Keep only last 5 refresh tokens

    # Update last login time
    user.last_login_at = datetime.now(timezone.utc)

    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get new access token using refresh token

    - **refresh_token**: Valid refresh token from login

    Returns new access token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode and validate refresh token
    payload = decode_token(refresh_token)
    if payload is None:
        raise credentials_exception

    # Verify token type
    if not verify_token_type(payload, "refresh"):
        raise credentials_exception

    # Get user email
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    # Find user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    # Verify refresh token exists in user's token list
    if refresh_token not in (user.refresh_tokens or []):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Generate new access token
    new_access_token = create_access_token(data={"sub": user.email})

    return Token(access_token=new_access_token, token_type="bearer")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    refresh_token: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user by invalidating refresh token

    - **refresh_token**: Refresh token to invalidate

    Requires authentication (access token in Authorization header)
    """
    # Remove refresh token from user's token list
    if current_user.refresh_tokens and refresh_token in current_user.refresh_tokens:
        current_user.refresh_tokens.remove(refresh_token)
        await db.commit()

    return None


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser):
    """
    Get current authenticated user information

    Requires authentication (access token in Authorization header)

    Returns user profile information
    """
    return UserResponse.model_validate(current_user)
