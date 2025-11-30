"""create email suppressions table

Revision ID: 20251125_0000
Revises: a1b2c3d4e5f6
Create Date: 2025-11-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251125_0000'
down_revision = 'autoresponder_20251123'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for suppression_type
    suppression_type_enum = postgresql.ENUM('bounce', 'unsubscribe', 'complaint', name='suppressiontype')
    suppression_type_enum.create(op.get_bind())

    # Create email_suppressions table
    op.create_table(
        'email_suppressions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('suppression_type', suppression_type_enum, nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('mailgun_created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('synced_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_email_suppression_email')
    )

    # Create indexes
    op.create_index('idx_email_suppression_email', 'email_suppressions', ['email'], unique=False)
    op.create_index('idx_email_suppression_type', 'email_suppressions', ['suppression_type'], unique=False)
    op.create_index('idx_email_suppression_email_type', 'email_suppressions', ['email', 'suppression_type'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_email_suppression_email_type', table_name='email_suppressions')
    op.drop_index('idx_email_suppression_type', table_name='email_suppressions')
    op.drop_index('idx_email_suppression_email', table_name='email_suppressions')

    # Drop table
    op.drop_table('email_suppressions')

    # Drop enum type
    sa.Enum(name='suppressiontype').drop(op.get_bind())
