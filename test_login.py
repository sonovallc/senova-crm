#!/usr/bin/env python3
import requests
import json

# Test the login endpoint
url = "https://crm.senovallc.com/api/v1/auth/login"
data = {
    "email": "jwoodcapital@gmail.com",
    "password": "D3n1w3n1!"
}

print(f"Testing POST {url}")
print(f"Data: {json.dumps(data)}")

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")

    if response.status_code == 200:
        data = response.json()
        if 'access_token' in data:
            print("✓ Login successful! Access token received")
        else:
            print("× Login response missing access token")
    elif response.status_code == 404:
        print("× Endpoint not found - double /api issue may still exist")
    elif response.status_code == 401:
        print("× Invalid credentials")
    elif response.status_code == 422:
        print("× Validation error")
    else:
        print(f"× Unexpected status code: {response.status_code}")

except Exception as e:
    print(f"Error: {e}")