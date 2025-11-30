"""add_user_roles_and_status

Revision ID: 9a3f2b1c4d5e
Revises: 8bed543240f3
Create Date: 2025-11-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '9a3f2b1c4d5e'
down_revision = '8bed543240f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum for user roles
    op.execute("CREATE TYPE user_role AS ENUM ('owner', 'admin', 'user')")

    # Convert existing role column from varchar to enum
    # First, update existing values to match enum values (convert 'staff' to 'user')
    op.execute("UPDATE users SET role = 'user' WHERE role NOT IN ('owner', 'admin', 'user')")

    # Alter column type using USING clause
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role")

    # Add status columns (is_active already exists, so add only if doesn't exist)
    # Check and add is_approved
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_approved') THEN
                ALTER TABLE users ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;
            END IF;
        END $$;
    """)

    # Add new columns
    op.add_column('users', sa.Column('approved_by_user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('users', sa.Column('approved_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('deactivated_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('deactivated_by_user_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Add foreign key constraints
    op.create_foreign_key('fk_users_approved_by', 'users', 'users', ['approved_by_user_id'], ['id'])
    op.create_foreign_key('fk_users_deactivated_by', 'users', 'users', ['deactivated_by_user_id'], ['id'])

    # Create indexes (skip role and is_active as they already exist)
    op.create_index('idx_users_is_approved', 'users', ['is_approved'])

    # Create unique partial index for single active owner
    op.execute(
        "CREATE UNIQUE INDEX idx_users_single_active_owner "
        "ON users (role) "
        "WHERE role = 'owner' AND is_active = true"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_users_single_active_owner")
    op.drop_index('idx_users_is_approved', 'users')
    op.drop_index('idx_users_is_active', 'users')
    op.drop_index('idx_users_role', 'users')
    op.drop_constraint('fk_users_deactivated_by', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_approved_by', 'users', type_='foreignkey')
    op.drop_column('users', 'deactivated_by_user_id')
    op.drop_column('users', 'deactivated_at')
    op.drop_column('users', 'approved_at')
    op.drop_column('users', 'approved_by_user_id')
    op.drop_column('users', 'is_approved')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'role')
    op.execute("DROP TYPE user_role")
