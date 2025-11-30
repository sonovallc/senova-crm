"""
Closebot AI service for automated response generation

Features:
- AI-powered response generation
- Sentiment analysis
- Intent classification
- Context-aware suggestions
- Multi-language support
"""

import httpx
from typing import Dict, Optional, List
from datetime import datetime, timezone

from app.config.settings import get_settings
from app.core.exceptions import IntegrationError

settings = get_settings()


class ClosebotService:
    """
    Closebot AI service for intelligent customer interactions

    Features:
    - Generate contextual responses
    - Analyze message sentiment
    - Classify customer intent
    - Suggest next actions
    - Conversation summarization
    """

    def __init__(self):
        self.api_key = settings.closebot_api_key
        self.base_url = "https://api.closebot.ai/v1"  # Placeholder URL

    async def generate_response(
        self,
        message: str,
        conversation_history: Optional[List[Dict]] = None,
        contact_context: Optional[Dict] = None,
        tone: str = "professional",
        max_length: int = 300,
    ) -> Dict:
        """
        Generate AI response to customer message

        Args:
            message: Customer message to respond to
            conversation_history: Previous messages in conversation
            contact_context: Contact information and history
            tone: Response tone (professional, friendly, casual)
            max_length: Maximum response length in characters

        Returns:
            Dict with generated response and metadata

        Raises:
            IntegrationError: If AI generation fails
        """
        try:
            payload = {
                "message": message,
                "tone": tone,
                "max_length": max_length,
            }

            if conversation_history:
                payload["conversation_history"] = conversation_history

            if contact_context:
                payload["contact_context"] = {
                    "name": contact_context.get("name"),
                    "company": contact_context.get("company"),
                    "previous_interactions": contact_context.get("previous_interactions", 0),
                    "last_purchase": contact_context.get("last_purchase"),
                    "tags": contact_context.get("tags", []),
                }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/generate-response",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "response_text": data.get("response"),
                    "confidence_score": data.get("confidence", 0.0),
                    "suggested_actions": data.get("suggested_actions", []),
                    "requires_human_review": data.get("requires_review", False),
                    "sentiment": data.get("sentiment", "neutral"),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Closebot AI error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to generate AI response: {str(e)}")

    async def analyze_sentiment(
        self,
        message: str,
    ) -> Dict:
        """
        Analyze sentiment of customer message

        Args:
            message: Message to analyze

        Returns:
            Dict with sentiment analysis results
        """
        try:
            payload = {"message": message}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/analyze-sentiment",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=10.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "sentiment": data.get("sentiment"),  # positive, neutral, negative
                    "score": data.get("score", 0.0),  # -1.0 to 1.0
                    "confidence": data.get("confidence", 0.0),
                    "emotions": data.get("emotions", {}),  # joy, anger, sadness, etc.
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Sentiment analysis error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to analyze sentiment: {str(e)}")

    async def classify_intent(
        self,
        message: str,
    ) -> Dict:
        """
        Classify customer intent

        Args:
            message: Message to classify

        Returns:
            Dict with intent classification
        """
        try:
            payload = {"message": message}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/classify-intent",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=10.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "intent": data.get("intent"),  # question, complaint, booking, etc.
                    "confidence": data.get("confidence", 0.0),
                    "entities": data.get("entities", {}),  # Extracted entities
                    "suggested_action": data.get("suggested_action"),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Intent classification error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to classify intent: {str(e)}")

    async def summarize_conversation(
        self,
        messages: List[Dict],
    ) -> Dict:
        """
        Summarize conversation

        Args:
            messages: List of conversation messages

        Returns:
            Dict with conversation summary
        """
        try:
            payload = {"messages": messages}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/summarize",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=20.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "summary": data.get("summary"),
                    "key_points": data.get("key_points", []),
                    "action_items": data.get("action_items", []),
                    "overall_sentiment": data.get("overall_sentiment"),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Conversation summary error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to summarize conversation: {str(e)}")

    async def suggest_next_actions(
        self,
        conversation_context: Dict,
        contact_context: Dict,
    ) -> Dict:
        """
        Suggest next best actions based on conversation

        Args:
            conversation_context: Recent conversation data
            contact_context: Contact information and history

        Returns:
            Dict with suggested actions
        """
        try:
            payload = {
                "conversation_context": conversation_context,
                "contact_context": contact_context,
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/suggest-actions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=15.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "suggested_actions": data.get("actions", []),
                    # Example: [
                    #   {"action": "send_follow_up", "priority": "high", "description": "..."},
                    #   {"action": "schedule_consultation", "priority": "medium", "description": "..."}
                    # ]
                    "reasoning": data.get("reasoning"),
                    "confidence": data.get("confidence", 0.0),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Action suggestion error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to suggest actions: {str(e)}")

    async def detect_language(
        self,
        message: str,
    ) -> Dict:
        """
        Detect message language

        Args:
            message: Message to analyze

        Returns:
            Dict with language detection results
        """
        try:
            payload = {"message": message}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/detect-language",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=5.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "language": data.get("language"),  # en, es, fr, etc.
                    "confidence": data.get("confidence", 0.0),
                    "is_multilingual": data.get("is_multilingual", False),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Language detection error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to detect language: {str(e)}")


# Singleton instance
_closebot_service: Optional[ClosebotService] = None


def get_closebot_service() -> ClosebotService:
    """Get or create Closebot service instance"""
    global _closebot_service
    if _closebot_service is None:
        _closebot_service = ClosebotService()
    return _closebot_service
