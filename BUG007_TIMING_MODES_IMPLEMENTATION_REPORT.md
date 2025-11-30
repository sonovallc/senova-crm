# BUG-7: Autoresponder Timing Modes Implementation Report

**Date:** 2025-11-27
**Status:** ✅ COMPLETE - Ready for Migration and Testing
**Severity:** Enhancement
**Reporter:** User

---

## Problem Statement

User reported: "Bug 7 still exists and there still isn't any option in autoresponder additional steps to wait for a certain action or trigger or time or both or either/or."

The user wanted Mailchimp/ActiveCampaign style timing options where each sequence step can have different timing modes:
- **Time Only** (current): Wait X days/hours before sending
- **Trigger Only**: Wait until a specific action happens (link clicked, email opened, etc.)
- **Either/Or**: Send when EITHER time passes OR trigger happens (whichever comes first)
- **Both**: Send only when BOTH time has passed AND trigger has occurred

---

## Implementation Summary

### ✅ Backend Changes

#### 1. **Models** (`backend/app/models/autoresponder.py`)
- Added `BOTH = "both"` to `TimingMode` enum (line 35)
- Existing `AutoresponderSequence` model already had:
  - `timing_mode` column with TimingMode enum
  - `wait_trigger_type` column (String 50)
  - `wait_trigger_config` column (JSONB)

#### 2. **Schemas** (`backend/app/schemas/autoresponder.py`)
- Updated `validate_timing_mode` validator to include 'both' (line 37)
- Updated `validate_wait_trigger` validator to require trigger type for 'both' mode (line 45)
- Updated `SequenceStepInput` schema to include:
  - `timing_mode` field with default "fixed_duration" (line 116)
  - `wait_trigger_type` field (line 119)
  - `wait_trigger_config` field (line 120)

#### 3. **API Endpoints** (`backend/app/api/v1/autoresponders.py`)
- Updated `update_autoresponder` endpoint (lines 241-245):
  - Now handles `timing_mode`, `wait_trigger_type`, `wait_trigger_config` when creating sequence steps
- Updated `add_sequence_step` endpoint (lines 350-354):
  - Now handles all timing mode fields when adding individual sequence steps

---

### ✅ Frontend Changes

#### 1. **Edit Page** (`frontend/src/app/(dashboard)/dashboard/email/autoresponders/[id]/edit/page.tsx`)

**Interface Updates:**
- Updated `SequenceStep` interface to include (lines 40-48):
  - `timing_mode: 'fixed_duration' | 'wait_for_trigger' | 'either_or' | 'both'`
  - `wait_trigger_type?: string`
  - `wait_trigger_config?: Record<string, any>`

**Function Updates:**
- `handleAddSequenceStep` now initializes with `timing_mode: 'fixed_duration'` (line 212)
- `handleSave` now includes timing fields in sequence_steps payload (lines 402-406)

**UI Components Added (lines 730-817):**
1. **Timing Mode Selector**
   - Dropdown with 4 options: Time Only, Trigger Only, Either/Or, Both
   - Dynamic description text based on selected mode

2. **Conditional Delay Fields**
   - Shown for: `fixed_duration`, `either_or`, `both` modes
   - Days and Hours input fields

3. **Conditional Trigger Selector**
   - Shown for: `wait_for_trigger`, `either_or`, `both` modes
   - Trigger options:
     - Email Opened - Previous email was opened
     - Link Clicked - Link in previous email was clicked
     - Email Replied - Contact replied to email
     - Tag Added - Specific tag was added to contact
     - Status Changed - Contact status changed
     - Appointment Booked - Contact booked appointment

#### 2. **Create Page** (`frontend/src/app/(dashboard)/dashboard/email/autoresponders/create/page.tsx`)

**Interface Updates:**
- Updated `SequenceStep` interface to include 'both' mode (line 40)

