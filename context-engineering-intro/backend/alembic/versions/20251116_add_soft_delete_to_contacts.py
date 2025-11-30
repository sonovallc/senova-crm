"""add soft delete to contacts

Revision ID: 5ac70a7e0cbe
Revises: add_normalized_phone_indexes
Create Date: 2025-11-16 09:03:23.911300

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '5ac70a7e0cbe'
down_revision = 'add_normalized_phone_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'contacts',
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column('contacts', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('contacts', sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index('ix_contacts_is_deleted', 'contacts', ['is_deleted'])


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text('DROP INDEX IF EXISTS ix_contacts_is_deleted'))

    inspector = sa.inspect(conn)
    existing_columns = {col['name'] for col in inspector.get_columns('contacts')}
    for column_name in ('deleted_by', 'deleted_at', 'is_deleted'):
        if column_name in existing_columns:
            op.drop_column('contacts', column_name)
