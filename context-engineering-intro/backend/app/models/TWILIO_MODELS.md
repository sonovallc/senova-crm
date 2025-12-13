# Twilio Integration Database Models

## Overview
This document describes the database models created for Twilio integration, supporting SMS/voice communications with a prepaid wallet system.

## Models Created

### 1. TwilioSettings (`twilio_settings.py`)
- **Purpose**: Store Twilio account credentials per object
- **Key Fields**:
  - `account_sid`: Twilio Account SID (not encrypted)
  - `auth_token_encrypted`: Encrypted auth token
  - `webhook_signing_secret_encrypted`: Encrypted webhook validation secret
- **Relationships**: One-to-one with Object, One-to-many with TwilioPhoneNumber

### 2. TwilioPhoneNumber (`twilio_phone_number.py`)
- **Purpose**: Track purchased Twilio phone numbers
- **Key Fields**:
  - `phone_number`: E.164 format phone number
  - `twilio_sid`: Unique Twilio phone number SID (starts with PN...)
  - `sms_capable`, `mms_capable`, `voice_capable`: Capability flags
  - `assigned_contact_id`, `assigned_user_id`: Assignment tracking
  - `monthly_cost`: Recurring cost tracking
- **Relationships**: Many-to-one with Object, TwilioSettings, Contact (optional), User (optional)

### 3. Wallet (`wallet.py`)
- **Purpose**: Prepaid credit system for SMS/voice usage
- **Key Fields**:
  - `balance`: Current balance in USD
  - `auto_recharge_enabled`: Auto top-up settings
  - `stripe_customer_id`: Stripe integration for payments
- **Relationships**: One-to-one with Object, One-to-many with WalletTransaction and PaymentMethod

### 4. PaymentMethod (`payment_method.py`)
- **Purpose**: Store tokenized credit card information via Stripe
- **Key Fields**:
  - `stripe_payment_method_id`: Stripe's payment method token
  - `card_brand`, `card_last_four`: Display information
  - `is_default`: Default payment method flag
- **Relationships**: Many-to-one with Wallet

### 5. WalletTransaction (`wallet_transaction.py`)
- **Purpose**: Audit trail of all wallet credits and debits
- **Key Fields**:
  - `transaction_type`: Type of transaction (charge, usage, refund)
  - `amount`: Positive for credits, negative for debits
  - `balance_after`: Balance snapshot after transaction
  - `stripe_charge_id`: Reference to Stripe charge (if applicable)
- **Relationships**: Many-to-one with Wallet

## Migration File
- **Location**: `backend/alembic/versions/20251208_0001_create_twilio_wallet_tables.py`
- **Creates**: All 5 tables with proper foreign keys, indexes, and constraints
- **Includes**: Check constraint on wallet owner consistency

## Encryption
All sensitive credentials (auth tokens, webhook secrets) are encrypted using the existing Fernet encryption pattern from `app/utils/encryption.py`. Helper functions are provided in `app/utils/twilio_encryption.py`.

## Usage Example
```python
from app.models import TwilioSettings, Wallet, WalletTransaction
from app.utils.twilio_encryption import encrypt_twilio_auth_token

# Create Twilio settings for an object
settings = TwilioSettings(
    object_id=object.id,
    account_sid="AC...",
    auth_token_encrypted=encrypt_twilio_auth_token("your_auth_token"),
    is_active=True
)

# Create a wallet for the object
wallet = Wallet(
    object_id=object.id,
    balance=50.00,
    auto_recharge_enabled=True
)

# Record a transaction
transaction = WalletTransaction(
    wallet_id=wallet.id,
    transaction_type="sms_usage",
    amount=-0.0075,  # Negative for debit
    balance_after=49.9925,
    description="SMS to +1234567890"
)
```

## Next Steps
1. Run the migration: `alembic upgrade head`
2. Create API endpoints for managing Twilio settings
3. Implement Twilio SDK integration service
4. Create wallet management and payment processing services
5. Build frontend components for configuration and monitoring