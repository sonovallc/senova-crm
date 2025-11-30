const { chromium } = require('playwright');
const path = require('path');

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
            // Navigate to Inbox
            await page.goto(`${BASE_URL}/dashboard/inbox`);
            await page.waitForTimeout(3000);

            const screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug1-01-inbox-initial.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug1.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug1-01-inbox-initial.png');

            // Look for tabs - try multiple selectors
            const tabs = await page.locator('[role="tab"], button:has-text("Archived"), a:has-text("Archived")').all();
            console.log(`Found ${tabs.length} tab elements`);

            let archivedTab = null;
            for (const tab of tabs) {
                const text = await tab.textContent();
                if (text.includes('Archived')) {
                    archivedTab = tab;
                    break;
                }
            }

            if (archivedTab) {
                await archivedTab.click();
                await page.waitForTimeout(2000);

                const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug1-02-archived-tab.png');
                await page.screenshot({ path: screenshotPath2, fullPage: true });
                results.bug1.screenshots.push(screenshotPath2);
                console.log('Screenshot: bug1-02-archived-tab.png');

                // Look for any visible contact elements using broader selectors
                const pageContent = await page.content();
                console.log('Searching for contacts in page content...');

                // Try to find contacts by looking for email patterns
                const emailPattern = /@/;
                const allElements = await page.locator('div, li, tr').all();
                let contactElements = [];

                for (const elem of allElements.slice(0, 50)) { // Check first 50 elements
                    const text = await elem.textContent().catch(() => '');
                    if (emailPattern.test(text) && text.length < 200) {
                        contactElements.push(elem);
                    }
                }

                console.log(`Found ${contactElements.length} potential contact elements`);

                if (contactElements.length > 0) {
                    // Click first contact
                    await contactElements[0].click();
                    await page.waitForTimeout(2000);

                    const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug1-03-select-contact.png');
                    await page.screenshot({ path: screenshotPath3, fullPage: true });
                    results.bug1.screenshots.push(screenshotPath3);
                    console.log('Screenshot: bug1-03-select-contact.png');

                    // Look for Unarchive button - try multiple variations
                    const unarchiveSelectors = [
                        'button:has-text("Unarchive")',
                        '[role="button"]:has-text("Unarchive")',
                        'button:has-text("unarchive")',
                        'a:has-text("Unarchive")'
                    ];

                    let unarchiveBtn = null;
                    for (const selector of unarchiveSelectors) {
                        const btn = page.locator(selector).first();
                        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
                            unarchiveBtn = btn;
                            break;
                        }
                    }

                    if (unarchiveBtn) {
                        console.log('Found Unarchive button, clicking...');

                        const contactText = await contactElements[0].textContent();
                        await unarchiveBtn.click();
                        await page.waitForTimeout(2000);

                        const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug1-04-click-unarchive.png');
                        await page.screenshot({ path: screenshotPath4, fullPage: true });
                        results.bug1.screenshots.push(screenshotPath4);
                        console.log('Screenshot: bug1-04-click-unarchive.png');

                        // Wait for update
                        await page.waitForTimeout(2000);

                        // CRITICAL CHECK: Is the contact still in archived view?
                        const pageAfter = await page.content();
                        const contactStillPresent = pageAfter.includes(contactText.substring(0, 20));

                        const screenshotPath5 = path.join(SCREENSHOT_DIR, 'bug1-05-verify-removed.png');
                        await page.screenshot({ path: screenshotPath5, fullPage: true });
                        results.bug1.screenshots.push(screenshotPath5);
                        console.log('Screenshot: bug1-05-verify-removed.png');

                        if (!contactStillPresent) {
                            console.log('✓ PASS: Contact removed from Archived tab');
                            results.bug1.status = 'PASS';
                            results.bug1.details.push('Contact successfully removed from Archived tab after unarchiving');
                        } else {
                            console.log('✗ FAIL: Contact still visible in Archived tab');
                            results.bug1.status = 'FAIL';
                            results.bug1.details.push('ERROR: Contact still appears in Archived tab after unarchiving');
                        }

                        // Switch to All tab
                        const allTabs = await page.locator('[role="tab"], button, a').all();
                        let allTab = null;
                        for (const tab of allTabs) {
                            const text = await tab.textContent();
                            if (text.includes('All')) {
                                allTab = tab;
                                break;
                            }
                        }

                        if (allTab) {
                            await allTab.click();
                            await page.waitForTimeout(2000);

                            const screenshotPath6 = path.join(SCREENSHOT_DIR, 'bug1-06-all-tab.png');
                            await page.screenshot({ path: screenshotPath6, fullPage: true });
                            results.bug1.screenshots.push(screenshotPath6);
                            console.log('Screenshot: bug1-06-all-tab.png');

                            results.bug1.details.push('Checked All tab view');
                        }
                    } else {
                        console.log('✗ Unarchive button not found');
                        results.bug1.status = 'FAIL';
                        results.bug1.details.push('ERROR: Unarchive button not found in UI');
                    }
                } else {
                    console.log('⚠ No archived contacts found to test');
                    results.bug1.status = 'SKIP';
                    results.bug1.details.push('No archived contacts available for testing - need to create test data');
                }
            } else {
                console.log('✗ Archived tab not found');
                results.bug1.status = 'FAIL';
                results.bug1.details.push('ERROR: Archived tab not found in Inbox');
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

            const screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug4-01-campaigns-list.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug4.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug4-01-campaigns-list.png');

            // Look for campaign rows - check table structure
            const tableRows = await page.locator('table tr, tbody tr').all();
            console.log(`Found ${tableRows.length} table rows`);

            // Filter out header rows
            let campaignRows = [];
            for (const row of tableRows) {
                const text = await row.textContent();
                if (text && !text.includes('Campaign Name') && text.length > 10) {
                    campaignRows.push(row);
                }
            }

            console.log(`Found ${campaignRows.length} potential campaign rows`);

            if (campaignRows.length > 0) {
                // Look for action buttons in first campaign row
                const firstRow = campaignRows[0];
                const actionBtns = await firstRow.locator('button').all();

                console.log(`Found ${actionBtns.length} buttons in first campaign row`);

                let menuBtn = null;
                for (const btn of actionBtns) {
                    const text = await btn.textContent();
                    const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
                    if (text.includes('⋮') || text.includes('•') || ariaLabel.includes('menu') || ariaLabel.includes('action')) {
                        menuBtn = btn;
                        break;
                    }
                }

                if (menuBtn) {
                    await menuBtn.click();
                    await page.waitForTimeout(1000);

                    const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug4-02-menu-open.png');
                    await page.screenshot({ path: screenshotPath2, fullPage: true });
                    results.bug4.screenshots.push(screenshotPath2);
                    console.log('Screenshot: bug4-02-menu-open.png');

                    // Look for Delete in menu
                    const deleteBtn = page.locator('button:has-text("Delete"), [role="menuitem"]:has-text("Delete"), a:has-text("Delete")').first();

                    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                        console.log('Found Delete option, clicking...');

                        await deleteBtn.click();
                        await page.waitForTimeout(1000);

                        const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug4-03-confirm-dialog.png');
                        await page.screenshot({ path: screenshotPath3, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath3);
                        console.log('Screenshot: bug4-03-confirm-dialog.png');

                        // Look for confirmation
                        const confirmSelectors = [
                            'button:has-text("Confirm")',
                            'button:has-text("Delete")',
                            'button:has-text("Yes")',
                            'button:has-text("OK")'
                        ];

                        let confirmBtn = null;
                        for (const selector of confirmSelectors) {
                            const btn = page.locator(selector).first();
                            if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
                                confirmBtn = btn;
                                break;
                            }
                        }

                        if (confirmBtn) {
                            console.log('Confirming delete...');
                            await confirmBtn.click();
                            await page.waitForTimeout(2000);
                        }

                        const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug4-04-delete-result.png');
                        await page.screenshot({ path: screenshotPath4, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath4);
                        console.log('Screenshot: bug4-04-delete-result.png');

                        // CRITICAL CHECK: Look for errors
                        const pageContent = await page.content();
                        const hasError = pageContent.toLowerCase().includes('failed to delete') ||
                                       pageContent.toLowerCase().includes('error');

                        const errorElements = await page.locator('[role="alert"], .error, .alert-error, .alert-danger').all();

                        if (!hasError && errorElements.length === 0) {
                            console.log('✓ PASS: No error message appeared');
                            results.bug4.status = 'PASS';
                            results.bug4.details.push('Campaign deleted successfully without errors');
                        } else {
                            console.log('✗ FAIL: Error detected');
                            results.bug4.status = 'FAIL';
                            results.bug4.details.push('ERROR: Delete operation showed error message');
                        }
                    } else {
                        console.log('✗ Delete option not visible');
                        results.bug4.status = 'FAIL';
                        results.bug4.details.push('ERROR: Delete option not found in menu');
                    }
                } else {
                    console.log('✗ No action menu button found');
                    results.bug4.status = 'FAIL';
                    results.bug4.details.push('ERROR: Action menu button not found');
                }
            } else {
                console.log('⚠ No campaigns found');
                results.bug4.status = 'SKIP';
                results.bug4.details.push('No campaigns available for testing - need to create test data');
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

            // Look for create button
            const createBtnSelectors = [
                'button:has-text("Create")',
                'button:has-text("New")',
                'a:has-text("Create")',
                'a:has-text("New Autoresponder")'
            ];

            let createBtn = null;
            for (const selector of createBtnSelectors) {
                const btn = page.locator(selector).first();
                if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    createBtn = btn;
                    break;
                }
            }

            if (createBtn) {
                console.log('Found Create button, clicking...');
                await createBtn.click();
                await page.waitForTimeout(3000);

                const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug7-02-create-page.png');
                await page.screenshot({ path: screenshotPath2, fullPage: true });
                results.bug7.screenshots.push(screenshotPath2);
                console.log('Screenshot: bug7-02-create-page.png');

                // Look for Timing Mode elements
                const pageContent = await page.content();
                const hasTimingMode = pageContent.includes('Timing Mode') || pageContent.includes('timing_mode');

                if (hasTimingMode) {
                    console.log('Found "Timing Mode" text on page');

                    // Find select elements
                    const selects = await page.locator('select').all();
                    console.log(`Found ${selects.length} select elements on page`);

                    let timingSelect = null;
                    for (const select of selects) {
                        const name = await select.getAttribute('name').catch(() => '');
                        const id = await select.getAttribute('id').catch(() => '');
                        if (name.includes('timing') || id.includes('timing')) {
                            timingSelect = select;
                            break;
                        }
                    }

                    if (timingSelect) {
                        console.log('Found timing mode select element');

                        const options = await timingSelect.locator('option').allTextContents();
                        console.log('Available options:', options);

                        const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug7-03-timing-options.png');
                        await page.screenshot({ path: screenshotPath3, fullPage: true });
                        results.bug7.screenshots.push(screenshotPath3);
                        console.log('Screenshot: bug7-03-timing-options.png');

                        // Check for expected options
                        const expectedTerms = ['wait time', 'wait for trigger', 'either', 'both'];
                        const foundOptions = expectedTerms.filter(term =>
                            options.some(opt => opt.toLowerCase().includes(term))
                        );

                        console.log(`Found ${foundOptions.length}/4 expected timing mode types`);

                        if (foundOptions.length >= 3) {
                            // Try to select "Wait for Trigger" option
                            const triggerOption = options.find(opt =>
                                opt.toLowerCase().includes('trigger') || opt.toLowerCase().includes('wait for')
                            );

                            if (triggerOption) {
                                await timingSelect.selectOption({ label: triggerOption });
                                await page.waitForTimeout(1000);

                                const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug7-04-after-select.png');
                                await page.screenshot({ path: screenshotPath4, fullPage: true });
                                results.bug7.screenshots.push(screenshotPath4);
                                console.log('Screenshot: bug7-04-after-select.png');

                                // Look for trigger type selector
                                const allSelects = await page.locator('select').all();
                                let triggerTypeSelect = null;

                                for (const select of allSelects) {
                                    const name = await select.getAttribute('name').catch(() => '');
                                    const id = await select.getAttribute('id').catch(() => '');
                                    if (name.includes('trigger_type') || id.includes('trigger')) {
                                        triggerTypeSelect = select;
                                        break;
                                    }
                                }

                                if (triggerTypeSelect) {
                                    const triggerOptions = await triggerTypeSelect.locator('option').allTextContents();
                                    console.log('Trigger type options:', triggerOptions);

                                    const expectedTriggers = ['opened', 'clicked', 'replied', 'tag', 'status'];
                                    const foundTriggers = expectedTriggers.filter(trigger =>
                                        triggerOptions.some(opt => opt.toLowerCase().includes(trigger))
                                    );

                                    console.log(`Found ${foundTriggers.length} trigger type options`);

                                    if (foundTriggers.length >= 2) {
                                        console.log('✓ PASS: Timing modes and triggers working');
                                        results.bug7.status = 'PASS';
                                        results.bug7.details.push(`Found timing modes: ${foundOptions.join(', ')}`);
                                        results.bug7.details.push(`Found ${foundTriggers.length} trigger types`);
                                    } else {
                                        results.bug7.status = 'PARTIAL';
                                        results.bug7.details.push('Timing modes found but insufficient trigger options');
                                    }
                                } else {
                                    results.bug7.status = 'PARTIAL';
                                    results.bug7.details.push('Timing modes found but trigger type selector not found');
                                }
                            }
                        } else {
                            console.log('✗ FAIL: Insufficient timing options');
                            results.bug7.status = 'FAIL';
                            results.bug7.details.push(`Only found ${foundOptions.length} timing mode options`);
                        }
                    } else {
                        console.log('✗ Timing mode select not found');
                        results.bug7.status = 'FAIL';
                        results.bug7.details.push('ERROR: Could not locate timing mode select element');
                    }
                } else {
                    console.log('✗ No "Timing Mode" text found on page');
                    results.bug7.status = 'FAIL';
                    results.bug7.details.push('ERROR: Timing Mode section not found on autoresponder page');
                }
            } else {
                console.log('✗ Create button not found');
                results.bug7.status = 'FAIL';
                results.bug7.details.push('ERROR: Create/New button not found on autoresponders page');
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

    // Print results
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERIFICATION RESULTS');
    console.log('='.repeat(80));

    console.log(`\nBUG-1 (Unarchive Contact): ${results.bug1.status}`);
    results.bug1.details.forEach(d => console.log(`  - ${d}`));
    console.log(`  Screenshots: ${results.bug1.screenshots.length}`);

    console.log(`\nBUG-4 (Campaign Delete): ${results.bug4.status}`);
    results.bug4.details.forEach(d => console.log(`  - ${d}`));
    console.log(`  Screenshots: ${results.bug4.screenshots.length}`);

    console.log(`\nBUG-7 (Timing Modes): ${results.bug7.status}`);
    results.bug7.details.forEach(d => console.log(`  - ${d}`));
    console.log(`  Screenshots: ${results.bug7.screenshots.length}`);

    const allPassed = results.bug1.status === 'PASS' &&
                      results.bug4.status === 'PASS' &&
                      results.bug7.status === 'PASS';

    const anyFailed = results.bug1.status === 'FAIL' ||
                     results.bug4.status === 'FAIL' ||
                     results.bug7.status === 'FAIL';

    console.log('\n' + '='.repeat(80));
    if (allPassed) {
        console.log('OVERALL VERDICT: ✓ ALL 3 BUGS VERIFIED AS FIXED');
    } else if (anyFailed) {
        console.log('OVERALL VERDICT: ✗ SOME BUGS STILL FAILING');
    } else {
        console.log('OVERALL VERDICT: ⚠ INSUFFICIENT TEST DATA - NEED TO CREATE TEST SCENARIOS');
    }
    console.log('='.repeat(80));

    // Save results
    const fs = require('fs');
    fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'verification_results.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\nDetailed results saved to: verification_results.json');
}

main();
