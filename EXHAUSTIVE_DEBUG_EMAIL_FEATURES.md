# EXHAUSTIVE DEBUG REPORT: EMAIL FEATURES

**Debug Date:** 2025-11-25T05:46:53.709Z
**Debugger Agent Session:** EXHAUSTIVE-EMAIL-DEBUG
**System Schema Version:** 1.0

---

## SUMMARY
- **Total Elements Tested:** 37
- **Passed:** 19
- **Failed:** 18
- **Pass Rate:** 51.4%

---

## DETAILED TEST RESULTS

### Email Composer

| Element | Status | Details | Timestamp |
|---------|--------|---------|----------|
| To field - Contact dropdown | ❌ FAIL | No contacts found in dropdown | 2025-11-25T05:37:46.038Z |
| Subject field | ✅ PASS | - | 2025-11-25T05:37:49.133Z |
| Rich Text - Bold button | ✅ PASS | - | 2025-11-25T05:37:50.053Z |
| Rich Text - Italic button | ✅ PASS | - | 2025-11-25T05:37:51.163Z |
| Rich Text - Underline button | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button[title*="Underline" i], button:has-text("U"), [data-testid="underline"]').first()[22m
[2m    - locator resolved to <button class="inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full justify-start">…</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <html lang="en">…</html> intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <html lang="en">…</html> intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    56 × waiting for element to be visible, enabled and stable[22m
[2m       - element is visible, enabled and stable[22m
[2m       - scrolling into view if needed[22m
[2m       - done scrolling[22m
[2m       - <html lang="en">…</html> intercepts pointer events[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m
 | 2025-11-25T05:38:21.426Z |
| Rich Text - Bullet List button | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button[title*="Bullet" i], button[title*="Unordered" i], [data-testid="bullet-list"]').first()[22m
 | 2025-11-25T05:38:51.679Z |
| Rich Text - Numbered List button | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button[title*="Numbered" i], button[title*="Ordered" i], [data-testid="numbered-list"]').first()[22m
 | 2025-11-25T05:39:21.858Z |
| Rich Text - Link button | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button[title*="Link" i], [data-testid="link"]').first()[22m
 | 2025-11-25T05:39:52.028Z |
| Variables dropdown | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button:has-text("Variable"), button:has-text("Insert"), [data-testid="variables-dropdown"]').first()[22m
 | 2025-11-25T05:40:22.039Z |
| Modal - Subject field | ✅ PASS | - | 2025-11-25T05:41:10.782Z |
| Wizard Step 1 - Subject field | ❌ FAIL | locator.fill: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('input[placeholder*="subject" i], #campaign-subject, [data-testid="campaign-subject"]').first()[22m
 | 2025-11-25T05:42:52.982Z |

### Email Templates

| Element | Status | Details | Timestamp |
|---------|--------|---------|----------|
| Modal - Name field | ✅ PASS | - | 2025-11-25T05:41:09.903Z |
| Modal - Cancel button | ✅ PASS | - | 2025-11-25T05:41:11.741Z |

### Email Campaigns

| Element | Status | Details | Timestamp |
|---------|--------|---------|----------|
| Create Campaign button | ✅ PASS | Wizard opened | 2025-11-25T05:41:52.957Z |
| Wizard Step 1 - Name field | ❌ FAIL | locator.fill: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('input[placeholder*="name" i], #campaign-name, [data-testid="campaign-name"]').first()[22m
 | 2025-11-25T05:42:22.969Z |

### Autoresponders

| Element | Status | Details | Timestamp |
|---------|--------|---------|----------|
| Create Autoresponder button | ✅ PASS | - | 2025-11-25T05:43:38.780Z |

### Unified Inbox

| Element | Status | Details | Timestamp |
|---------|--------|---------|----------|
| Filter Tab - All | ✅ PASS | - | 2025-11-25T05:45:19.552Z |
| Filter Tab - Unread | ✅ PASS | - | 2025-11-25T05:45:20.907Z |
| Filter Tab - Read | ✅ PASS | - | 2025-11-25T05:45:22.258Z |
| Filter Tab - Archived | ✅ PASS | - | 2025-11-25T05:45:23.668Z |
| Click conversation | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid*="conversation-"], .conversation-item, .inbox-item').first()[22m
 | 2025-11-25T05:46:23.693Z |

### Other

| Element | Status | Details | Timestamp |
|---------|--------|---------|----------|
| Login | ✅ PASS | Successfully logged in | 2025-11-25T05:37:39.781Z |
| Manual email entry | ❌ FAIL | Email chip did not appear | 2025-11-25T05:37:46.861Z |
| CC field toggle | ✅ PASS | - | 2025-11-25T05:37:47.615Z |
| BCC field toggle | ✅ PASS | - | 2025-11-25T05:37:48.407Z |
| Send button | ✅ PASS | Button exists and is visible | 2025-11-25T05:40:22.392Z |
| View toggle | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button[title*="Grid" i], button[title*="List" i], [data-testid="view-toggle"]').first()[22m
 | 2025-11-25T05:41:04.887Z |
| Search bar | ✅ PASS | - | 2025-11-25T05:41:06.210Z |
| Create Template button | ✅ PASS | Modal opened | 2025-11-25T05:41:08.964Z |
| Click existing template | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid*="template-"], .template-card, .template-item').first()[22m
 | 2025-11-25T05:41:41.749Z |
| Search bar | ✅ PASS | - | 2025-11-25T05:41:51.450Z |
| Click existing campaign | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid*="campaign-"], .campaign-card, .campaign-item').first()[22m
 | 2025-11-25T05:43:26.233Z |
| Form - Name field | ❌ FAIL | locator.fill: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('input[placeholder*="name" i], #autoresponder-name, [data-testid="autoresponder-name"]').first()[22m
 | 2025-11-25T05:44:08.795Z |
| Status toggle | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('input[type="checkbox"]:near(:text("Active")), [data-testid="status-toggle"]').first()[22m
 | 2025-11-25T05:44:39.201Z |
| Click existing autoresponder | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid*="autoresponder-"], .autoresponder-card, .autoresponder-item').first()[22m
 | 2025-11-25T05:45:12.612Z |
| Search bar | ❌ FAIL | locator.fill: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('input[placeholder*="Search" i], input[type="search"], [data-testid="search"]').first()[22m
 | 2025-11-25T05:45:53.678Z |
| Refresh button | ❌ FAIL | locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button:has-text("Refresh"), button[title*="Refresh"], [data-testid="refresh-button"]').first()[22m
 | 2025-11-25T05:46:53.708Z |

---

## BUGS DISCOVERED

| Bug ID | Severity | Description | Screenshot | Timestamp |
|--------|----------|-------------|------------|----------|
| BUG-001 | HIGH | Variables dropdown error: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button:has-text("Variable"), button:has-text("Insert"), [data-testid="variables-dropdown"]').first()[22m
 | - | 2025-11-25T05:40:22.040Z |

---

## CONSOLE ERRORS

1. [error] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/login" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="page" pagePath="/src/(auth...">
          <SegmentTrieNode>
          <ClientPageRoot Component={function LoginPage} searchParams={{}} params={{}}>
            <LoginPage params={Promise} searchParams={Promise}>
              <div className="flex min-h...">
                <LinkComponent>
                <_c className="w-full max...">
                  <div ref={null} className="rounded-lg...">
                    <_c2>
                    <_c8>
                      <div ref={null} className="p-6 pt-0">
                        <form suppressHydrationWarning={true} onSubmit={function} className="space-y-4">
                          <div className="space-y-2">
                            <_c>
                            <_c id="email" type="email" placeholder="name@examp..." name="email" ...>
                              <input
                                type="email"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 tex..."
                                ref={function ref}
                                id="email"
                                placeholder="name@example.com"
                                name="email"
                                onChange={function onChange}
                                onBlur={function onChange}
                                disabled={false}
-                               style={{caret-color:"transparent"}}
                              >
                          <div className="space-y-2">
                            <_c>
                            <_c id="password" type="password" placeholder="••••••••" name="password" ...>
                              <input
                                type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 tex..."
                                ref={function ref}
                                id="password"
                                placeholder="••••••••"
                                name="password"
                                onChange={function onChange}
                                onBlur={function onChange}
                                disabled={false}
-                               style={{caret-color:"transparent"}}
                              >
                          ...
                    ...
        ...
      ...

2. [PAGE ERROR] Cannot read properties of undefined (reading 'map')

---

## SCHEMA UPDATES MADE

- Created initial system schema: system-schema-eve-crm-email.md
- Documented all tested elements across 5 email feature pages
- Captured 37 element interactions with screenshots

---

## RECOMMENDATIONS

1. **18 failed tests require immediate attention**
2. Review all FAIL status elements in detailed results
3. Fix critical bugs before production deployment

---

**Status:** ❌ NOT PRODUCTION READY
