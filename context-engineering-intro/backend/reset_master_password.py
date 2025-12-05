#!/usr/bin/env python3
"""
Reset master owner password.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Use postgres hostname for Docker environment
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://senova_crm_user:senova_dev_password@postgres:5432/senova_crm'

import asyncio
from sqlalchemy import select, update
from app.config.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def reset_password():
    async with AsyncSessionLocal() as session:
        try:
            # Update password
            result = await session.execute(
                update(User)
                .where(User.email == "jwoodcapital@gmail.com")
                .values(
                    hashed_password=get_password_hash("D3n1w3n1!"),
                    is_active=True,
                    is_verified=True,
                    is_approved=True
                )
            )

            await session.commit()

            if result.rowcount > 0:
                print("✅ Password reset successfully!")
                print("   Email: jwoodcapital@gmail.com")
                print("   Password: D3n1w3n1!")
                print("   Status: Active, Verified, Approved")
            else:
                print("❌ User not found")

        except Exception as e:
            print(f"❌ Error: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(reset_password())