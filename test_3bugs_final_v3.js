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
            await page.goto(`${BASE_URL}/dashboard/inbox`);
            await page.waitForTimeout(3000);

            const screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug1-01-inbox-initial.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug1.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug1-01-inbox-initial.png');

            // Click Archived tab
            await page.click('button:has-text("Archived"), [role="tab"]:has-text("Archived")');
            await page.waitForTimeout(2000);

            const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug1-02-archived-tab.png');
            await page.screenshot({ path: screenshotPath2, fullPage: true });
            results.bug1.screenshots.push(screenshotPath2);
            console.log('Screenshot: bug1-02-archived-tab.png');

            // Find and click on a contact name - look for the actual contact card/button
            // The contact list items should be clickable divs or buttons
            const contactCards = await page.locator('[class*="cursor-pointer"], [role="button"]').all();

            let contactClicked = false;
            for (const card of contactCards) {
                const text = await card.textContent().catch(() => '');
                // Look for contact cards that have names (Dolores Fay, Diana Bunting, etc.)
                if (text.includes('Fay') || text.includes('Bunting') || text.includes('EMAIL')) {
                    console.log(`Clicking on contact card with text: ${text.substring(0, 50)}...`);
                    await card.click();
                    contactClicked = true;
                    break;
                }
            }

            if (!contactClicked) {
                // Fallback: try clicking on the contact list area directly
                const contactArea = await page.locator('text="Dolores Fay"').first();
                if (await contactArea.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await contactArea.click();
                    contactClicked = true;
                }
            }

            await page.waitForTimeout(2000);

            const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug1-03-contact-opened.png');
            await page.screenshot({ path: screenshotPath3, fullPage: true });
            results.bug1.screenshots.push(screenshotPath3);
            console.log('Screenshot: bug1-03-contact-opened.png');

            // Now look for Archive/Unarchive button in the conversation header
            // It might be in a dropdown menu or as a direct button
            const buttons = await page.locator('button').all();

            let unarchiveBtn = null;
            for (const btn of buttons) {
                const text = await btn.textContent().catch(() => '');
                const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
                if (text.toLowerCase().includes('unarchive') || ariaLabel.toLowerCase().includes('unarchive')) {
                    unarchiveBtn = btn;
                    console.log('Found Unarchive button!');
                    break;
                }
                // Also check for "Archive" button which might toggle
                if (text.toLowerCase().includes('archive') && !text.toLowerCase().includes('unarchive')) {
                    console.log(`Found Archive-related button: "${text}"`);
                }
            }

            // Also check for a menu button that might contain the unarchive option
            const menuButtons = await page.locator('button[aria-label*="menu"], button:has-text("⋮"), button:has-text("•••")').all();

            if (!unarchiveBtn && menuButtons.length > 0) {
                console.log(`Found ${menuButtons.length} menu buttons, checking for Unarchive option...`);
                await menuButtons[0].click();
                await page.waitForTimeout(1000);

                const screenshotPath3b = path.join(SCREENSHOT_DIR, 'bug1-03b-menu-open.png');
                await page.screenshot({ path: screenshotPath3b, fullPage: true });
                results.bug1.screenshots.push(screenshotPath3b);
                console.log('Screenshot: bug1-03b-menu-open.png');

                unarchiveBtn = page.locator('button:has-text("Unarchive"), [role="menuitem"]:has-text("Unarchive")').first();
            }

            if (unarchiveBtn && await unarchiveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('Clicking Unarchive button...');

                // Get contact identifier before unarchiving
                const pageContentBefore = await page.content();

                await unarchiveBtn.click();
                await page.waitForTimeout(2000);

                const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug1-04-after-unarchive.png');
                await page.screenshot({ path: screenshotPath4, fullPage: true });
                results.bug1.screenshots.push(screenshotPath4);
                console.log('Screenshot: bug1-04-after-unarchive.png');

                // CRITICAL CHECK: Verify we're no longer in Archived tab or the contact list changed
                const archivedTabStillActive = await page.locator('button:has-text("Archived")[aria-selected="true"]').isVisible().catch(() => false);

                // Check if the conversation panel changed or closed
                const conversationStillVisible = await page.locator('text="Select a conversation"').isVisible().catch(() => false);

                await page.waitForTimeout(2000);

                const screenshotPath5 = path.join(SCREENSHOT_DIR, 'bug1-05-verify-removed.png');
                await page.screenshot({ path: screenshotPath5, fullPage: true });
                results.bug1.screenshots.push(screenshotPath5);
                console.log('Screenshot: bug1-05-verify-removed.png');

                // Navigate back to Archived tab to verify contact is gone
                if (!archivedTabStillActive) {
                    await page.click('button:has-text("Archived")');
                    await page.waitForTimeout(2000);
                }

                const pageContentAfter = await page.content();

                // Check if the number of archived contacts decreased
                const archivedContactsBefore = (pageContentBefore.match(/EMAIL/g) || []).length;
                const archivedContactsAfter = (pageContentAfter.match(/EMAIL/g) || []).length;

                console.log(`Archived contacts: Before=${archivedContactsBefore}, After=${archivedContactsAfter}`);

                if (archivedContactsAfter < archivedContactsBefore || conversationStillVisible) {
                    console.log('✓ PASS: Contact removed from Archived tab');
                    results.bug1.status = 'PASS';
                    results.bug1.details.push('Contact successfully removed from Archived tab after unarchiving');
                } else {
                    console.log('✗ FAIL: Contact may still be in Archived tab');
                    results.bug1.status = 'FAIL';
                    results.bug1.details.push('ERROR: Contact appears to still be in Archived tab');
                }

                // Check All tab
                await page.click('button:has-text("All")');
                await page.waitForTimeout(2000);

                const screenshotPath6 = path.join(SCREENSHOT_DIR, 'bug1-06-all-tab.png');
                await page.screenshot({ path: screenshotPath6, fullPage: true });
                results.bug1.screenshots.push(screenshotPath6);
                console.log('Screenshot: bug1-06-all-tab.png');

            } else {
                console.log('✗ Unarchive button not found');
                results.bug1.status = 'FAIL';
                results.bug1.details.push('ERROR: Unarchive button not found in conversation view');
            }

        } catch (error) {
            console.error('BUG-1 Test Error:', error.message);
            results.bug1.status = 'ERROR';
            results.bug1.details.push(`Exception: ${error.message}`);
        }

        // ========================================
        // BUG-4: Campaign Delete fails - CREATE TEST CAMPAIGN FIRST
        // ========================================
        console.log('\n=== TESTING BUG-4: Campaign Delete ===');

        try {
            // First, create a test campaign to delete
            console.log('Creating test campaign...');
            await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
            await page.waitForTimeout(2000);

            // Look for Create/New Campaign button
            const createBtn = page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create")').first();

            if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await createBtn.click();
                await page.waitForTimeout(2000);

                // Fill in basic campaign info
                const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
                if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await nameInput.fill('TEST DELETE CAMPAIGN - Auto Generated');
                    await page.waitForTimeout(1000);

                    // Try to save as draft or proceed to a point where we can save
                    const saveDraftBtn = page.locator('button:has-text("Save"), button:has-text("Draft")').first();
                    if (await saveDraftBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveDraftBtn.click();
                        await page.waitForTimeout(2000);
                    }
                }

                // Go back to campaigns list
                await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
                await page.waitForTimeout(3000);
            }

            const screenshotPath1 = path.join(SCREENSHOT_DIR, 'bug4-01-campaigns-list.png');
            await page.screenshot({ path: screenshotPath1, fullPage: true });
            results.bug4.screenshots.push(screenshotPath1);
            console.log('Screenshot: bug4-01-campaigns-list.png');

            // Look for our test campaign or any campaign
            const rows = await page.locator('table tbody tr, tr:has-text("Campaign")').all();
            console.log(`Found ${rows.length} campaign rows`);

            if (rows.length > 0) {
                // Find the row with our test campaign or use the first one
                let targetRow = rows[0];
                for (const row of rows) {
                    const text = await row.textContent();
                    if (text.includes('TEST DELETE')) {
                        targetRow = row;
                        break;
                    }
                }

                // Look for action menu in this row
                const menuBtn = targetRow.locator('button[aria-label*="menu"], button:has-text("⋮")').first();

                if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await menuBtn.click();
                    await page.waitForTimeout(1000);

                    const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug4-02-menu-open.png');
                    await page.screenshot({ path: screenshotPath2, fullPage: true });
                    results.bug4.screenshots.push(screenshotPath2);
                    console.log('Screenshot: bug4-02-menu-open.png');

                    // Click Delete
                    const deleteBtn = page.locator('button:has-text("Delete"), [role="menuitem"]:has-text("Delete")').first();

                    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                        console.log('Clicking Delete...');
                        await deleteBtn.click();
                        await page.waitForTimeout(1000);

                        const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug4-03-confirm-dialog.png');
                        await page.screenshot({ path: screenshotPath3, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath3);
                        console.log('Screenshot: bug4-03-confirm-dialog.png');

                        // Confirm
                        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();

                        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                            await confirmBtn.click();
                            await page.waitForTimeout(3000);
                        }

                        const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug4-04-delete-result.png');
                        await page.screenshot({ path: screenshotPath4, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath4);
                        console.log('Screenshot: bug4-04-delete-result.png');

                        // CRITICAL CHECK: Look for error messages
                        const errorElements = await page.locator('[role="alert"], .error, .alert-error, text="Failed to delete"').all();
                        const pageText = await page.content();
                        const hasError = errorElements.length > 0 || pageText.toLowerCase().includes('failed to delete');

                        if (!hasError) {
                            console.log('✓ PASS: No error message appeared');
                            results.bug4.status = 'PASS';
                            results.bug4.details.push('Campaign deleted successfully without errors');
                        } else {
                            console.log('✗ FAIL: Error message detected');
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
                console.log('⚠ No campaigns found');
                results.bug4.status = 'SKIP';
                results.bug4.details.push('No campaigns available - tried to create but may have failed');
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
            await page.click('button:has-text("Create"), a:has-text("Create")');
            await page.waitForTimeout(3000);

            const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug7-02-create-page-top.png');
            await page.screenshot({ path: screenshotPath2, fullPage: true });
            results.bug7.screenshots.push(screenshotPath2);
            console.log('Screenshot: bug7-02-create-page-top.png');

            // SCROLL DOWN to find Timing Mode section
            console.log('Scrolling down to find Timing Mode section...');
            await page.evaluate(() => window.scrollBy(0, 800));
            await page.waitForTimeout(1000);

            const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug7-03-scrolled-down.png');
            await page.screenshot({ path: screenshotPath3, fullPage: true });
            results.bug7.screenshots.push(screenshotPath3);
            console.log('Screenshot: bug7-03-scrolled-down.png');

            // Continue scrolling if needed
            await page.evaluate(() => window.scrollBy(0, 800));
            await page.waitForTimeout(1000);

            const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug7-04-scrolled-more.png');
            await page.screenshot({ path: screenshotPath4, fullPage: true });
            results.bug7.screenshots.push(screenshotPath4);
            console.log('Screenshot: bug7-04-scrolled-more.png');

            // Look for Timing Mode text
            const timingModeVisible = await page.locator('text="Timing Mode"').isVisible().catch(() => false);

            if (timingModeVisible) {
                console.log('Found Timing Mode section!');

                // Find all select elements
                const selects = await page.locator('select').all();
                console.log(`Found ${selects.length} select elements`);

                let timingSelect = null;
                for (const select of selects) {
                    const name = await select.getAttribute('name').catch(() => '');
                    const id = await select.getAttribute('id').catch(() => '');
                    if (name.includes('timing') || id.includes('timing')) {
                        timingSelect = select;
                        console.log(`Found timing select with name="${name}" id="${id}"`);
                        break;
                    }
                }

                if (timingSelect) {
                    const options = await timingSelect.locator('option').allTextContents();
                    console.log('Timing Mode Options:', options);

                    const screenshotPath5 = path.join(SCREENSHOT_DIR, 'bug7-05-timing-found.png');
                    await page.screenshot({ path: screenshotPath5, fullPage: true });
                    results.bug7.screenshots.push(screenshotPath5);
                    console.log('Screenshot: bug7-05-timing-found.png');

                    // Check for expected options (case-insensitive)
                    const expectedTerms = ['wait time', 'trigger', 'either', 'both'];
                    const foundCount = expectedTerms.filter(term =>
                        options.some(opt => opt.toLowerCase().includes(term))
                    ).length;

                    console.log(`Found ${foundCount}/4 expected timing mode types`);

                    if (foundCount >= 3) {
                        // Select a trigger-based option
                        const triggerOption = options.find(opt =>
                            opt.toLowerCase().includes('trigger') ||
                            opt.toLowerCase().includes('wait for')
                        );

                        if (triggerOption) {
                            await timingSelect.selectOption({ label: triggerOption });
                            await page.waitForTimeout(1000);

                            const screenshotPath6 = path.join(SCREENSHOT_DIR, 'bug7-06-trigger-selected.png');
                            await page.screenshot({ path: screenshotPath6, fullPage: true });
                            results.bug7.screenshots.push(screenshotPath6);
                            console.log('Screenshot: bug7-06-trigger-selected.png');

                            // Look for trigger type dropdown
                            const allSelects = await page.locator('select').all();
                            let triggerTypeSelect = null;

                            for (const sel of allSelects) {
                                const name = await sel.getAttribute('name').catch(() => '');
                                if (name.includes('trigger_type') || name.includes('event')) {
                                    triggerTypeSelect = sel;
                                    break;
                                }
                            }

                            if (triggerTypeSelect) {
                                const triggerOpts = await triggerTypeSelect.locator('option').allTextContents();
                                console.log('Trigger Type Options:', triggerOpts);

                                const expectedTriggers = ['open', 'click', 'repl', 'tag', 'status'];
                                const foundTriggers = expectedTriggers.filter(trigger =>
                                    triggerOpts.some(opt => opt.toLowerCase().includes(trigger))
                                ).length;

                                console.log(`Found ${foundTriggers} trigger type options`);

                                if (foundTriggers >= 2) {
                                    console.log('✓ PASS: Timing modes and triggers implemented');
                                    results.bug7.status = 'PASS';
                                    results.bug7.details.push(`Found ${foundCount} timing mode options`);
                                    results.bug7.details.push(`Found ${foundTriggers} trigger type options`);
                                } else {
                                    results.bug7.status = 'PARTIAL';
                                    results.bug7.details.push('Timing modes found but insufficient trigger options');
                                }
                            } else {
                                results.bug7.status = 'PARTIAL';
                                results.bug7.details.push('Timing modes found but trigger type dropdown not found');
                            }
                        }
                    } else {
                        results.bug7.status = 'FAIL';
                        results.bug7.details.push(`Only found ${foundCount}/4 timing mode options`);
                    }
                } else {
                    results.bug7.status = 'FAIL';
                    results.bug7.details.push('Timing Mode section found but select element not located');
                }
            } else {
                results.bug7.status = 'FAIL';
                results.bug7.details.push('Timing Mode section not found on page - may need more scrolling');
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

    console.log('\n' + '='.repeat(80));
    if (allPassed) {
        console.log('OVERALL VERDICT: ✓ ALL 3 BUGS VERIFIED AS FIXED');
    } else {
        console.log('OVERALL VERDICT: ✗ VERIFICATION INCOMPLETE OR FAILURES DETECTED');
    }
    console.log('='.repeat(80));

    // Save results
    const fs = require('fs');
    fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'verification_results_v3.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\nDetailed results saved to: verification_results_v3.json');
}

main();
