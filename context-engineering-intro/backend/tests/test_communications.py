"""
Communication endpoint tests

Tests for unified inbox, sending messages, and WebSocket functionality
"""

import pytest
from fastapi.testclient import TestClient
from uuid import UUID

from app.models.communication import Communication, CommunicationType, CommunicationDirection, CommunicationStatus
from app.models.contact import Contact


@pytest.mark.asyncio
async def test_get_unified_inbox(client: TestClient, auth_headers: dict, test_contact: Contact, db_session):
    """Test getting unified inbox"""
    # Create test communications
    comm1 = Communication(
        type=CommunicationType.EMAIL,
        direction=CommunicationDirection.INBOUND,
        contact_id=test_contact.id,
        subject="Test Email",
        body="Test email body",
        status=CommunicationStatus.DELIVERED,
    )
    comm2 = Communication(
        type=CommunicationType.SMS,
        direction=CommunicationDirection.OUTBOUND,
        contact_id=test_contact.id,
        body="Test SMS",
        status=CommunicationStatus.SENT,
    )

    db_session.add_all([comm1, comm2])
    await db_session.commit()

    # Get inbox
    response = client.get("/api/v1/communications/inbox", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2


@pytest.mark.asyncio
async def test_get_inbox_filtered_by_contact(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
    db_session,
):
    """Test getting inbox filtered by contact"""
    # Create communications
    comm = Communication(
        type=CommunicationType.SMS,
        direction=CommunicationDirection.INBOUND,
        contact_id=test_contact.id,
        body="Test message",
        status=CommunicationStatus.DELIVERED,
    )

    db_session.add(comm)
    await db_session.commit()

    # Get inbox filtered by contact
    response = client.get(
        f"/api/v1/communications/inbox?contact_id={test_contact.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert len(data["items"]) >= 1
    assert all(item["contact_id"] == str(test_contact.id) for item in data["items"])


@pytest.mark.asyncio
async def test_get_inbox_filtered_by_type(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
    db_session,
):
    """Test getting inbox filtered by communication type"""
    # Create different types of communications
    email = Communication(
        type=CommunicationType.EMAIL,
        direction=CommunicationDirection.INBOUND,
        contact_id=test_contact.id,
        subject="Test",
        body="Test email",
        status=CommunicationStatus.DELIVERED,
    )
    sms = Communication(
        type=CommunicationType.SMS,
        direction=CommunicationDirection.INBOUND,
        contact_id=test_contact.id,
        body="Test SMS",
        status=CommunicationStatus.DELIVERED,
    )

    db_session.add_all([email, sms])
    await db_session.commit()

    # Get inbox filtered by EMAIL
    response = client.get(
        "/api/v1/communications/inbox?type=email",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert all(item["type"] == "email" for item in data["items"])


@pytest.mark.asyncio
async def test_send_sms(client: TestClient, auth_headers: dict, test_contact: Contact):
    """Test sending SMS message"""
    message_data = {
        "type": "sms",
        "contact_id": str(test_contact.id),
        "body": "Test SMS message",
    }

    response = client.post(
        "/api/v1/communications/send",
        json=message_data,
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()

    assert data["type"] == "sms"
    assert data["body"] == "Test SMS message"
    assert data["contact_id"] == str(test_contact.id)
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_send_email(client: TestClient, auth_headers: dict, test_contact: Contact):
    """Test sending email message"""
    message_data = {
        "type": "email",
        "contact_id": str(test_contact.id),
        "subject": "Test Subject",
        "body": "Test email body",
    }

    response = client.post(
        "/api/v1/communications/send",
        json=message_data,
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()

    assert data["type"] == "email"
    assert data["subject"] == "Test Subject"
    assert data["body"] == "Test email body"
    assert data["contact_id"] == str(test_contact.id)


@pytest.mark.asyncio
async def test_send_sms_contact_no_phone(client: TestClient, auth_headers: dict, db_session):
    """Test sending SMS to contact without phone number fails"""
    # Create contact without phone
    contact = Contact(
        email="noPhone@example.com",
        first_name="No",
        last_name="Phone",
        status="lead",
        source="website",
    )

    db_session.add(contact)
    await db_session.commit()
    await db_session.refresh(contact)

    message_data = {
        "type": "sms",
        "contact_id": str(contact.id),
        "body": "Test SMS",
    }

    response = client.post(
        "/api/v1/communications/send",
        json=message_data,
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "no phone" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_send_email_missing_subject(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
):
    """Test sending email without subject fails"""
    message_data = {
        "type": "email",
        "contact_id": str(test_contact.id),
        "body": "Test body",
        # Missing subject
    }

    response = client.post(
        "/api/v1/communications/send",
        json=message_data,
        headers=auth_headers,
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_contact_communications(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
    db_session,
):
    """Test getting all communications for a specific contact"""
    # Create multiple communications
    comm1 = Communication(
        type=CommunicationType.SMS,
        direction=CommunicationDirection.OUTBOUND,
        contact_id=test_contact.id,
        body="First message",
        status=CommunicationStatus.SENT,
    )
    comm2 = Communication(
        type=CommunicationType.EMAIL,
        direction=CommunicationDirection.INBOUND,
        contact_id=test_contact.id,
        subject="Reply",
        body="Reply message",
        status=CommunicationStatus.DELIVERED,
    )

    db_session.add_all([comm1, comm2])
    await db_session.commit()

    # Get contact communications
    response = client.get(
        f"/api/v1/communications/contact/{test_contact.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["total"] >= 2
    assert all(item["contact_id"] == str(test_contact.id) for item in data["items"])


@pytest.mark.asyncio
async def test_get_communication_by_id(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
    db_session,
):
    """Test getting single communication by ID"""
    comm = Communication(
        type=CommunicationType.SMS,
        direction=CommunicationDirection.OUTBOUND,
        contact_id=test_contact.id,
        body="Test message",
        status=CommunicationStatus.SENT,
    )

    db_session.add(comm)
    await db_session.commit()
    await db_session.refresh(comm)

    # Get communication
    response = client.get(
        f"/api/v1/communications/{comm.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(comm.id)
    assert data["body"] == "Test message"


@pytest.mark.asyncio
async def test_get_nonexistent_communication(client: TestClient, auth_headers: dict):
    """Test getting non-existent communication returns 404"""
    fake_id = "00000000-0000-0000-0000-000000000000"

    response = client.get(
        f"/api/v1/communications/{fake_id}",
        headers=auth_headers,
    )

    assert response.status_code == 404
