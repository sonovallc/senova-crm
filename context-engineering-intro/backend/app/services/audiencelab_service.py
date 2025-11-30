"""
AudienceLab contact enrichment service

CRITICAL NOTE:
- NEVER display "AudienceLab" brand name in public-facing UI
- Use generic terms: "Data Integration", "Behavioral Insights", "Enhanced Analytics"
- This is white-labeled data enrichment

Features:
- Contact data enrichment
- Behavioral insights
- Demographic data
- Psychographic profiling
- Purchase prediction
"""

import httpx
from typing import Dict, Optional, List
from datetime import datetime, timezone

from app.config.settings import get_settings
from app.core.exceptions import IntegrationError

settings = get_settings()


class AudienceLabService:
    """
    AudienceLab contact enrichment service

    CRITICAL: This service is white-labeled
    Never expose "AudienceLab" branding in customer-facing UI

    Features:
    - Enrich contact with demographic data
    - Add behavioral insights
    - Predict purchase likelihood
    - Segment classification
    - Interest profiling
    """

    def __init__(self):
        self.api_key = settings.audiencelab_api_key
        self.base_url = "https://api.audiencelab.io/v1"  # Placeholder URL

    async def enrich_contact(
        self,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        company: Optional[str] = None,
    ) -> Dict:
        """
        Enrich contact with additional data

        Args:
            email: Contact email
            phone: Contact phone
            first_name: First name
            last_name: Last name
            company: Company name

        Returns:
            Dict with enrichment data

        Raises:
            IntegrationError: If enrichment fails
        """
        try:
            # Build enrichment request
            payload = {}

            if email:
                payload["email"] = email
            if phone:
                payload["phone"] = phone
            if first_name:
                payload["first_name"] = first_name
            if last_name:
                payload["last_name"] = last_name
            if company:
                payload["company"] = company

            if not payload:
                raise IntegrationError("At least one identifier required for enrichment")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/enrich",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                # Structure enrichment data
                enrichment_data = {
                    "enriched_at": datetime.now(timezone.utc).isoformat(),
                    "confidence_score": data.get("confidence", 0.0),
                    "demographics": {
                        "age_range": data.get("demographics", {}).get("age_range"),
                        "gender": data.get("demographics", {}).get("gender"),
                        "location": {
                            "city": data.get("demographics", {}).get("location", {}).get("city"),
                            "state": data.get("demographics", {}).get("location", {}).get("state"),
                            "country": data.get("demographics", {}).get("location", {}).get("country"),
                            "zip_code": data.get("demographics", {}).get("location", {}).get("zip_code"),
                        },
                        "education": data.get("demographics", {}).get("education"),
                        "occupation": data.get("demographics", {}).get("occupation"),
                        "income_range": data.get("demographics", {}).get("income_range"),
                    },
                    "behavioral": {
                        "interests": data.get("behavioral", {}).get("interests", []),
                        "purchase_behavior": data.get("behavioral", {}).get("purchase_behavior", {}),
                        "online_activity": data.get("behavioral", {}).get("online_activity", {}),
                        "social_media": data.get("behavioral", {}).get("social_media", {}),
                    },
                    "psychographic": {
                        "personality_traits": data.get("psychographic", {}).get("traits", []),
                        "values": data.get("psychographic", {}).get("values", []),
                        "lifestyle": data.get("psychographic", {}).get("lifestyle", []),
                    },
                    "professional": {
                        "job_title": data.get("professional", {}).get("title"),
                        "company_size": data.get("professional", {}).get("company_size"),
                        "industry": data.get("professional", {}).get("industry"),
                        "seniority_level": data.get("professional", {}).get("seniority"),
                    },
                    "predictions": {
                        "purchase_likelihood": data.get("predictions", {}).get("purchase_likelihood", 0.0),
                        "lifetime_value_estimate": data.get("predictions", {}).get("ltv_estimate"),
                        "churn_risk": data.get("predictions", {}).get("churn_risk", 0.0),
                    },
                }

                return enrichment_data

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"AudienceLab enrichment error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to enrich contact: {str(e)}")

    async def get_segments(
        self,
        contact_data: Dict,
    ) -> Dict:
        """
        Get segment classifications for contact

        Args:
            contact_data: Contact information and enrichment data

        Returns:
            Dict with segment classifications
        """
        try:
            payload = {"contact_data": contact_data}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/segments",
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
                    "segments": data.get("segments", []),
                    # Example: ["high-value-prospect", "beauty-enthusiast", "monthly-buyer"]
                    "primary_segment": data.get("primary_segment"),
                    "segment_scores": data.get("scores", {}),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Segment classification error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to get segments: {str(e)}")

    async def predict_purchase_intent(
        self,
        contact_data: Dict,
        product_category: Optional[str] = None,
    ) -> Dict:
        """
        Predict purchase intent for contact

        Args:
            contact_data: Contact information
            product_category: Specific product category (optional)

        Returns:
            Dict with purchase predictions
        """
        try:
            payload = {"contact_data": contact_data}

            if product_category:
                payload["product_category"] = product_category

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/predict-purchase",
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
                    "purchase_likelihood": data.get("likelihood", 0.0),  # 0.0 to 1.0
                    "predicted_value": data.get("predicted_value"),
                    "timeframe": data.get("timeframe"),  # next_7_days, next_30_days, etc.
                    "recommended_products": data.get("recommended_products", []),
                    "best_contact_channel": data.get("best_channel"),  # email, sms, phone
                    "optimal_contact_time": data.get("optimal_time"),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Purchase prediction error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to predict purchase: {str(e)}")

    async def get_lookalike_contacts(
        self,
        contact_id: str,
        limit: int = 10,
    ) -> Dict:
        """
        Find lookalike contacts (similar to given contact)

        Args:
            contact_id: Reference contact ID
            limit: Max number of lookalikes to return

        Returns:
            Dict with lookalike contact IDs and similarity scores
        """
        try:
            payload = {
                "contact_id": contact_id,
                "limit": limit,
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/lookalikes",
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
                    "lookalikes": data.get("lookalikes", []),
                    # Example: [
                    #   {"contact_id": "...", "similarity_score": 0.92},
                    #   {"contact_id": "...", "similarity_score": 0.87}
                    # ]
                    "common_attributes": data.get("common_attributes", []),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Lookalike search error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to find lookalikes: {str(e)}")

    async def validate_contact_data(
        self,
        email: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> Dict:
        """
        Validate contact data quality

        Args:
            email: Email to validate
            phone: Phone to validate

        Returns:
            Dict with validation results
        """
        try:
            payload = {}

            if email:
                payload["email"] = email
            if phone:
                payload["phone"] = phone

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/validate",
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
                    "is_valid": data.get("is_valid", False),
                    "email_valid": data.get("email_valid"),
                    "phone_valid": data.get("phone_valid"),
                    "deliverability": data.get("deliverability"),  # high, medium, low
                    "risk_score": data.get("risk_score", 0.0),  # 0.0 to 1.0
                    "suggested_corrections": data.get("corrections", {}),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Validation error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to validate contact: {str(e)}")


# Singleton instance
_audiencelab_service: Optional[AudienceLabService] = None


def get_audiencelab_service() -> AudienceLabService:
    """Get or create AudienceLab service instance"""
    global _audiencelab_service
    if _audiencelab_service is None:
        _audiencelab_service = AudienceLabService()
    return _audiencelab_service
