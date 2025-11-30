# Objects Feature - Database Schema Documentation

## Overview

The Objects feature provides organizational entity management for Senova CRM, allowing contacts to be grouped into companies/organizations with hierarchical access control and permissions.

## Database Schema

### New Tables Created

#### 1. `objects` Table
Core table for organizational entities (companies, organizations, departments)

**Columns:**
- `id` (UUID): Primary key
- `name` (VARCHAR 255): Organization name
- `type` (VARCHAR 50): Type of object (default: 'company')
- `company_info` (JSONB): Flexible storage for company details
- `created_at` (TIMESTAMP): Creation timestamp
- `created_by` (UUID): User who created the object
- `updated_at` (TIMESTAMP): Last update timestamp
- `deleted` (BOOLEAN): Soft delete flag
- `deleted_at` (TIMESTAMP): Deletion timestamp

**Company Info Structure:**
```json
{
  "industry": "Technology",
  "size": "50-100",
  "website": "https://example.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "postal_code": "94102"
  },
  "social_media": {
    "linkedin": "https://linkedin.com/company/example",
    "twitter": "@example"
  },
  "custom_fields": {}
}
```

#### 2. `object_contacts` Table
Junction table linking objects to contacts with assignment metadata

**Columns:**
- `id` (UUID): Primary key
- `object_id` (UUID): Foreign key to objects table
- `contact_id` (UUID): Foreign key to contacts table
- `assigned_at` (TIMESTAMP): When contact was assigned
- `assigned_by` (UUID): User who assigned the contact
- `role` (VARCHAR 100): Contact's role in the organization
- `department` (VARCHAR 100): Contact's department
- `is_primary_contact` (BOOLEAN): Primary contact flag

**Constraints:**
- Unique constraint on (object_id, contact_id)
- Cascade delete on both foreign keys

#### 3. `object_users` Table
Junction table linking objects to users with granular permissions

**Columns:**
- `id` (UUID): Primary key
- `object_id` (UUID): Foreign key to objects table
- `user_id` (UUID): Foreign key to users table
- `permissions` (JSONB): Granular permission settings
- `assigned_at` (TIMESTAMP): When user was granted access
- `assigned_by` (UUID): User who granted access
- `role_name` (VARCHAR 100): User's role in object context

**Permission Structure:**
```json
{
  "can_view": true,
  "can_manage_contacts": false,
  "can_manage_company_info": true,
  "can_manage_websites": false,
  "can_assign_users": false,
  "can_delete_object": false,
  "manageable_fields": ["address", "phone", "email"],
  "view_only_fields": ["revenue", "size"],
  "custom_permissions": {}
}
```

#### 4. `object_websites` Table
Hosted websites/landing pages for objects

**Columns:**
- `id` (UUID): Primary key
- `object_id` (UUID): Foreign key to objects table
- `name` (VARCHAR 255): Website name
- `slug` (VARCHAR 255): URL slug (unique)
- `custom_domain` (VARCHAR 255): Optional custom domain (unique)
- `content` (JSONB): Website content and configuration
- `published` (BOOLEAN): Publishing status
- `ssl_provisioned` (BOOLEAN): SSL certificate status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp
- `published_at` (TIMESTAMP): Publication timestamp

**Content Structure:**
```json
{
  "pages": [
    {
      "path": "/",
      "title": "Home",
      "content": "...",
      "meta": {}
    }
  ],
  "theme": {
    "colors": {},
    "fonts": {}
  },
  "settings": {
    "analytics_id": "UA-xxx",
    "favicon": "url",
    "logo": "url"
  },
  "forms": [],
  "integrations": {}
}
```

### Modified Tables

#### `contacts` Table - Added Columns
- `object_ids` (UUID[]): Array of associated object IDs
- `primary_object_id` (UUID): Primary organization (foreign key to objects)
- `assigned_user_ids` (UUID[]): Users who can access this contact

#### `users` Table - Added Columns
- `assigned_object_ids` (UUID[]): Objects user has access to
- `object_permissions` (JSONB): Global object-related permissions

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── object.py              # SQLAlchemy models for Objects feature
│   │   ├── contact.py             # Updated with object relationships
│   │   └── user.py                # Updated with object permissions
│   ├── schemas/
│   │   └── object.py              # Pydantic schemas for API validation
│   └── ...
├── alembic/
│   └── versions/
│       └── 20251127_1830_add_objects_feature.py  # Database migration
└── test_object_models.py          # Test script for verification
```

## Usage Examples

### Creating an Object (Organization)
```python
from app.models import Object
from app.config.database import get_db

async def create_company(db_session):
    new_company = Object(
        name="Acme Corp",
        type="company",
        company_info={
            "industry": "Technology",
            "size": "100-500",
            "website": "https://acme.com"
        },
        created_by=user_id
    )
    db_session.add(new_company)
    await db_session.commit()
    return new_company
