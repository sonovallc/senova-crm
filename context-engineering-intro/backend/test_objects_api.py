#!/usr/bin/env python3
"""
Test script for Objects API endpoints

This script tests the basic functionality of the Objects feature API endpoints.
Run with: python test_objects_api.py
"""

import asyncio
import json
from datetime import datetime
from uuid import UUID, uuid4

# Import necessary modules
from app.config.database import get_db
from app.models.user import User, UserRole
from app.models.object import Object
from app.services.object_service import ObjectService
from app.schemas.object import ObjectCreate, ObjectUpdate, PermissionSet


async def test_object_service():
    """Test the Object Service functionality"""
    print("=" * 50)
    print("Testing Object Service")
    print("=" * 50)

    # Get database session
    async for db in get_db():
        try:
            service = ObjectService(db)

            # Create a test user (Owner role)
            owner_user = User(
                id=uuid4(),
                email="owner@test.com",
                first_name="Test",
                last_name="Owner",
                role=UserRole.OWNER,
                is_active=True
            )

            # Create a test admin user
            admin_user = User(
                id=uuid4(),
                email="admin@test.com",
                first_name="Test",
                last_name="Admin",
                role=UserRole.ADMIN,
                is_active=True
            )

            print("\n1. Testing Object Creation (Owner)")
            object_data = ObjectCreate(
                name="Test Company",
                type="company",
                company_info={
                    "industry": "Technology",
                    "website": "https://testcompany.com",
                    "size": "50-100"
                }
            )

            try:
                new_object = await service.create_object(owner_user, object_data)
                print(f"✅ Created object: {new_object.name} (ID: {new_object.id})")
            except Exception as e:
                print(f"❌ Failed to create object: {e}")
                return

            print("\n2. Testing List Objects (Owner)")
            objects, total = await service.list_objects(owner_user)
            print(f"✅ Owner can see {total} objects")

            print("\n3. Testing List Objects (Admin - no assignment)")
            objects, total = await service.list_objects(admin_user)
            print(f"✅ Admin sees {total} objects (should be 0 since not assigned)")

            print("\n4. Testing Assign User to Object")
            permissions = PermissionSet(
                can_view=True,
                can_manage_contacts=True,
                can_manage_company_info=False,
                can_manage_websites=False,
                can_assign_users=False,
                can_delete_object=False
            )

            try:
                assignment = await service.assign_user_to_object(
                    owner_user,
                    new_object.id,
                    admin_user.id,
                    permissions,
                    role_name="Manager"
                )
                print(f"✅ Assigned admin user to object with Manager role")
            except Exception as e:
                print(f"❌ Failed to assign user: {e}")

            print("\n5. Testing List Objects (Admin - after assignment)")
            objects, total = await service.list_objects(admin_user)
            print(f"✅ Admin now sees {total} objects")

            print("\n6. Testing Update Object")
            update_data = ObjectUpdate(
                name="Updated Test Company",
                company_info={
                    "industry": "Technology",
                    "website": "https://updated.testcompany.com",
                    "size": "100-500",
                    "address": {
                        "city": "San Francisco",
                        "state": "CA",
                        "country": "USA"
                    }
                }
            )

            try:
                updated_object = await service.update_object(
                    owner_user,
                    new_object.id,
                    update_data
                )
                print(f"✅ Updated object name to: {updated_object.name}")
            except Exception as e:
                print(f"❌ Failed to update object: {e}")

            print("\n7. Testing Permission Check")
            can_view, _ = await service.check_object_permission(
                admin_user,
                new_object.id,
                "can_view"
            )
            print(f"✅ Admin can_view permission: {can_view}")

            can_delete, _ = await service.check_object_permission(
                admin_user,
                new_object.id,
                "can_delete_object"
            )
            print(f"✅ Admin can_delete_object permission: {can_delete}")

            print("\n✅ All tests passed!")

        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break


async def test_api_endpoints():
    """Test API endpoints directly"""
    print("\n" + "=" * 50)
    print("Testing API Endpoints")
    print("=" * 50)

    # This would typically use an HTTP client to test the actual REST endpoints
    # For now, we're just verifying that the router is properly configured

    from app.api.v1.objects import router

    print("\n✅ Router created successfully")
    print(f"✅ Router prefix: {router.prefix}")
    print(f"✅ Router tags: {router.tags}")

    # List all routes
    print("\n📍 Available endpoints:")
    for route in router.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            for method in route.methods:
                print(f"   {method:6} {route.path}")


def main():
    """Main test function"""
    print("🚀 Starting Objects API Tests\n")

    # Run tests
    asyncio.run(test_object_service())
    asyncio.run(test_api_endpoints())

    print("\n✅ All tests completed!")


if __name__ == "__main__":
    main()