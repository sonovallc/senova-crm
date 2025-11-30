# SENOVA CRM - COMPREHENSIVE SYSTEM MAP

**Generated:** 2025-11-28
**Version:** 1.0
**Status:** Production Ready

---

## TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [Public Website Pages](#public-website-pages)
3. [CRM Dashboard Pages](#crm-dashboard-pages)
4. [Navigation Components](#navigation-components)
5. [API Endpoints](#api-endpoints)
6. [Forms & Interactive Elements](#forms--interactive-elements)

---

## SYSTEM OVERVIEW

### Tech Stack
- **Frontend:** Next.js 14 (React), TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python), SQLAlchemy
- **Database:** PostgreSQL
- **Ports:** Frontend: 3000/3004, Backend: 8000

### Project Structure
```
context-engineering-intro/
├── frontend/           # Next.js frontend
│   ├── src/app/       # App router pages
│   └── src/components/ # React components
└── backend/           # FastAPI backend
    └── app/api/       # API endpoints
```

---

## PUBLIC WEBSITE PAGES

### Core Pages (5 pages)

#### 1. Home Page (`/`)
- **Purpose:** Main landing page for Senova CRM
- **Components:**
  - Hero section with gradient animation
  - Features grid
  - Stats section
  - Testimonials section
  - CTA section
- **Buttons:**
  - "Get Started" -> `/demo`
  - "Watch Demo" -> `/demo`
  - "Book Demo" -> `/demo`
- **Links:** All navigation links from header/footer

#### 2. Platform Page (`/platform`)
- **Purpose:** Platform overview and capabilities
- **Content:** Full platform feature descriptions
- **CTAs:** Demo booking buttons

#### 3. Pricing Page (`/pricing`)
- **Purpose:** Pricing tiers and plans
- **Components:**
  - Pricing table with 3 tiers
  - Feature comparison
  - FAQ section
- **Buttons:**
  - "Start Free Trial" per tier
  - "Contact Sales" for enterprise
  - "Book Demo" CTA

#### 4. About Page (`/about`)
- **Purpose:** Company information
- **Content:**
  - Company mission
  - Team (if applicable)
  - Company values

#### 5. Contact Page (`/contact`)
- **Purpose:** Contact form and information
- **Form Fields:**
  - First Name (required)
  - Last Name (required)
  - Email (required)
  - Phone
  - Company
  - Message (textarea)
- **Buttons:** "Send Message"

---

### Solution Pages (6 pages)

#### 6. CRM (`/solutions/crm`)
- **Purpose:** CRM features overview
- **Content:** 360-degree customer management features

#### 7. Audience Intelligence (`/solutions/audience-intelligence`)
- **Purpose:** Data-driven customer insights
- **Content:** AI-powered analytics and segmentation

#### 8. Patient Identification (`/solutions/patient-identification`)
- **Purpose:** Advanced patient matching system (healthcare focus)
- **Content:** HIPAA-compliant identification technology

#### 9. Visitor Identification (`/solutions/visitor-identification`)
- **Purpose:** Website visitor tracking
- **Content:** Anonymous visitor to known contact conversion

#### 10. Campaign Activation (`/solutions/campaign-activation`)
- **Purpose:** Multi-channel marketing automation
- **Content:** Email, SMS, social campaign management

#### 11. Analytics (`/solutions/analytics`)
- **Purpose:** ROI and performance tracking
- **Content:** Dashboard, reports, attribution

---

### Industry Pages (8 pages)

#### Healthcare Verticals
| Route | Industry | Focus |
|-------|----------|-------|
| `/industries/medical-spas` | Medical Spas | Complete medspa management |
| `/industries/dermatology` | Dermatology | Practice management |
| `/industries/plastic-surgery` | Plastic Surgery | Patient management |
| `/industries/aesthetic-clinics` | Aesthetic Clinics | Clinic solutions |

#### General Business Verticals
| Route | Industry | Focus |
|-------|----------|-------|
| `/industries/restaurants` | Restaurants | Restaurant management |
| `/industries/home-services` | Home Services | Contractor solutions |
| `/industries/retail` | Retail & E-commerce | Retail growth |
| `/industries/professional-services` | Professional Services | Consultants & agencies |

---

### Legal & Compliance Pages (5 pages)

| Route | Page | Content |
|-------|------|---------|
| `/privacy-policy` | Privacy Policy | Data handling policies |
| `/terms-of-service` | Terms of Service | Service terms |
| `/hipaa` | HIPAA Compliance | Healthcare compliance documentation |
| `/security` | Security | Data security measures |
| `/compliance` | Compliance | General compliance info |

---

### Placeholder Pages (4 pages)

| Route | Page | Status |
|-------|------|--------|
| `/blog` | Blog | Coming Soon placeholder |
| `/case-studies` | Case Studies | Coming Soon placeholder |
| `/roi-calculator` | ROI Calculator | Coming Soon placeholder |
| `/docs` | Documentation | Coming Soon placeholder |

---

### Authentication Pages (2 pages)

#### Login Page (`/login`)
- **Form Fields:**
  - Email (required)
  - Password (required)
- **Buttons:**
  - "Sign In"
  - "Forgot Password?" link
  - "Create Account" link
- **Redirects:** Successful login -> `/dashboard`

#### Register Page (`/register`)
- **Form Fields:**
  - First Name
  - Last Name
  - Email
  - Password
  - Confirm Password
- **Buttons:**
  - "Create Account"
  - "Already have account?" link

---

## CRM DASHBOARD PAGES

### Main Dashboard Pages

#### Dashboard Home (`/dashboard`)
- **Purpose:** Main dashboard overview
- **Components:**
  - Stats cards (contacts, messages, etc.)
  - Recent activity widget
  - Quick actions
- **Buttons:**
  - Quick action buttons
  - View all links

---

### Inbox Module (`/dashboard/inbox`)
- **Purpose:** Unified multi-channel communications
- **Tabs:**
  | Tab | Filter |
  |-----|--------|
  | All | All conversations |
  | Unread | Status != READ and != ARCHIVED |
  | Read | Status = READ |
  | Archived | Status = ARCHIVED |
- **Sort Options:**
  - Recent Activity
  - Oldest First
  - Recent Inbound
  - Recent Outbound
  - Newest Contact
  - Oldest Contact
- **Buttons:**
  - "Compose Email" - Opens email composer dialog
  - "Forward" - Forward current message
  - "Archive" / "Unarchive" - Toggle archive status
  - "View Contact" - Navigate to contact detail
- **Message Composer:**
  - To field with contact autocomplete
  - CC/BCC fields
  - Subject line
  - Rich text editor body
  - Template selection dropdown
  - Variables dropdown ({first_name}, {last_name}, {email}, {phone}, {company})
  - Attachment upload
  - Send button

---

### Contacts Module

#### Contacts List (`/dashboard/contacts`)
- **Purpose:** Manage customer database
- **Search & Filters:**
  - Search input (name, email, phone)
  - Status dropdown: All, Lead, Prospect, Customer, Inactive
  - Tag filter (multi-select popover)
  - Advanced Filters button (filter builder)
- **Bulk Actions (when selected):**
  - Add Tags ({count})
  - Remove Tags ({count})
  - Export ({count})
  - Delete ({count})
- **Header Buttons:**
  - Export All
  - Import Contacts -> `/dashboard/contacts/import`
  - Add Contact (opens modal)
- **Table Columns:**
  - Checkbox (select)
  - Name
  - Email
  - Phone
  - Company
  - Status
  - Tags
  - Actions
- **Pagination:**
  - Previous/Next buttons
  - Page X of Y display
  - "Select all X matching" link

#### Contact Detail (`/dashboard/contacts/[id]`)
- **Purpose:** View/edit individual contact
- **Tabs:**
  - Overview
  - Activity Timeline
  - Communications
  - Notes
- **Form Fields:**
  - First Name, Last Name
  - Email, Phone
  - Company
  - Status dropdown
  - Tags selector
  - Custom fields
- **Buttons:**
  - Save Changes
  - Send Email
  - Delete Contact

#### Contact Import (`/dashboard/contacts/import`)
- **Purpose:** Bulk import contacts via CSV
- **Steps:**
  1. File Upload (drag & drop or browse)
  2. Column Mapping (auto-map or manual)
  3. Duplicate Handling (skip, update, create new)
  4. Tag Assignment
  5. Preview & Confirm
  6. Import Results
- **Buttons:**
  - Browse Files
  - Auto-map Columns
  - Apply Mapping
  - Import Contacts

#### Deleted Contacts (`/dashboard/contacts/deleted`)
- **Purpose:** View and restore deleted contacts (Owner only)
- **Actions:** Restore, Permanently Delete

---

### Email Module

#### Email Compose (`/dashboard/email/compose`)
- **Purpose:** Compose and send emails
- **Form:**
  - To: Contact selector
  - CC/BCC: Additional recipients
  - Subject: Text input
  - Body: Rich text editor
  - Template: Dropdown selector
  - Variables: Insert field variables
- **Buttons:**
  - Send Email
  - Save as Draft
  - Preview
  - Discard

#### Email Templates (`/dashboard/email/templates`)
- **Purpose:** Manage email templates
- **Table Columns:**
  - Name
  - Subject
  - Category
  - Last Updated
  - Actions (Edit, Duplicate, Delete)
- **Buttons:**
  - Create Template
  - Filter by Category

#### Email Campaigns (`/dashboard/email/campaigns`)
- **Purpose:** Create and manage email campaigns
- **Table Columns:**
  - Campaign Name
  - Status (Draft, Scheduled, Sent, Paused)
  - Recipients
  - Open Rate
  - Click Rate
  - Sent Date
- **Buttons:**
  - Create Campaign
  - Filter by Status
- **Campaign Actions:**
  - Edit, Pause, Resume, Delete, View Stats

#### Campaign Create/Edit (`/dashboard/email/campaigns/create`, `/dashboard/email/campaigns/[id]/edit`)
- **Steps:**
  1. Campaign Details (name, subject)
  2. Recipient Selection (filters, segments, tags)
  3. Email Content (template or custom)
  4. Schedule (immediate or scheduled)
  5. Review & Send

#### Autoresponders (`/dashboard/email/autoresponders`)
- **Purpose:** Automated email sequences
- **Table Columns:**
  - Name
  - Trigger
  - Status (Active, Paused)
  - Emails in Sequence
- **Buttons:**
  - Create Autoresponder
  - Enable/Disable toggle

---

### Objects Module (Multi-Tenant)

#### Objects List (`/dashboard/objects`)
- **Purpose:** Manage business entities (locations, franchises)
- **Visible to:** Owner, Admin roles only
- **Table/Grid View:**
  - Object Name
  - Type
  - Address
  - Contacts Count
  - Users Count
  - Status
- **Buttons:**
  - Create Object
  - Toggle Grid/List View
- **Row Actions:**
  - View Details
  - Edit
  - Manage Contacts
  - Manage Users

#### Object Detail (`/dashboard/objects/[id]`)
- **Tabs:**
  - Overview
  - Contacts (assigned to this object)
  - Users (with permissions)
  - Websites
  - Settings
- **Modals:**
  - Contact Assignment Modal
  - User Permission Modal
  - Bulk Assignment Modal

#### Object Create/Edit (`/dashboard/objects/create`, `/dashboard/objects/[id]/edit`)
- **Form Fields:**
  - Object Name (required)
  - Object Type (dropdown)
  - Address
  - Phone
  - Email
  - Website URL
  - Notes

---

### Activity & Analytics

#### Activity Log (`/dashboard/activity-log`)
- **Purpose:** View system activity history
- **Visible to:** Owner, Admin roles
- **Filters:**
  - Date range
  - User
  - Action type
  - Entity type
- **Columns:**
  - Timestamp
  - User
  - Action
  - Entity
  - Details

#### Payments (`/dashboard/payments`)
- **Purpose:** View payment transactions
- **Stats Cards:**
  - Total Revenue
  - Transactions
  - Average Value
- **Table:**
  - Date
  - Customer
  - Amount
  - Status
  - Payment Method

#### AI Tools (`/dashboard/ai`)
- **Purpose:** AI-powered features
- **Features:**
  - Response Generator
  - Sentiment Analyzer
  - Smart Suggestions

---

### Settings Module

#### Settings Main (`/dashboard/settings`)
- **Quick Links (Owner/Admin):**
  - User Management card -> `/dashboard/settings/users`
  - Field Visibility card -> `/dashboard/settings/fields`
  - Tags Management card -> `/dashboard/settings/tags`
- **Tabs:**
  1. **API Keys**
     - Bandwidth.com API Key
     - Mailgun API Key
     - Stripe Secret Key
     - Square Access Token
     - Closebot API Key
     - Data Integration API Key
  2. **Email Configuration**
     - Mailgun domain settings
     - From email address
     - Reply-to address
  3. **Integrations**
     - Integration status cards
     - Connect/Disconnect buttons
  4. **Profile**
     - First Name, Last Name
     - Email
     - Role (readonly)

#### Settings Sub-Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard/settings/users` | Users | Manage user accounts |
| `/dashboard/settings/users/new` | New User | Create new user |
| `/dashboard/settings/tags` | Tags | Create/edit tags |
| `/dashboard/settings/fields` | Fields | Configure field visibility |
| `/dashboard/settings/feature-flags` | Feature Flags | Toggle features (Owner only) |
| `/dashboard/settings/integrations/mailgun` | Mailgun | Mailgun configuration |
| `/dashboard/settings/integrations/closebot` | Closebot | Closebot integration |

---

### Standalone Dashboard Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard/closebot` | CloseBot AI | AI conversation assistant |
| `/dashboard/calendar` | Calendar | Appointment scheduling |

### Redirect Pages (Legacy Routes)

| Old Route | Redirects To |
|-----------|--------------|
| `/dashboard/email-templates` | `/dashboard/email/templates` |
| `/dashboard/campaigns` | `/dashboard/email/campaigns` |
| `/dashboard/autoresponders` | `/dashboard/email/autoresponders` |

---

## NAVIGATION COMPONENTS

### Website Header (`header.tsx`)

#### Desktop Navigation
```
Logo (-> /) | Platform (dropdown) | Solutions (dropdown) | Industries (dropdown) | Pricing | About | Contact | [Login] [Get Demo]
```

#### Platform Dropdown
- Overview -> `/platform`
- CRM Features -> `/solutions/crm`

#### Solutions Dropdown
- CRM -> `/solutions/crm`
- Audience Intelligence -> `/solutions/audience-intelligence`
- Patient Identification -> `/solutions/patient-identification`
- Visitor Identification -> `/solutions/visitor-identification`
- Campaign Activation -> `/solutions/campaign-activation`
- Analytics -> `/solutions/analytics`

#### Industries Dropdown
- Medical Spas -> `/industries/medical-spas`
- Dermatology -> `/industries/dermatology`
- Plastic Surgery -> `/industries/plastic-surgery`
- Aesthetic Clinics -> `/industries/aesthetic-clinics`
- Restaurants -> `/industries/restaurants`
- Home Services -> `/industries/home-services`
- Retail & E-commerce -> `/industries/retail`
- Professional Services -> `/industries/professional-services`

#### Mobile Menu
- Hamburger button: `id="mobile-menu-button"`, `data-testid="mobile-menu-button"`
- All navigation items in collapsible accordion
- Login and Get Demo buttons at bottom

---

### Website Footer (`footer.tsx`)

#### Link Sections

**Company:**
- About Us -> `/about`
- Contact -> `/contact`

**Solutions:**
- CRM Platform -> `/platform`
- Customer Intelligence -> `/solutions/audience-intelligence`
- Website Visitor Tracking -> `/solutions/visitor-identification`
- Smart Advertising -> `/solutions/campaign-activation`
- Analytics Dashboard -> `/solutions/analytics`

**Industries We Serve:**
- Restaurants & Food -> `/industries/restaurants`
- Home Services -> `/industries/home-services`
- Retail & E-commerce -> `/industries/retail`
- Professional Services -> `/industries/professional-services`

**Legal:**
- Privacy Policy -> `/privacy-policy`
- Terms of Service -> `/terms-of-service`
- Data Security -> `/security`
- Compliance -> `/compliance`

#### Newsletter Form
- Email input
- Subscribe button

#### Social Links
- LinkedIn -> `https://linkedin.com/company/senova`
- Twitter -> `https://twitter.com/senovacrm`
- YouTube -> `https://youtube.com/@senovacrm`

#### Trust Badges
- Bank-Level Security
- Privacy First
- 256-bit Encryption

---

### CRM Sidebar (`Sidebar.tsx`)

#### Navigation Items (All Users)
| Icon | Label | Route |
|------|-------|-------|
| Home | Dashboard | `/dashboard` |
| Inbox | Inbox | `/dashboard/inbox` |
| Users | Contacts | `/dashboard/contacts` |
| Mail | Email (expandable) | - |
| - Edit3 | Compose | `/dashboard/email/compose` |
| - FileText | Templates | `/dashboard/email/templates` |
| - Megaphone | Campaigns | `/dashboard/email/campaigns` |
| - Zap | Autoresponders | `/dashboard/email/autoresponders` |
| CreditCard | Payments | `/dashboard/payments` |
| Brain | AI Tools | `/dashboard/ai` |
| Settings | Settings (expandable) | - |
| - Users | Users | `/dashboard/settings/users` |
| - Tag | Tags | `/dashboard/settings/tags` |
| - List | Fields | `/dashboard/settings/fields` |
| - Flag | Feature Flags | `/dashboard/settings/feature-flags` |
| - Send | Mailgun | `/dashboard/settings/integrations/mailgun` |
| - Bot | Closebot | `/dashboard/settings/integrations/closebot` |

#### Role-Specific Items
| Role | Additional Items |
|------|------------------|
| Owner, Admin | Objects (`/dashboard/objects`), Activity Log (`/dashboard/activity-log`) |
| Owner | Deleted Contacts (`/dashboard/contacts/deleted`), Feature Flags |

#### Bottom Section
- Logout button

---

## API ENDPOINTS

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/login` | User login |
| POST | `/register` | User registration |
| POST | `/logout` | User logout |
| GET | `/me` | Get current user |
| POST | `/refresh` | Refresh access token |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |

### Contacts (`/api/v1/contacts`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List contacts (paginated) |
| POST | `/` | Create contact |
| GET | `/{id}` | Get contact by ID |
| PUT | `/{id}` | Update contact |
| DELETE | `/{id}` | Soft delete contact |
| POST | `/search` | Advanced search |
| POST | `/bulk-delete` | Bulk delete contacts |
| POST | `/{id}/enrich` | Enrich contact data |

### Contact Import (`/api/v1/contacts/import`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/upload` | Upload CSV file |
| POST | `/process` | Process import |
| GET | `/preview` | Preview import data |

### Tags (`/api/v1/tags`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all tags |
| POST | `/` | Create tag |
| PUT | `/{id}` | Update tag |
| DELETE | `/{id}` | Delete tag |
| POST | `/contacts/{contact_id}` | Add tag to contact |
| DELETE | `/contacts/{contact_id}/{tag_id}` | Remove tag from contact |

### Communications (`/api/v1/communications`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/inbox/threads` | Get inbox threads |
| GET | `/contacts/{id}/history` | Contact message history |
| POST | `/send` | Send message |
| POST | `/email` | Send email |
| PUT | `/{id}/read` | Mark as read |
| PUT | `/{id}/archive` | Archive message |
| PUT | `/{id}/unarchive` | Unarchive message |
| POST | `/upload` | Upload attachments |

### Email Templates (`/api/v1/email_templates`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List templates |
| POST | `/` | Create template |
| GET | `/{id}` | Get template |
| PUT | `/{id}` | Update template |
| DELETE | `/{id}` | Delete template |

### Email Campaigns (`/api/v1/email_campaigns`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List campaigns |
| POST | `/` | Create campaign |
| GET | `/{id}` | Get campaign |
| PUT | `/{id}` | Update campaign |
| DELETE | `/{id}` | Delete campaign |
| POST | `/{id}/send` | Send campaign |
| PUT | `/{id}/pause` | Pause campaign |

### Autoresponders (`/api/v1/autoresponders`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List autoresponders |
| POST | `/` | Create autoresponder |
| GET | `/{id}` | Get autoresponder |
| PUT | `/{id}` | Update autoresponder |
| DELETE | `/{id}` | Delete autoresponder |
| PUT | `/{id}/toggle` | Enable/disable |

### Objects (`/api/v1/objects`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List objects |
| POST | `/` | Create object |
| GET | `/{id}` | Get object |
| PUT | `/{id}` | Update object |
| DELETE | `/{id}` | Delete object |
| POST | `/{id}/contacts` | Assign contacts |
| POST | `/{id}/users` | Assign users |
| POST | `/bulk-assign` | Bulk assign |

### Users (`/api/v1/users`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List users |
| POST | `/` | Create user |
| GET | `/{id}` | Get user |
| PUT | `/{id}` | Update user |
| DELETE | `/{id}` | Delete user |
| PUT | `/{id}/role` | Update role |

### Settings
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/mailgun/settings` | Get Mailgun settings |
| PUT | `/api/v1/mailgun/settings` | Update Mailgun settings |
| POST | `/api/v1/mailgun/test` | Test Mailgun connection |
| GET | `/api/v1/feature_flags` | Get feature flags |
| PUT | `/api/v1/feature_flags/{flag}` | Toggle feature flag |
| GET | `/api/v1/field_visibility` | Get field visibility rules |
| PUT | `/api/v1/field_visibility` | Update field visibility |

### Dashboard (`/api/v1/dashboard`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/stats` | Get dashboard statistics |
| GET | `/activity` | Get recent activity |

### Activities (`/api/v1/activities`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List activities |
| GET | `/contacts/{id}` | Contact activity |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List payments |
| GET | `/stats` | Payment statistics |

### AI (`/api/v1/ai`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/generate-response` | Generate AI response |
| POST | `/analyze-sentiment` | Analyze sentiment |

### Webhooks (`/api/v1/webhooks`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/mailgun` | Mailgun webhook receiver |
| POST | `/bandwidth` | Bandwidth webhook receiver |

---

## FORMS & INTERACTIVE ELEMENTS

### Dropdowns & Selects

#### Contact Status Dropdown
Options: All Status, Lead, Prospect, Customer, Inactive

#### Inbox Sort Dropdown
Options: Recent Activity, Oldest First, Recent Inbound, Recent Outbound, Newest Contact, Oldest Contact

#### Email Variables Dropdown
Variables: {first_name}, {last_name}, {email}, {phone}, {company}

### Modals/Dialogs

| Component | Purpose | Trigger |
|-----------|---------|---------|
| ContactForm Dialog | Create/Edit contact | "Add Contact" button or row click |
| EmailComposer Dialog | Compose new email | "Compose Email" button |
| Bulk Delete Dialog | Confirm bulk deletion | "Delete" bulk action |
| Bulk Tag Dialog | Add/remove tags in bulk | Bulk tag buttons |
| Contact Assignment Modal | Assign contacts to object | Object detail page |
| User Permission Modal | Assign users to object | Object detail page |
| Password Reset Dialog | Reset user password | Settings or login |

### Toast Notifications
- Success (green): Operation completed
- Error (red): Operation failed
- Warning (yellow): Attention needed
- Info (blue): Information only

---

## TEST IDS FOR AUTOMATION

### Key Test IDs
```
mobile-menu-button          # Mobile hamburger menu
mobile-menu                 # Mobile menu container
bulk-action-bar             # Bulk action buttons container
bulk-add-tags-button        # Add tags to selected
bulk-remove-tags-button     # Remove tags from selected
bulk-export-button          # Export selected contacts
bulk-delete-button          # Delete selected contacts
export-all-button           # Export all contacts
inbox-forward-button        # Forward email button
export-csv-download         # CSV download link
```

---

## PAGE COUNT SUMMARY

| Category | Count |
|----------|-------|
| Public Website Pages | 27 |
| CRM Dashboard Pages | 25+ |
| **Total Pages** | **52+** |

### Public Website Breakdown
- Core Pages: 5
- Solution Pages: 6
- Industry Pages: 8
- Legal Pages: 5
- Placeholder Pages: 4
- Auth Pages: 2

### CRM Dashboard Breakdown
- Main Dashboard: 1
- Inbox: 1
- Contacts: 4 (list, detail, import, deleted)
- Email: 5 (compose, templates, campaigns, create, edit)
- Objects: 4 (list, detail, create, edit)
- Settings: 8 (main + sub-pages)
- Other: 2+ (activity, payments, ai, calendar, closebot)

---

*This system map is comprehensive as of 2025-11-28. Update as features are added.*