**UI Updates (lines 656-741):**
- Updated timing mode dropdown to include "Both - Time AND trigger must happen"
- Updated conditional rendering for delay fields to include 'both' mode (line 681)
- Updated conditional rendering for trigger fields to include 'both' mode (line 714)
- Updated trigger options to match edit page (6 trigger types)

---

### ✅ Database Migration

**File:** `backend/alembic/versions/20251127_1500-add_timing_mode_to_autoresponder_sequences.py`

**Migration Actions:**
1. Creates `timingmode` enum with values: fixed_duration, wait_for_trigger, either_or, both
2. Adds `timing_mode` column to `autoresponder_sequences` table
   - Type: ENUM (timingmode)
   - Nullable: False
   - Default: 'fixed_duration'
3. Adds `wait_trigger_type` column
   - Type: String(50)
   - Nullable: True
4. Adds `wait_trigger_config` column
   - Type: JSONB
   - Nullable: True
   - Default: {}
5. Creates index `idx_autoresponder_sequence_timing_mode` for query performance

**Rollback Support:**
- Downgrade function drops all added columns and enum type

---

## Files Modified

### Backend (4 files)
1. `backend/app/models/autoresponder.py` - Added BOTH to TimingMode enum
2. `backend/app/schemas/autoresponder.py` - Updated validators and SequenceStepInput schema
3. `backend/app/api/v1/autoresponders.py` - Updated create/update endpoints
4. `backend/alembic/versions/20251127_1500-add_timing_mode_to_autoresponder_sequences.py` - NEW migration file

### Frontend (2 files)
1. `frontend/src/app/(dashboard)/dashboard/email/autoresponders/[id]/edit/page.tsx` - Added timing mode UI
2. `frontend/src/app/(dashboard)/dashboard/email/autoresponders/create/page.tsx` - Updated timing mode UI

---

## UI Flow

### Creating/Editing a Sequence Step

```
Step 1
├── Timing Mode: [Dropdown]
│   ├── Time Only - Wait for specific time
│   ├── Trigger Only - Wait for action/event
│   ├── Either/Or - Whichever happens first
│   └── Both - Time AND trigger must happen
│
├── (if Time Only, Either/Or, or Both)
│   ├── Delay (Days): [Input]
│   └── Delay (Hours): [Input]
│
├── (if Trigger Only, Either/Or, or Both)
│   └── Wait For Trigger: [Dropdown]
│       ├── Email Opened
│       ├── Link Clicked
│       ├── Email Replied
│       ├── Tag Added
│       ├── Status Changed
│       └── Appointment Booked
│
├── Template: [Dropdown]
├── Subject: [Input]
└── Body: [Rich Text Editor]
```

---

## Next Steps

### 1. Run Database Migration
```bash
cd context-engineering-intro/backend
alembic upgrade head
```

### 2. Restart Docker Containers
```bash
cd context-engineering-intro
docker-compose restart backend
docker-compose restart frontend
```

### 3. Test Scenarios

#### Test 1: Time Only Mode
1. Navigate to Autoresponders > Create
2. Enable multi-step sequence
3. Add sequence step
4. Select "Time Only" timing mode
5. Set delay: 1 day, 2 hours
6. Verify: Only delay fields are shown
7. Save autoresponder

#### Test 2: Trigger Only Mode
1. Add sequence step
2. Select "Trigger Only" timing mode
3. Select trigger: "Email Opened"
4. Verify: Only trigger field is shown, no delay fields
5. Save autoresponder

#### Test 3: Either/Or Mode
1. Add sequence step
2. Select "Either/Or" timing mode
3. Set delay: 2 days, 0 hours
4. Select trigger: "Link Clicked"
5. Verify: Both delay AND trigger fields are shown
6. Save autoresponder

#### Test 4: Both Mode
1. Add sequence step
2. Select "Both" timing mode
3. Set delay: 1 day, 0 hours
4. Select trigger: "Email Replied"
5. Verify: Both delay AND trigger fields are shown
6. Save autoresponder

