#!/usr/bin/env python3
"""
Initialize production database and create admin user
This script bypasses Alembic migrations and creates all tables directly
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.api.v1.auth import get_password_hash

# Import the Base and all models to ensure they're registered
from app.config.database import Base
from app.models import (
    User, UserRole, Contact, ContactStatus, ContactSource,
    Communication, CommunicationType, CommunicationDirection, CommunicationStatus,
    Payment, PaymentGateway, PaymentStatus,
    Workflow, WorkflowExecution, WorkflowTriggerType, WorkflowActionType,
    Integration, IntegrationType, Pipeline, FieldVisibility,
    Tag, ContactTag, ContactActivity, FeatureFlag,
    MailgunSettings, VerifiedEmailAddress, EmailTemplate,
    EmailCampaign, CampaignRecipient, CampaignStatus, CampaignRecipientStatus,
    Autoresponder, AutoresponderSequence, AutoresponderExecution,
    TriggerType, ExecutionStatus, EmailSuppression, SuppressionType,
    UnsubscribeToken, Object, ObjectContact, ObjectUser, ObjectWebsite,
    ObjectMailgunSettings, EmailSendingProfile, UserEmailProfileAssignment
)

# Production database URL - using container name for postgres host
DATABASE_URL = "postgresql+asyncpg://senova_crm_user:senova_dev_password@postgres:5432/senova_crm"

async def init_db():
    """Create all tables and admin user"""
    print("=" * 60)
    print("Production Database Initialization")
    print("=" * 60)

    print(f"\n1. Connecting to database...")
    print(f"   Database URL: {DATABASE_URL}")

    engine = create_async_engine(DATABASE_URL, echo=False)

    try:
        # Create all tables
        async with engine.begin() as conn:
            print("\n2. Creating database tables...")
            await conn.run_sync(Base.metadata.create_all)
            print("   ✓ All tables created successfully!")

        # Create admin user
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as session:
            print("\n3. Checking for existing admin user...")

            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == "jwoodcapital@gmail.com")
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print(f"   ! User already exists: {existing_user.email}")
                print(f"     Role: {existing_user.role}")
                print(f"     Active: {existing_user.is_active}")

                # Update password if user exists
                print("\n4. Updating password for existing user...")
                existing_user.hashed_password = get_password_hash("D3n1w3n1!")
                existing_user.role = UserRole.OWNER
                existing_user.is_active = True
                await session.commit()
                print("   ✓ Password and role updated successfully!")

            else:
                print("   User not found, creating new admin user...")

                # Hash the password
                hashed_password = get_password_hash("D3n1w3n1!")

                # Create owner user
                admin_user = User(
                    email="jwoodcapital@gmail.com",
                    hashed_password=hashed_password,
                    role=UserRole.OWNER,
                    is_active=True,
                    full_name="Jeff Wood"
                )
                session.add(admin_user)
                await session.commit()

                print(f"\n   ✓ Created admin user successfully!")
                print(f"     Email: {admin_user.email}")
                print(f"     Role: {admin_user.role}")
                print(f"     Active: {admin_user.is_active}")

        # Verify the user can be retrieved
        async with async_session() as session:
            print("\n5. Verifying admin user...")
            result = await session.execute(
                select(User).where(User.email == "jwoodcapital@gmail.com")
            )
            user = result.scalar_one_or_none()

            if user:
                print(f"   ✓ Admin user verified!")
                print(f"     ID: {user.id}")
                print(f"     Email: {user.email}")
                print(f"     Role: {user.role}")
                print(f"     Active: {user.is_active}")
            else:
                print("   ✗ Failed to verify admin user!")
                return False

    except Exception as e:
        print(f"\n✗ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await engine.dispose()

    print("\n" + "=" * 60)
    print("✓ Database initialization complete!")
    print("=" * 60)
    print("\nAdmin credentials:")
    print("  Email: jwoodcapital@gmail.com")
    print("  Password: D3n1w3n1!")
    print("  Role: OWNER")
    print("\n")

    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(init_db())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)