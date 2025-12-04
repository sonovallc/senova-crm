"""create_email_sending_profiles

Revision ID: c8f9d2e3a1b4
Revises: seed_senova_001
Create Date: 2025-12-03 00:00:00.000000

Creates email sending profiles for organization-wide email configuration
with user assignments.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c8f9d2e3a1b4'
down_revision = 'seed_senova_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create email_sending_profiles and user_email_profile_assignments tables"""

    # Create email_sending_profiles table
    op.create_table(
        'email_sending_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email_address', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(255), nullable=False),
        sa.Column('reply_to_address', sa.String(255), nullable=False),
        sa.Column('signature_html', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint('email_address', name='uq_email_sending_profile_email'),
    )

    # Create indexes for email_sending_profiles
    op.create_index('idx_email_profile_active', 'email_sending_profiles', ['is_active'])
    op.create_index('idx_email_profile_email', 'email_sending_profiles', ['email_address'])

    # Create user_email_profile_assignments table
    op.create_table(
        'user_email_profile_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_email_assignment_user', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['profile_id'], ['email_sending_profiles.id'], name='fk_user_email_assignment_profile', ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'profile_id', name='uq_user_email_profile'),
    )

    # Create indexes for user_email_profile_assignments
    op.create_index('idx_user_email_assignment_user', 'user_email_profile_assignments', ['user_id'])
    op.create_index('idx_user_email_assignment_profile', 'user_email_profile_assignments', ['profile_id'])


def downgrade() -> None:
    """Drop email_sending_profiles and user_email_profile_assignments tables"""

    # Drop indexes first
    op.drop_index('idx_user_email_assignment_profile', table_name='user_email_profile_assignments')
    op.drop_index('idx_user_email_assignment_user', table_name='user_email_profile_assignments')
    op.drop_index('idx_email_profile_email', table_name='email_sending_profiles')
    op.drop_index('idx_email_profile_active', table_name='email_sending_profiles')

    # Drop tables
    op.drop_table('user_email_profile_assignments')
    op.drop_table('email_sending_profiles')