const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    const results = [];
    const screenshots = [];

    try {
        // Login
        console.log('=== LOGGING IN ===');
        await page.goto('http://localhost:3004/login', { timeout: 90000 });
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
        await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
        await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 30000 });
        console.log('Login successful');

        // TEST 1: BUG-L - Settings Fields Create Button
        console.log('\n=== TEST BUG-L: Settings Fields ===');
        await page.goto('http://localhost:3004/dashboard/settings/fields', { timeout: 90000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/bug-L-fields-page.png', fullPage: true });
        const createFieldBtn = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New Field"), a:has-text("Create"), a:has-text("Add")');
        results.push({ bug: 'BUG-L', status: createFieldBtn ? 'PASS' : 'FAIL', detail: createFieldBtn ? 'Create button found' : 'No create button found' });
        console.log('BUG-L:', createFieldBtn ? 'PASS - Create button exists' : 'FAIL - No create button');

        // TEST 2: BUG-M - Feature Flags visibility
        console.log('\n=== TEST BUG-M: Feature Flags ===');
        await page.goto('http://localhost:3004/dashboard/settings', { timeout: 90000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/bug-M-settings-sidebar.png', fullPage: true });
        const featureFlagsLink = await page.$('a:has-text("Feature Flags"), [href*="feature-flags"]');
        results.push({ bug: 'BUG-M', status: 'CHECK', detail: featureFlagsLink ? 'Feature Flags link VISIBLE (admin is owner?)' : 'Feature Flags link NOT visible (correctly hidden)' });
        console.log('BUG-M:', featureFlagsLink ? 'Feature Flags link visible (check if admin is owner role)' : 'Feature Flags link hidden (PASS if non-owner)');

        // TEST 3: BUG-E,F,G - Campaigns Edit/Duplicate/Delete
        console.log('\n=== TEST BUG-E,F,G: Campaigns ===');
        await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 90000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/bug-EFG-campaigns-list.png', fullPage: true });

        // Check if there are any campaigns
        const campaignRows = await page.$$('table tbody tr, [class*="campaign"], [class*="card"]');
        console.log('Found', campaignRows.length, 'campaign rows/cards');

        // Try to create a campaign if none exist
        if (campaignRows.length < 2) {
            console.log('No campaigns found, trying to create one...');
            const createBtn = await page.$('button:has-text("Create"), button:has-text("New"), a:has-text("Create"), a:has-text("New")');
            if (createBtn) {
                await createBtn.click();
                await page.waitForTimeout(3000);
                await page.screenshot({ path: 'screenshots/bug-EFG-create-campaign.png', fullPage: true });
            }
        }

        // Look for Edit button on first campaign
        const editBtn = await page.$('button:has-text("Edit"), a:has-text("Edit"), [title="Edit"], svg[class*="edit"]');
        if (editBtn) {
            console.log('Found Edit button, clicking...');
            await editBtn.click();
            await page.waitForTimeout(3000);
            const url = page.url();
            await page.screenshot({ path: 'screenshots/bug-E-edit-result.png', fullPage: true });
            const is404 = url.includes('404') || await page.$('text=404, text=Not Found');
            results.push({ bug: 'BUG-E', status: is404 ? 'FAIL' : 'PASS', detail: is404 ? 'Edit opens 404' : 'Edit opens correctly at ' + url });
            console.log('BUG-E:', is404 ? 'FAIL - Opens 404' : 'PASS - Opens edit form');
            await page.goBack();
            await page.waitForTimeout(2000);
        } else {
            results.push({ bug: 'BUG-E', status: 'SKIP', detail: 'No edit button found (no campaigns?)' });
        }

        // Look for Duplicate button
        const dupBtn = await page.$('button:has-text("Duplicate"), button:has-text("Copy"), [title="Duplicate"], svg[class*="copy"]');
        if (dupBtn) {
            console.log('Found Duplicate button, clicking...');
            await dupBtn.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'screenshots/bug-F-duplicate-result.png', fullPage: true });
            results.push({ bug: 'BUG-F', status: 'PASS', detail: 'Duplicate button clicked without error' });
            console.log('BUG-F: PASS - Duplicate executed');
        } else {
            results.push({ bug: 'BUG-F', status: 'SKIP', detail: 'No duplicate button found' });
        }

        // Look for Delete button
        const delBtn = await page.$('button:has-text("Delete"), [title="Delete"], svg[class*="trash"]');
        if (delBtn) {
            console.log('Found Delete button');
            results.push({ bug: 'BUG-G', status: 'CHECK', detail: 'Delete button exists' });
            console.log('BUG-G: CHECK - Delete button found');
        } else {
            results.push({ bug: 'BUG-G', status: 'SKIP', detail: 'No delete button found' });
        }

        // TEST 4: BUG-B - Inbox Unread Status
        console.log('\n=== TEST BUG-B: Inbox Unread ===');
        await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/bug-B-inbox-initial.png', fullPage: true });

        // Look for unread indicator
        const unreadIndicator = await page.$('[class*="unread"], .font-bold, .bg-blue, [class*="dot"]');
        const firstThread = await page.$('table tbody tr, [class*="thread"], [class*="conversation"]');
        if (firstThread) {
            console.log('Clicking first thread...');
            await firstThread.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'screenshots/bug-B-thread-opened.png', fullPage: true });
            results.push({ bug: 'BUG-B', status: 'CHECK', detail: 'Thread opened - manual check if unread indicator changed' });
        } else {
            results.push({ bug: 'BUG-B', status: 'SKIP', detail: 'No threads found in inbox' });
        }

        // TEST 5: BUG-C - Compose Template Selection
        console.log('\n=== TEST BUG-C: Compose Template ===');
        await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
        await page.waitForTimeout(2000);

        const composeBtn = await page.$('button:has-text("Compose"), button:has-text("New"), a:has-text("Compose"), a:has-text("New Email")');
        if (composeBtn) {
            console.log('Found Compose button, clicking...');
            await composeBtn.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'screenshots/bug-C-compose-modal.png', fullPage: true });

            // Look for template selector
            const templateSelector = await page.$('select:has-text("Template"), [class*="template"], button:has-text("Template")');
            if (templateSelector) {
                console.log('Found template selector, clicking...');
                await templateSelector.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'screenshots/bug-C-template-dropdown.png', fullPage: true });
                const url = page.url();
                const isError = url.includes('404') || url.includes('error') || await page.$('text=404, text=Error');
                results.push({ bug: 'BUG-C', status: isError ? 'FAIL' : 'PASS', detail: isError ? 'Template navigates to error' : 'Template selector works' });
            } else {
                results.push({ bug: 'BUG-C', status: 'CHECK', detail: 'No template selector found in compose' });
            }
        } else {
            results.push({ bug: 'BUG-C', status: 'SKIP', detail: 'No compose button found' });
        }

        // Print summary
        console.log('\n========== RESULTS SUMMARY ==========');
        results.forEach(r => console.log(r.bug + ':', r.status, '-', r.detail));
        console.log('======================================');

    } catch (error) {
        console.error('ERROR:', error.message);
        await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();
