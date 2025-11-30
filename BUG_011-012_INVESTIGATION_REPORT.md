# BUGS #11-12 Investigation Report

## BUG #11: Edit Template Body Content Empty

### ROOT CAUSE
RichTextEditor component fails to populate body_html in Dialog context due to TipTap editor initialization timing issue.

### AFFECTED FILES & LINES
1. `context-engineering-intro/frontend/src/components/inbox/rich-text-editor.tsx`
   - Line 61: `setTimeout(() => { ... }, 0)` - delay too short for Dialog context
   - Lines 46-66: useEffect that tries to set content
   - Line 58: `if (editor && editor.isEditable)` - editor not ready when called

2. `context-engineering-intro/frontend/src/app/(dashboard)/dashboard/email/templates/page.tsx`
   - Lines 619-626: RichTextEditor in Edit Modal
   - Lines 569-666: Full Edit Modal Dialog component
   - Lines 258-267: handleEdit function (correctly loads data)

### WHY IT HAPPENS
1. User clicks Edit → handleEdit() loads template.body_html into formData
2. Dialog opens, RichTextEditor mounts with value={formData.body_html}
3. TipTap useEditor hook initializes asynchronously
4. Dialog rendering cycle adds another async layer (animations, transitions)
5. useEffect tries to call editor.commands.setContent(value) via setTimeout(0)
6. But editor.isEditable is still false when setTimeout fires after 0ms
7. setContent call is skipped, leaving editor empty

### WHY PREVIOUS BUG #10 FIX INCOMPLETE
- Bug #10 fix used setTimeout(0) which works in simple contexts
- Fails in Dialog because Dialog rendering interferes with TipTap state
- 0ms delay insufficient for both Dialog and TipTap to initialize
- Need longer delay or Dialog callback-based approach

### RECOMMENDED FIX
**Option 1 (Simplest):** Increase setTimeout from 0ms to 100ms
- File: rich-text-editor.tsx, Line 61
- Change: `}, 0)` to `}, 100)`
- Allows both Dialog and TipTap full initialization time

**Option 2 (Better):** Use Dialog's onOpenChange callback
- Detect when Edit Modal fully opens
- Explicitly trigger editor content update
- More precise timing control

---

## BUG #12: Success AND Error Notifications Show Together

### ROOT CAUSE
Query invalidation fails after successful mutation, causing cascading error toast.

### AFFECTED FILES & LINES
1. `context-engineering-intro/frontend/src/app/(dashboard)/dashboard/email/templates/page.tsx`
   - Lines 145-166: updateMutation configuration
   - Lines 149-155: onSuccess callback with invalidateQueries
   - Lines 159-165: onError callback

2. `context-engineering-intro/frontend/src/lib/queries/email-templates.ts`
   - Lines 32-43: updateTemplate API function
   - Line 42: `return response.data` - no validation

### WHY IT HAPPENS
1. User clicks "Save Changes"
2. updateMutation.mutate() calls API PATCH
3. API responds with HTTP 200 OK
4. onSuccess callback fires → First toast shows "Template updated successfully"
5. onSuccess calls queryClient.invalidateQueries({ queryKey: ['email-templates'] })
6. This triggers automatic refetch of email-templates list
7. Refetch FAILS for some reason (network blip, backend error, race condition)
8. Failed refetch triggers error handler → Second toast shows "Failed to update template"
9. User sees both toasts simultaneously

### RACE CONDITION SCENARIO
```
Time  Event
T0    User clicks Save
T1    API PATCH in flight
T2    API responds 200 OK
T3    onSuccess fires → Toast: "Template updated" (GREEN)
T4    queryClient.invalidateQueries() called
T5    Refetch of email-templates starts
T6    Refetch FAILS (timeout, backend error, race condition)
T7    Error handler triggered → Toast: "Failed to update template" (RED)
```

### SECONDARY ISSUE
updateTemplate function in email-templates.ts has no response validation:
- If API returns 200 with invalid data, still treated as success
- If response.data is missing required fields, not caught
- Makes it harder to detect when mutation actually failed

### RECOMMENDED FIX
**Primary Fix:** Wrap invalidateQueries in error handling
- File: page.tsx, Lines 149-155
- Change onSuccess to catch invalidation errors:
```typescript
onSuccess: () => {
  toast({ title: 'Template updated', ... })
  queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    .catch(() => {
      console.warn('Failed to refetch templates after update')
      // Silently fail - we already showed success
    })
  setIsEditModalOpen(false)
  ...
}
```

**Secondary Fix:** Add API response validation
- File: email-templates.ts, Lines 40-43
- Add validation before returning:
```typescript
const response = await api.patch(`/api/v1/email-templates/${id}`, data)
if (!response.data || !response.data.id) {
  throw new Error('Invalid response from server')
}
return response.data
```

---

## SUMMARY TABLE

| Bug | Root Cause | Primary File | Lines | Severity |
|-----|-----------|--------------|-------|----------|
| #11 | TipTap editor not ready in Dialog context, setTimeout(0) too short | rich-text-editor.tsx | 61 | HIGH |
| #12 | Query invalidation fails, error bubbles up as second toast | page.tsx (updateMutation) | 149-155 | HIGH |

---

## FILES TO MODIFY

**Bug #11 Fix:**
- `context-engineering-intro/frontend/src/components/inbox/rich-text-editor.tsx` (Line 61)
- OR `context-engineering-intro/frontend/src/app/(dashboard)/dashboard/email/templates/page.tsx` (Lines 569-666)

**Bug #12 Fix:**
- `context-engineering-intro/frontend/src/app/(dashboard)/dashboard/email/templates/page.tsx` (Lines 149-155)
- `context-engineering-intro/frontend/src/lib/queries/email-templates.ts` (Lines 40-43)