```

### Assigning Contacts to an Object
```python
from app.models import ObjectContact

async def assign_contact_to_company(db_session, object_id, contact_id, user_id):
    assignment = ObjectContact(
        object_id=object_id,
        contact_id=contact_id,
        role="Sales Manager",
        department="Sales",
        is_primary_contact=True,
        assigned_by=user_id
    )
    db_session.add(assignment)
    await db_session.commit()
    return assignment
```

### Granting User Permissions
```python
from app.models import ObjectUser

async def grant_user_access(db_session, object_id, user_id, granter_id):
    permissions = ObjectUser(
        object_id=object_id,
        user_id=user_id,
        permissions={
            "can_view": True,
            "can_manage_contacts": True,
            "can_manage_company_info": False,
            "can_manage_websites": False,
            "can_assign_users": False,
            "can_delete_object": False
        },
        role_name="Account Manager",
        assigned_by=granter_id
    )
    db_session.add(permissions)
    await db_session.commit()
    return permissions
```

## Migration Instructions

1. **Backup your database** (if in production)
   ```bash
   pg_dump -U postgres -d your_database > backup_$(date +%Y%m%d).sql
   ```

2. **Run the migration**
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Verify tables were created**
   ```bash
   psql -U postgres -d your_database -c "\dt" | grep object
   ```

   Expected output:
   - objects
   - object_contacts
   - object_users
   - object_websites

4. **Test the models**
   ```bash
   python test_object_models.py
   ```

## API Endpoints (To Be Implemented)

### Object Management
- `GET /api/objects` - List all objects with pagination
- `POST /api/objects` - Create new object
- `GET /api/objects/{id}` - Get object details
- `PUT /api/objects/{id}` - Update object
- `DELETE /api/objects/{id}` - Soft delete object

### Contact Assignment
- `GET /api/objects/{id}/contacts` - List object's contacts
- `POST /api/objects/{id}/contacts` - Assign contacts to object
- `DELETE /api/objects/{id}/contacts/{contact_id}` - Remove contact from object

### User Permissions
- `GET /api/objects/{id}/users` - List users with access
- `POST /api/objects/{id}/users` - Grant user access
- `PUT /api/objects/{id}/users/{user_id}` - Update user permissions
- `DELETE /api/objects/{id}/users/{user_id}` - Revoke user access

### Website Management
- `GET /api/objects/{id}/websites` - List object's websites
- `POST /api/objects/{id}/websites` - Create new website
- `PUT /api/objects/{id}/websites/{website_id}` - Update website
- `DELETE /api/objects/{id}/websites/{website_id}` - Delete website

## Security Considerations

1. **Access Control**: All operations should check user permissions before allowing actions
2. **Data Isolation**: Users should only see objects they have permission to view
3. **Audit Trail**: All assignments and permission changes are tracked with timestamps and user IDs
4. **Soft Deletes**: Objects are soft-deleted to maintain referential integrity
5. **Cascading Deletes**: Junction tables cascade delete to prevent orphaned records

## Performance Optimizations

### Indexes Created
- `idx_objects_name_type` - Composite index for searching by name and type
- `idx_objects_created_by` - Index for filtering by creator
- `idx_objects_deleted` - Index for soft delete queries
- `idx_object_contacts_primary` - Index for finding primary contacts
- `idx_object_users_permissions` - Composite index for permission lookups
- `idx_object_websites_published` - Index for published website queries

### Query Optimization Tips
1. Use eager loading for relationships when fetching objects with contacts/users
2. Use array operations for `object_ids` and `assigned_user_ids` columns
3. Consider materialized views for complex permission checks
4. Use JSONB operators for efficient company_info queries

## Future Enhancements

1. **Object Hierarchy**: Support parent-child relationships between objects
2. **Activity Logging**: Track all actions performed on objects
3. **Bulk Operations**: API endpoints for bulk assignments and updates
4. **Export/Import**: Support for exporting object data with all relationships
5. **Templates**: Website templates for quick setup
6. **Analytics**: Object-level analytics and reporting

## Troubleshooting

### Common Issues

1. **Migration fails with foreign key error**
   - Ensure users and contacts tables exist
   - Check that referenced IDs are valid UUIDs

2. **Import errors in Python**
   - Run `python test_object_models.py` to verify all imports
   - Check that all model files are in the correct location

3. **Permission denied errors**
   - Verify database user has CREATE TABLE privileges
   - Check PostgreSQL connection settings

### Rollback Instructions

If you need to rollback the migration:
```bash
alembic downgrade -1
```

This will remove all objects-related tables and columns.

## Support

For questions or issues with the Objects feature, please contact the development team or create an issue in the project repository.