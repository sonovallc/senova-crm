# SYSTEM SCHEMA: SENOVA CRM - OBJECTS MODULE

**Created:** 2025-11-30T01:32:00.298Z
**Module:** Objects Management
**URL:** http://localhost:3004/dashboard/objects

---

## OBJECTS LIST PAGE
**URL:** /dashboard/objects

### Page Header
| Element | Type | Text/Label | Action | Destination |
|---------|------|------------|--------|-------------|
| Page Title | h1 | "Objects" | Display only | N/A |
| Page Description | p | "Manage your organization's objects" | Display only | N/A |

### Search and Filters
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Search Input | input | "Search objects..." | accepts text | Filters list in real-time |
| Type Filter | dropdown | "All Types" | Opens dropdown | Shows type options |
| View Toggle | button-group | "Grid/Table" | Toggle view | Changes display format |

### Type Filter Options
| Option | Value | Result When Selected |
|--------|-------|---------------------|
| All Types | all | Shows all objects |
| Company | company | Shows only company objects |
| Organization | organization | Shows only organization objects |
| Group | group | Shows only group objects |

### Action Buttons
| Element | Type | Text/Label | Action | Destination |
|---------|------|------------|--------|-------------|
| Create Object | button | "+ Create Object" | Opens form | Create object modal/page |

### Objects Table/Grid
| Column | Type | Sortable | Action |
|--------|------|----------|--------|
| Name | text/link | Yes | Click to view detail |
| Type | badge | Yes | Display only |
| Created | date | Yes | Display only |
| Actions | menu | No | Opens action menu |

### Action Menu Options (per object)
| Option | Icon | Action | Result |
|--------|------|--------|--------|
| View Details | eye | Navigate | Goes to object detail page |
| Edit | pencil | Navigate | Opens edit form |
| Duplicate | copy | Action | Creates copy with "(Copy)" suffix |
| Delete | trash | Action | Opens confirmation dialog |

---

## CREATE OBJECT FORM
**URL:** /dashboard/objects/new (or modal)

### Form Fields
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Name | text input | Yes | Min 1 char | Empty |
| Type | dropdown | Yes | Must select | Empty |
| Legal Name | text input | No | None | Empty |
| Industry | text input | No | None | Empty |
| Email | email input | No | Email format | Empty |
| Phone | tel input | No | Phone format | Empty |
| Website | url input | No | URL format | Empty |
| Address | text area | No | None | Empty |

### Type Options
| Option | Value | Description |
|--------|-------|-------------|
| Company | company | Business entity |
| Organization | organization | Non-profit or org |
| Group | group | Group of entities |

### Form Actions
| Button | Type | Action | Result |
|--------|------|--------|--------|
| Cancel | button | Cancel | Closes form without saving |
| Save | submit | Submit form | Creates object and redirects |

---

## OBJECT DETAIL PAGE
**URL:** /dashboard/objects/[id]

### Header Section
| Element | Type | Text/Label | Action | Destination |
|---------|------|------------|--------|-------------|
| Back Button | button | "← Back to Objects" | Navigate | /dashboard/objects |
| Object Icon | icon | Dynamic based on type | Display only | N/A |
| Object Name | h1 | [Object name] | Display only | N/A |
| Type Badge | badge | [Company/Organization/Group] | Display only | N/A |
| Created Date | text | "Created [date]" | Display only | N/A |
| Edit Button | button | "Edit Object" | Navigate | Edit form |

### Navigation Tabs
| Tab | Label | Default | Content |
|-----|-------|---------|---------|
| Information | "Information" | Yes | Object details and metadata |
| Contacts | "Contacts" | No | Associated contacts |
| Users | "Users" | No | User permissions |
| Websites | "Websites" | No | Associated websites |

---

## INFORMATION TAB
**Component:** Object Information Display

### Company Information Card
| Field | Type | Editable | Display Format |
|-------|------|----------|----------------|
| Name | text | Via edit | Bold, large |
| Type | badge | Via edit | Colored badge |
| Legal Name | text | Via edit | Normal text |
| Industry | text | Via edit | Normal text |
| Email | email | Via edit | Link (mailto:) |
| Phone | tel | Via edit | Link (tel:) |
| Website | url | Via edit | Link (external) |
| Address | text | Via edit | Multi-line |

### Metadata Section
| Field | Type | Editable | Display Format |
|-------|------|----------|----------------|
| Created | datetime | No | "MMM DD, YYYY at HH:mm" |
| Last Updated | datetime | No | "MMM DD, YYYY at HH:mm" |
| Created By | user | No | User name/email |

