# BUG INVESTIGATION: Template Body Not Populating (Bugs #6, #10, #14)

## ROOT CAUSE: TipTap Editor Timing Issue

### Summary
All three bugs have the SAME root cause:
- API IS returning body_html correctly (CONFIRMED)
- React state IS being updated correctly (CONFIRMED)  
- RichTextEditor has TIMING ISSUE with TipTap initialization (PROBLEM)

### Bug Locations

Bug #6: frontend/src/components/inbox/email-composer.tsx
- Lines 75-80: Template fetch
- Lines 117-128: handleTemplateChange sets state correctly
- Lines 355-360: RichTextEditor receives value but doesn't display

Bug #10: frontend/src/app/(dashboard)/dashboard/email/templates/page.tsx
- Lines 258-267: handleEdit sets body_html correctly
- Lines 621-622: RichTextEditor receives value but doesn't display

Bug #14: frontend/src/app/(dashboard)/dashboard/email/campaigns/create/page.tsx
- Lines 109-116: handleTemplateChange sets body_html correctly

### Root Cause

TipTap editor initialization is asynchronous. When user selects template:
1. setMessage() or setBodyHtml() updates state
2. Component re-renders with new value
3. useEffect in RichTextEditor triggers
4. editor.commands.setContent() called
5. PROBLEM: TipTap editor not fully ready yet
6. Content update fails silently

### Why Subject Works But Body Doesn't
- Subject uses HTML <Input> - accepts updates immediately
- Body uses RichTextEditor with TipTap - needs time to initialize

### Fix Implementation

File: frontend/src/components/inbox/rich-text-editor.tsx
Lines: 45-57

Change from:
  useEffect(() => {
    if (editor) {
      // ... validation ...
      editor.commands.setContent(value)
    }
  }, [value, editor])

Change to:
  useEffect(() => {
    if (editor) {
      // ... validation ...
      const timeout = setTimeout(() => {
        if (editor && editor.isEditable) {
          editor.commands.setContent(value)
        }
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [value, editor])

The setTimeout defers execution to next event loop, ensuring TipTap is ready.

### Impact
- Files to modify: 1 (rich-text-editor.tsx)
- Bugs fixed: 3 (#6, #10, #14)
- Risk: MINIMAL (only internal timing fix)
- Backward compatible: YES

### Verification
Test all three components after fix:
1. Email Compose - select template, verify body displays
2. Templates Edit - open edit modal, verify body displays
3. Campaign Compose - select template, verify body displays

