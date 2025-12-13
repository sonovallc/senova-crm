"""
Telnyx API integration for SMS/MMS

Features:
- SMS/MMS sending with media support
- Phone number search and purchase
- 10DLC Brand registration
- 10DLC Campaign registration
- Webhook signature verification

API Documentation: https://developers.telnyx.com/docs/messaging/overview
"""

import httpx
import hmac
import hashlib
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from uuid import UUID
import logging

from app.core.exceptions import IntegrationError
from app.utils.encryption import encrypt_api_key, decrypt_api_key

logger = logging.getLogger(__name__)


class TelnyxService:
    """
    Telnyx API client for SMS/MMS messaging

    Features:
    - SMS/MMS sending with media support
    - Phone number management (search, purchase, release)
    - 10DLC Brand and Campaign registration
    - Message status tracking
    - Webhook signature verification
    """

    BASE_URL = "https://api.telnyx.com/v2"

    def __init__(self, api_key: str, messaging_profile_id: Optional[str] = None):
        """
        Initialize Telnyx service with API credentials

        Args:
            api_key: Telnyx API key (v2)
            messaging_profile_id: Default messaging profile ID
        """
        self.api_key = api_key
        self.messaging_profile_id = messaging_profile_id
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    # =========================================================================
    # SMS/MMS MESSAGING
    # =========================================================================

    async def send_sms(
        self,
        to_number: str,
        text: str,
        from_number: str,
        messaging_profile_id: Optional[str] = None,
        webhook_url: Optional[str] = None,
        webhook_failover_url: Optional[str] = None,
    ) -> Dict:
        """
        Send SMS message

        Args:
            to_number: Recipient phone number (E.164 format: +1XXXXXXXXXX)
            text: Message text content (up to 1600 characters for long SMS)
            from_number: Sender phone number (must be owned)
            messaging_profile_id: Override default messaging profile
            webhook_url: URL for delivery status webhooks
            webhook_failover_url: Failover URL for webhooks

        Returns:
            Dict with message ID, cost, and status

        Raises:
            IntegrationError: If API call fails
        """
        payload = {
            "from": from_number,
            "to": to_number,
            "text": text,
            "type": "SMS",
        }

        # Add messaging profile
        profile_id = messaging_profile_id or self.messaging_profile_id
        if profile_id:
            payload["messaging_profile_id"] = profile_id

        # Add webhook URLs
        if webhook_url:
            payload["webhook_url"] = webhook_url
        if webhook_failover_url:
            payload["webhook_failover_url"] = webhook_failover_url

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/messages",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json().get("data", {})
                    return {
                        "message_id": data.get("id"),
                        "status": "accepted",
                        "to": to_number,
                        "from": from_number,
                        "parts": data.get("parts", 1),
                        "cost": data.get("cost", {}).get("amount"),
                        "carrier": data.get("carrier"),
                    }
                else:
                    error_data = response.json()
                    errors = error_data.get("errors", [{}])
                    error_msg = errors[0].get("detail", response.text) if errors else response.text
                    raise IntegrationError(f"Telnyx SMS API error: {error_msg}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx SMS API error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to send SMS via Telnyx: {str(e)}")

    async def send_mms(
        self,
        to_number: str,
        text: str,
        from_number: str,
        media_urls: List[str],
        messaging_profile_id: Optional[str] = None,
        webhook_url: Optional[str] = None,
    ) -> Dict:
        """
        Send MMS message with media attachments

        Args:
            to_number: Recipient phone number (E.164 format)
            text: Message text content
            from_number: Sender phone number (must be owned)
            media_urls: List of media URLs (max 1MB each, max 10 files)
            messaging_profile_id: Override default messaging profile
            webhook_url: URL for delivery status webhooks

        Returns:
            Dict with message ID and status

        Raises:
            IntegrationError: If API call fails
        """
        if len(media_urls) > 10:
            raise IntegrationError("MMS supports maximum 10 media files")

        payload = {
            "from": from_number,
            "to": to_number,
            "text": text,
            "media_urls": media_urls,
            "type": "MMS",
        }

        profile_id = messaging_profile_id or self.messaging_profile_id
        if profile_id:
            payload["messaging_profile_id"] = profile_id

        if webhook_url:
            payload["webhook_url"] = webhook_url

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/messages",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json().get("data", {})
                    return {
                        "message_id": data.get("id"),
                        "status": "accepted",
                        "to": to_number,
                        "from": from_number,
                        "media_count": len(media_urls),
                        "cost": data.get("cost", {}).get("amount"),
                    }
                else:
                    error_data = response.json()
                    errors = error_data.get("errors", [{}])
                    error_msg = errors[0].get("detail", response.text) if errors else response.text
                    raise IntegrationError(f"Telnyx MMS API error: {error_msg}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx MMS API error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to send MMS via Telnyx: {str(e)}")

    async def get_message(self, message_id: str) -> Dict:
        """
        Get message details by ID

        Args:
            message_id: Telnyx message ID

        Returns:
            Dict with message details
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/messages/{message_id}",
                    headers=self.headers,
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json().get("data", {})

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx get message error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to get message from Telnyx: {str(e)}")

    # =========================================================================
    # PHONE NUMBER MANAGEMENT
    # =========================================================================

    async def search_available_numbers(
        self,
        country_code: str = "US",
        area_code: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        number_type: str = "local",  # local, toll_free
        features: Optional[List[str]] = None,  # sms, mms, voice
        limit: int = 20,
    ) -> List[Dict]:
        """
        Search for available phone numbers to purchase

        Args:
            country_code: ISO country code (default: US)
            area_code: Filter by area code (e.g., "415")
            city: Filter by city name
            state: Filter by state code (e.g., "CA")
            number_type: "local" or "toll_free"
            features: Filter by features ["sms", "mms", "voice"]
            limit: Max results (default: 20)

        Returns:
            List of available numbers with details
        """
        params = {
            "filter[country_code]": country_code,
            "filter[phone_number_type]": number_type,
            "filter[limit]": limit,
        }

        if area_code:
            params["filter[national_destination_code]"] = area_code
        if city:
            params["filter[locality]"] = city
        if state:
            params["filter[administrative_area]"] = state
        if features:
            params["filter[features]"] = ",".join(features)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/available_phone_numbers",
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()
                numbers = []
                for item in data.get("data", []):
                    numbers.append({
                        "phone_number": item.get("phone_number"),
                        "type": item.get("phone_number_type"),
                        "region": item.get("region_information", [{}])[0].get("region_name"),
                        "locality": item.get("region_information", [{}])[0].get("locality"),
                        "features": item.get("features", []),
                        "monthly_cost": item.get("cost_information", {}).get("monthly_cost"),
                        "upfront_cost": item.get("cost_information", {}).get("upfront_cost"),
                    })
                return numbers

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx number search error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to search numbers on Telnyx: {str(e)}")

    async def purchase_number(
        self,
        phone_number: str,
        messaging_profile_id: Optional[str] = None,
        connection_id: Optional[str] = None,
    ) -> Dict:
        """
        Purchase a phone number

        Args:
            phone_number: Phone number to purchase (E.164 format)
            messaging_profile_id: Messaging profile to assign
            connection_id: Connection ID for voice

        Returns:
            Dict with purchase details and phone number ID
        """
        payload = {
            "phone_numbers": [{"phone_number": phone_number}],
        }

        if messaging_profile_id:
            payload["messaging_profile_id"] = messaging_profile_id
        if connection_id:
            payload["connection_id"] = connection_id

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/number_orders",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code in [200, 201]:
                    data = response.json().get("data", {})
                    phone_numbers = data.get("phone_numbers", [{}])
                    return {
                        "order_id": data.get("id"),
                        "status": data.get("status"),
                        "phone_number_id": phone_numbers[0].get("id") if phone_numbers else None,
                        "phone_number": phone_number,
                    }
                else:
                    error_data = response.json()
                    errors = error_data.get("errors", [{}])
                    error_msg = errors[0].get("detail", response.text) if errors else response.text
                    raise IntegrationError(f"Telnyx number purchase error: {error_msg}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx number purchase error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to purchase number on Telnyx: {str(e)}")

    async def list_owned_numbers(
        self,
        page_size: int = 50,
        status: str = "active",
    ) -> List[Dict]:
        """
        List all owned phone numbers

        Args:
            page_size: Results per page
            status: Filter by status

        Returns:
            List of owned phone numbers
        """
        params = {
            "page[size]": page_size,
            "filter[status]": status,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/phone_numbers",
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()
                numbers = []
                for item in data.get("data", []):
                    numbers.append({
                        "id": item.get("id"),
                        "phone_number": item.get("phone_number"),
                        "status": item.get("status"),
                        "connection_id": item.get("connection_id"),
                        "messaging_profile_id": item.get("messaging_profile_id"),
                        "created_at": item.get("created_at"),
                        "purchased_at": item.get("purchased_at"),
                    })
                return numbers

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx list numbers error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to list numbers from Telnyx: {str(e)}")

    async def release_number(self, phone_number_id: str) -> Dict:
        """
        Release (cancel) a phone number

        Args:
            phone_number_id: Telnyx phone number ID

        Returns:
            Dict with release status
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.BASE_URL}/phone_numbers/{phone_number_id}",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code in [200, 204]:
                    return {"status": "released", "phone_number_id": phone_number_id}
                else:
                    raise IntegrationError(f"Failed to release number: {response.text}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx release number error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to release number on Telnyx: {str(e)}")

    async def update_number(
        self,
        phone_number_id: str,
        messaging_profile_id: Optional[str] = None,
        connection_id: Optional[str] = None,
    ) -> Dict:
        """
        Update phone number settings

        Args:
            phone_number_id: Telnyx phone number ID
            messaging_profile_id: New messaging profile ID
            connection_id: New connection ID

        Returns:
            Dict with updated number details
        """
        payload = {}
        if messaging_profile_id:
            payload["messaging_profile_id"] = messaging_profile_id
        if connection_id:
            payload["connection_id"] = connection_id

        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.BASE_URL}/phone_numbers/{phone_number_id}",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json().get("data", {})

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx update number error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to update number on Telnyx: {str(e)}")

    # =========================================================================
    # MESSAGING PROFILES
    # =========================================================================

    async def create_messaging_profile(
        self,
        name: str,
        webhook_url: Optional[str] = None,
        webhook_failover_url: Optional[str] = None,
    ) -> Dict:
        """
        Create a new messaging profile

        Args:
            name: Profile name
            webhook_url: URL for inbound message webhooks
            webhook_failover_url: Failover URL

        Returns:
            Dict with profile ID and details
        """
        payload = {"name": name}
        if webhook_url:
            payload["webhook_url"] = webhook_url
        if webhook_failover_url:
            payload["webhook_failover_url"] = webhook_failover_url

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/messaging_profiles",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json().get("data", {})
                return {
                    "id": data.get("id"),
                    "name": data.get("name"),
                    "webhook_url": data.get("webhook_url"),
                }

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx create profile error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to create messaging profile: {str(e)}")

    async def list_messaging_profiles(self) -> List[Dict]:
        """List all messaging profiles"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/messaging_profiles",
                    headers=self.headers,
                    timeout=30.0,
                )
                response.raise_for_status()

                profiles = []
                for item in response.json().get("data", []):
                    profiles.append({
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "enabled": item.get("enabled"),
                        "webhook_url": item.get("webhook_url"),
                    })
                return profiles

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx list profiles error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to list messaging profiles: {str(e)}")

    # =========================================================================
    # 10DLC BRAND REGISTRATION
    # =========================================================================

    async def create_brand(
        self,
        company_name: str,
        display_name: Optional[str] = None,
        ein: Optional[str] = None,
        website: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        street: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: str = "US",
        vertical: Optional[str] = None,
        entity_type: str = "PRIVATE_PROFIT",  # PRIVATE_PROFIT, PUBLIC_PROFIT, NON_PROFIT, GOVERNMENT
    ) -> Dict:
        """
        Register a 10DLC brand

        Args:
            company_name: Legal company name
            display_name: Brand display name
            ein: Employer Identification Number
            website: Company website
            phone: Contact phone
            email: Contact email
            street: Street address
            city: City
            state: State/Province
            postal_code: ZIP/Postal code
            country: Country code
            vertical: Industry vertical
            entity_type: Business entity type

        Returns:
            Dict with brand ID and status
        """
        payload = {
            "company_name": company_name,
            "entity_type": entity_type,
            "country": country,
        }

        if display_name:
            payload["display_name"] = display_name
        if ein:
            payload["ein"] = ein
        if website:
            payload["website"] = website
        if phone:
            payload["phone"] = phone
        if email:
            payload["email"] = email
        if vertical:
            payload["vertical"] = vertical

        # Address
        if any([street, city, state, postal_code]):
            payload["address"] = {}
            if street:
                payload["address"]["street"] = street
            if city:
                payload["address"]["city"] = city
            if state:
                payload["address"]["state"] = state
            if postal_code:
                payload["address"]["postal_code"] = postal_code

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/brand",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code in [200, 201]:
                    data = response.json().get("data", {})
                    return {
                        "brand_id": data.get("id"),
                        "status": data.get("status"),
                        "company_name": data.get("company_name"),
                        "vetting_status": data.get("vetting_status"),
                    }
                else:
                    error_data = response.json()
                    errors = error_data.get("errors", [{}])
                    error_msg = errors[0].get("detail", response.text) if errors else response.text
                    raise IntegrationError(f"Telnyx brand creation error: {error_msg}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx brand creation error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to create brand on Telnyx: {str(e)}")

    async def get_brand(self, brand_id: str) -> Dict:
        """Get brand details by ID"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/brand/{brand_id}",
                    headers=self.headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json().get("data", {})

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx get brand error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to get brand from Telnyx: {str(e)}")

    async def list_brands(self) -> List[Dict]:
        """List all registered brands"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/brand",
                    headers=self.headers,
                    timeout=30.0,
                )
                response.raise_for_status()

                brands = []
                for item in response.json().get("data", []):
                    brands.append({
                        "brand_id": item.get("id"),
                        "company_name": item.get("company_name"),
                        "display_name": item.get("display_name"),
                        "status": item.get("status"),
                        "vetting_status": item.get("vetting_status"),
                    })
                return brands

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx list brands error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to list brands from Telnyx: {str(e)}")

    # =========================================================================
    # 10DLC CAMPAIGN REGISTRATION
    # =========================================================================

    async def create_campaign(
        self,
        brand_id: str,
        use_case: str,
        description: str,
        sample_messages: List[str],
        opt_in_message: Optional[str] = None,
        opt_out_message: Optional[str] = None,
        help_message: Optional[str] = None,
        subscriber_optin: bool = True,
        subscriber_optout: bool = True,
        subscriber_help: bool = True,
        number_pool: bool = False,
        embedded_link: bool = False,
        embedded_phone: bool = False,
    ) -> Dict:
        """
        Create a 10DLC campaign

        Args:
            brand_id: Associated brand ID
            use_case: Campaign use case (MARKETING, CUSTOMER_CARE, etc.)
            description: Campaign description
            sample_messages: Sample messages (2-5 required)
            opt_in_message: Auto-reply for opt-in
            opt_out_message: Auto-reply for opt-out
            help_message: Auto-reply for help
            subscriber_optin: Requires opt-in
            subscriber_optout: Allows opt-out
            subscriber_help: Provides help
            number_pool: Uses multiple numbers
            embedded_link: Contains links
            embedded_phone: Contains phone numbers

        Returns:
            Dict with campaign ID and status
        """
        payload = {
            "brand_id": brand_id,
            "usecase": use_case,
            "description": description,
            "sample1": sample_messages[0] if len(sample_messages) > 0 else "",
            "sample2": sample_messages[1] if len(sample_messages) > 1 else "",
            "subscriber_optin": subscriber_optin,
            "subscriber_optout": subscriber_optout,
            "subscriber_help": subscriber_help,
            "number_pool": number_pool,
            "embedded_link": embedded_link,
            "embedded_phone": embedded_phone,
        }

        if len(sample_messages) > 2:
            payload["sample3"] = sample_messages[2]
        if len(sample_messages) > 3:
            payload["sample4"] = sample_messages[3]
        if len(sample_messages) > 4:
            payload["sample5"] = sample_messages[4]

        if opt_in_message:
            payload["message_flow"] = opt_in_message
        if opt_out_message:
            payload["opt_out_message"] = opt_out_message
        if help_message:
            payload["help_message"] = help_message

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/campaign",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code in [200, 201]:
                    data = response.json().get("data", {})
                    return {
                        "campaign_id": data.get("id"),
                        "status": data.get("status"),
                        "use_case": data.get("usecase"),
                    }
                else:
                    error_data = response.json()
                    errors = error_data.get("errors", [{}])
                    error_msg = errors[0].get("detail", response.text) if errors else response.text
                    raise IntegrationError(f"Telnyx campaign creation error: {error_msg}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx campaign creation error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to create campaign on Telnyx: {str(e)}")

    async def get_campaign(self, campaign_id: str) -> Dict:
        """Get campaign details by ID"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/campaign/{campaign_id}",
                    headers=self.headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json().get("data", {})

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx get campaign error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to get campaign from Telnyx: {str(e)}")

    async def list_campaigns(self, brand_id: Optional[str] = None) -> List[Dict]:
        """List all campaigns, optionally filtered by brand"""
        params = {}
        if brand_id:
            params["filter[brand_id]"] = brand_id

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/campaign",
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()

                campaigns = []
                for item in response.json().get("data", []):
                    campaigns.append({
                        "campaign_id": item.get("id"),
                        "brand_id": item.get("brand_id"),
                        "use_case": item.get("usecase"),
                        "status": item.get("status"),
                        "description": item.get("description"),
                    })
                return campaigns

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx list campaigns error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise IntegrationError(f"Failed to list campaigns from Telnyx: {str(e)}")

    async def assign_number_to_campaign(
        self,
        phone_number_id: str,
        campaign_id: str,
    ) -> Dict:
        """
        Assign a phone number to a 10DLC campaign

        Args:
            phone_number_id: Telnyx phone number ID
            campaign_id: Campaign ID

        Returns:
            Dict with assignment status
        """
        payload = {"campaign_id": campaign_id}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/phone_number_campaigns",
                    headers=self.headers,
                    json={
                        "phone_number_id": phone_number_id,
                        "campaign_id": campaign_id,
                    },
                    timeout=30.0,
                )

                if response.status_code in [200, 201]:
                    return {
                        "status": "assigned",
                        "phone_number_id": phone_number_id,
                        "campaign_id": campaign_id,
                    }
                else:
                    error_data = response.json()
                    errors = error_data.get("errors", [{}])
                    error_msg = errors[0].get("detail", response.text) if errors else response.text
                    raise IntegrationError(f"Telnyx campaign assignment error: {error_msg}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx campaign assignment error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to assign number to campaign: {str(e)}")

    # =========================================================================
    # WEBHOOK SIGNATURE VERIFICATION
    # =========================================================================

    @staticmethod
    def verify_webhook_signature(
        payload: bytes,
        signature: str,
        timestamp: str,
        webhook_secret: str,
        tolerance_seconds: int = 300,
    ) -> bool:
        """
        Verify Telnyx webhook signature

        Args:
            payload: Raw request body bytes
            signature: X-Telnyx-Signature-Ed25519 header
            timestamp: X-Telnyx-Timestamp header
            webhook_secret: Webhook signing secret
            tolerance_seconds: Max age of valid requests

        Returns:
            bool: True if signature is valid
        """
        try:
            # Check timestamp freshness
            request_time = int(timestamp)
            current_time = int(time.time())
            if abs(current_time - request_time) > tolerance_seconds:
                logger.warning("Telnyx webhook timestamp too old")
                return False

            # Build signed payload
            signed_payload = f"{timestamp}.{payload.decode('utf-8')}"

            # Verify HMAC signature
            expected_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                signed_payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(expected_signature, signature)

        except Exception as e:
            logger.error(f"Telnyx webhook signature verification failed: {str(e)}")
            return False

    # =========================================================================
    # ACCOUNT VERIFICATION
    # =========================================================================

    async def verify_credentials(self) -> Dict:
        """
        Verify API credentials are valid by fetching account info

        Returns:
            Dict with account info if valid

        Raises:
            IntegrationError: If credentials are invalid
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/balance",
                    headers=self.headers,
                    timeout=10.0,
                )

                if response.status_code == 200:
                    data = response.json().get("data", {})
                    return {
                        "valid": True,
                        "balance": data.get("balance"),
                        "currency": data.get("currency"),
                        "available_credit": data.get("available_credit"),
                    }
                elif response.status_code == 401:
                    raise IntegrationError("Invalid Telnyx API key")
                else:
                    raise IntegrationError(f"Telnyx API error: {response.status_code}")

        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"Telnyx verification error: {e.response.status_code} - {e.response.text}"
            )
        except IntegrationError:
            raise
        except Exception as e:
            raise IntegrationError(f"Failed to verify Telnyx credentials: {str(e)}")
