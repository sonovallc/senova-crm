"""add communications indexes for inbox query performance

Revision ID: m7n8o9p0q1r2
Revises: f1g2h3i4j5k6
Create Date: 2025-11-21 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'm7n8o9p0q1r2'
down_revision = 'f1g2h3i4j5k6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add strategic database indexes to communications table for optimal inbox query performance"""

    # Single-column indexes for filtering and sorting
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_contact_id ON communications (contact_id)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_created_at ON communications (created_at DESC)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_sent_at ON communications (sent_at DESC)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_direction ON communications (direction)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_status ON communications (status)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_type ON communications (type)')

    # Composite indexes for common inbox query patterns
    # Most common: group by contact, sort by recent activity
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_contact_created ON communications (contact_id, created_at DESC)')

    # Filter by direction (inbound/outbound), sort by recent
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_direction_created ON communications (direction, created_at DESC)')

    # Filter by status (read/unread/pending), sort by recent
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_status_created ON communications (status, created_at DESC)')

    # Filter by type (email/sms), group by contact, sort by recent
    op.execute('CREATE INDEX IF NOT EXISTS ix_communications_type_contact_created ON communications (type, contact_id, created_at DESC)')


def downgrade() -> None:
    """Drop all communications indexes"""

    # Drop composite indexes
    op.execute('DROP INDEX IF EXISTS ix_communications_type_contact_created')
    op.execute('DROP INDEX IF EXISTS ix_communications_status_created')
    op.execute('DROP INDEX IF EXISTS ix_communications_direction_created')
    op.execute('DROP INDEX IF EXISTS ix_communications_contact_created')

    # Drop single-column indexes
    op.execute('DROP INDEX IF EXISTS ix_communications_type')
    op.execute('DROP INDEX IF EXISTS ix_communications_status')
    op.execute('DROP INDEX IF EXISTS ix_communications_direction')
    op.execute('DROP INDEX IF EXISTS ix_communications_sent_at')
    op.execute('DROP INDEX IF EXISTS ix_communications_created_at')
    op.execute('DROP INDEX IF EXISTS ix_communications_contact_id')
