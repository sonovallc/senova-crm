"""Add objects feature

Revision ID: add_objects_feature
Revises:
Create Date: 2025-11-27 18:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_objects_feature'
down_revision = '20251127_1400'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create objects table
    op.create_table('objects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, server_default='company'),
        sa.Column('company_info', postgresql.JSONB(astext_type=sa.Text()), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('deleted', sa.Boolean(), server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_objects_created_by', 'objects', ['created_by'], unique=False)
    op.create_index('idx_objects_deleted', 'objects', ['deleted'], unique=False)
    op.create_index('idx_objects_name_type', 'objects', ['name', 'type'], unique=False)
    op.create_index(op.f('ix_objects_name'), 'objects', ['name'], unique=False)
    op.create_index(op.f('ix_objects_type'), 'objects', ['type'], unique=False)

    # Create object_contacts junction table
    op.create_table('object_contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('assigned_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('is_primary_contact', sa.Boolean(), server_default='false'),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['object_id'], ['objects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('object_id', 'contact_id', name='uq_object_contact')
    )
    op.create_index('idx_object_contacts_primary', 'object_contacts', ['object_id', 'is_primary_contact'], unique=False)
    op.create_index(op.f('ix_object_contacts_contact_id'), 'object_contacts', ['contact_id'], unique=False)
    op.create_index(op.f('ix_object_contacts_object_id'), 'object_contacts', ['object_id'], unique=False)

    # Create object_users junction table with permissions
    op.create_table('object_users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('assigned_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_name', sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['object_id'], ['objects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('object_id', 'user_id', name='uq_object_user')
    )
    op.create_index('idx_object_users_permissions', 'object_users', ['object_id', 'user_id'], unique=False)
    op.create_index(op.f('ix_object_users_object_id'), 'object_users', ['object_id'], unique=False)
    op.create_index(op.f('ix_object_users_user_id'), 'object_users', ['user_id'], unique=False)

    # Create object_websites table
    op.create_table('object_websites',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('custom_domain', sa.String(length=255), nullable=True),
        sa.Column('content', postgresql.JSONB(astext_type=sa.Text()), server_default='{}'),
        sa.Column('published', sa.Boolean(), server_default='false'),
        sa.Column('ssl_provisioned', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['object_id'], ['objects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_object_websites_object', 'object_websites', ['object_id'], unique=False)
    op.create_index('idx_object_websites_published', 'object_websites', ['published'], unique=False)
    op.create_index(op.f('ix_object_websites_custom_domain'), 'object_websites', ['custom_domain'], unique=True)
    op.create_index(op.f('ix_object_websites_object_id'), 'object_websites', ['object_id'], unique=False)
    op.create_index(op.f('ix_object_websites_published'), 'object_websites', ['published'], unique=False)
    op.create_index(op.f('ix_object_websites_slug'), 'object_websites', ['slug'], unique=True)

    # Add columns to contacts table
    op.add_column('contacts', sa.Column('object_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default='{}', nullable=True))
    op.add_column('contacts', sa.Column('primary_object_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('contacts', sa.Column('assigned_user_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default='{}', nullable=True))
    op.create_foreign_key('fk_contacts_primary_object', 'contacts', 'objects', ['primary_object_id'], ['id'], ondelete='SET NULL')

    # Add columns to users table
    op.add_column('users', sa.Column('assigned_object_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default='{}', nullable=True))
    op.add_column('users', sa.Column('object_permissions', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=True))


def downgrade() -> None:
    # Remove foreign key and columns from users table
    op.drop_column('users', 'object_permissions')
    op.drop_column('users', 'assigned_object_ids')

    # Remove foreign key and columns from contacts table
    op.drop_constraint('fk_contacts_primary_object', 'contacts', type_='foreignkey')
    op.drop_column('contacts', 'assigned_user_ids')
    op.drop_column('contacts', 'primary_object_id')
    op.drop_column('contacts', 'object_ids')

    # Drop tables in reverse order
    op.drop_index(op.f('ix_object_websites_slug'), table_name='object_websites')
    op.drop_index(op.f('ix_object_websites_published'), table_name='object_websites')
    op.drop_index(op.f('ix_object_websites_object_id'), table_name='object_websites')
    op.drop_index(op.f('ix_object_websites_custom_domain'), table_name='object_websites')
    op.drop_index('idx_object_websites_published', table_name='object_websites')
    op.drop_index('idx_object_websites_object', table_name='object_websites')
    op.drop_table('object_websites')

    op.drop_index(op.f('ix_object_users_user_id'), table_name='object_users')
    op.drop_index(op.f('ix_object_users_object_id'), table_name='object_users')
    op.drop_index('idx_object_users_permissions', table_name='object_users')
    op.drop_table('object_users')

    op.drop_index(op.f('ix_object_contacts_object_id'), table_name='object_contacts')
    op.drop_index(op.f('ix_object_contacts_contact_id'), table_name='object_contacts')
    op.drop_index('idx_object_contacts_primary', table_name='object_contacts')
    op.drop_table('object_contacts')

    op.drop_index(op.f('ix_objects_type'), table_name='objects')
    op.drop_index(op.f('ix_objects_name'), table_name='objects')
    op.drop_index('idx_objects_name_type', table_name='objects')
    op.drop_index('idx_objects_deleted', table_name='objects')
    op.drop_index('idx_objects_created_by', table_name='objects')
    op.drop_table('objects')