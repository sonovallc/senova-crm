#!/usr/bin/env python3
"""
Seed script for Senova CRM initial data.
Creates master owner profile and Senova CRM object.

Run with: python -m scripts.seed_senova_data
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone
import logging
import os

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Override DATABASE_URL for local execution if running outside Docker
if 'DATABASE_URL' in os.environ and 'postgres:5432' in os.environ['DATABASE_URL']:
    os.environ['DATABASE_URL'] = os.environ['DATABASE_URL'].replace('postgres:5432', 'localhost:5432')

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.config.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.object import Object, ObjectUser
from app.core.security import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Master owner credentials
MASTER_OWNER_EMAIL = "jwoodcapital@gmail.com"
MASTER_OWNER_PASSWORD = "D3n1w3n1!"
MASTER_OWNER_NAME = "System Owner"

# Senova CRM object data
SENOVA_OBJECT = {
    "name": "Senova CRM",
    "type": "company",
    "company_info": {
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
}


async def create_master_owner(session):
    """Create or verify master owner profile"""

    try:
        # Check if owner already exists
        result = await session.execute(
            select(User).where(User.email == MASTER_OWNER_EMAIL)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            # Update to ensure owner role and active status
            if existing_user.role != UserRole.OWNER:
                existing_user.role = UserRole.OWNER
                logger.info(f"✓ Updated existing user to owner role: {MASTER_OWNER_EMAIL}")

            if not existing_user.is_active or not existing_user.is_verified:
                existing_user.is_active = True
                existing_user.is_verified = True
                existing_user.is_approved = True
                logger.info(f"✓ Activated and verified existing user: {MASTER_OWNER_EMAIL}")

            await session.commit()
            logger.info(f"✓ Master owner already exists: {MASTER_OWNER_EMAIL}")
            return existing_user

        # Create new master owner
        master_owner = User(
            email=MASTER_OWNER_EMAIL,
            hashed_password=get_password_hash(MASTER_OWNER_PASSWORD),
            first_name="System",
            last_name="Owner",
            full_name=MASTER_OWNER_NAME,
            role=UserRole.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=True,
            approved_at=datetime.now(timezone.utc),
            permissions=["*:*"],  # Full system permissions
            object_permissions={
                "global": {
                    "can_create_objects": True,
                    "can_manage_all_objects": True,
                    "can_assign_users": True,
                    "can_manage_system": True
                }
            }
        )

        session.add(master_owner)
        await session.commit()

        logger.info("✅ Master owner created successfully!")
        logger.info(f"   Email: {MASTER_OWNER_EMAIL}")
        logger.info(f"   Password: [SECURED]")
        logger.info(f"   Role: {UserRole.OWNER.value}")
        logger.info(f"   Name: {MASTER_OWNER_NAME}")

        return master_owner

    except IntegrityError as e:
        await session.rollback()
        logger.error(f"❌ Integrity error creating master owner: {e}")
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"❌ Error creating master owner: {e}")
        raise


async def create_senova_object(session, owner_user):
    """Create or verify Senova CRM object"""

    try:
        # Check if Senova object already exists
        result = await session.execute(
            select(Object).where(Object.name == SENOVA_OBJECT["name"])
        )
        existing_object = result.scalar_one_or_none()

        if existing_object:
            # Update company info if needed
            if existing_object.company_info != SENOVA_OBJECT["company_info"]:
                existing_object.company_info = SENOVA_OBJECT["company_info"]
                existing_object.updated_at = datetime.now(timezone.utc)
                await session.commit()
                logger.info(f"✓ Updated Senova object company info")

            logger.info(f"✓ Senova CRM object already exists: {existing_object.id}")
            return existing_object

        # Create new Senova object
        senova_object = Object(
            name=SENOVA_OBJECT["name"],
            type=SENOVA_OBJECT["type"],
            company_info=SENOVA_OBJECT["company_info"],
            created_by=owner_user.id,
            deleted=False
        )

        session.add(senova_object)
        await session.flush()  # Get the ID without committing

        # Create ObjectUser permission for the owner
        object_user_permission = ObjectUser(
            object_id=senova_object.id,
            user_id=owner_user.id,
            permissions={
                "can_view": True,
                "can_manage_contacts": True,
                "can_manage_company_info": True,
                "can_manage_websites": True,
                "can_assign_users": True,
                "can_delete_object": True,
                "is_owner": True  # Mark as object owner
            },
            assigned_by=owner_user.id,
            role_name="Owner"
        )

        session.add(object_user_permission)

        # Also add the object ID to user's assigned_object_ids
        if not owner_user.assigned_object_ids:
            owner_user.assigned_object_ids = []

        if senova_object.id not in owner_user.assigned_object_ids:
            owner_user.assigned_object_ids.append(senova_object.id)

        await session.commit()

        logger.info("✅ Senova CRM object created successfully!")
        logger.info(f"   ID: {senova_object.id}")
        logger.info(f"   Name: {senova_object.name}")
        logger.info(f"   Type: {senova_object.type}")
        logger.info(f"   Industry: {senova_object.company_info.get('industry')}")
        logger.info(f"   Website: {senova_object.company_info.get('website')}")
        logger.info(f"   Owner: {owner_user.email}")

        return senova_object

    except IntegrityError as e:
        await session.rollback()
        logger.error(f"❌ Integrity error creating Senova object: {e}")
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"❌ Error creating Senova object: {e}")
        raise


async def verify_data(session):
    """Verify the seeded data exists and relationships are correct"""

    try:
        # Verify owner exists
        result = await session.execute(
            select(User).where(User.email == MASTER_OWNER_EMAIL)
        )
        owner = result.scalar_one_or_none()

        if not owner:
            logger.error("❌ Master owner not found after seeding")
            return False

        # Verify Senova object exists
        result = await session.execute(
            select(Object).where(Object.name == SENOVA_OBJECT["name"])
        )
        senova_obj = result.scalar_one_or_none()

        if not senova_obj:
            logger.error("❌ Senova object not found after seeding")
            return False

        # Verify ObjectUser relationship
        result = await session.execute(
            select(ObjectUser).where(
                (ObjectUser.object_id == senova_obj.id) &
                (ObjectUser.user_id == owner.id)
            )
        )
        obj_user = result.scalar_one_or_none()

        if not obj_user:
            logger.error("❌ ObjectUser relationship not found")
            return False

        logger.info("\n" + "="*50)
        logger.info("✅ Data verification successful!")
        logger.info("="*50)
        logger.info(f"Owner: {owner.email} (Role: {owner.role})")
        logger.info(f"Object: {senova_obj.name} (ID: {senova_obj.id})")
        logger.info(f"Permissions: Owner has full permissions on object")
        logger.info("="*50 + "\n")

        return True

    except Exception as e:
        logger.error(f"❌ Error verifying data: {e}")
        return False


async def seed_data():
    """Main function to seed all initial data"""

    logger.info("="*60)
    logger.info("Starting Senova CRM data seeding...")
    logger.info("="*60 + "\n")

    async with AsyncSessionLocal() as session:
        try:
            # Create master owner
            logger.info("Step 1: Creating master owner profile...")
            owner = await create_master_owner(session)

            # Create Senova CRM object
            logger.info("\nStep 2: Creating Senova CRM object...")
            senova_obj = await create_senova_object(session, owner)

            # Verify everything is set up correctly
            logger.info("\nStep 3: Verifying seeded data...")
            success = await verify_data(session)

            if success:
                logger.info("\n🎉 Senova CRM seed data completed successfully!")
                logger.info("\n📝 Login credentials:")
                logger.info(f"   Email: {MASTER_OWNER_EMAIL}")
                logger.info(f"   Password: [Check script for secure password]")
                logger.info("\n⚠️  IMPORTANT SECURITY NOTES:")
                logger.info("   1. Change the password after first login")
                logger.info("   2. Enable 2FA if available")
                logger.info("   3. Keep credentials secure")
            else:
                logger.error("\n❌ Data seeding verification failed")

        except Exception as e:
            logger.error(f"\n❌ Fatal error during seeding: {e}")
            raise


if __name__ == "__main__":
    try:
        asyncio.run(seed_data())
    except KeyboardInterrupt:
        logger.info("\n⚠️  Seeding interrupted by user")
    except Exception as e:
        logger.error(f"\n❌ Seeding failed: {e}")
        sys.exit(1)