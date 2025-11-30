"""
AI API endpoints

Features:
- AI response generation with Closebot
- Contact enrichment with AudienceLab
- Sentiment analysis
- Intent classification
- Purchase prediction
"""

from typing import List, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.contact import Contact
from app.models.communication import Communication
from app.services.closebot_service import get_closebot_service
from app.services.audiencelab_service import get_audiencelab_service
from app.core.exceptions import NotFoundError, IntegrationError
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ai", tags=["AI"])


# ==================== REQUEST/RESPONSE MODELS ====================


class GenerateResponseRequest(BaseModel):
    """Request model for AI response generation"""

    message: str = Field(..., description="Customer message to respond to")
    contact_id: Optional[UUID] = Field(None, description="Contact ID for context")
    tone: str = Field("professional", description="Response tone")
    max_length: int = Field(300, ge=50, le=1000, description="Max response length")
    include_conversation_history: bool = Field(True, description="Include conversation context")


class GenerateResponseResponse(BaseModel):
    """Response model for AI generated response"""

    response_text: str
    confidence_score: float
    suggested_actions: List[str]
    requires_human_review: bool
    sentiment: str


class EnrichContactRequest(BaseModel):
    """Request model for contact enrichment"""

    contact_id: UUID = Field(..., description="Contact ID to enrich")
    force_refresh: bool = Field(False, description="Force re-enrichment even if recent")


class EnrichContactResponse(BaseModel):
    """Response model for contact enrichment"""

    contact_id: str
    enrichment_data: Dict
    confidence_score: float
    enriched_at: str


class AnalyzeSentimentRequest(BaseModel):
    """Request model for sentiment analysis"""

    message: str = Field(..., description="Message to analyze")


class SentimentResponse(BaseModel):
    """Response model for sentiment analysis"""

    sentiment: str  # positive, neutral, negative
    score: float  # -1.0 to 1.0
    confidence: float
    emotions: Dict


class ClassifyIntentRequest(BaseModel):
    """Request model for intent classification"""

    message: str = Field(..., description="Message to classify")


class IntentResponse(BaseModel):
    """Response model for intent classification"""

    intent: str
    confidence: float
    entities: Dict
    suggested_action: Optional[str]


# ==================== AI RESPONSE ENDPOINTS ====================


@router.post("/generate-response", response_model=GenerateResponseResponse)
async def generate_ai_response(
    request: GenerateResponseRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Generate AI response to customer message

    Uses Closebot AI to generate contextual, professional responses
    Includes conversation history and contact context for better accuracy
    """
    closebot = get_closebot_service()

    # Get conversation history if requested
    conversation_history = None
    contact_context = None

    if request.contact_id:
        # Get contact
        contact = await db.get(Contact, request.contact_id)
        if not contact:
            raise NotFoundError(f"Contact {request.contact_id} not found")

        # Build contact context
        contact_context = {
            "name": f"{contact.first_name} {contact.last_name}",
            "company": contact.company,
            "tags": contact.tags,
        }

        # Get recent conversation history
        if request.include_conversation_history:
            history_result = await db.execute(
                select(Communication)
                .where(Communication.contact_id == request.contact_id)
                .order_by(Communication.created_at.desc())
                .limit(10)
            )
            recent_messages = history_result.scalars().all()

            conversation_history = [
                {
                    "direction": msg.direction.value,
                    "message": msg.body,
                    "timestamp": msg.created_at.isoformat(),
                }
                for msg in reversed(recent_messages)
            ]

    try:
        # Generate AI response
        result = await closebot.generate_response(
            message=request.message,
            conversation_history=conversation_history,
            contact_context=contact_context,
            tone=request.tone,
            max_length=request.max_length,
        )

        return GenerateResponseResponse(**result)

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service error: {str(e)}",
        )


@router.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(
    request: AnalyzeSentimentRequest,
    current_user: CurrentUser,
):
    """
    Analyze sentiment of message

    Returns sentiment classification and emotional analysis
    """
    closebot = get_closebot_service()

    try:
        result = await closebot.analyze_sentiment(request.message)
        return SentimentResponse(**result)

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service error: {str(e)}",
        )


@router.post("/classify-intent", response_model=IntentResponse)
async def classify_intent(
    request: ClassifyIntentRequest,
    current_user: CurrentUser,
):
    """
    Classify customer intent

    Determines what the customer is trying to accomplish
    """
    closebot = get_closebot_service()

    try:
        result = await closebot.classify_intent(request.message)
        return IntentResponse(**result)

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service error: {str(e)}",
        )


# ==================== CONTACT ENRICHMENT ENDPOINTS ====================


@router.post("/enrich-contact", response_model=EnrichContactResponse)
async def enrich_contact(
    request: EnrichContactRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Enrich contact with AudienceLab data

    CRITICAL: Never expose "AudienceLab" branding in UI
    This is white-labeled as "Enhanced Analytics" or "Data Integration"

    Adds demographic, behavioral, and psychographic data to contact
    """
    # Get contact
    contact = await db.get(Contact, request.contact_id)
    if not contact:
        raise NotFoundError(f"Contact {request.contact_id} not found")

    # Check if enrichment needed
    if not request.force_refresh:
        if not contact.needs_enrichment:
            # Return existing enrichment data
            return EnrichContactResponse(
                contact_id=str(contact.id),
                enrichment_data=contact.enrichment_data or {},
                confidence_score=contact.enrichment_data.get("confidence_score", 0.0)
                if contact.enrichment_data
                else 0.0,
                enriched_at=contact.last_enriched_at.isoformat()
                if contact.last_enriched_at
                else datetime.now(timezone.utc).isoformat(),
            )

    audiencelab = get_audiencelab_service()

    try:
        # Enrich contact
        enrichment_data = await audiencelab.enrich_contact(
            email=contact.email,
            phone=contact.phone,
            first_name=contact.first_name,
            last_name=contact.last_name,
            company=contact.company,
        )

        # Update contact with enrichment data
        contact.enrichment_data = enrichment_data
        contact.last_enriched_at = datetime.now(timezone.utc)

        await db.commit()

        return EnrichContactResponse(
            contact_id=str(contact.id),
            enrichment_data=enrichment_data,
            confidence_score=enrichment_data.get("confidence_score", 0.0),
            enriched_at=enrichment_data.get("enriched_at"),
        )

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Enrichment service error: {str(e)}",
        )


@router.get("/contact/{contact_id}/segments")
async def get_contact_segments(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get segment classifications for contact

    Returns marketing segments and scores
    """
    # Get contact
    contact = await db.get(Contact, contact_id)
    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    if not contact.enrichment_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact has not been enriched. Run enrichment first.",
        )

    audiencelab = get_audiencelab_service()

    try:
        result = await audiencelab.get_segments(
            contact_data={
                "enrichment_data": contact.enrichment_data,
                "tags": contact.tags,
                "status": contact.status.value,
            }
        )

        return result

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Segmentation error: {str(e)}",
        )


@router.get("/contact/{contact_id}/purchase-prediction")
async def predict_purchase_intent(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
    product_category: Optional[str] = None,
):
    """
    Predict purchase intent for contact

    Returns likelihood and recommended actions
    """
    # Get contact
    contact = await db.get(Contact, contact_id)
    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    if not contact.enrichment_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact has not been enriched. Run enrichment first.",
        )

    audiencelab = get_audiencelab_service()

    try:
        result = await audiencelab.predict_purchase_intent(
            contact_data={
                "enrichment_data": contact.enrichment_data,
                "tags": contact.tags,
                "status": contact.status.value,
            },
            product_category=product_category,
        )

        return result

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Prediction error: {str(e)}",
        )
