"""
Service layer for Object management with role-based access control

This service handles:
- Object CRUD operations with role-based permissions
- Contact assignment and bulk operations
- User assignment with granular permissions
- Website management
- Complex filtering and search
"""

from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, or_, and_, exists, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.object import Object, ObjectContact, ObjectUser, ObjectWebsite
from app.models.contact import Contact
from app.models.user import User, UserRole
from app.models.tag import Tag
from app.models.contact_tag import ContactTag
from app.schemas.object import (
    ObjectCreate,
    ObjectUpdate,
    ObjectResponse,
    ObjectContactCreate,
    ObjectUserCreate,
    PermissionSet,
    ObjectWebsiteCreate,
    ObjectWebsiteUpdate,
    BulkOperationResult,
)
from app.core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)


class ObjectService:
    """Service class for Object management"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Permission Checking ====================

    async def check_object_permission(
        self,
        user: User,
        object_id: UUID,
        permission: str = "can_view"
    ) -> Tuple[bool, Optional[ObjectUser]]:
        """
        Check if user has specific permission on an object

        Returns:
            Tuple of (has_permission, object_user_record)
        """
        # Owner has all permissions
        if user.role == UserRole.OWNER:
            return True, None

        # Check if user is assigned to the object
        result = await self.db.execute(
            select(ObjectUser).where(
                and_(
                    ObjectUser.object_id == object_id,
                    ObjectUser.user_id == user.id
                )
            )
        )
        object_user = result.scalar_one_or_none()

        if not object_user:
            return False, None

        # Check specific permission
        permissions = object_user.permissions or {}
        has_permission = permissions.get(permission, False)

        return has_permission, object_user

    async def get_visible_object_ids(self, user: User) -> List[UUID]:
        """Get list of object IDs visible to the user"""
        if user.role == UserRole.OWNER:
            # Owner sees all objects
            result = await self.db.execute(
                select(Object.id).where(Object.deleted == False)
            )
            return [row[0] for row in result.all()]

        # Admin/User only sees assigned objects
        result = await self.db.execute(
            select(ObjectUser.object_id).where(
                ObjectUser.user_id == user.id
            )
        )
        return [row[0] for row in result.all()]

    async def can_create_object(self, user: User) -> bool:
        """Check if user can create new objects"""
        return user.role == UserRole.OWNER

    async def can_delete_object(self, user: User, object_id: UUID) -> bool:
        """Check if user can delete an object"""
        if user.role == UserRole.OWNER:
            return True

        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_delete_object"
        )
        return has_permission

    # ==================== Object CRUD ====================

    async def create_object(
        self,
        user: User,
        object_data: ObjectCreate
    ) -> ObjectResponse:
        """Create a new object"""
        if not await self.can_create_object(user):
            raise PermissionDeniedError("Only owners can create objects")

        # Create the object
        new_object = Object(
            name=object_data.name,
            type=object_data.type,
            company_info=object_data.company_info,
            created_by=user.id
        )

        self.db.add(new_object)
        await self.db.commit()
        await self.db.refresh(new_object)

        # Auto-assign owner as user with full permissions
        owner_assignment = ObjectUser(
            object_id=new_object.id,
            user_id=user.id,
            permissions={
                "can_view": True,
                "can_manage_contacts": True,
                "can_manage_company_info": True,
                "can_manage_websites": True,
                "can_assign_users": True,
                "can_delete_object": True
            },
            role_name="Owner",
            assigned_by=user.id
        )
        self.db.add(owner_assignment)
        await self.db.commit()

        return await self._format_object_response(new_object, user)

    async def list_objects(
        self,
        user: User,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        type_filter: Optional[str] = None
    ) -> Tuple[List[ObjectResponse], int]:
        """List objects visible to the user"""
        # Base query
        query = select(Object).where(Object.deleted == False)

        # Apply role-based filtering
        if user.role != UserRole.OWNER:
            visible_ids = await self.get_visible_object_ids(user)
            if not visible_ids:
                return [], 0
            query = query.where(Object.id.in_(visible_ids))

        # Apply search filter
        if search:
            query = query.where(
                or_(
                    Object.name.ilike(f"%{search}%"),
                    Object.company_info["website"].astext.ilike(f"%{search}%")
                )
            )

        # Apply type filter
        if type_filter:
            query = query.where(Object.type == type_filter)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination and ordering
        query = query.order_by(Object.created_at.desc()).offset(skip).limit(limit)

        # Execute query
        result = await self.db.execute(query)
        objects = result.scalars().all()

        # Format responses
        responses = []
        for obj in objects:
            responses.append(await self._format_object_response(obj, user))

        return responses, total

    async def get_object(
        self,
        user: User,
        object_id: UUID
    ) -> ObjectResponse:
        """Get object details"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_view"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have access to this object")

        # Get object
        result = await self.db.execute(
            select(Object).where(
                and_(
                    Object.id == object_id,
                    Object.deleted == False
                )
            )
        )
        obj = result.scalar_one_or_none()

        if not obj:
            raise NotFoundError("Object not found")

        return await self._format_object_response(obj, user)

    async def update_object(
        self,
        user: User,
        object_id: UUID,
        object_data: ObjectUpdate
    ) -> ObjectResponse:
        """Update object details"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_manage_company_info"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to edit this object")

        # Get object
        result = await self.db.execute(
            select(Object).where(
                and_(
                    Object.id == object_id,
                    Object.deleted == False
                )
            )
        )
        obj = result.scalar_one_or_none()

        if not obj:
            raise NotFoundError("Object not found")

        # Update fields
        update_data = object_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(obj, field, value)

        await self.db.commit()
        await self.db.refresh(obj)

        return await self._format_object_response(obj, user)

    async def delete_object(
        self,
        user: User,
        object_id: UUID
    ) -> bool:
        """Soft delete an object"""
        if not await self.can_delete_object(user, object_id):
            raise PermissionDeniedError("You don't have permission to delete this object")

        # Get object
        result = await self.db.execute(
            select(Object).where(
                and_(
                    Object.id == object_id,
                    Object.deleted == False
                )
            )
        )
        obj = result.scalar_one_or_none()

        if not obj:
            raise NotFoundError("Object not found")

        # Soft delete
        obj.deleted = True
        obj.deleted_at = datetime.utcnow()

        await self.db.commit()

        return True

    # ==================== Contact Management ====================

    async def list_object_contacts(
        self,
        user: User,
        object_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> Tuple[List[Contact], int]:
        """List contacts in an object"""
        # Check permission
        has_permission, object_user = await self.check_object_permission(
            user, object_id, "can_view"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have access to this object")

        # Build query
        query = (
            select(Contact)
            .join(ObjectContact, Contact.id == ObjectContact.contact_id)
            .where(ObjectContact.object_id == object_id)
        )

        # Apply search filter
        if search:
            query = query.where(
                or_(
                    Contact.first_name.ilike(f"%{search}%"),
                    Contact.last_name.ilike(f"%{search}%"),
                    Contact.email.ilike(f"%{search}%"),
                    Contact.phone.ilike(f"%{search}%")
                )
            )

        # For non-owner users, filter based on role
        if user.role == UserRole.USER:
            # Regular users only see contacts assigned to them
            query = query.where(Contact.assigned_to == user.id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        query = query.offset(skip).limit(limit)

        # Execute query
        result = await self.db.execute(query)
        contacts = result.scalars().all()

        return contacts, total

    async def list_object_contacts_with_details(
        self,
        user: User,
        object_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> Tuple[List[ObjectContact], int]:
        """List ObjectContact records with full contact details"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_view"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have access to this object")

        # Build query for ObjectContact with joined Contact
        query = (
            select(ObjectContact)
            .options(joinedload(ObjectContact.contact))
            .where(ObjectContact.object_id == object_id)
        )

        # Apply search filter on contact fields
        if search:
            query = query.join(Contact).where(
                or_(
                    Contact.first_name.ilike(f"%{search}%"),
                    Contact.last_name.ilike(f"%{search}%"),
                    Contact.email.ilike(f"%{search}%"),
                    Contact.phone.ilike(f"%{search}%")
                )
            )

        # For non-owner users, filter based on role
        if user.role == UserRole.USER:
            if not search:  # Only join if not already joined
                query = query.join(Contact)
            query = query.where(Contact.assigned_to == user.id)

        # Get total count - need a simpler query for count
        count_base = (
            select(func.count(ObjectContact.id))
            .where(ObjectContact.object_id == object_id)
        )
        if search:
            count_base = count_base.join(Contact).where(
                or_(
                    Contact.first_name.ilike(f"%{search}%"),
                    Contact.last_name.ilike(f"%{search}%"),
                    Contact.email.ilike(f"%{search}%"),
                    Contact.phone.ilike(f"%{search}%")
                )
            )
        if user.role == UserRole.USER:
            if not search:
                count_base = count_base.join(Contact)
            count_base = count_base.where(Contact.assigned_to == user.id)

        total_result = await self.db.execute(count_base)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.offset(skip).limit(limit)

        # Execute query
        result = await self.db.execute(query)
        object_contacts = result.unique().scalars().all()

        return object_contacts, total

    async def assign_contacts_to_object(
        self,
        user: User,
        object_id: UUID,
        contact_ids: List[UUID],
        role: Optional[str] = None,
        department: Optional[str] = None
    ) -> BulkOperationResult:
        """Assign multiple contacts to an object"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_manage_contacts"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage contacts in this object")

        succeeded = 0
        failed = 0
        errors = []

        for contact_id in contact_ids:
            try:
                # Check if already assigned
                existing = await self.db.execute(
                    select(ObjectContact).where(
                        and_(
                            ObjectContact.object_id == object_id,
                            ObjectContact.contact_id == contact_id
                        )
                    )
                )
                if existing.scalar_one_or_none():
                    failed += 1
                    errors.append({
                        "contact_id": str(contact_id),
                        "error": "Contact already assigned to this object"
                    })
                    continue

                # Create assignment
                assignment = ObjectContact(
                    object_id=object_id,
                    contact_id=contact_id,
                    role=role,
                    department=department,
                    assigned_by=user.id
                )
                self.db.add(assignment)
                succeeded += 1

            except Exception as e:
                failed += 1
                errors.append({
                    "contact_id": str(contact_id),
                    "error": str(e)
                })

        await self.db.commit()

        return BulkOperationResult(
            success=failed == 0,
            total=len(contact_ids),
            succeeded=succeeded,
            failed=failed,
            errors=errors
        )

    async def bulk_assign_with_filters(
        self,
        user: User,
        object_id: UUID,
        filters: Dict[str, Any],
        role: Optional[str] = None,
        department: Optional[str] = None
    ) -> BulkOperationResult:
        """Bulk assign contacts to object based on filters"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_manage_contacts"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage contacts in this object")

        # Build query based on filters
        query = select(Contact.id).where(Contact.deleted == False)

        # Apply filters
        if filters.get("tag_ids"):
            query = query.join(ContactTag).where(ContactTag.tag_id.in_(filters["tag_ids"]))

        if filters.get("status"):
            query = query.where(Contact.status == filters["status"])

        if filters.get("created_after"):
            query = query.where(Contact.created_at >= filters["created_after"])

        if filters.get("created_before"):
            query = query.where(Contact.created_at <= filters["created_before"])

        if filters.get("search"):
            search_term = f"%{filters['search']}%"
            query = query.where(
                or_(
                    Contact.first_name.ilike(search_term),
                    Contact.last_name.ilike(search_term),
                    Contact.email.ilike(search_term)
                )
            )

        if filters.get("exclude_object_ids"):
            # Exclude contacts already in specified objects
            query = query.where(
                ~exists(
                    select(1).where(
                        and_(
                            ObjectContact.contact_id == Contact.id,
                            ObjectContact.object_id.in_(filters["exclude_object_ids"])
                        )
                    )
                )
            )

        # Get matching contact IDs
        result = await self.db.execute(query)
        contact_ids = [row[0] for row in result.all()]

        # Assign contacts
        return await self.assign_contacts_to_object(
            user, object_id, contact_ids, role, department
        )

    async def remove_contact_from_object(
        self,
        user: User,
        object_id: UUID,
        contact_id: UUID
    ) -> bool:
        """Remove a contact from an object"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_manage_contacts"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage contacts in this object")

        # Delete the assignment
        result = await self.db.execute(
            delete(ObjectContact).where(
                and_(
                    ObjectContact.object_id == object_id,
                    ObjectContact.contact_id == contact_id
                )
            )
        )

        await self.db.commit()

        return result.rowcount > 0

    # ==================== User Management ====================

    async def list_object_users(
        self,
        user: User,
        object_id: UUID
    ) -> List[ObjectUser]:
        """List users assigned to an object"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_view"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have access to this object")

        # Get users
        result = await self.db.execute(
            select(ObjectUser)
            .options(joinedload(ObjectUser.user))
            .where(ObjectUser.object_id == object_id)
        )

        return result.scalars().all()

    async def assign_user_to_object(
        self,
        user: User,
        object_id: UUID,
        user_id: UUID,
        permissions: PermissionSet,
        role_name: Optional[str] = None
    ) -> ObjectUser:
        """Assign a user to an object with specific permissions"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_assign_users"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to assign users to this object")

        # Check if already assigned
        existing = await self.db.execute(
            select(ObjectUser).where(
                and_(
                    ObjectUser.object_id == object_id,
                    ObjectUser.user_id == user_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValidationError("User is already assigned to this object")

        # Create assignment
        assignment = ObjectUser(
            object_id=object_id,
            user_id=user_id,
            permissions=permissions.model_dump(),
            role_name=role_name,
            assigned_by=user.id
        )

        self.db.add(assignment)
        await self.db.commit()
        await self.db.refresh(assignment)

        return assignment

    async def update_user_permissions(
        self,
        user: User,
        object_id: UUID,
        user_id: UUID,
        permissions: PermissionSet,
        role_name: Optional[str] = None
    ) -> ObjectUser:
        """Update user permissions for an object"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_assign_users"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage users in this object")

        # Get assignment
        result = await self.db.execute(
            select(ObjectUser).where(
                and_(
                    ObjectUser.object_id == object_id,
                    ObjectUser.user_id == user_id
                )
            )
        )
        assignment = result.scalar_one_or_none()

        if not assignment:
            raise NotFoundError("User is not assigned to this object")

        # Update permissions
        assignment.permissions = permissions.model_dump()
        if role_name is not None:
            assignment.role_name = role_name

        await self.db.commit()
        await self.db.refresh(assignment)

        return assignment

    async def remove_user_from_object(
        self,
        user: User,
        object_id: UUID,
        user_id: UUID
    ) -> bool:
        """Remove a user from an object"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_assign_users"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage users in this object")

        # Can't remove the last owner
        if user.role == UserRole.OWNER:
            owner_count = await self.db.execute(
                select(func.count(ObjectUser.id)).where(
                    and_(
                        ObjectUser.object_id == object_id,
                        ObjectUser.permissions["can_delete_object"].astext == "true"
                    )
                )
            )
            if owner_count.scalar() <= 1:
                raise ValidationError("Cannot remove the last owner from an object")

        # Delete assignment
        result = await self.db.execute(
            delete(ObjectUser).where(
                and_(
                    ObjectUser.object_id == object_id,
                    ObjectUser.user_id == user_id
                )
            )
        )

        await self.db.commit()

        return result.rowcount > 0

    # ==================== Website Management ====================

    async def list_object_websites(
        self,
        user: User,
        object_id: UUID
    ) -> List[ObjectWebsite]:
        """List websites for an object"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_view"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have access to this object")

        # Get websites
        result = await self.db.execute(
            select(ObjectWebsite).where(ObjectWebsite.object_id == object_id)
        )

        return result.scalars().all()

    async def create_website(
        self,
        user: User,
        object_id: UUID,
        website_data: ObjectWebsiteCreate
    ) -> ObjectWebsite:
        """Create a website for an object"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_manage_websites"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage websites for this object")

        # Check for slug uniqueness
        existing = await self.db.execute(
            select(ObjectWebsite).where(ObjectWebsite.slug == website_data.slug)
        )
        if existing.scalar_one_or_none():
            raise ValidationError(f"Slug '{website_data.slug}' is already in use")

        # Create website
        website = ObjectWebsite(
            object_id=object_id,
            name=website_data.name,
            slug=website_data.slug,
            custom_domain=website_data.custom_domain,
            content=website_data.content.model_dump() if website_data.content else {}
        )

        self.db.add(website)
        await self.db.commit()
        await self.db.refresh(website)

        return website

    async def update_website(
        self,
        user: User,
        object_id: UUID,
        website_id: UUID,
        website_data: ObjectWebsiteUpdate
    ) -> ObjectWebsite:
        """Update a website"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_manage_websites"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage websites for this object")

        # Get website
        result = await self.db.execute(
            select(ObjectWebsite).where(
                and_(
                    ObjectWebsite.id == website_id,
                    ObjectWebsite.object_id == object_id
                )
            )
        )
        website = result.scalar_one_or_none()

        if not website:
            raise NotFoundError("Website not found")

        # Check slug uniqueness if changing
        if website_data.slug and website_data.slug != website.slug:
            existing = await self.db.execute(
                select(ObjectWebsite).where(ObjectWebsite.slug == website_data.slug)
            )
            if existing.scalar_one_or_none():
                raise ValidationError(f"Slug '{website_data.slug}' is already in use")

        # Update fields
        update_data = website_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "content" and value:
                value = value.model_dump() if hasattr(value, 'model_dump') else value
            setattr(website, field, value)

        # Update published_at if publishing
        if website_data.published is not None:
            if website_data.published and not website.published:
                website.published_at = datetime.utcnow()
            elif not website_data.published:
                website.published_at = None

        await self.db.commit()
        await self.db.refresh(website)

        return website

    async def delete_website(
        self,
        user: User,
        object_id: UUID,
        website_id: UUID
    ) -> bool:
        """Delete a website"""
        # Check permission
        has_permission, _ = await self.check_object_permission(
            user, object_id, "can_manage_websites"
        )

        if not has_permission and user.role != UserRole.OWNER:
            raise PermissionDeniedError("You don't have permission to manage websites for this object")

        # Delete website
        result = await self.db.execute(
            delete(ObjectWebsite).where(
                and_(
                    ObjectWebsite.id == website_id,
                    ObjectWebsite.object_id == object_id
                )
            )
        )

        await self.db.commit()

        return result.rowcount > 0

    # ==================== Helper Methods ====================

    async def _format_object_response(
        self,
        obj: Object,
        user: User
    ) -> ObjectResponse:
        """Format object for API response with counts"""
        # Get counts
        contact_count = await self.db.execute(
            select(func.count(ObjectContact.id)).where(
                ObjectContact.object_id == obj.id
            )
        )
        user_count = await self.db.execute(
            select(func.count(ObjectUser.id)).where(
                ObjectUser.object_id == obj.id
            )
        )
        website_count = await self.db.execute(
            select(func.count(ObjectWebsite.id)).where(
                ObjectWebsite.object_id == obj.id
            )
        )

        # Check if primary for user
        is_primary = False
        if user.role != UserRole.OWNER:
            result = await self.db.execute(
                select(ObjectUser).where(
                    and_(
                        ObjectUser.object_id == obj.id,
                        ObjectUser.user_id == user.id
                    )
                )
            )
            object_user = result.scalar_one_or_none()
            is_primary = bool(object_user)

        return ObjectResponse(
            id=obj.id,
            name=obj.name,
            type=obj.type,
            company_info=obj.company_info or {},
            created_at=obj.created_at,
            created_by=obj.created_by,
            updated_at=obj.updated_at,
            deleted=obj.deleted,
            deleted_at=obj.deleted_at,
            contact_count=contact_count.scalar() or 0,
            user_count=user_count.scalar() or 0,
            website_count=website_count.scalar() or 0,
            is_primary=is_primary
        )