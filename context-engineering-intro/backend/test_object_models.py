#!/usr/bin/env python
"""Test script to verify Object models import correctly"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all models can be imported without errors"""
    print("Testing model imports...")

    try:
        # Import base models
        from app.models import User, Contact
        print("[OK] Base models (User, Contact) imported successfully")

        # Import new Object models
        from app.models import Object, ObjectContact, ObjectUser, ObjectWebsite
        print("[OK] Object models imported successfully")

        # Test that Contact has new attributes
        assert hasattr(Contact, 'object_ids'), "Contact missing object_ids column"
        assert hasattr(Contact, 'primary_object_id'), "Contact missing primary_object_id column"
        assert hasattr(Contact, 'assigned_user_ids'), "Contact missing assigned_user_ids column"
        assert hasattr(Contact, 'primary_object'), "Contact missing primary_object relationship"
        print("[OK] Contact model has new object-related columns")

        # Test that User has new attributes
        assert hasattr(User, 'assigned_object_ids'), "User missing assigned_object_ids column"
        assert hasattr(User, 'object_permissions'), "User missing object_permissions column"
        print("[OK] User model has new object-related columns")

        # Test Object model attributes
        assert hasattr(Object, 'name'), "Object missing name column"
        assert hasattr(Object, 'type'), "Object missing type column"
        assert hasattr(Object, 'company_info'), "Object missing company_info column"
        assert hasattr(Object, 'contacts'), "Object missing contacts relationship"
        assert hasattr(Object, 'user_permissions'), "Object missing user_permissions relationship"
        assert hasattr(Object, 'websites'), "Object missing websites relationship"
        print("[OK] Object model has all expected attributes")

        # Test ObjectContact model
        assert hasattr(ObjectContact, 'object_id'), "ObjectContact missing object_id"
        assert hasattr(ObjectContact, 'contact_id'), "ObjectContact missing contact_id"
        assert hasattr(ObjectContact, 'role'), "ObjectContact missing role"
        assert hasattr(ObjectContact, 'is_primary_contact'), "ObjectContact missing is_primary_contact"
        print("[OK] ObjectContact model has all expected attributes")

        # Test ObjectUser model
        assert hasattr(ObjectUser, 'object_id'), "ObjectUser missing object_id"
        assert hasattr(ObjectUser, 'user_id'), "ObjectUser missing user_id"
        assert hasattr(ObjectUser, 'permissions'), "ObjectUser missing permissions"
        assert hasattr(ObjectUser, 'role_name'), "ObjectUser missing role_name"
        print("[OK] ObjectUser model has all expected attributes")

        # Test ObjectWebsite model
        assert hasattr(ObjectWebsite, 'object_id'), "ObjectWebsite missing object_id"
        assert hasattr(ObjectWebsite, 'name'), "ObjectWebsite missing name"
        assert hasattr(ObjectWebsite, 'slug'), "ObjectWebsite missing slug"
        assert hasattr(ObjectWebsite, 'content'), "ObjectWebsite missing content"
        assert hasattr(ObjectWebsite, 'published'), "ObjectWebsite missing published"
        print("[OK] ObjectWebsite model has all expected attributes")

        print("\n[SUCCESS] All model tests passed successfully!")
        return True

    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        return False
    except AssertionError as e:
        print(f"[ERROR] Assertion error: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False


def test_schemas():
    """Test that all schemas can be imported"""
    print("\nTesting schema imports...")

    try:
        from app.schemas.object import (
            ObjectCreate, ObjectUpdate, ObjectResponse,
            ObjectContactCreate, ObjectContactResponse,
            ObjectUserCreate, ObjectUserResponse, PermissionSet,
            ObjectWebsiteCreate, ObjectWebsiteResponse, WebsiteContent,
            BulkContactAssignment, BulkUserAssignment, BulkOperationResult
        )
        print("[OK] All object schemas imported successfully")

        # Test creating instances
        permission_set = PermissionSet(can_view=True, can_manage_contacts=True)
        print("[OK] PermissionSet instance created successfully")

        object_create = ObjectCreate(name="Test Company", type="company")
        print("[OK] ObjectCreate instance created successfully")

        website_content = WebsiteContent(pages=[], theme={}, settings={})
        print("[OK] WebsiteContent instance created successfully")

        print("\n[SUCCESS] All schema tests passed successfully!")
        return True

    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Objects Feature Database Schema")
    print("=" * 60)

    models_ok = test_imports()
    schemas_ok = test_schemas()

    if models_ok and schemas_ok:
        print("\n" + "=" * 60)
        print("[SUCCESS] ALL TESTS PASSED - Schema is ready for migration!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Run migration: alembic upgrade head")
        print("2. Verify tables created: psql -c '\\dt'")
    else:
        print("\n" + "=" * 60)
        print("[ERROR] TESTS FAILED - Please fix errors before migrating")
        print("=" * 60)
        sys.exit(1)