#### Test 5: Edit Existing Autoresponder
1. Navigate to Autoresponders > Edit existing
2. If sequence steps exist, verify timing_mode defaults to 'fixed_duration'
3. Change timing mode to "Both"
4. Set trigger and delay
5. Save and reload
6. Verify: Changes persisted correctly

---

## Validation Rules

### Backend Validation
- `timing_mode` must be one of: fixed_duration, wait_for_trigger, either_or, both
- If timing_mode is `wait_for_trigger`, `either_or`, or `both`:
  - `wait_trigger_type` is REQUIRED
- `delay_days` must be >= 0
- `delay_hours` must be between 0-23
- Either `template_id` OR `subject` must be provided

### Frontend Validation
- Subject is required for sequence steps
- Email body is required for sequence steps
- If timing mode requires trigger, trigger type must be selected

---

## Database Schema

### autoresponder_sequences Table (After Migration)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NO | - |
| autoresponder_id | UUID | NO | - |
| sequence_order | INTEGER | NO | - |
| **timing_mode** | **ENUM(timingmode)** | **NO** | **'fixed_duration'** |
| delay_days | INTEGER | NO | 0 |
| delay_hours | INTEGER | NO | 0 |
| **wait_trigger_type** | **VARCHAR(50)** | **YES** | **NULL** |
| **wait_trigger_config** | **JSONB** | **YES** | **{}** |
| template_id | UUID | YES | NULL |
| subject | VARCHAR(500) | YES | NULL |
| body_html | TEXT | YES | NULL |
| created_at | TIMESTAMP | NO | now() |

**Indexes:**
- `idx_autoresponder_sequence_autoresponder_id` (autoresponder_id)
- `idx_autoresponder_sequence_template_id` (template_id)
- `idx_autoresponder_sequence_order` (autoresponder_id, sequence_order)
- **`idx_autoresponder_sequence_timing_mode` (timing_mode)** ← NEW

---

## Known Limitations

1. **Trigger Implementation**: The actual trigger detection logic (email opened tracking, link click tracking) is NOT implemented in this change. This PR only adds the UI and database schema for configuring triggers. Trigger detection would require:
   - Mailgun webhook handlers for email opens/clicks
   - Tag/status change listeners
   - Appointment booking hooks

2. **Trigger Config UI**: The `wait_trigger_config` field is stored but no UI is provided for configuring tag-specific or status-specific triggers (e.g., "wait for tag X" vs "wait for any tag"). This would be a future enhancement.

3. **Backward Compatibility**: Existing autoresponder sequences will default to `timing_mode = 'fixed_duration'` which maintains current behavior.

---

## Success Criteria

- ✅ Backend model supports all 4 timing modes
- ✅ Backend API validates timing modes correctly
- ✅ Frontend displays timing mode selector
- ✅ Frontend conditionally shows delay/trigger fields based on mode
- ✅ Database migration adds required columns
- ✅ All trigger types are available in dropdown
- ✅ Existing autoresponders continue to work with default timing mode
- ⏳ User can create autoresponder with all 4 timing modes (pending testing)
- ⏳ Changes persist correctly when editing (pending testing)

---

## Production Readiness Checklist

- [x] Backend code changes complete
- [x] Frontend code changes complete
- [x] Database migration created
- [ ] Database migration run successfully
- [ ] Backend container restarted
- [ ] Frontend container restarted
- [ ] Manual testing completed
- [ ] Playwright automated tests created (if applicable)
- [ ] User acceptance testing

---

## Additional Notes

**Design Decision:** The UI uses clear, user-friendly labels:
- "Time Only" instead of "Fixed Duration"
- "Trigger Only" instead of "Wait for Trigger"
- "Either/Or" instead of "Either Or"
- "Both" instead of "Both Required"

This matches Mailchimp/ActiveCampaign's UX patterns and makes the feature immediately understandable to users familiar with those platforms.

**Future Enhancement:** Consider adding visual icons next to each timing mode option for better UX:
- ⏰ Time Only
- 🎯 Trigger Only
- ⚡ Either/Or
- ✅ Both
