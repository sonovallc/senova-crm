"""
Authentication endpoint tests

Tests for register, login, refresh, logout, and get current user
"""

import pytest
from fastapi.testclient import TestClient

from app.models.user import User


@pytest.mark.auth
def test_register_user(client: TestClient):
    """Test user registration with valid data"""
    user_data = {
        "email": "newuser@example.com",
        "password": "NewPassword123",
        "first_name": "New",
        "last_name": "User",
        "role": "staff"
    }

    response = client.post("/api/v1/auth/register", json=user_data)

    assert response.status_code == 201
    data = response.json()

    # Check response structure
    assert "access_token" in data
    assert "refresh_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert "user" in data

    # Check user data
    user = data["user"]
    assert user["email"] == user_data["email"]
    assert user["first_name"] == user_data["first_name"]
    assert user["last_name"] == user_data["last_name"]
    assert user["role"] == user_data["role"]
    assert user["is_active"] is True
    assert "id" in user


@pytest.mark.auth
def test_register_duplicate_email(client: TestClient):
    """Test registration with duplicate email fails"""
    user_data = {
        "email": "duplicate@example.com",
        "password": "Password123",
        "first_name": "First",
        "last_name": "User"
    }

    # First registration should succeed
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201

    # Second registration with same email should fail
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.auth
def test_register_weak_password(client: TestClient):
    """Test registration with weak password fails"""
    user_data = {
        "email": "weak@example.com",
        "password": "weak",  # Too short, no uppercase, no digit
        "first_name": "Weak",
        "last_name": "Password"
    }

    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 422  # Validation error


@pytest.mark.auth
@pytest.mark.asyncio
async def test_login_success(client: TestClient, test_user: User):
    """Test successful login with valid credentials"""
    login_data = {
        "email": "test@example.com",
        "password": "TestPassword123"
    }

    response = client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == login_data["email"]


@pytest.mark.auth
def test_login_invalid_email(client: TestClient):
    """Test login with non-existent email fails"""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "SomePassword123"
    }

    response = client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.auth
@pytest.mark.asyncio
async def test_login_wrong_password(client: TestClient, test_user: User):
    """Test login with wrong password fails"""
    login_data = {
        "email": "test@example.com",
        "password": "WrongPassword123"
    }

    response = client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.auth
def test_get_current_user(client: TestClient, auth_headers: dict):
    """Test getting current user with valid token"""
    response = client.get("/api/v1/auth/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    assert "email" in data
    assert "id" in data
    assert "is_active" in data
    assert data["is_active"] is True


@pytest.mark.auth
def test_get_current_user_no_token(client: TestClient):
    """Test getting current user without token fails"""
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


@pytest.mark.auth
def test_get_current_user_invalid_token(client: TestClient):
    """Test getting current user with invalid token fails"""
    headers = {"Authorization": "Bearer invalid_token_here"}
    response = client.get("/api/v1/auth/me", headers=headers)

    assert response.status_code == 401


@pytest.mark.auth
def test_refresh_token(client: TestClient):
    """Test refreshing access token with valid refresh token"""
    # Register user
    register_data = {
        "email": "refresh@example.com",
        "password": "RefreshPassword123",
        "first_name": "Refresh",
        "last_name": "Test"
    }

    response = client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 201

    refresh_token = response.json()["refresh_token"]

    # Use refresh token to get new access token
    response = client.post(
        "/api/v1/auth/refresh",
        params={"refresh_token": refresh_token}
    )

    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
