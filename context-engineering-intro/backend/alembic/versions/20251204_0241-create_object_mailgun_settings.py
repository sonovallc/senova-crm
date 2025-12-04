"""create_object_mailgun_settings

Revision ID: d4e5f6a7b8c9
Revises: 3c0301b8fb05
Create Date: 2025-12-04 02:41:00.000000

Creates object_mailgun_settings table for object-level Mailgun configuration.
Each object can have its own Mailgun API key and domain settings.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = '3c0301b8fb05'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create object_mailgun_settings table"""

    # Create object_mailgun_settings table
    op.create_table(
        'object_mailgun_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('api_key', sa.String(500), nullable=False),  # Will be encrypted with Fernet
        sa.Column('sending_domain', sa.String(255), nullable=False),  # e.g., "senovallc.com"
        sa.Column('receiving_domain', sa.String(255), nullable=False),  # e.g., "mg.senovallc.com"
        sa.Column('region', sa.String(10), nullable=False, server_default='us'),  # "us" or "eu"
        sa.Column('webhook_signing_key', sa.String(255), nullable=True),  # For webhook verification
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rate_limit_per_hour', sa.Integer, nullable=False, server_default='100'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),

        # Foreign key constraint
        sa.ForeignKeyConstraint(['object_id'], ['objects.id'], name='fk_object_mailgun_object', ondelete='CASCADE'),

        # Unique constraint - one config per object
        sa.UniqueConstraint('object_id', name='uq_object_mailgun_object_id'),
    )

    # Create indexes for object_mailgun_settings
    op.create_index('idx_object_mailgun_object_id', 'object_mailgun_settings', ['object_id'])
    op.create_index('idx_object_mailgun_active', 'object_mailgun_settings', ['is_active'])


def downgrade() -> None:
    """Drop object_mailgun_settings table"""

    # Drop indexes first
    op.drop_index('idx_object_mailgun_active', table_name='object_mailgun_settings')
    op.drop_index('idx_object_mailgun_object_id', table_name='object_mailgun_settings')

    # Drop table
    op.drop_table('object_mailgun_settings')