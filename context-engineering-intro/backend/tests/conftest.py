"""
Pytest configuration and shared fixtures

Provides test database, test client, and mock data fixtures
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.config.database import Base, get_db
from app.models.user import User
from app.models.contact import Contact, ContactStatus, ContactSource
from app.core.security import get_password_hash

# Test database URL (use in-memory or separate test database)
TEST_DATABASE_URL = "postgresql+asyncpg://evecrm:evecrm_dev_password@postgres:5432/eve_crm_test"


# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False,
)

# Create test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test

    Automatically rolls back changes after each test
    """
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    # Drop all tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client(db_session: AsyncSession):
    """
    Create FastAPI test client with test database

    Overrides the get_db dependency to use test database
    """

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """
    Create a test user

    Returns a user with email: test@example.com, password: TestPassword123
    """
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        first_name="Test",
        last_name="User",
        full_name="Test User",
        role="staff",
        is_active=True,
        is_verified=True,
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """
    Create a test admin user

    Returns an admin user with email: admin@example.com, password: AdminPassword123
    """
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPassword123"),
        first_name="Admin",
        last_name="User",
        full_name="Admin User",
        role="admin",
        is_active=True,
        is_verified=True,
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest_asyncio.fixture
async def test_contact(db_session: AsyncSession, test_user: User) -> Contact:
    """
    Create a test contact

    Returns a contact assigned to test_user
    """
    contact = Contact(
        email="contact@example.com",
        phone="+15551234567",
        first_name="John",
        last_name="Doe",
        company="Test Company",
        status=ContactStatus.LEAD,
        source=ContactSource.WEBSITE,
        assigned_to_id=test_user.id,
    )

    db_session.add(contact)
    await db_session.commit()
    await db_session.refresh(contact)

    return contact


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    """
    Get authentication headers for test user

    Returns headers with Bearer token for test@example.com user
    """
    # Register and login
    register_data = {
        "email": "auth_test@example.com",
        "password": "TestPassword123",
        "first_name": "Auth",
        "last_name": "Test"
    }

    response = client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 201

    token_data = response.json()
    access_token = token_data["access_token"]

    return {"Authorization": f"Bearer {access_token}"}
