"""create_field_visibility

Revision ID: 7e8d9a2b3c4f
Revises: 9a3f2b1c4d5e
Create Date: 2025-11-06 10:01:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '7e8d9a2b3c4f'
down_revision = '9a3f2b1c4d5e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'field_visibility',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('field_name', sa.String(100), nullable=False),
        sa.Column('field_label', sa.String(255), nullable=False),
        sa.Column('field_category', sa.String(50), nullable=True),
        sa.Column('visible_to_admin', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('visible_to_user', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_sensitive', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_by_user_id', postgresql.UUID(as_uuid=True), nullable=True)
    )

    op.create_foreign_key('fk_field_visibility_updated_by', 'field_visibility', 'users', ['updated_by_user_id'], ['id'])
    op.create_index('idx_field_visibility_field_name', 'field_visibility', ['field_name'], unique=True)


def downgrade() -> None:
    op.drop_constraint('fk_field_visibility_updated_by', 'field_visibility', type_='foreignkey')
    op.drop_table('field_visibility')
