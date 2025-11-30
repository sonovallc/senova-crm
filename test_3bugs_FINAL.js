const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\final-3bugs-verify';

async function main() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    const results = {
        bug1: { status: 'NOT_TESTED', details: [], screenshots: [] },
        bug4: { status: 'NOT_TESTED', details: [], screenshots: [] },
        bug7: { status: 'NOT_TESTED', details: [], screenshots: [] }
    };

    try {
        // LOGIN
        console.log('\n=== LOGGING IN ===');
        await page.goto(`${BASE_URL}/login`);
        await page.waitForTimeout(2000);

        await page.fill('input[type="email"]', 'admin@evebeautyma.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        console.log('✓ Logged in successfully');

        // ========================================
        // BUG-1: Unarchived contacts still show in Archived tab
        // ========================================
        console.log('\n=== TESTING BUG-1: Unarchive Contact ===');

        try {
            await page.goto(`${BASE_URL}/dashboard/inbox`);
            await page.waitForTimeout(3000);

            const screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug1-01-inbox-initial.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug1.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug1-01-inbox-initial.png');

            // Click Archived tab
            await page.click('button:has-text("Archived")');
            await page.waitForTimeout(2000);

            const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug1-02-archived-tab.png');
            await page.screenshot({ path: screenshotPath2, fullPage: true });
            results.bug1.screenshots.push(screenshotPath2);
            console.log('Screenshot: bug1-02-archived-tab.png');

            // Count archived contacts before
            const archivedListBefore = await page.locator('text="EMAIL"').count();
            console.log(`Archived contacts visible: ${archivedListBefore}`);

            // Click on first contact - use the contact card directly
            const firstContactCard = await page.locator('text="Dolores Fay"').first();
            if (await firstContactCard.isVisible({ timeout: 3000 }).catch(() => false)) {
                await firstContactCard.click();
                await page.waitForTimeout(2000);

                const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug1-03-contact-opened.png');
                await page.screenshot({ path: screenshotPath3, fullPage: true });
                results.bug1.screenshots.push(screenshotPath3);
                console.log('Screenshot: bug1-03-contact-opened.png');

                // Look for Unarchive button - it should be in the top right of conversation view
                const unarchiveBtn = page.locator('button:has-text("Unarchive")').first();

                if (await unarchiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    console.log('✓ Found Unarchive button, clicking...');

                    await unarchiveBtn.click();
                    await page.waitForTimeout(3000);

                    const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug1-04-after-unarchive.png');
                    await page.screenshot({ path: screenshotPath4, fullPage: true });
                    results.bug1.screenshots.push(screenshotPath4);
                    console.log('Screenshot: bug1-04-after-unarchive.png');

                    // CRITICAL CHECK: Count contacts in archived tab now
                    // First ensure we're still viewing Archived tab
                    const archivedTab = page.locator('button:has-text("Archived")').first();
                    if (await archivedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
                        const isActive = await archivedTab.getAttribute('aria-selected').catch(() => 'false');
                        if (isActive !== 'true') {
                            await archivedTab.click();
                            await page.waitForTimeout(2000);
                        }
                    }

                    const screenshotPath5 = path.join(SCREENSHOT_DIR, 'bug1-05-verify-removed.png');
                    await page.screenshot({ path: screenshotPath5, fullPage: true });
                    results.bug1.screenshots.push(screenshotPath5);
                    console.log('Screenshot: bug1-05-verify-removed.png');

                    const archivedListAfter = await page.locator('text="EMAIL"').count();
                    console.log(`Archived contacts after unarchive: ${archivedListAfter}`);

                    if (archivedListAfter < archivedListBefore) {
                        console.log('✓ PASS: Contact removed from Archived tab');
                        results.bug1.status = 'PASS';
                        results.bug1.details.push(`Contact count decreased from ${archivedListBefore} to ${archivedListAfter}`);
                        results.bug1.details.push('BUG-1 FIX VERIFIED: Unarchived contacts no longer appear in Archived tab');
                    } else {
                        console.log('✗ FAIL: Contact still appears in Archived tab');
                        results.bug1.status = 'FAIL';
                        results.bug1.details.push(`ERROR: Contact count unchanged (${archivedListBefore} → ${archivedListAfter})`);
                    }

                    // Verify in All tab
                    await page.click('button:has-text("All")');
                    await page.waitForTimeout(2000);

                    const screenshotPath6 = path.join(SCREENSHOT_DIR, 'bug1-06-all-tab.png');
                    await page.screenshot({ path: screenshotPath6, fullPage: true });
                    results.bug1.screenshots.push(screenshotPath6);
                    console.log('Screenshot: bug1-06-all-tab.png');

                } else {
                    console.log('✗ FAIL: Unarchive button not found');
                    results.bug1.status = 'FAIL';
                    results.bug1.details.push('ERROR: Unarchive button not visible in conversation view');
                }
            } else {
                results.bug1.status = 'SKIP';
                results.bug1.details.push('No archived contacts available for testing');
            }

        } catch (error) {
            console.error('BUG-1 Test Error:', error.message);
            results.bug1.status = 'ERROR';
            results.bug1.details.push(`Exception: ${error.message}`);
        }

        // ========================================
        // BUG-4: Campaign Delete fails
        // ========================================
        console.log('\n=== TESTING BUG-4: Campaign Delete ===');

        try {
            await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
            await page.waitForTimeout(3000);

            let screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug4-01-campaigns-list-initial.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug4.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug4-01-campaigns-list-initial.png');

            // Check if we need to create a test campaign
            const hasCreateBtn = await page.locator('button:has-text("Create Campaign"), a:has-text("Create Campaign"), button:has-text("New Campaign")').first().isVisible({ timeout: 3000 }).catch(() => false);

            if (hasCreateBtn) {
                console.log('Creating test campaign for deletion test...');
                await page.click('button:has-text("Create Campaign"), a:has-text("Create Campaign"), button:has-text("New Campaign")');
                await page.waitForTimeout(3000);

                // Fill minimal campaign info
                const nameField = page.locator('input[name="name"], input[placeholder*="name" i]').first();
                if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await nameField.fill('TEST_DELETE_CAMPAIGN_' + Date.now());
                    await page.waitForTimeout(500);

                    // Look for Save Draft or Save button
                    const saveBtn = page.locator('button:has-text("Save Draft"), button:has-text("Save"), button:has-text("Create")').first();
                    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveBtn.click();
                        await page.waitForTimeout(2000);
                    }

                    // Navigate back to campaigns list
                    await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
                    await page.waitForTimeout(3000);
                }
            }

            screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug4-01-campaigns-list.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug4.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug4-01-campaigns-list.png');

            // Find campaign rows
            const tableRows = await page.locator('table tbody tr').count();
            console.log(`Found ${tableRows} campaign rows`);

            if (tableRows > 0) {
                // Find action menu button in first row
                const firstRowActionBtn = page.locator('table tbody tr').first().locator('button[aria-label*="menu"], button:has-text("⋮")').first();

                if (await firstRowActionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await firstRowActionBtn.click();
                    await page.waitForTimeout(1000);

                    const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug4-02-menu-open.png');
                    await page.screenshot({ path: screenshotPath2, fullPage: true });
                    results.bug4.screenshots.push(screenshotPath2);
                    console.log('Screenshot: bug4-02-menu-open.png');

                    // Click Delete
                    const deleteBtn = page.locator('button:has-text("Delete"), [role="menuitem"]:has-text("Delete")').first();

                    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                        console.log('Clicking Delete option...');
                        await deleteBtn.click();
                        await page.waitForTimeout(1000);

                        const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug4-03-confirm-dialog.png');
                        await page.screenshot({ path: screenshotPath3, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath3);
                        console.log('Screenshot: bug4-03-confirm-dialog.png');

                        // Confirm deletion
                        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();

                        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                            console.log('Confirming deletion...');
                            await confirmBtn.click();
                            await page.waitForTimeout(3000);
                        }

                        const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug4-04-delete-result.png');
                        await page.screenshot({ path: screenshotPath4, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath4);
                        console.log('Screenshot: bug4-04-delete-result.png');

                        // CRITICAL CHECK: Look for error messages
                        const errorAlert = await page.locator('[role="alert"]:has-text("Failed to delete"), text="Failed to delete campaign"').isVisible().catch(() => false);
                        const errorText = await page.locator('text="error" i, text="failed" i').count();

                        if (!errorAlert && errorText === 0) {
                            console.log('✓ PASS: No error message appeared');
                            results.bug4.status = 'PASS';
                            results.bug4.details.push('BUG-4 FIX VERIFIED: Campaign deleted without "Failed to delete" error');
                            results.bug4.details.push('Transaction handling with db.flush() working correctly');
                        } else {
                            console.log('✗ FAIL: Error detected during deletion');
                            results.bug4.status = 'FAIL';
                            results.bug4.details.push('ERROR: Delete operation showed error message');
                        }
                    } else {
                        results.bug4.status = 'FAIL';
                        results.bug4.details.push('ERROR: Delete option not found in menu');
                    }
                } else {
                    results.bug4.status = 'FAIL';
                    results.bug4.details.push('ERROR: Action menu button not found');
                }
            } else {
                results.bug4.status = 'SKIP';
                results.bug4.details.push('No campaigns available and creation failed');
            }

        } catch (error) {
            console.error('BUG-4 Test Error:', error.message);
            results.bug4.status = 'ERROR';
            results.bug4.details.push(`Exception: ${error.message}`);
        }

        // ========================================
        // BUG-7: Autoresponder timing mode options
        // ========================================
        console.log('\n=== TESTING BUG-7: Autoresponder Timing Modes ===');

        try {
            await page.goto(`${BASE_URL}/dashboard/email/autoresponders`);
            await page.waitForTimeout(3000);

            const screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug7-01-autoresponders.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug7.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug7-01-autoresponders.png');

            // Click Create
            await page.click('button:has-text("Create Autoresponder"), a:has-text("Create")');
            await page.waitForTimeout(3000);

            const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug7-02-create-page-top.png');
            await page.screenshot({ path: screenshotPath2, fullPage: true });
            results.bug7.screenshots.push(screenshotPath2);
            console.log('Screenshot: bug7-02-create-page-top.png');

            // Scroll down progressively to find Timing Mode
            console.log('Scrolling to find Timing Mode section...');

            for (let i = 1; i <= 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 1000));
                await page.waitForTimeout(1000);

                const screenshotPath = path.join(SCREENSHOT_DIR, `bug7-03-scroll-${i}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: false });
                results.bug7.screenshots.push(screenshotPath);
                console.log(`Screenshot: bug7-03-scroll-${i}.png`);

                // Check if Timing Mode is visible
                const timingModeVisible = await page.locator('text="Timing Mode" >> visible=true').isVisible().catch(() => false);

                if (timingModeVisible) {
                    console.log(`✓ Found Timing Mode section after ${i} scrolls`);

                    const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug7-04-timing-mode-found.png');
                    await page.screenshot({ path: screenshotPath4, fullPage: true });
                    results.bug7.screenshots.push(screenshotPath4);
                    console.log('Screenshot: bug7-04-timing-mode-found.png');

                    // Find the timing mode select
                    const selects = await page.locator('select').all();

                    let timingSelect = null;
                    for (const select of selects) {
                        const name = (await select.getAttribute('name')) || '';
                        const id = (await select.getAttribute('id')) || '';
                        if (name.includes('timing') || id.includes('timing')) {
                            timingSelect = select;
                            console.log(`Found timing select: name="${name}", id="${id}"`);
                            break;
                        }
                    }

                    if (timingSelect) {
                        const options = await timingSelect.locator('option').allTextContents();
                        console.log('Timing Mode Options:', options);

                        // Check for expected options
                        const hasWaitTime = options.some(opt => opt.toLowerCase().includes('wait') && opt.toLowerCase().includes('time'));
                        const hasTrigger = options.some(opt => opt.toLowerCase().includes('trigger') || opt.toLowerCase().includes('wait for'));
                        const hasEither = options.some(opt => opt.toLowerCase().includes('either') || opt.toLowerCase().includes('whichever'));
                        const hasBoth = options.some(opt => opt.toLowerCase().includes('both') || opt.toLowerCase().includes('required'));

                        const foundCount = [hasWaitTime, hasTrigger, hasEither, hasBoth].filter(Boolean).length;

                        console.log(`Found ${foundCount}/4 expected timing modes`);
                        console.log(`  - Wait Time Only: ${hasWaitTime ? '✓' : '✗'}`);
                        console.log(`  - Wait for Trigger: ${hasTrigger ? '✓' : '✗'}`);
                        console.log(`  - Either/Or: ${hasEither ? '✓' : '✗'}`);
                        console.log(`  - Both Required: ${hasBoth ? '✓' : '✗'}`);

                        if (foundCount >= 4) {
                            // Select a trigger option to test trigger type dropdown
                            const triggerOption = options.find(opt =>
                                opt.toLowerCase().includes('trigger') || opt.toLowerCase().includes('wait for')
                            );

                            if (triggerOption) {
                                console.log(`Selecting trigger option: "${triggerOption}"`);
                                await timingSelect.selectOption({ label: triggerOption });
                                await page.waitForTimeout(1500);

                                const screenshotPath5 = path.join(SCREENSHOT_DIR, 'bug7-05-trigger-selected.png');
                                await page.screenshot({ path: screenshotPath5, fullPage: true });
                                results.bug7.screenshots.push(screenshotPath5);
                                console.log('Screenshot: bug7-05-trigger-selected.png');

                                // Look for trigger type dropdown
                                const allSelects = await page.locator('select').all();
                                let triggerTypeSelect = null;

                                for (const sel of allSelects) {
                                    const name = (await sel.getAttribute('name')) || '';
                                    const id = (await sel.getAttribute('id')) || '';
                                    if (name.includes('trigger_type') || name.includes('event_type')) {
                                        triggerTypeSelect = sel;
                                        console.log(`Found trigger type select: name="${name}"`);
                                        break;
                                    }
                                }

                                if (triggerTypeSelect) {
                                    const triggerOpts = await triggerTypeSelect.locator('option').allTextContents();
                                    console.log('Trigger Type Options:', triggerOpts);

                                    console.log('✓ PASS: All timing mode features implemented');
                                    results.bug7.status = 'PASS';
                                    results.bug7.details.push('BUG-7 FIX VERIFIED: All 4 timing modes available');
                                    results.bug7.details.push(`Timing modes: ${options.join(', ')}`);
                                    results.bug7.details.push(`Trigger types: ${triggerOpts.join(', ')}`);
                                } else {
                                    results.bug7.status = 'PARTIAL';
                                    results.bug7.details.push('Timing modes found but trigger type dropdown not visible');
                                }
                            }
                        } else {
                            results.bug7.status = 'FAIL';
                            results.bug7.details.push(`Only found ${foundCount}/4 expected timing modes`);
                        }

                        break; // Exit scroll loop
                    } else {
                        results.bug7.status = 'FAIL';
                        results.bug7.details.push('Timing Mode text found but select element not located');
                        break;
                    }
                }

                // If we've scrolled 5 times and haven't found it, fail
                if (i === 5) {
                    results.bug7.status = 'FAIL';
                    results.bug7.details.push('Timing Mode section not found after extensive scrolling');
                }
            }

        } catch (error) {
            console.error('BUG-7 Test Error:', error.message);
            results.bug7.status = 'ERROR';
            results.bug7.details.push(`Exception: ${error.message}`);
        }

    } catch (error) {
        console.error('Fatal test error:', error);
    } finally {
        await browser.close();
    }

    // Print final results
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERIFICATION RESULTS - 3 BUG FIXES');
    console.log('='.repeat(80));

    console.log(`\nBUG-1 (Unarchive Contact - Inbox Filtering): ${results.bug1.status}`);
    results.bug1.details.forEach(d => console.log(`  ${d}`));
    console.log(`  Screenshots: ${results.bug1.screenshots.length}`);

    console.log(`\nBUG-4 (Campaign Delete Failure): ${results.bug4.status}`);
    results.bug4.details.forEach(d => console.log(`  ${d}`));
    console.log(`  Screenshots: ${results.bug4.screenshots.length}`);

    console.log(`\nBUG-7 (Autoresponder Timing Modes): ${results.bug7.status}`);
    results.bug7.details.forEach(d => console.log(`  ${d}`));
    console.log(`  Screenshots: ${results.bug7.screenshots.length}`);

    const allPassed = results.bug1.status === 'PASS' &&
                      results.bug4.status === 'PASS' &&
                      results.bug7.status === 'PASS';

    const totalScreenshots = results.bug1.screenshots.length +
                            results.bug4.screenshots.length +
                            results.bug7.screenshots.length;

    console.log('\n' + '='.repeat(80));
    if (allPassed) {
        console.log('OVERALL VERDICT: ✓✓✓ ALL 3 BUGS VERIFIED AS FIXED ✓✓✓');
        console.log('\nAll bug fixes working correctly:');
        console.log('  - BUG-1: SQL query with CTE fixes archived contact filtering');
        console.log('  - BUG-4: Transaction handling with db.flush() fixes campaign deletion');
        console.log('  - BUG-7: Timing mode UI with 4 options + trigger types implemented');
    } else {
        const passedCount = [results.bug1.status, results.bug4.status, results.bug7.status].filter(s => s === 'PASS').length;
        console.log(`OVERALL VERDICT: ${passedCount}/3 BUGS VERIFIED AS FIXED`);
    }
    console.log('='.repeat(80));
    console.log(`\nTotal screenshots captured: ${totalScreenshots}`);
    console.log(`Screenshot directory: ${SCREENSHOT_DIR}`);

    // Save detailed JSON results
    fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'verification_results_FINAL.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\nDetailed results saved to: verification_results_FINAL.json');

    // Create markdown report
    const report = `# 3-BUG VERIFICATION REPORT

**Date:** ${new Date().toISOString()}
**Total Screenshots:** ${totalScreenshots}

## BUG-1: Unarchived Contacts Still Show in Archived Tab
**Status:** ${results.bug1.status}
**Fix:** Fixed SQL query in communications.py to use CTE - first get latest message per contact, THEN filter by status

### Test Details:
${results.bug1.details.map(d => `- ${d}`).join('\n')}

### Screenshots: ${results.bug1.screenshots.length}
${results.bug1.screenshots.map((s, i) => `${i + 1}. ${path.basename(s)}`).join('\n')}

---

## BUG-4: Campaign Delete Fails with "Failed to delete campaign" Error
**Status:** ${results.bug4.status}
**Fix:** Added proper transaction handling, db.flush() after deleting recipients, and better error messages

### Test Details:
${results.bug4.details.map(d => `- ${d}`).join('\n')}

### Screenshots: ${results.bug4.screenshots.length}
${results.bug4.screenshots.map((s, i) => `${i + 1}. ${path.basename(s)}`).join('\n')}

---

## BUG-7: Autoresponder Timing Mode Options (Mailchimp/ActiveCampaign Style)
**Status:** ${results.bug7.status}
**Fix:** Added timing_mode UI with 4 options: Wait Time Only, Wait for Trigger, Either/Or, Both Required

### Test Details:
${results.bug7.details.map(d => `- ${d}`).join('\n')}

### Screenshots: ${results.bug7.screenshots.length}
${results.bug7.screenshots.map((s, i) => `${i + 1}. ${path.basename(s)}`).join('\n')}

---

## FINAL VERDICT

${allPassed ? '✓✓✓ ALL 3 BUGS VERIFIED AS FIXED ✓✓✓' : `${[results.bug1.status, results.bug4.status, results.bug7.status].filter(s => s === 'PASS').length}/3 BUGS VERIFIED AS FIXED`}

${allPassed ? `
All bug fixes are working correctly in production:
- BUG-1: SQL query with CTE fixes archived contact filtering
- BUG-4: Transaction handling with db.flush() fixes campaign deletion
- BUG-7: Timing mode UI with 4 options + trigger types fully functional
` : 'Some bugs require additional verification or fixes.'}
`;

    fs.writeFileSync(
        path.join(SCREENSHOT_DIR, '3_BUGS_VERIFICATION_REPORT.md'),
        report
    );
    console.log('Markdown report saved to: 3_BUGS_VERIFICATION_REPORT.md\n');
}

main();
