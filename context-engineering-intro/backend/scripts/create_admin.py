"""
Create initial admin user for Senova CRM

Run with: python -m scripts.create_admin
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.config.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash


async def create_admin_user():
    """Create initial admin user"""

    admin_email = "admin@senovallc.com"
    admin_password = "admin123"  # Change this after first login!

    async with AsyncSessionLocal() as session:
        # Check if admin already exists
        result = await session.execute(
            select(User).where(User.email == admin_email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"❌ Admin user already exists: {admin_email}")
            return

        # Create admin user
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            first_name="Admin",
            last_name="User",
            full_name="Admin User",
            role="admin",
            is_active=True,
            is_verified=True,
            permissions=["*:*"],  # Full permissions
        )

        session.add(admin_user)
        await session.commit()

        print("✅ Admin user created successfully!")
        print(f"   Email: {admin_email}")
        print(f"   Password: {admin_password}")
        print(f"   Role: admin")
        print("\n⚠️  IMPORTANT: Change the password after first login!")


if __name__ == "__main__":
    asyncio.run(create_admin_user())
