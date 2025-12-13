"""Reset password using async database"""
import asyncio
import os
import sys
import getpass
from sqlalchemy import select, update
from app.config.database import get_db
from app.models.user import User
from app.core.security import get_password_hash

async def reset_password(email: str = None, password: str = None):
    """
    Reset user password.

    Args:
        email: User email (defaults to environment variable or prompts)
        password: New password (defaults to environment variable or prompts)
    """
    # Get email from parameter, environment, or prompt
    if not email:
        email = os.getenv('RESET_USER_EMAIL')
        if not email:
            email = input("Enter user email: ").strip()
            if not email:
                print("❌ Email is required")
                return

    # Get password from parameter, environment, or secure prompt
    if not password:
        password = os.getenv('RESET_USER_PASSWORD')
        if not password:
            password = getpass.getpass("Enter new password: ")
            if not password:
                print("❌ Password is required")
                return

    # Use the async database session
    async for db in get_db():
        try:
            # Find user
            result = await db.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()

            if user:
                # Hash new password
                hashed = get_password_hash(password)

                # Update user
                user.hashed_password = hashed
                await db.commit()

                print(f"✅ Password reset successful!")
                print(f"   Email: {email}")
                print(f"   Role: {user.role}")
                # Security: Never print the actual password
            else:
                print(f"❌ User not found: {email}")
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    # Allow command-line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Reset user password')
    parser.add_argument('--email', help='User email address')
    parser.add_argument('--password', help='New password (use environment variable or prompt for better security)')
    args = parser.parse_args()

    asyncio.run(reset_password(args.email, args.password))
