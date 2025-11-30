"""Reset password using async database"""
import asyncio
from sqlalchemy import select, update
from app.config.database import get_db
from app.models.user import User
from app.core.security import get_password_hash

async def reset_password():
    # Use the async database session
    async for db in get_db():
        try:
            # Find user
            result = await db.execute(
                select(User).where(User.email == 'admin@test.com')
            )
            user = result.scalar_one_or_none()

            if user:
                # Hash new password
                new_password = 'AdminTest123!'
                hashed = get_password_hash(new_password)

                # Update user
                user.hashed_password = hashed
                await db.commit()

                print(f"✅ Password reset successful!")
                print(f"   Email: admin@test.com")
                print(f"   Password: AdminTest123!")
                print(f"   Role: {user.role}")
            else:
                print("❌ User not found")
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(reset_password())
