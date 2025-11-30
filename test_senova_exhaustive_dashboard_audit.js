const { chromium } = require('playwright');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3004';
const LOGIN_EMAIL = 'admin@evebeautyma.com';
const LOGIN_PASSWORD = 'TestPass123!';
const SCREENSHOT_DIR = 'screenshots/debug-senova-dashboard';
const TIMEOUT = 60000;
const ACTION_TIMEOUT = 30000;

// Color validation
const BANNED_COLORS = {
    purple: ['#8b5cf6', '#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff'],
    green: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#d9f99d', '#ecfccb', '#f7fee7']
};

// Initialize results tracking
const results = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: [],
    colorViolations: [],
    elements: {},
    pages: {}
};

// Helper functions
async function takeScreenshot(page, name) {
    const cleanName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${SCREENSHOT_DIR}/${cleanName}-${Date.now()}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
}

async function checkForErrors(page) {
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    return errors;
}

async function checkForBannedColors(page) {
    const violations = [];
    for (const [colorType, colorList] of Object.entries(BANNED_COLORS)) {
        for (const color of colorList) {
            const elements = await page.locator(`[style*="${color}"]`).all();
            if (elements.length > 0) {
                violations.push({ type: colorType, color, count: elements.length });
            }
        }
    }
    return violations;
}

async function testElement(page, selector, description, action = 'click') {
    results.totalTests++;
    const testResult = {
        element: description,
        selector: selector,
        status: 'FAIL',
        screenshot: null,
        error: null
    };

    try {
        console.log(`Testing: ${description}`);

        // Wait for element
        await page.waitForSelector(selector, { timeout: ACTION_TIMEOUT });

        // Take before screenshot
        const beforeScreenshot = await takeScreenshot(page, `${description}-before`);

        // Perform action
        if (action === 'click') {
            await page.click(selector, { timeout: ACTION_TIMEOUT });
        } else if (action === 'fill') {
            await page.fill(selector, 'Test Input', { timeout: ACTION_TIMEOUT });
        } else if (action === 'select') {
            const options = await page.locator(`${selector} option`).all();
            if (options.length > 1) {
                await page.selectOption(selector, { index: 1 });
            }
        }

        // Small wait for UI response
        await page.waitForTimeout(1000);

        // Take after screenshot
        testResult.screenshot = await takeScreenshot(page, `${description}-after`);

        testResult.status = 'PASS';
        results.passed++;
        console.log(`✅ ${description} - PASS`);

    } catch (error) {
        testResult.status = 'FAIL';
        testResult.error = error.message;
        results.failed++;
        results.errors.push({ element: description, error: error.message });
        console.log(`❌ ${description} - FAIL: ${error.message}`);
    }

    return testResult;
}

async function testPage(page, url, pageName) {
    console.log(`\n=== Testing Page: ${pageName} (${url}) ===`);
    const pageResults = {
        url: url,
        name: pageName,
        elements: [],
        colorViolations: [],
        consoleErrors: []
    };

    try {
        // Navigate to page
        await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await page.waitForTimeout(2000);

        // Take page screenshot
        const screenshot = await takeScreenshot(page, `page-${pageName}`);
        pageResults.screenshot = screenshot;

        // Check for color violations
        pageResults.colorViolations = await checkForBannedColors(page);
        if (pageResults.colorViolations.length > 0) {
            results.colorViolations.push(...pageResults.colorViolations);
        }

        return pageResults;
    } catch (error) {
        console.error(`Failed to test page ${pageName}: ${error.message}`);
        pageResults.error = error.message;
        return pageResults;
    }
}

