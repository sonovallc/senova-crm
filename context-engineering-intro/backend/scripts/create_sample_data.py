"""
Create sample data for testing

Run with: python -m scripts.create_sample_data
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.config.database import AsyncSessionLocal
from app.models.contact import Contact, ContactSource, ContactStatus
from app.models.user import User


async def create_sample_data():
    """Create sample contacts for testing"""

    async with AsyncSessionLocal() as session:
        # Get admin user
        result = await session.execute(
            select(User).where(User.email == "admin@senovallc.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Admin user not found. Run create_admin.py first.")
            return

        # Check if sample data already exists
        result = await session.execute(select(Contact))
        existing = result.scalars().all()

        if len(existing) > 0:
            print(f"ℹ️  Sample data already exists ({len(existing)} contacts)")
            return

        print("📝 Creating sample contacts...")

        # Sample contacts
        contacts = [
            Contact(
                email="sarah.johnson@email.com",
                first_name="Sarah",
                last_name="Johnson",
                phone="+1-555-0101",
                status=ContactStatus.LEAD,
                source=ContactSource.WEBSITE,
                assigned_to_id=admin.id,
                tags=["permanent-makeup", "microblading"],
                custom_fields={
                    "interest": "Microblading",
                    "budget": "$500-1000",
                    "preferred_contact": "email"
                },
            ),
            Contact(
                email="michael.chen@email.com",
                first_name="Michael",
                last_name="Chen",
                phone="+1-555-0102",
                status=ContactStatus.CUSTOMER,
                source=ContactSource.REFERRAL,
                assigned_to_id=admin.id,
                tags=["vip", "skin-treatment"],
                custom_fields={
                    "interest": "HydraFacial",
                    "visits": 3,
                    "lifetime_value": "$1200"
                },
            ),
            Contact(
                email="emma.wilson@email.com",
                first_name="Emma",
                last_name="Wilson",
                phone="+1-555-0103",
                status=ContactStatus.LEAD,
                source=ContactSource.SOCIAL_MEDIA,
                assigned_to_id=admin.id,
                tags=["body-contouring", "consultation-scheduled"],
                custom_fields={
                    "interest": "Venus Bliss Body Contouring",
                    "consultation_date": "2025-11-15",
                    "referred_by": "Sarah Johnson"
                },
            ),
            Contact(
                email="james.martinez@email.com",
                first_name="James",
                last_name="Martinez",
                phone="+1-555-0104",
                status=ContactStatus.CUSTOMER,
                source=ContactSource.OTHER,
                assigned_to_id=admin.id,
                tags=["permanent-eyeliner", "returning-client"],
                custom_fields={
                    "interest": "Permanent Eyeliner",
                    "previous_service": "Microblading (2024)",
                    "satisfaction": "5/5"
                },
            ),
            Contact(
                email="olivia.brown@email.com",
                first_name="Olivia",
                last_name="Brown",
                phone="+1-555-0105",
                status=ContactStatus.LEAD,
                source=ContactSource.SOCIAL_MEDIA,
                assigned_to_id=admin.id,
                tags=["lash-lift", "new-client-special"],
                custom_fields={
                    "interest": "Keratin Lash Lift",
                    "budget": "Under $200",
                    "how_heard": "Facebook Ad Campaign"
                },
            ),
        ]

        for contact in contacts:
            session.add(contact)

        await session.commit()

        print(f"✅ Created {len(contacts)} sample contacts:")
        for contact in contacts:
            full_name = f"{contact.first_name} {contact.last_name}"
            print(f"   - {full_name} ({contact.email}) - {contact.status.value}")

        print("\n💡 You can now test the CRM with realistic data!")


if __name__ == "__main__":
    asyncio.run(create_sample_data())
