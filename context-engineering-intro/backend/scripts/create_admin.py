"""
Create initial admin user for Senova CRM

Run with: python -m scripts.create_admin
"""

import asyncio
import os
import sys
import getpass
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.config.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash


async def create_admin_user(email: str = None, password: str = None):
    """
    Create initial admin user.

    Args:
        email: Admin email (defaults to environment variable or prompts)
        password: Admin password (defaults to environment variable or secure prompt)
    """

    # Get email from parameter, environment, or prompt
    if not email:
        email = os.getenv('ADMIN_EMAIL', 'admin@senovallc.com')
        confirm = input(f"Create admin with email [{email}]? (Enter for yes, or type new email): ").strip()
        if confirm:
            email = confirm

    # Get password from parameter, environment, or secure prompt
    if not password:
        password = os.getenv('ADMIN_PASSWORD')
        if not password:
            print("\n⚠️  Set a strong password for the admin user")
            password = getpass.getpass("Enter admin password: ")
            if not password:
                print("❌ Password is required")
                return
            # Confirm password for security
            confirm_password = getpass.getpass("Confirm password: ")
            if password != confirm_password:
                print("❌ Passwords do not match")
                return

    async with AsyncSessionLocal() as session:
        # Check if admin already exists
        result = await session.execute(
            select(User).where(User.email == email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"❌ Admin user already exists: {email}")
            return

        # Create admin user
        admin_user = User(
            email=email,
            hashed_password=get_password_hash(password),
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
        print(f"   Email: {email}")
        print(f"   Role: admin")
        # Security: Never print the actual password
        print("\n⚠️  Store the password securely. You'll need it to log in.")


if __name__ == "__main__":
    # Allow command-line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Create admin user for Senova CRM')
    parser.add_argument('--email', help='Admin email address')
    parser.add_argument('--password', help='Admin password (use environment variable or prompt for better security)')
    args = parser.parse_args()

    asyncio.run(create_admin_user(args.email, args.password))