async function runExhaustiveAudit() {
    console.log('=== SENOVA CRM EXHAUSTIVE DASHBOARD AUDIT ===');
    console.log(`Timestamp: ${results.timestamp}`);
    console.log(`Base URL: ${BASE_URL}`);

    // Create screenshots directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: false,
        slowMo: 100
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Set up console error tracking
    const consoleErrors = await checkForErrors(page);

    try {
        // ========= LOGIN =========
        console.log('\n=== PHASE 1: LOGIN ===');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'login-page');

        // Test login form elements
        await testElement(page, 'input[type="email"], input[name="email"]', 'Login Email Field', 'fill');
        await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);

        await testElement(page, 'input[type="password"], input[name="password"]', 'Login Password Field', 'fill');
        await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);

        await testElement(page, 'button[type="submit"], button:has-text("Sign In")', 'Sign In Button');

        // Wait for dashboard
        await page.waitForURL('**/dashboard', { timeout: TIMEOUT });
        await page.waitForTimeout(3000);

        // ========= MAIN DASHBOARD =========
        console.log('\n=== PHASE 2: MAIN DASHBOARD ===');
        const dashboardResults = await testPage(page, `${BASE_URL}/dashboard`, 'Main Dashboard');

        // Test dashboard elements
        await testElement(page, '[href="/dashboard/inbox"]', 'Inbox Nav Link');
        await page.goto(`${BASE_URL}/dashboard`);

        await testElement(page, '[href="/dashboard/contacts"]', 'Contacts Nav Link');
        await page.goto(`${BASE_URL}/dashboard`);

        await testElement(page, '[href="/dashboard/email/compose"]', 'Compose Email Link');
        await page.goto(`${BASE_URL}/dashboard`);

        // ========= INBOX MODULE =========
        console.log('\n=== PHASE 3: INBOX MODULE ===');
        await page.goto(`${BASE_URL}/dashboard/inbox`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'inbox-main');

        // Test inbox tabs
        const inboxTabs = ['All', 'Unread', 'Read', 'Archived'];
        for (const tab of inboxTabs) {
            await testElement(page, `button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`, `Inbox Tab: ${tab}`);
            await page.waitForTimeout(1000);
            await takeScreenshot(page, `inbox-tab-${tab.toLowerCase()}`);
        }

        // Test inbox actions
        await testElement(page, 'button:has-text("Compose Email")', 'Inbox Compose Button');
        await page.goto(`${BASE_URL}/dashboard/inbox`);

        // Test sort dropdown
        const sortDropdown = await page.locator('select:has(option:has-text("Newest"))').first();
        if (await sortDropdown.isVisible()) {
            await testElement(page, 'select:has(option:has-text("Newest"))', 'Inbox Sort Dropdown', 'select');
        }

        // ========= CONTACTS MODULE =========
        console.log('\n=== PHASE 4: CONTACTS MODULE ===');
        await page.goto(`${BASE_URL}/dashboard/contacts`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'contacts-main');

        // Test search
        await testElement(page, 'input[placeholder*="Search"], input[type="search"]', 'Contacts Search Field', 'fill');

        // Test status filter
        const statusFilter = await page.locator('select:has(option:has-text("All Statuses"))').first();
        if (await statusFilter.isVisible()) {
            await testElement(page, 'select:has(option:has-text("All Statuses"))', 'Status Filter Dropdown', 'select');
        }

        // Test action buttons
        await testElement(page, 'button:has-text("Add Contact")', 'Add Contact Button');
        await page.keyboard.press('Escape'); // Close modal if it opens
        await page.waitForTimeout(500);

        await testElement(page, 'button:has-text("Import Contacts")', 'Import Contacts Button');
        await page.goto(`${BASE_URL}/dashboard/contacts`);

        await testElement(page, 'button:has-text("Export All")', 'Export All Button');

        // Test bulk selection
        const checkbox = await page.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible()) {
            await testElement(page, 'input[type="checkbox"]', 'Bulk Select Checkbox');
        }

        // Click a contact to test detail page
        const contactRow = await page.locator('tr[onclick], tr[role="button"], tbody tr').first();
        if (await contactRow.isVisible()) {
            await contactRow.click();
            await page.waitForTimeout(2000);
            await takeScreenshot(page, 'contact-detail');

            // Test contact detail tabs
            const detailTabs = ['Overview', 'Activity', 'Communications', 'Notes'];
            for (const tab of detailTabs) {
                const tabButton = await page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
                if (await tabButton.isVisible()) {
                    await testElement(page, `button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`, `Contact Tab: ${tab}`);
                    await takeScreenshot(page, `contact-tab-${tab.toLowerCase()}`);
                }
            }

            // Test contact actions
            await testElement(page, 'button:has-text("Save Changes")', 'Save Contact Button');
            await testElement(page, 'button:has-text("Send Email")', 'Send Email Button');
        }

        // ========= EMAIL MODULE =========
        console.log('\n=== PHASE 5: EMAIL MODULE ===');

        // Email Compose
        await page.goto(`${BASE_URL}/dashboard/email/compose`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'email-compose');

        await testElement(page, 'input[placeholder*="To"], input[name="to"]', 'To Field', 'fill');
        await testElement(page, 'button:has-text("CC/BCC")', 'CC/BCC Expander');
        await testElement(page, 'select:has(option:has-text("Select Template"))', 'Template Dropdown', 'select');
        await testElement(page, 'button:has-text("Variables"), button:has-text("Insert Variable")', 'Variables Dropdown');

        // Email Templates
        await page.goto(`${BASE_URL}/dashboard/email/templates`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'email-templates');
        await testElement(page, 'button:has-text("Create Template")', 'Create Template Button');

        // Email Campaigns
        await page.goto(`${BASE_URL}/dashboard/email/campaigns`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'email-campaigns');
        await testElement(page, 'button:has-text("Create Campaign")', 'Create Campaign Button');

        // Autoresponders
        await page.goto(`${BASE_URL}/dashboard/email/autoresponders`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'email-autoresponders');
        await testElement(page, 'button:has-text("Create Autoresponder")', 'Create Autoresponder Button');

        // ========= SETTINGS MODULE =========
        console.log('\n=== PHASE 6: SETTINGS MODULE ===');
        await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: 'networkidle', timeout: TIMEOUT });
        await takeScreenshot(page, 'settings-main');

        // Test settings tabs
        const settingsTabs = ['API Keys', 'Email Config', 'Integrations', 'Profile'];
        for (const tab of settingsTabs) {
            const tabButton = await page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
            if (await tabButton.isVisible()) {
                await testElement(page, `button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`, `Settings Tab: ${tab}`);
                await takeScreenshot(page, `settings-tab-${tab.toLowerCase().replace(' ', '-')}`);
            }
        }

        // Test other settings pages
        const settingsPages = [
            { url: '/dashboard/settings/users', name: 'Users Management' },
            { url: '/dashboard/settings/tags', name: 'Tags Management' },
            { url: '/dashboard/settings/fields', name: 'Field Visibility' },
            { url: '/dashboard/settings/integrations/mailgun', name: 'Mailgun Setup' },
            { url: '/dashboard/settings/integrations/closebot', name: 'Closebot Setup' }
        ];

        for (const settingsPage of settingsPages) {
            await testPage(page, `${BASE_URL}${settingsPage.url}`, settingsPage.name);
        }

        // ========= OTHER PAGES =========
        console.log('\n=== PHASE 7: OTHER PAGES ===');

        const otherPages = [
            { url: '/dashboard/activity-log', name: 'Activity Log' },
            { url: '/dashboard/payments', name: 'Payments' },
            { url: '/dashboard/ai', name: 'AI Tools' },
            { url: '/dashboard/calendar', name: 'Calendar' },
            { url: '/dashboard/objects', name: 'Multi-tenant Objects' }
        ];

        for (const otherPage of otherPages) {
            const pageResult = await testPage(page, `${BASE_URL}${otherPage.url}`, otherPage.name);
            results.pages[otherPage.name] = pageResult;
        }

        // ========= NAVIGATION MENU =========
        console.log('\n=== PHASE 8: NAVIGATION MENU ===');
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });

        // Test all navigation links
        const navLinks = [
            { selector: '[href="/dashboard"]', name: 'Dashboard' },
            { selector: '[href="/dashboard/inbox"]', name: 'Inbox' },
            { selector: '[href="/dashboard/contacts"]', name: 'Contacts' },
            { selector: '[href="/dashboard/email/compose"]', name: 'Compose' },
            { selector: '[href="/dashboard/email/templates"]', name: 'Templates' },
            { selector: '[href="/dashboard/email/campaigns"]', name: 'Campaigns' },
            { selector: '[href="/dashboard/email/autoresponders"]', name: 'Autoresponders' },
            { selector: '[href="/dashboard/activity-log"]', name: 'Activity' },
            { selector: '[href="/dashboard/settings"]', name: 'Settings' },
            { selector: '[href="/dashboard/calendar"]', name: 'Calendar' },
            { selector: '[href="/dashboard/payments"]', name: 'Payments' },
            { selector: '[href="/dashboard/ai"]', name: 'AI Tools' }
        ];

        for (const link of navLinks) {
            await testElement(page, link.selector, `Nav Link: ${link.name}`);
            await page.goto(`${BASE_URL}/dashboard`);
        }

        // ========= MODALS AND POPUPS =========
        console.log('\n=== PHASE 9: MODALS AND POPUPS ===');

        // Test Add Contact Modal
        await page.goto(`${BASE_URL}/dashboard/contacts`);
        const addContactBtn = await page.locator('button:has-text("Add Contact")').first();
        if (await addContactBtn.isVisible()) {
            await addContactBtn.click();
            await page.waitForTimeout(1000);
            await takeScreenshot(page, 'modal-add-contact');

            // Test modal fields
            await testElement(page, 'input[name="firstName"], input[placeholder*="First"]', 'Modal First Name', 'fill');
            await testElement(page, 'input[name="lastName"], input[placeholder*="Last"]', 'Modal Last Name', 'fill');
            await testElement(page, 'input[name="email"], input[type="email"]', 'Modal Email', 'fill');

            // Close modal
            await page.keyboard.press('Escape');
        }

        // ========= DROPDOWNS =========
        console.log('\n=== PHASE 10: ALL DROPDOWNS ===');

        // Find and test all select elements
        await page.goto(`${BASE_URL}/dashboard/contacts`);
        const selects = await page.locator('select').all();
        console.log(`Found ${selects.length} dropdown elements`);

        for (let i = 0; i < selects.length; i++) {
            const select = selects[i];
            if (await select.isVisible()) {
                const options = await select.locator('option').all();
                console.log(`Dropdown ${i + 1} has ${options.length} options`);

                // Click dropdown to open
                await select.click();
                await page.waitForTimeout(500);
                await takeScreenshot(page, `dropdown-${i + 1}-open`);

                // Select each option
                if (options.length > 1) {
                    await select.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                    await takeScreenshot(page, `dropdown-${i + 1}-selected`);
                }
            }
        }

        // ========= FORM FIELDS =========
        console.log('\n=== PHASE 11: ALL FORM FIELDS ===');

        // Test all input fields on settings page
        await page.goto(`${BASE_URL}/dashboard/settings`);
        const inputs = await page.locator('input:not([type="hidden"])').all();
        console.log(`Found ${inputs.length} input fields`);

        for (let i = 0; i < Math.min(inputs.length, 10); i++) { // Test first 10 to avoid too many
            const input = inputs[i];
            if (await input.isVisible()) {
                const type = await input.getAttribute('type');
                const placeholder = await input.getAttribute('placeholder');
                console.log(`Testing input ${i + 1}: type=${type}, placeholder=${placeholder}`);

                if (type === 'checkbox' || type === 'radio') {
                    await input.click();
                    await takeScreenshot(page, `input-${type}-${i + 1}-toggled`);
                } else if (type !== 'submit' && type !== 'button') {
                    await input.fill('Test Value');
                    await takeScreenshot(page, `input-${type}-${i + 1}-filled`);
                    await input.clear();
                }
            }
        }

        // ========= BUTTONS =========
        console.log('\n=== PHASE 12: ALL BUTTONS ===');

        // Find and document all buttons
        await page.goto(`${BASE_URL}/dashboard`);
        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on dashboard`);

        for (let i = 0; i < Math.min(buttons.length, 10); i++) { // Test first 10
            const button = buttons[i];
            if (await button.isVisible()) {
                const text = await button.textContent();
                console.log(`Button ${i + 1}: ${text}`);
                results.elements[`button-${i + 1}`] = { text, status: 'documented' };
            }
        }

    } catch (error) {
        console.error('Critical error during audit:', error);
        results.errors.push({ phase: 'critical', error: error.message });
    } finally {
        // Generate final report
        console.log('\n=== GENERATING FINAL REPORT ===');

        // Calculate pass rate
        const passRate = results.totalTests > 0
            ? ((results.passed / results.totalTests) * 100).toFixed(1)
            : 0;

        results.summary = {
            passRate: `${passRate}%`,
            totalTests: results.totalTests,
            passed: results.passed,
            failed: results.failed,
            colorViolations: results.colorViolations.length,
            consoleErrors: consoleErrors.length
        };

        // Save results
        fs.writeFileSync(
            'DEBUG_REPORT_SENOVA_DASHBOARD_EXHAUSTIVE.json',
            JSON.stringify(results, null, 2)
        );

        // Generate markdown report
        const report = `# EXHAUSTIVE DEBUG REPORT: SENOVA CRM DASHBOARD

