"""Reset admin@test.com password"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
from app.models.user import User

# Database URL - MUST be set via environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL environment variable must be set")
    print("   Example: export DATABASE_URL='postgresql://user:pass@localhost:5432/senova_crm'")
    sys.exit(1)

# Convert asyncpg to psycopg2 for synchronous connection
DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def reset_password():
    # Get new password from environment variable or command line
    new_password = os.getenv("NEW_PASSWORD")
    if not new_password:
        if len(sys.argv) > 1:
            new_password = sys.argv[1]
        else:
            print("❌ ERROR: New password must be provided")
            print("   Usage: python reset_admin_password.py <new_password>")
            print("   Or set NEW_PASSWORD environment variable")
            sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == 'admin@test.com').first()
        if user:
            # Set new password
            user.hashed_password = get_password_hash(new_password)
            db.commit()
            print(f"✅ Password reset successful!")
            print(f"   Email: admin@test.com")
            print(f"   Password: <hidden for security>")
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
