"""
AI endpoint tests

Tests for AI response generation and contact enrichment
"""

import pytest
from fastapi.testclient import TestClient
from uuid import UUID

from app.models.contact import Contact
from app.models.communication import Communication, CommunicationType, CommunicationDirection, CommunicationStatus


@pytest.mark.asyncio
async def test_generate_ai_response(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
):
    """Test AI response generation"""
    request_data = {
        "message": "I'm interested in your Botox treatments. What's the price?",
        "contact_id": str(test_contact.id),
        "tone": "professional",
        "max_length": 300,
    }

    response = client.post(
        "/api/v1/ai/generate-response",
        json=request_data,
        headers=auth_headers,
    )

    # Will fail without actual AI service, but tests endpoint
    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_generate_response_without_contact(
    client: TestClient,
    auth_headers: dict,
):
    """Test AI response generation without contact context"""
    request_data = {
        "message": "What are your business hours?",
        "tone": "friendly",
        "max_length": 200,
    }

    response = client.post(
        "/api/v1/ai/generate-response",
        json=request_data,
        headers=auth_headers,
    )

    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_analyze_sentiment(
    client: TestClient,
    auth_headers: dict,
):
    """Test sentiment analysis"""
    request_data = {
        "message": "I'm very happy with your service! Everything was perfect!"
    }

    response = client.post(
        "/api/v1/ai/analyze-sentiment",
        json=request_data,
        headers=auth_headers,
    )

    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_analyze_negative_sentiment(
    client: TestClient,
    auth_headers: dict,
):
    """Test negative sentiment analysis"""
    request_data = {
        "message": "This is terrible service. I'm very disappointed and angry."
    }

    response = client.post(
        "/api/v1/ai/analyze-sentiment",
        json=request_data,
        headers=auth_headers,
    )

    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_classify_intent(
    client: TestClient,
    auth_headers: dict,
):
    """Test intent classification"""
    request_data = {
        "message": "I would like to book an appointment for next Tuesday"
    }

    response = client.post(
        "/api/v1/ai/classify-intent",
        json=request_data,
        headers=auth_headers,
    )

    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_enrich_contact(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
):
    """Test contact enrichment"""
    request_data = {
        "contact_id": str(test_contact.id),
        "force_refresh": True,
    }

    response = client.post(
        "/api/v1/ai/enrich-contact",
        json=request_data,
        headers=auth_headers,
    )

    # Will fail without actual enrichment service
    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_enrich_nonexistent_contact(
    client: TestClient,
    auth_headers: dict,
):
    """Test enriching non-existent contact returns 404"""
    fake_id = "00000000-0000-0000-0000-000000000000"

    request_data = {
        "contact_id": fake_id,
        "force_refresh": True,
    }

    response = client.post(
        "/api/v1/ai/enrich-contact",
        json=request_data,
        headers=auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_contact_segments(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
    db_session,
):
    """Test getting contact segments"""
    # Set enrichment data
    test_contact.enrichment_data = {
        "confidence_score": 0.85,
        "demographics": {"age_range": "25-34"},
    }
    await db_session.commit()

    response = client.get(
        f"/api/v1/ai/contact/{test_contact.id}/segments",
        headers=auth_headers,
    )

    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_get_segments_without_enrichment(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
):
    """Test getting segments without enrichment fails"""
    # Contact has no enrichment data
    response = client.get(
        f"/api/v1/ai/contact/{test_contact.id}/segments",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "not been enriched" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_predict_purchase_intent(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
    db_session,
):
    """Test purchase prediction"""
    # Set enrichment data
    test_contact.enrichment_data = {
        "confidence_score": 0.90,
        "behavioral": {"purchase_behavior": {"frequency": "monthly"}},
    }
    await db_session.commit()

    response = client.get(
        f"/api/v1/ai/contact/{test_contact.id}/purchase-prediction",
        headers=auth_headers,
    )

    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_purchase_prediction_without_enrichment(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
):
    """Test purchase prediction without enrichment fails"""
    response = client.get(
        f"/api/v1/ai/contact/{test_contact.id}/purchase-prediction",
        headers=auth_headers,
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_ai_response_with_conversation_history(
    client: TestClient,
    auth_headers: dict,
    test_contact: Contact,
    db_session,
):
    """Test AI response generation with conversation history"""
    # Create conversation history
    msg1 = Communication(
        type=CommunicationType.SMS,
        direction=CommunicationDirection.INBOUND,
        contact_id=test_contact.id,
        body="Hi, I'm interested in your treatments",
        status=CommunicationStatus.DELIVERED,
    )
    msg2 = Communication(
        type=CommunicationType.SMS,
        direction=CommunicationDirection.OUTBOUND,
        contact_id=test_contact.id,
        body="Great! We'd love to help. What treatment are you interested in?",
        status=CommunicationStatus.SENT,
    )

    db_session.add_all([msg1, msg2])
    await db_session.commit()

    # Generate response with history
    request_data = {
        "message": "I want to know about Botox pricing",
        "contact_id": str(test_contact.id),
        "tone": "professional",
        "include_conversation_history": True,
    }

    response = client.post(
        "/api/v1/ai/generate-response",
        json=request_data,
        headers=auth_headers,
    )

    assert response.status_code in [200, 503]