---

## CONTACTS TAB
**Component:** Object-Contact Association

### Controls
| Element | Type | Text/Label | Action | Result |
|---------|------|------------|--------|--------|
| Bulk Assign | button | "Bulk Assign" | Opens modal | Bulk contact assignment |
| Assign Contact | button | "+ Assign Contact" | Opens picker | Single contact assignment |
| Search | input | "Search contacts..." | Filter list | Real-time filtering |

### Contacts List
| Column | Type | Action | Result |
|--------|------|--------|--------|
| Name | text/link | Click | Navigate to contact |
| Email | text | Display | Show contact email |
| Phone | text | Display | Show contact phone |
| Role | text | Display | Show role in object |
| Remove | button | Click | Remove association |

### Empty State
| Element | Type | Text | Action |
|---------|------|------|--------|
| Message | text | "No contacts assigned" | Display only |
| CTA | button | "Assign First Contact" | Opens picker |

---

## USERS TAB
**Component:** Object User Permissions

### User Permissions Table
| Column | Type | Editable | Options |
|--------|------|----------|---------|
| User | text/avatar | No | Display user info |
| Email | text | No | Display email |
| Role | dropdown | Yes | Owner/Admin/User |
| Access Level | badges | Yes | Read/Write/Delete |
| Remove | button | Yes | Remove user access |

### Add User Section
| Element | Type | Action | Result |
|---------|------|--------|--------|
| User Picker | dropdown | Select user | Shows available users |
| Role Selector | dropdown | Select role | Owner/Admin/User |
| Add Button | button | Click | Grants access |

---

## WEBSITES TAB
**Component:** Associated Websites

### Controls
| Element | Type | Text/Label | Action | Result |
|---------|------|------------|--------|--------|
| Add Website | button | "+ Add Website" | Opens form | Add new website |

### Websites List
| Column | Type | Action | Result |
|--------|------|--------|--------|
| URL | link | Click | Open in new tab |
| Type | text | Display | Primary/Secondary |
| Status | badge | Display | Active/Inactive |
| Remove | button | Click | Remove website |

---

## EDIT OBJECT FORM
**URL:** /dashboard/objects/[id]/edit (or modal)

### Form Behavior
- All fields pre-populated with current values
- Same fields as Create Object form
- Same validation rules apply
- Changes tracked for audit log

### Form Actions
| Button | Type | Action | Result |
|--------|------|--------|--------|
| Cancel | button | Cancel | Discards changes |
| Save Changes | submit | Update | Saves and redirects |

---

## DELETE CONFIRMATION DIALOG

### Dialog Content
| Element | Type | Text | Purpose |
|---------|------|------|---------|
| Title | h2 | "Delete Object?" | Confirmation header |
| Message | text | "This action cannot be undone" | Warning message |
| Object Name | text | Shows object being deleted | Clarity |

### Dialog Actions
| Button | Type | Action | Result |
|--------|------|--------|--------|
| Cancel | button | Close dialog | No changes |
| Delete | button | Confirm delete | Removes object |

---

## ERROR STATES

### Form Validation Errors
| Field | Error Type | Message |
|-------|------------|---------|
| Name | Required | "Name is required" |
| Type | Required | "Please select a type" |
| Email | Format | "Please enter a valid email" |
| Website | Format | "Please enter a valid URL" |

### System Errors
| Error | Message | Action |
|-------|---------|--------|
| Load Failure | "Failed to load objects" | Retry button |
| Save Failure | "Failed to save object" | Retry button |
| Delete Failure | "Failed to delete object" | Retry button |
| Network Error | "Connection error" | Retry button |

---

## PERMISSIONS & RBAC

### Role-Based Access
| Role | View | Create | Edit | Delete |
|------|------|--------|------|--------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ❌ |
| User | ✅ | ❌ | Own only | ❌ |

---

## API ENDPOINTS

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/objects | List all objects |
| GET | /api/objects/[id] | Get single object |
| POST | /api/objects | Create new object |
| PUT | /api/objects/[id] | Update object |
| DELETE | /api/objects/[id] | Delete object |
| POST | /api/objects/[id]/contacts | Assign contacts |
| DELETE | /api/objects/[id]/contacts/[contactId] | Remove contact |
| POST | /api/objects/[id]/users | Add user permission |
| PUT | /api/objects/[id]/users/[userId] | Update user permission |
| DELETE | /api/objects/[id]/users/[userId] | Remove user permission |

---

*Schema generated by Exhaustive Debugger Agent*
*Last updated: 2025-11-30T01:32:00.298Z*
