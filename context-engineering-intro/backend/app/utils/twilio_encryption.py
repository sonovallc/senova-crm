"""Encryption utilities for Twilio credentials"""

from app.utils.encryption import encrypt_api_key, decrypt_api_key


def encrypt_twilio_auth_token(auth_token: str) -> str:
    """
    Encrypt Twilio auth token using the same encryption as API keys.

    Args:
        auth_token: Plain text Twilio auth token

    Returns:
        Base64-encoded encrypted auth token
    """
    return encrypt_api_key(auth_token)


def decrypt_twilio_auth_token(encrypted_token: str) -> str:
    """
    Decrypt Twilio auth token that was encrypted with encrypt_twilio_auth_token.

    Args:
        encrypted_token: Base64-encoded encrypted auth token

    Returns:
        Plain text auth token
    """
    return decrypt_api_key(encrypted_token)


def encrypt_webhook_secret(webhook_secret: str) -> str:
    """
    Encrypt Twilio webhook signing secret.

    Args:
        webhook_secret: Plain text webhook signing secret

    Returns:
        Base64-encoded encrypted webhook secret
    """
    return encrypt_api_key(webhook_secret)


def decrypt_webhook_secret(encrypted_secret: str) -> str:
    """
    Decrypt Twilio webhook signing secret.

    Args:
        encrypted_secret: Base64-encoded encrypted webhook secret

    Returns:
        Plain text webhook secret
    """
    return decrypt_api_key(encrypted_secret)


def mask_twilio_auth_token(auth_token: str) -> str:
    """
    Mask Twilio auth token for display purposes.
    Shows first 4 and last 4 characters only.

    Args:
        auth_token: Auth token to mask (encrypted or plain)

    Returns:
        Masked auth token like "abcd****wxyz"
    """
    if not auth_token or len(auth_token) < 12:
        return "****"

    # If it looks encrypted (very long), decrypt first to get proper mask
    if len(auth_token) > 50:
        try:
            decrypted = decrypt_api_key(auth_token)
            return f"{decrypted[:4]}****{decrypted[-4:]}"
        except:
            # If decryption fails, just mask the encrypted value
            return f"{auth_token[:4]}****{auth_token[-4:]}"

    return f"{auth_token[:4]}****{auth_token[-4:]}"