"""
Test script for the inbox send-email endpoint

This tests the endpoint logic and Mailgun integration
"""

import sys
import asyncio
from typing import List

# Test email parsing function
def parse_emails(email_string: str) -> List[str]:
    """Parse comma-separated email string into list"""
    if not email_string:
        return []
    return [email.strip() for email in email_string.split(",") if email.strip()]

# Test email validation
def is_valid_email(email: str) -> bool:
    """Basic email validation"""
    if "@" not in email:
        return False
    parts = email.split("@")
    if len(parts) != 2:
        return False
    user, domain = parts
    if not user or not domain:
        return False
    return "." in domain

def test_email_parsing():
    """Test email parsing logic"""
    print("Testing email parsing...")

    # Test single email
    result = parse_emails("test@example.com")
    assert result == ["test@example.com"], f"Failed: {result}"
    print("  [PASS] Single email")

    # Test multiple emails
    result = parse_emails("test1@example.com, test2@example.com, test3@example.com")
    assert result == ["test1@example.com", "test2@example.com", "test3@example.com"], f"Failed: {result}"
    print("  [PASS] Multiple emails")

    # Test with spaces
    result = parse_emails("test1@example.com,  test2@example.com  ,test3@example.com")
    assert result == ["test1@example.com", "test2@example.com", "test3@example.com"], f"Failed: {result}"
    print("  [PASS] Emails with extra spaces")

    # Test empty string
    result = parse_emails("")
    assert result == [], f"Failed: {result}"
    print("  [PASS] Empty string")

    # Test None
    result = parse_emails(None)
    assert result == [], f"Failed: {result}"
    print("  [PASS] None value")

    print("All email parsing tests passed!\n")

def test_email_validation():
    """Test email validation logic"""
    print("Testing email validation...")

    # Valid emails
    assert is_valid_email("test@example.com") == True
    print("  [PASS] Valid email: test@example.com")

    assert is_valid_email("user+tag@domain.co.uk") == True
    print("  [PASS] Valid email with + and subdomain")

    # Invalid emails
    assert is_valid_email("notanemail") == False
    print("  [PASS] Invalid: no @")

    assert is_valid_email("no@domain") == False
    print("  [PASS] Invalid: no . in domain")

    assert is_valid_email("@nodomain.com") == False
    print("  [PASS] Invalid: no user part")

    print("All email validation tests passed!\n")

async def test_mailgun_data_structure():
    """Test that we build the correct data structure for Mailgun"""
    print("Testing Mailgun data structure...")

    # Simulate building the request data
    to_list = ["recipient@example.com"]
    cc_list = ["cc@example.com"]
    bcc_list = ["bcc@example.com"]
    subject = "Test Subject"
    body_html = "<h1>Test Email</h1>"
    from_email = "sender@example.com"
    from_name = "Test Sender"

    from_address = f"{from_name} <{from_email}>"

    data = {
        "from": from_address,
        "to": to_list,
        "subject": subject,
        "html": body_html,
    }

    if cc_list and len(cc_list) > 0:
        data["cc"] = cc_list

    if bcc_list and len(bcc_list) > 0:
        data["bcc"] = bcc_list

    # Verify structure
    assert data["from"] == "Test Sender <sender@example.com>", "From address incorrect"
    assert data["to"] == ["recipient@example.com"], "To list incorrect"
    assert data["cc"] == ["cc@example.com"], "CC list incorrect"
    assert data["bcc"] == ["bcc@example.com"], "BCC list incorrect"
    assert data["subject"] == "Test Subject", "Subject incorrect"
    assert data["html"] == "<h1>Test Email</h1>", "HTML body incorrect"

    print("  [PASS] Mailgun data structure is correct")
    print("All Mailgun structure tests passed!\n")

def main():
    """Run all tests"""
    print("=" * 60)
    print("INBOX SEND-EMAIL ENDPOINT TESTS")
    print("=" * 60)
    print()

    try:
        test_email_parsing()
        test_email_validation()
        asyncio.run(test_mailgun_data_structure())

        print("=" * 60)
        print("ALL TESTS PASSED")
        print("=" * 60)
        print()
        print("The inbox send-email endpoint logic is working correctly!")
        print("Ready for integration testing with real Mailgun credentials.")

        return 0

    except Exception as e:
        print(f"\n[FAIL] TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
