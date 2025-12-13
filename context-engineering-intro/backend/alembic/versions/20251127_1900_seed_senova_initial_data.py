"""Seed Senova CRM initial data

Revision ID: seed_senova_001
Revises: 20251127_1830_add_objects_feature
Create Date: 2025-11-27 19:00:00

Creates:
- Master owner user (jwoodcapital@gmail.com)
- Senova CRM object
- ObjectUser relationship between owner and Senova object
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime, timezone
import uuid
import os

# Import password hashing function
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from app.core.security import get_password_hash

# Revision identifiers
revision = 'seed_senova_001'
down_revision = 'add_objects_feature'
branch_labels = None
depends_on = None

# Master owner credentials
MASTER_OWNER_EMAIL = "jwoodcapital@gmail.com"
MASTER_OWNER_PASSWORD = os.getenv("MASTER_OWNER_PASSWORD")
if not MASTER_OWNER_PASSWORD:
    raise ValueError(
        "MASTER_OWNER_PASSWORD environment variable must be set. "
        "This is required to create the initial admin user. "
        "Generate a strong password with: openssl rand -base64 24"
    )
MASTER_OWNER_ID = str(uuid.uuid4())

# Senova object ID
SENOVA_OBJECT_ID = str(uuid.uuid4())


def upgrade():
    """Create initial seed data"""

    conn = op.get_bind()

    # Check if master owner already exists
    result = conn.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": MASTER_OWNER_EMAIL}
    ).fetchone()

    if result:
        owner_id = str(result[0])
        print(f"Master owner already exists with ID: {owner_id}")
    else:
        # Create master owner
        owner_id = MASTER_OWNER_ID
        hashed_password = get_password_hash(MASTER_OWNER_PASSWORD)

        conn.execute(
            text("""
                INSERT INTO users (
                    id, email, hashed_password, first_name, last_name, full_name,
                    role, is_active, is_verified, is_approved, approved_at,
                    permissions, object_permissions, assigned_object_ids,
                    created_at, updated_at
                ) VALUES (
                    :id, :email, :hashed_password, :first_name, :last_name, :full_name,
                    :role, :is_active, :is_verified, :is_approved, :approved_at,
                    :permissions::jsonb, :object_permissions::jsonb, :assigned_object_ids,
                    :created_at, :updated_at
                )
            """),
            {
                "id": owner_id,
                "email": MASTER_OWNER_EMAIL,
                "hashed_password": hashed_password,
                "first_name": "System",
                "last_name": "Owner",
                "full_name": "System Owner",
                "role": "owner",
                "is_active": True,
                "is_verified": True,
                "is_approved": True,
                "approved_at": datetime.now(timezone.utc),
                "permissions": '["*:*"]',
                "object_permissions": '{"global": {"can_create_objects": true, "can_manage_all_objects": true, "can_assign_users": true, "can_manage_system": true}}',
                "assigned_object_ids": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        )
        print(f"Created master owner with ID: {owner_id}")

    # Check if Senova object already exists
    result = conn.execute(
        text("SELECT id FROM objects WHERE name = :name"),
        {"name": "Senova CRM"}
    ).fetchone()

    if result:
        senova_id = str(result[0])
        print(f"Senova CRM object already exists with ID: {senova_id}")
    else:
        # Create Senova CRM object
        senova_id = SENOVA_OBJECT_ID
        company_info = {
            "legal_name": "Senova",
            "parent_company": "Noveris Data, LLC",
            "address": {
                "street": "8 The Green #21994",
                "city": "Dover",
                "state": "DE",
                "postal_code": "19901",
                "country": "USA"
            },
            "email": "info@senovallc.com",
            "website": "senovallc.com",
            "industry": "Technology / SaaS",
            "description": "B2B SaaS CRM and audience intelligence platform for medical aesthetics",
            "size": "10-50",
            "founding_year": "2024"
        }

        conn.execute(
            text("""
                INSERT INTO objects (
                    id, name, type, company_info, created_by,
                    created_at, updated_at, deleted
                ) VALUES (
                    :id, :name, :type, :company_info::jsonb, :created_by,
                    :created_at, :updated_at, :deleted
                )
            """),
            {
                "id": senova_id,
                "name": "Senova CRM",
                "type": "company",
                "company_info": sa.text(f"'{sa.JSON.NULL.process_bind_param(company_info, None)}'"),
                "created_by": owner_id,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "deleted": False
            }
        )
        print(f"Created Senova CRM object with ID: {senova_id}")

    # Check if ObjectUser relationship exists
    result = conn.execute(
        text("""
            SELECT id FROM object_users
            WHERE object_id = :object_id AND user_id = :user_id
        """),
        {"object_id": senova_id, "user_id": owner_id}
    ).fetchone()

    if not result:
        # Create ObjectUser relationship
        permissions = {
            "can_view": True,
            "can_manage_contacts": True,
            "can_manage_company_info": True,
            "can_manage_websites": True,
            "can_assign_users": True,
            "can_delete_object": True,
            "is_owner": True
        }

        conn.execute(
            text("""
                INSERT INTO object_users (
                    id, object_id, user_id, permissions,
                    assigned_at, assigned_by, role_name
                ) VALUES (
                    :id, :object_id, :user_id, :permissions::jsonb,
                    :assigned_at, :assigned_by, :role_name
                )
            """),
            {
                "id": str(uuid.uuid4()),
                "object_id": senova_id,
                "user_id": owner_id,
                "permissions": sa.text(f"'{sa.JSON.NULL.process_bind_param(permissions, None)}'"),
                "assigned_at": datetime.now(timezone.utc),
                "assigned_by": owner_id,
                "role_name": "Owner"
            }
        )

        # Update user's assigned_object_ids
        conn.execute(
            text("""
                UPDATE users
                SET assigned_object_ids = array_append(assigned_object_ids, :object_id::uuid)
                WHERE id = :user_id::uuid
                AND NOT (:object_id::uuid = ANY(assigned_object_ids))
            """),
            {"user_id": owner_id, "object_id": senova_id}
        )

        print(f"Created ObjectUser relationship between owner and Senova object")

    print("\n✅ Senova CRM seed data migration completed successfully!")


def downgrade():
    """Remove seed data (optional - be careful with this)"""

    conn = op.get_bind()

    # This is a data migration, so we might want to keep the data even on downgrade
    # Uncomment below if you really want to remove the seed data

    # # Remove ObjectUser relationships
    # conn.execute(
    #     text("""
    #         DELETE FROM object_users
    #         WHERE object_id IN (SELECT id FROM objects WHERE name = 'Senova CRM')
    #     """)
    # )
    #
    # # Remove Senova object
    # conn.execute(
    #     text("DELETE FROM objects WHERE name = 'Senova CRM'")
    # )
    #
    # # Note: We don't remove the user as they might have other data associated

    print("Data migration downgrade: No action taken (preserving seed data)")