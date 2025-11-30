"""add_mailgun_settings

Revision ID: b7c8d9e0f1a2
Revises: e9d3h3hc56f3
Create Date: 2025-11-21 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b7c8d9e0f1a2'
down_revision = 'e9d3h3hc56f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create mailgun_settings and verified_email_addresses tables"""

    # Create mailgun_settings table
    op.create_table(
        'mailgun_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('api_key', sa.String(500), nullable=False),
        sa.Column('domain', sa.String(255), nullable=False),
        sa.Column('region', sa.String(10), nullable=False, server_default='us'),
        sa.Column('from_email', sa.String(255), nullable=False),
        sa.Column('from_name', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rate_limit_per_hour', sa.Integer, nullable=False, server_default='100'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_mailgun_settings_user_id', ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_mailgun_settings_user_id'),
    )

    # Create indexes for mailgun_settings
    op.create_index('idx_mailgun_user_id', 'mailgun_settings', ['user_id'])
    op.create_index('idx_mailgun_active', 'mailgun_settings', ['is_active'])

    # Create verified_email_addresses table
    op.create_table(
        'verified_email_addresses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('mailgun_settings_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email_address', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(255), nullable=True),
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('verified_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['mailgun_settings_id'], ['mailgun_settings.id'], name='fk_verified_email_mailgun_settings', ondelete='CASCADE'),
    )

    # Create indexes for verified_email_addresses
    op.create_index('idx_verified_email_mailgun', 'verified_email_addresses', ['mailgun_settings_id'])
    op.create_index('idx_verified_email_address', 'verified_email_addresses', ['email_address'])


def downgrade() -> None:
    """Drop mailgun_settings and verified_email_addresses tables"""

    # Drop indexes first
    op.drop_index('idx_verified_email_address', table_name='verified_email_addresses')
    op.drop_index('idx_verified_email_mailgun', table_name='verified_email_addresses')
    op.drop_index('idx_mailgun_active', table_name='mailgun_settings')
    op.drop_index('idx_mailgun_user_id', table_name='mailgun_settings')

    # Drop tables
    op.drop_table('verified_email_addresses')
    op.drop_table('mailgun_settings')