**Debug Date:** ${results.timestamp}
**Base URL:** ${BASE_URL}
**Debugger Agent Session:** EXHAUSTIVE-AUDIT-001

---

## SUMMARY
- **Total Elements Tested:** ${results.totalTests}
- **Passed:** ${results.passed}
- **Failed:** ${results.failed}
- **Pass Rate:** ${passRate}%
- **Color Violations:** ${results.colorViolations.length}
- **Console Errors:** ${consoleErrors.length}

---

## COLOR VIOLATIONS
${results.colorViolations.length > 0 ? results.colorViolations.map(v =>
    `- ${v.type.toUpperCase()} color ${v.color} found in ${v.count} elements`
).join('\\n') : '✅ No banned colors detected'}

---

## CRITICAL ISSUES
${results.errors.length > 0 ? results.errors.map(e =>
    `- **${e.element}**: ${e.error}`
).join('\\n') : '✅ No critical errors'}

---

## TESTED PAGES
${Object.entries(results.pages).map(([name, data]) =>
    `### ${name}
- URL: ${data.url}
- Screenshot: ${data.screenshot || 'N/A'}
- Color Violations: ${data.colorViolations?.length || 0}
- Status: ${data.error ? '❌ FAIL' : '✅ PASS'}`
).join('\\n\\n')}

---

## RECOMMENDATIONS
1. ${results.failed > 0 ? `Fix ${results.failed} failing elements` : 'All elements functional'}
2. ${results.colorViolations.length > 0 ? 'Remove all purple/green color violations' : 'Color scheme compliant'}
3. ${consoleErrors.length > 0 ? 'Resolve console errors' : 'No console errors detected'}

---

## SCREENSHOTS
All screenshots saved in: ${SCREENSHOT_DIR}/

**Total Screenshots Captured:** ${fs.readdirSync(SCREENSHOT_DIR).length}
`;

        fs.writeFileSync('DEBUG_REPORT_SENOVA_DASHBOARD_EXHAUSTIVE.md', report);

        console.log('\n=== AUDIT COMPLETE ===');
        console.log(`Pass Rate: ${passRate}%`);
        console.log(`Report saved to: DEBUG_REPORT_SENOVA_DASHBOARD_EXHAUSTIVE.md`);
        console.log(`JSON data saved to: DEBUG_REPORT_SENOVA_DASHBOARD_EXHAUSTIVE.json`);
        console.log(`Screenshots saved to: ${SCREENSHOT_DIR}/`);

        await browser.close();
    }
}

// Run the audit
runExhaustiveAudit().catch(console.error);