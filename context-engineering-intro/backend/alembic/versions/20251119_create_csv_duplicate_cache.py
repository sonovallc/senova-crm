"""create csv_duplicate_cache table

Revision ID: d8c2g2gb45e2
Revises: c7b1f1fa34d1
Create Date: 2025-11-19

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = 'd8c2g2gb45e2'
down_revision = 'c7b1f1fa34d1'
branch_labels = None
depends_on = None


def upgrade():
    # Create csv_duplicate_cache table
    op.create_table(
        'csv_duplicate_cache',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('validation_id', UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('duplicate_group_id', sa.String(255), nullable=False, index=True),
        sa.Column('duplicate_type', sa.String(20), nullable=False),  # 'internal' or 'external'
        sa.Column('duplicate_field', sa.String(100), nullable=False),
        sa.Column('duplicate_value', sa.Text(), nullable=False),
        sa.Column('csv_row_index', sa.Integer(), nullable=True),
        sa.Column('existing_contact_id', UUID(as_uuid=True), nullable=True),  # UUID to match contacts.id
        sa.Column('user_decision', sa.String(50), nullable=True),
        sa.Column('shown_to_user', sa.Boolean(), default=True, nullable=False),
        sa.Column('cross_column_duplicate', sa.Boolean(), default=False, nullable=False),
        sa.Column('cross_column_fields', sa.Text(), nullable=True),
        sa.Column('hash_match_duplicate', sa.Boolean(), default=False, nullable=False),
        sa.Column('data_completeness_score', sa.Integer(), nullable=True),
        sa.Column('recommendation', sa.String(50), nullable=True),
        sa.Column('recommendation_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['existing_contact_id'], ['contacts.id'], ondelete='SET NULL'),
    )

    # Create indexes for common queries
    op.create_index('idx_csv_duplicate_cache_validation_id', 'csv_duplicate_cache', ['validation_id'])
    op.create_index('idx_csv_duplicate_cache_group_id', 'csv_duplicate_cache', ['duplicate_group_id'])
    op.create_index('idx_csv_duplicate_cache_row_index', 'csv_duplicate_cache', ['csv_row_index'])
    op.create_index('idx_csv_duplicate_cache_shown_to_user', 'csv_duplicate_cache', ['shown_to_user'])

    # Add duplicate_flags JSONB column to contacts table
    op.add_column('contacts', sa.Column('duplicate_flags', JSONB, default={}, nullable=True))
    op.create_index('idx_contacts_duplicate_flags', 'contacts', ['duplicate_flags'], postgresql_using='gin')


def downgrade():
    op.drop_index('idx_contacts_duplicate_flags', table_name='contacts')
    op.drop_column('contacts', 'duplicate_flags')

    op.drop_index('idx_csv_duplicate_cache_shown_to_user', table_name='csv_duplicate_cache')
    op.drop_index('idx_csv_duplicate_cache_row_index', table_name='csv_duplicate_cache')
    op.drop_index('idx_csv_duplicate_cache_group_id', table_name='csv_duplicate_cache')
    op.drop_index('idx_csv_duplicate_cache_validation_id', table_name='csv_duplicate_cache')
    op.drop_table('csv_duplicate_cache')
