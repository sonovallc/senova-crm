"""Reset admin@test.com password"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
from app.models.user import User

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://evecrm:evecrm_dev_password@localhost:5432/eve_crm")
# Convert asyncpg to psycopg2
DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def reset_password():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == 'admin@test.com').first()
        if user:
            # Set new password
            new_password = 'AdminTest123!'
            user.hashed_password = get_password_hash(new_password)
            db.commit()
            print(f"✅ Password reset successful!")
            print(f"   Email: admin@test.com")
            print(f"   Password: AdminTest123!")
            print(f"   Role: {user.role}")
            print(f"   Active: {user.is_active}")
            print(f"   Verified: {user.is_verified}")
        else:
            print("❌ User admin@test.com not found")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
