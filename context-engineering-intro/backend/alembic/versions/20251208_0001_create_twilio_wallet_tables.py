"""create_twilio_wallet_tables

Revision ID: 20251208_0001
Revises: a1b2c3d4e5f6
Create Date: 2025-12-08 00:01:00.000000

Creates Twilio integration and wallet system tables for SMS/Voice communications.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251208_0001'
down_revision = 'f6g7h8i9j0k1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create Twilio and wallet system tables"""

    # 1. Create twilio_settings table
    op.create_table(
        'twilio_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_sid', sa.String(34), nullable=False),
        sa.Column('auth_token_encrypted', sa.Text, nullable=False),  # Encrypted with Fernet
        sa.Column('webhook_signing_secret_encrypted', sa.Text, nullable=True),  # Encrypted
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('connection_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),

        # Foreign key constraint
        sa.ForeignKeyConstraint(['object_id'], ['objects.id'], name='fk_twilio_settings_object', ondelete='CASCADE'),

        # Unique constraint - one config per object
        sa.UniqueConstraint('object_id', name='uq_twilio_settings_object_id'),
    )

    # Create indexes for twilio_settings
    op.create_index('idx_twilio_settings_object_id', 'twilio_settings', ['object_id'])
    op.create_index('idx_twilio_settings_active', 'twilio_settings', ['is_active'])

    # 2. Create twilio_phone_numbers table
    op.create_table(
        'twilio_phone_numbers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('twilio_settings_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=False),  # E.164 format
        sa.Column('twilio_sid', sa.String(34), nullable=False),
        sa.Column('friendly_name', sa.String(100), nullable=True),
        sa.Column('messaging_service_sid', sa.String(34), nullable=True),
        sa.Column('sms_capable', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('mms_capable', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('voice_capable', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('assigned_contact_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('monthly_cost', sa.Numeric(10, 2), nullable=False, server_default='1.15'),
        sa.Column('purchased_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('purchased_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),

        # Foreign key constraints
        sa.ForeignKeyConstraint(['object_id'], ['objects.id'], name='fk_twilio_phone_numbers_object', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['twilio_settings_id'], ['twilio_settings.id'], name='fk_twilio_phone_numbers_settings', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_contact_id'], ['contacts.id'], name='fk_twilio_phone_numbers_contact', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.id'], name='fk_twilio_phone_numbers_user', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['purchased_by_id'], ['users.id'], name='fk_twilio_phone_numbers_purchased_by'),

        # Unique constraints
        sa.UniqueConstraint('twilio_sid', name='uq_twilio_phone_numbers_sid'),
        sa.UniqueConstraint('object_id', 'phone_number', name='uq_object_phone_number'),
    )

    # Create indexes for twilio_phone_numbers
    op.create_index('idx_twilio_phone_numbers_object_id', 'twilio_phone_numbers', ['object_id'])
    op.create_index('idx_twilio_phone_numbers_status', 'twilio_phone_numbers', ['status'])
    op.create_index('idx_twilio_phone_numbers_assigned_contact', 'twilio_phone_numbers', ['assigned_contact_id'])
    op.create_index('idx_twilio_phone_numbers_assigned_user', 'twilio_phone_numbers', ['assigned_user_id'])

    # 3. Create wallets table
    op.create_table(
        'wallets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_type', sa.String(20), nullable=False, server_default='object'),
        sa.Column('owner_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('balance', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('auto_recharge_enabled', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('auto_recharge_threshold', sa.Numeric(10, 2), nullable=False, server_default='10.00'),
        sa.Column('auto_recharge_amount', sa.Numeric(10, 2), nullable=False, server_default='50.00'),
        sa.Column('stripe_customer_id', sa.String(100), nullable=True),
        sa.Column('default_payment_method_id', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),

        # Foreign key constraints
        sa.ForeignKeyConstraint(['object_id'], ['objects.id'], name='fk_wallets_object', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_user_id'], ['users.id'], name='fk_wallets_user', ondelete='SET NULL'),

        # Unique constraints
        sa.UniqueConstraint('object_id', name='uq_wallets_object_id'),
        sa.UniqueConstraint('stripe_customer_id', name='uq_wallets_stripe_customer'),

        # Check constraint for owner consistency
        sa.CheckConstraint(
            "(owner_type = 'object' AND owner_user_id IS NULL) OR "
            "(owner_type = 'user' AND owner_user_id IS NOT NULL)",
            name='ck_wallet_owner_consistency'
        ),
    )

    # Create indexes for wallets
    op.create_index('idx_wallets_object_id', 'wallets', ['object_id'])
    op.create_index('idx_wallets_owner_user_id', 'wallets', ['owner_user_id'])
    op.create_index('idx_wallets_stripe_customer', 'wallets', ['stripe_customer_id'])

    # 4. Create payment_methods table
    op.create_table(
        'payment_methods',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('wallet_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stripe_payment_method_id', sa.String(100), nullable=False),
        sa.Column('card_brand', sa.String(20), nullable=False),
        sa.Column('card_last_four', sa.String(4), nullable=False),
        sa.Column('card_exp_month', sa.Integer, nullable=False),
        sa.Column('card_exp_year', sa.Integer, nullable=False),
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),

        # Foreign key constraint
        sa.ForeignKeyConstraint(['wallet_id'], ['wallets.id'], name='fk_payment_methods_wallet', ondelete='CASCADE'),

        # Unique constraint
        sa.UniqueConstraint('stripe_payment_method_id', name='uq_payment_methods_stripe_id'),
    )

    # Create indexes for payment_methods
    op.create_index('idx_payment_methods_wallet_id', 'payment_methods', ['wallet_id'])
    op.create_index('idx_payment_methods_stripe_id', 'payment_methods', ['stripe_payment_method_id'])
    op.create_index('idx_payment_methods_default', 'payment_methods', ['wallet_id', 'is_default'])

    # 5. Create wallet_transactions table
    op.create_table(
        'wallet_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('wallet_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_type', sa.String(30), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('balance_after', sa.Numeric(10, 2), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('reference_type', sa.String(30), nullable=True),
        sa.Column('reference_id', sa.String(100), nullable=True),
        sa.Column('stripe_charge_id', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),

        # Foreign key constraint
        sa.ForeignKeyConstraint(['wallet_id'], ['wallets.id'], name='fk_wallet_transactions_wallet', ondelete='CASCADE'),
    )

    # Create indexes for wallet_transactions
    op.create_index('idx_wallet_transactions_wallet_id', 'wallet_transactions', ['wallet_id'])
    op.create_index('idx_wallet_transactions_type', 'wallet_transactions', ['transaction_type'])
    op.create_index('idx_wallet_transactions_created_at', 'wallet_transactions', ['created_at'])
    op.create_index('idx_wallet_transactions_reference', 'wallet_transactions', ['reference_type', 'reference_id'])
    op.create_index('idx_wallet_transactions_stripe', 'wallet_transactions', ['stripe_charge_id'])


def downgrade() -> None:
    """Drop all Twilio and wallet system tables"""

    # Drop indexes first
    op.drop_index('idx_wallet_transactions_stripe', 'wallet_transactions')
    op.drop_index('idx_wallet_transactions_reference', 'wallet_transactions')
    op.drop_index('idx_wallet_transactions_created_at', 'wallet_transactions')
    op.drop_index('idx_wallet_transactions_type', 'wallet_transactions')
    op.drop_index('idx_wallet_transactions_wallet_id', 'wallet_transactions')

    op.drop_index('idx_payment_methods_default', 'payment_methods')
    op.drop_index('idx_payment_methods_stripe_id', 'payment_methods')
    op.drop_index('idx_payment_methods_wallet_id', 'payment_methods')

    op.drop_index('idx_wallets_stripe_customer', 'wallets')
    op.drop_index('idx_wallets_owner_user_id', 'wallets')
    op.drop_index('idx_wallets_object_id', 'wallets')

    op.drop_index('idx_twilio_phone_numbers_assigned_user', 'twilio_phone_numbers')
    op.drop_index('idx_twilio_phone_numbers_assigned_contact', 'twilio_phone_numbers')
    op.drop_index('idx_twilio_phone_numbers_status', 'twilio_phone_numbers')
    op.drop_index('idx_twilio_phone_numbers_object_id', 'twilio_phone_numbers')

    op.drop_index('idx_twilio_settings_active', 'twilio_settings')
    op.drop_index('idx_twilio_settings_object_id', 'twilio_settings')

    # Drop tables in reverse order (due to foreign key dependencies)
    op.drop_table('wallet_transactions')
    op.drop_table('payment_methods')
    op.drop_table('wallets')
    op.drop_table('twilio_phone_numbers')
    op.drop_table('twilio_settings')