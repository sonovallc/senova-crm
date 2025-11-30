"""Encryption utilities for sensitive data (API keys, credentials)"""

from cryptography.fernet import Fernet
from app.config.settings import settings
import base64
import hashlib


def _get_fernet_key() -> bytes:
    """
    Convert the encryption_key from settings into a valid Fernet key.

    Fernet requires a 32-byte URL-safe base64-encoded key.
    We derive this from the settings.encryption_key using SHA256.

    Returns:
        Valid Fernet key as bytes
    """
    if not settings.encryption_key:
        raise ValueError("encryption_key not configured in settings")

    # Use SHA256 to derive a 32-byte key from the encryption_key
    # This ensures we always get a valid 32-byte key regardless of input
    derived_key = hashlib.sha256(settings.encryption_key.encode()).digest()

    # Encode to URL-safe base64 format required by Fernet
    fernet_key = base64.urlsafe_b64encode(derived_key)

    return fernet_key


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key using Fernet symmetric encryption.

    Args:
        api_key: Plain text API key to encrypt

    Returns:
        Base64-encoded encrypted API key

    Raises:
        ValueError: If encryption_key is not set in settings
    """
    if not settings.encryption_key:
        raise ValueError("encryption_key not configured in settings")

    # Get properly formatted Fernet key
    fernet_key = _get_fernet_key()

    # Create Fernet cipher
    cipher = Fernet(fernet_key)

    # Encrypt the API key
    encrypted_bytes = cipher.encrypt(api_key.encode())

    # Return as base64 string for database storage
    return base64.b64encode(encrypted_bytes).decode('utf-8')


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key that was encrypted with encrypt_api_key.

    Args:
        encrypted_key: Base64-encoded encrypted API key

    Returns:
        Plain text API key

    Raises:
        ValueError: If encryption_key is not set or decryption fails
    """
    if not settings.encryption_key:
        raise ValueError("encryption_key not configured in settings")

    # Get properly formatted Fernet key
    fernet_key = _get_fernet_key()

    # Create Fernet cipher
    cipher = Fernet(fernet_key)

    try:
        # Decode from base64
        encrypted_bytes = base64.b64decode(encrypted_key.encode('utf-8'))

        # Decrypt and return
        decrypted_bytes = cipher.decrypt(encrypted_bytes)
        return decrypted_bytes.decode('utf-8')
    except Exception as e:
        raise ValueError(f"Failed to decrypt API key: {str(e)}")
