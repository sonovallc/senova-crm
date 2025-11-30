"""
Test API endpoints to verify functionality

Run with: python -m scripts.test_api
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx


async def test_api():
    """Test core API functionality"""

    base_url = "http://localhost:8000"

    print("🧪 Testing Senova CRM API")
    print("=" * 50)

    async with httpx.AsyncClient() as client:
        # Test 1: Health check
        print("\n1️⃣  Testing health endpoint...")
        response = await client.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")

        # Test 2: Login
        print("\n2️⃣  Testing authentication...")
        login_data = {
            "email": "admin@senovallc.com",
            "password": "admin123"
        }
        response = await client.post(
            f"{base_url}/api/v1/auth/login",
            json=login_data
        )
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user")
            print(f"   ✅ Login successful!")
            print(f"   User: {user.get('email')} ({user.get('role')})")
            print(f"   Token: {token[:50]}...")

            # Test 3: Get current user
            print("\n3️⃣  Testing authenticated endpoint...")
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get(
                f"{base_url}/api/v1/auth/me",
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                me = response.json()
                print(f"   ✅ Current user: {me.get('email')}")
                print(f"   Name: {me.get('full_name')}")
                print(f"   Permissions: {me.get('permissions')}")

            # Test 4: List contacts (should be empty)
            print("\n4️⃣  Testing contacts endpoint...")
            response = await client.get(
                f"{base_url}/api/v1/contacts",
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                contacts = response.json()
                print(f"   ✅ Retrieved contacts")
                print(f"   Total: {contacts.get('total', 0)}")
        else:
            print(f"   ❌ Login failed: {response.text}")

    print("\n" + "=" * 50)
    print("✅ API testing complete!")


if __name__ == "__main__":
    asyncio.run(test_api())
