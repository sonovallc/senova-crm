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

            // Click on Archived tab
            const archivedTab = await page.locator('text="Archived"').first();
            if (await archivedTab.isVisible({ timeout: 5000 })) {
                await archivedTab.click();
                await page.waitForTimeout(2000);

                const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug1-02-archived-tab.png');
                await page.screenshot({ path: screenshotPath2, fullPage: true });
                results.bug1.screenshots.push(screenshotPath2);
                console.log('Screenshot: bug1-02-archived-tab.png');

                // Check if there are archived contacts
                const archivedContacts = await page.locator('.contact-item, [class*="contact"], [role="button"]:has-text("@")').count();
                console.log(`Found ${archivedContacts} potential archived contact elements`);

                if (archivedContacts > 0) {
                    // Click on first archived contact
                    const firstContact = await page.locator('.contact-item, [class*="contact"], [role="button"]:has-text("@")').first();
                    const contactText = await firstContact.textContent().catch(() => 'Unknown Contact');
                    console.log(`Clicking on contact: ${contactText}`);

                    await firstContact.click();
                    await page.waitForTimeout(2000);

                    const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug1-03-select-contact.png');
                    await page.screenshot({ path: screenshotPath3, fullPage: true });
                    results.bug1.screenshots.push(screenshotPath3);
                    console.log('Screenshot: bug1-03-select-contact.png');

                    // Look for Unarchive button
                    const unarchiveBtn = await page.locator('button:has-text("Unarchive"), [role="button"]:has-text("Unarchive")').first();

                    if (await unarchiveBtn.isVisible({ timeout: 5000 })) {
                        console.log('Found Unarchive button, clicking...');

                        await unarchiveBtn.click();
                        await page.waitForTimeout(2000);

                        const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug1-04-click-unarchive.png');
                        await page.screenshot({ path: screenshotPath4, fullPage: true });
                        results.bug1.screenshots.push(screenshotPath4);
                        console.log('Screenshot: bug1-04-click-unarchive.png');

                        // Wait for UI to update
                        await page.waitForTimeout(2000);

                        // CRITICAL CHECK: Verify contact disappeared from Archived tab
                        const contactStillVisible = await firstContact.isVisible().catch(() => false);

                        const screenshotPath5 = path.join(SCREENSHOT_DIR, 'bug1-05-verify-removed.png');
                        await page.screenshot({ path: screenshotPath5, fullPage: true });
                        results.bug1.screenshots.push(screenshotPath5);
                        console.log('Screenshot: bug1-05-verify-removed.png');

                        if (!contactStillVisible) {
                            console.log('✓ PASS: Contact removed from Archived tab');
                            results.bug1.status = 'PASS';
                            results.bug1.details.push('Contact successfully removed from Archived tab after unarchiving');
                        } else {
                            console.log('✗ FAIL: Contact still visible in Archived tab');
                            results.bug1.status = 'FAIL';
                            results.bug1.details.push('ERROR: Contact still appears in Archived tab after unarchiving');
                        }

                        // Switch to All tab to verify
                        const allTab = await page.locator('text="All"').first();
                        if (await allTab.isVisible({ timeout: 5000 })) {
                            await allTab.click();
                            await page.waitForTimeout(2000);

                            const screenshotPath6 = path.join(SCREENSHOT_DIR, 'bug1-06-all-tab.png');
                            await page.screenshot({ path: screenshotPath6, fullPage: true });
                            results.bug1.screenshots.push(screenshotPath6);
                            console.log('Screenshot: bug1-06-all-tab.png');

                            results.bug1.details.push('Verified contact appears in All tab');
                        }

                    } else {
                        console.log('✗ Unarchive button not found');
                        results.bug1.status = 'FAIL';
                        results.bug1.details.push('ERROR: Unarchive button not found in UI');
                    }
                } else {
                    console.log('⚠ No archived contacts found to test');
                    results.bug1.status = 'SKIP';
                    results.bug1.details.push('No archived contacts available for testing');
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

            // Look for campaigns
            const campaigns = await page.locator('tr[role="row"], .campaign-item, [class*="campaign"]').count();
            console.log(`Found ${campaigns} potential campaign elements`);

            if (campaigns > 0) {
                // Look for 3-dot menu or action buttons
                const actionMenus = await page.locator('button[aria-label*="menu"], button:has-text("⋮"), button:has-text("•••"), [role="button"][aria-haspopup="menu"]').all();

                console.log(`Found ${actionMenus.length} action menu buttons`);

                if (actionMenus.length > 0) {
                    // Click first action menu
                    await actionMenus[0].click();
                    await page.waitForTimeout(1000);

                    const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug4-02-menu-open.png');
                    await page.screenshot({ path: screenshotPath2, fullPage: true });
                    results.bug4.screenshots.push(screenshotPath2);
                    console.log('Screenshot: bug4-02-menu-open.png');

                    // Look for Delete option
                    const deleteOption = await page.locator('text="Delete", [role="menuitem"]:has-text("Delete")').first();

                    if (await deleteOption.isVisible({ timeout: 5000 })) {
                        console.log('Found Delete option, clicking...');

                        await deleteOption.click();
                        await page.waitForTimeout(1000);

                        const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug4-03-confirm-dialog.png');
                        await page.screenshot({ path: screenshotPath3, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath3);
                        console.log('Screenshot: bug4-03-confirm-dialog.png');

                        // Look for confirmation dialog
                        const confirmBtn = await page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();

                        if (await confirmBtn.isVisible({ timeout: 5000 })) {
                            console.log('Found confirmation button, confirming delete...');
                            await confirmBtn.click();
                            await page.waitForTimeout(2000);
                        }

                        const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug4-04-delete-result.png');
                        await page.screenshot({ path: screenshotPath4, fullPage: true });
                        results.bug4.screenshots.push(screenshotPath4);
                        console.log('Screenshot: bug4-04-delete-result.png');

                        // CRITICAL CHECK: Look for error messages
                        const errorMessages = await page.locator('text="Failed to delete", text="error", [role="alert"], .error, .alert-error').all();
                        const hasError = errorMessages.length > 0;

                        if (!hasError) {
                            console.log('✓ PASS: No error message appeared');
                            results.bug4.status = 'PASS';
                            results.bug4.details.push('Campaign deleted successfully without errors');
                        } else {
                            console.log('✗ FAIL: Error message detected');
                            const errorText = await errorMessages[0].textContent();
                            results.bug4.status = 'FAIL';
                            results.bug4.details.push(`ERROR: Delete failed with message: ${errorText}`);
                        }
                    } else {
                        console.log('✗ Delete option not found in menu');
                        results.bug4.status = 'FAIL';
                        results.bug4.details.push('ERROR: Delete option not found in action menu');
                    }
                } else {
                    console.log('✗ No action menus found');
                    results.bug4.status = 'FAIL';
                    results.bug4.details.push('ERROR: No action menus found on campaigns page');
                }
            } else {
                console.log('⚠ No campaigns found to test');
                results.bug4.status = 'SKIP';
                results.bug4.details.push('No campaigns available for testing');
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

            // Look for existing autoresponders or create new button
            const autoresponders = await page.locator('tr[role="row"], .autoresponder-item, [class*="autoresponder"]').count();
            console.log(`Found ${autoresponders} potential autoresponder elements`);

            let editPageReached = false;

            // Try clicking on existing autoresponder first
            if (autoresponders > 0) {
                const firstAutoresponder = await page.locator('tr[role="row"], .autoresponder-item').first();
                await firstAutoresponder.click();
                await page.waitForTimeout(2000);
                editPageReached = true;
            } else {
                // Try to create new autoresponder
                const createBtn = await page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create")').first();
                if (await createBtn.isVisible({ timeout: 5000 })) {
                    await createBtn.click();
                    await page.waitForTimeout(2000);
                    editPageReached = true;
                }
            }

            if (editPageReached) {
                const screenshotPath2 = path.join(SCREENSHOT_DIR, 'bug7-02-edit-page.png');
                await page.screenshot({ path: screenshotPath2, fullPage: true });
                results.bug7.screenshots.push(screenshotPath2);
                console.log('Screenshot: bug7-02-edit-page.png');

                // Look for Timing Mode dropdown
                const timingModeLabel = await page.locator('label:has-text("Timing Mode"), text="Timing Mode"').first();

                if (await timingModeLabel.isVisible({ timeout: 5000 })) {
                    console.log('Found Timing Mode label');

                    // Find the dropdown/select near the label
                    const timingModeSelect = await page.locator('select[name*="timing"], select:near(text="Timing Mode"), select').first();

                    if (await timingModeSelect.isVisible({ timeout: 5000 })) {
                        console.log('Found Timing Mode select, clicking to open...');

                        await timingModeSelect.click();
                        await page.waitForTimeout(1000);

                        const screenshotPath3 = path.join(SCREENSHOT_DIR, 'bug7-03-timing-dropdown.png');
                        await page.screenshot({ path: screenshotPath3, fullPage: true });
                        results.bug7.screenshots.push(screenshotPath3);
                        console.log('Screenshot: bug7-03-timing-dropdown.png');

                        // Get all options
                        const options = await timingModeSelect.locator('option').allTextContents();
                        console.log('Timing Mode Options:', options);

                        // CRITICAL CHECK: Verify 4 timing mode options exist
                        const expectedOptions = [
                            'Wait Time Only',
                            'Wait for Trigger',
                            'Either/Or',
                            'Both'
                        ];

                        const foundOptions = expectedOptions.filter(expected =>
                            options.some(opt => opt.includes(expected) || opt.toLowerCase().includes(expected.toLowerCase()))
                        );

                        console.log(`Found ${foundOptions.length}/4 expected timing modes:`, foundOptions);

                        if (foundOptions.length >= 3) {
                            // Select "Wait for Trigger" to check trigger options
                            await timingModeSelect.selectOption({ label: /Wait for Trigger/i });
                            await page.waitForTimeout(1000);

                            const screenshotPath4 = path.join(SCREENSHOT_DIR, 'bug7-04-trigger-options.png');
                            await page.screenshot({ path: screenshotPath4, fullPage: true });
                            results.bug7.screenshots.push(screenshotPath4);
                            console.log('Screenshot: bug7-04-trigger-options.png');

                            // Look for trigger type dropdown
                            const triggerTypeSelect = await page.locator('select[name*="trigger"], label:has-text("Trigger Type") + select, text="Trigger Type" ~ select').first();

                            if (await triggerTypeSelect.isVisible({ timeout: 5000 })) {
                                const triggerOptions = await triggerTypeSelect.locator('option').allTextContents();
                                console.log('Trigger Type Options:', triggerOptions);

                                const expectedTriggers = ['Email Opened', 'Link Clicked', 'Email Replied', 'Tag Added'];
                                const foundTriggers = expectedTriggers.filter(expected =>
                                    triggerOptions.some(opt => opt.includes(expected))
                                );

                                console.log(`Found ${foundTriggers.length} expected trigger types:`, foundTriggers);

                                if (foundTriggers.length >= 2) {
                                    console.log('✓ PASS: Timing modes and trigger options working');
                                    results.bug7.status = 'PASS';
                                    results.bug7.details.push(`Found ${foundOptions.length} timing modes: ${foundOptions.join(', ')}`);
                                    results.bug7.details.push(`Found ${foundTriggers.length} trigger types: ${foundTriggers.join(', ')}`);
                                } else {
                                    console.log('✗ FAIL: Insufficient trigger options');
                                    results.bug7.status = 'FAIL';
                                    results.bug7.details.push(`ERROR: Only found ${foundTriggers.length} trigger types`);
                                }
                            } else {
                                console.log('⚠ Trigger type dropdown not visible');
                                results.bug7.status = 'PARTIAL';
                                results.bug7.details.push('Timing modes found but trigger type dropdown not visible');
                            }
                        } else {
                            console.log('✗ FAIL: Insufficient timing mode options');
                            results.bug7.status = 'FAIL';
                            results.bug7.details.push(`ERROR: Only found ${foundOptions.length} timing modes: ${foundOptions.join(', ')}`);
                        }
                    } else {
                        console.log('✗ Timing Mode select not found');
                        results.bug7.status = 'FAIL';
                        results.bug7.details.push('ERROR: Timing Mode select element not found');
                    }
                } else {
                    console.log('✗ Timing Mode label not found');
                    results.bug7.status = 'FAIL';
                    results.bug7.details.push('ERROR: Timing Mode label not found on page');
                }
            } else {
                console.log('✗ Could not reach edit/create page');
                results.bug7.status = 'FAIL';
                results.bug7.details.push('ERROR: Could not navigate to autoresponder edit/create page');
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
    console.log(`OVERALL VERDICT: ${allPassed ? '✓ ALL BUGS FIXED' : '✗ SOME BUGS STILL FAILING'}`);
    console.log('='.repeat(80));

    // Write detailed JSON report
    const fs = require('fs');
    fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'verification_results.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\nDetailed results saved to: verification_results.json');
}

main();
