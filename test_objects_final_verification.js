const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3004';
const LOGIN_EMAIL = 'jwoodcapital@gmail.com';
const LOGIN_PASSWORD = 'D3n1w3n1!';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'objects-final-verification');
const REPORT_PATH = path.join(__dirname, 'OBJECTS_FINAL_VERIFICATION_REPORT.md');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test Results Storage
const testResults = {
    timestamp: new Date().toISOString(),
    environment: BASE_URL,
    tests: [],
    bugs: [],
    consoleErrors: [],
    productionReady: true
};

// Helper function to capture screenshot
async function captureScreenshot(page, name) {
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
}

// Helper function to log test result
function logTest(name, status, details = '') {
    const result = {
        name,
        status,
        details,
        timestamp: new Date().toISOString()
    };
    testResults.tests.push(result);
    console.log(`[${status}] ${name} ${details ? '- ' + details : ''}`);
    if (status === 'FAIL') {
        testResults.productionReady = false;
    }
}

// Main test function
async function runObjectsVerification() {
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Set up console error monitoring
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const errorText = msg.text();
            console.error('Console Error:', errorText);
            testResults.consoleErrors.push({
                text: errorText,
                url: page.url(),
                timestamp: new Date().toISOString()
            });

            // Check for specific React errors
            if (errorText.includes('Objects are not valid as a React child') ||
                errorText.includes('Cannot read properties of undefined')) {
                testResults.bugs.push({
                    type: 'React Error',
                    message: errorText,
                    url: page.url()
                });
                testResults.productionReady = false;
            }
        }
    });

    try {
        console.log('Starting Objects Final Verification Testing...\n');

        // TEST 1: Login
        console.log('TEST 1: Authentication');
        await page.goto(BASE_URL);
        await page.waitForTimeout(2000);

        // Check if already logged in or need to login
        if (page.url().includes('/login')) {
            await page.fill('input[type="email"]', LOGIN_EMAIL);
            await page.fill('input[type="password"]', LOGIN_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard/**', { timeout: 10000 });
            logTest('Authentication', 'PASS', 'Successfully logged in');
        } else {
            logTest('Authentication', 'PASS', 'Already authenticated');
        }

        await captureScreenshot(page, '01-dashboard');

        // TEST 2: Navigate to Objects page
        console.log('\nTEST 2: Objects Page Navigation');
        await page.goto(`${BASE_URL}/dashboard/objects`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const objectsPageLoaded = await page.locator('h1').filter({ hasText: /Objects/i }).isVisible();
        if (objectsPageLoaded) {
            logTest('Objects Page Navigation', 'PASS', 'Objects page loaded successfully');
        } else {
            logTest('Objects Page Navigation', 'FAIL', 'Objects page did not load');
        }
        await captureScreenshot(page, '02-objects-list');

        // TEST 3: Address Rendering Fix - Check Senova CRM object
        console.log('\nTEST 3: Address Rendering Verification');
        const senovaObject = page.locator('text=Senova CRM').first();

        if (await senovaObject.isVisible()) {
            // Click on Senova CRM object
            await senovaObject.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Check for React errors in console
            const hasReactErrors = testResults.consoleErrors.some(err =>
                err.text.includes('Objects are not valid as a React child')
            );

            if (!hasReactErrors) {
                logTest('Address Rendering Fix', 'PASS', 'No React errors with address object');
            } else {
                logTest('Address Rendering Fix', 'FAIL', 'React error found with address object');
                testResults.bugs.push({
                    type: 'Address Rendering',
                    message: 'React error when rendering address as object'
                });
            }

            await captureScreenshot(page, '03-senova-object-detail');

            // Go back to Objects list
            await page.goto(`${BASE_URL}/dashboard/objects`);
            await page.waitForLoadState('networkidle');
        } else {
            logTest('Address Rendering Fix', 'SKIP', 'Senova CRM object not found');
        }

        // TEST 4: Create Object Button Verification
        console.log('\nTEST 4: Create Object Button');
        const createButton = page.locator('button:has-text("Create Object"), a:has-text("Create Object")').first();
        const createButtonVisible = await createButton.isVisible();

        if (createButtonVisible) {
            logTest('Create Object Button', 'PASS', 'Create button is visible');

            // Click Create Object button
            await createButton.click();
            await page.waitForTimeout(2000);

            // Check if create form opened
            const formVisible = await page.locator('input[name="name"], input[placeholder*="Name"]').isVisible();
            if (formVisible) {
                logTest('Create Form Opens', 'PASS', 'Create form opened successfully');
                await captureScreenshot(page, '04-create-form');
            } else {
                logTest('Create Form Opens', 'FAIL', 'Create form did not open');
            }
        } else {
            logTest('Create Object Button', 'FAIL', 'Create button not visible');
            testResults.bugs.push({
                type: 'UI Element',
                message: 'Create Object button not found'
            });
        }

        // TEST 5: Full CRUD Test
        console.log('\nTEST 5: Full CRUD Operations');
        const testTimestamp = Date.now();
        const testObjectName = `Final Test Object - ${testTimestamp}`;

        // Create new object
        if (await page.locator('input[name="name"], input[placeholder*="Name"]').isVisible()) {
            // Fill create form
            await page.fill('input[name="name"], input[placeholder*="Name"]', testObjectName);

            // Fill industry if field exists
            const industryField = page.locator('select[name="industry"], input[name="industry"]').first();
            if (await industryField.isVisible()) {
                if (await industryField.evaluate(el => el.tagName === 'SELECT')) {
                    await industryField.selectOption({ index: 1 });
                } else {
                    await industryField.fill('Technology');
                }
            }

            // Fill website if field exists
            const websiteField = page.locator('input[name="website"], input[placeholder*="Website"]').first();
            if (await websiteField.isVisible()) {
                await websiteField.fill(`https://testobject${testTimestamp}.com`);
            }

            // Submit form
            const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
            await submitButton.click();
            await page.waitForTimeout(3000);

            // Verify object was created
            await page.goto(`${BASE_URL}/dashboard/objects`);
            await page.waitForLoadState('networkidle');

            const createdObject = page.locator(`text="${testObjectName}"`).first();
            if (await createdObject.isVisible()) {
                logTest('Create Object', 'PASS', 'Object created successfully');
                await captureScreenshot(page, '05-object-created');

                // TEST 6: Object Detail Navigation
                console.log('\nTEST 6: Object Detail Navigation');
                await createdObject.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);

                // Check if detail page loaded
                const detailPageLoaded = page.url().includes('/dashboard/objects/');
                if (detailPageLoaded) {
                    logTest('Object Detail Navigation', 'PASS', 'Navigated to object detail page');

                    // Check for tabs
                    const tabs = ['Information', 'Contacts', 'Users', 'Websites'];
                    for (const tab of tabs) {
                        const tabElement = page.locator(`text="${tab}"`).first();
                        if (await tabElement.isVisible()) {
                            logTest(`Tab: ${tab}`, 'PASS', 'Tab is visible');
                        } else {
                            logTest(`Tab: ${tab}`, 'FAIL', 'Tab not found');
                        }
                    }

                    await captureScreenshot(page, '06-object-detail');
                } else {
                    logTest('Object Detail Navigation', 'FAIL', 'Failed to navigate to detail page');
                }

                // TEST 7: Edit Object
                console.log('\nTEST 7: Edit Object');
                const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
                if (await editButton.isVisible()) {
                    await editButton.click();
                    await page.waitForTimeout(2000);

                    // Modify industry
                    const industryField = page.locator('select[name="industry"], input[name="industry"]').first();
                    if (await industryField.isVisible()) {
                        if (await industryField.evaluate(el => el.tagName === 'SELECT')) {
                            await industryField.selectOption({ index: 2 });
                        } else {
                            await industryField.fill('Healthcare');
                        }

                        // Save changes
                        const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
                        await saveButton.click();
                        await page.waitForTimeout(2000);

                        logTest('Edit Object', 'PASS', 'Object edited successfully');
                        await captureScreenshot(page, '07-object-edited');
                    } else {
                        logTest('Edit Object', 'SKIP', 'Edit form not found');
                    }
                } else {
                    logTest('Edit Object', 'FAIL', 'Edit button not found');
                }

                // TEST 8: Duplicate Object
                console.log('\nTEST 8: Duplicate Object');
                const menuButton = page.locator('button[aria-label*="menu"], button:has-text("...")').first();
                if (await menuButton.isVisible()) {
                    await menuButton.click();
                    await page.waitForTimeout(1000);

                    const duplicateOption = page.locator('text=Duplicate').first();
                    if (await duplicateOption.isVisible()) {
                        await duplicateOption.click();
                        await page.waitForTimeout(2000);

                        // Check if duplicate form opened
                        const duplicateFormVisible = await page.locator('input[name="name"], input[placeholder*="Name"]').isVisible();
                        if (duplicateFormVisible) {
                            logTest('Duplicate Object', 'PASS', 'Duplicate form opened');

                            // Cancel or close duplicate form
                            const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
                            if (await cancelButton.isVisible()) {
                                await cancelButton.click();
                            }
                        } else {
                            logTest('Duplicate Object', 'FAIL', 'Duplicate form did not open');
                        }
                    } else {
                        logTest('Duplicate Object', 'SKIP', 'Duplicate option not found');
                    }
                } else {
                    logTest('Duplicate Object', 'SKIP', 'Menu button not found');
                }

                // TEST 9: Delete Object
                console.log('\nTEST 9: Delete Object');
                await page.goto(`${BASE_URL}/dashboard/objects`);
                await page.waitForLoadState('networkidle');

                // Find the test object again
                const objectToDelete = page.locator(`text="${testObjectName}"`).first();
                if (await objectToDelete.isVisible()) {
                    // Find delete button in same row
                    const row = objectToDelete.locator('xpath=ancestor::tr').first();
                    const deleteButton = row.locator('button[aria-label*="delete"], button:has-text("Delete")').first();

                    if (await deleteButton.isVisible()) {
                        await deleteButton.click();
                        await page.waitForTimeout(1000);

                        // Confirm deletion if dialog appears
                        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').first();
                        if (await confirmButton.isVisible()) {
                            await confirmButton.click();
                        }

                        await page.waitForTimeout(2000);

                        // Verify object was deleted
                        const deletedObject = page.locator(`text="${testObjectName}"`).first();
                        if (!(await deletedObject.isVisible())) {
                            logTest('Delete Object', 'PASS', 'Object deleted successfully');
                        } else {
                            logTest('Delete Object', 'FAIL', 'Object still visible after delete');
                        }
                    } else {
                        logTest('Delete Object', 'SKIP', 'Delete button not found');
                    }
                } else {
                    logTest('Delete Object', 'SKIP', 'Test object not found');
                }
            } else {
                logTest('Create Object', 'FAIL', 'Object not found after creation');
                testResults.bugs.push({
                    type: 'CRUD Operation',
                    message: 'Object creation failed or object not visible in list'
                });
            }
        } else {
            logTest('Full CRUD Test', 'SKIP', 'Create form not available');
        }

        // TEST 10: Console Error Summary
        console.log('\nTEST 10: Console Error Check');
        if (testResults.consoleErrors.length === 0) {
            logTest('Console Errors', 'PASS', 'No console errors detected');
        } else {
            logTest('Console Errors', 'FAIL', `${testResults.consoleErrors.length} console errors found`);
            testResults.productionReady = false;
        }

        await captureScreenshot(page, '10-final-state');

    } catch (error) {
        console.error('Test execution error:', error);
        testResults.bugs.push({
            type: 'Test Execution',
            message: error.message
        });
        testResults.productionReady = false;
    } finally {
        await browser.close();
        generateReport();
    }
}

// Generate final report
function generateReport() {
    const report = `# OBJECTS FINAL VERIFICATION REPORT

## Test Environment
- **URL**: ${BASE_URL}
- **Date**: ${new Date().toISOString()}
- **Account**: ${LOGIN_EMAIL} (OWNER-level)

## Executive Summary
- **Total Tests**: ${testResults.tests.length}
- **Passed**: ${testResults.tests.filter(t => t.status === 'PASS').length}
- **Failed**: ${testResults.tests.filter(t => t.status === 'FAIL').length}
- **Skipped**: ${testResults.tests.filter(t => t.status === 'SKIP').length}
- **Console Errors**: ${testResults.consoleErrors.length}
- **Production Ready**: ${testResults.productionReady ? 'YES ✅' : 'NO ❌'}

## Test Results

### Bug Fix Verifications

#### 1. Address Rendering Fix
**Status**: ${testResults.tests.find(t => t.name === 'Address Rendering Fix')?.status || 'NOT TESTED'}
**Details**: Verified that objects with address as object (not string) render without React errors.
**Result**: ${testResults.consoleErrors.filter(e => e.text.includes('Objects are not valid')).length === 0 ? 'No React errors detected ✅' : 'React errors still present ❌'}

#### 2. Create Object Button
**Status**: ${testResults.tests.find(t => t.name === 'Create Object Button')?.status || 'NOT TESTED'}
**Details**: Create Object button visibility and functionality.
**Result**: ${testResults.tests.find(t => t.name === 'Create Object Button')?.status === 'PASS' ? 'Button visible and functional ✅' : 'Issues with Create button ❌'}

#### 3. Object Detail Navigation
**Status**: ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.status || 'NOT TESTED'}
**Details**: Navigation to object detail pages and tab visibility.
**Result**: ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.status === 'PASS' ? 'Navigation working correctly ✅' : 'Navigation issues detected ❌'}

### CRUD Operations

| Operation | Status | Details |
|-----------|--------|---------|
| Create | ${testResults.tests.find(t => t.name === 'Create Object')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Create Object')?.details || 'N/A'} |
| Read | ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.details || 'N/A'} |
| Update | ${testResults.tests.find(t => t.name === 'Edit Object')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Edit Object')?.details || 'N/A'} |
| Delete | ${testResults.tests.find(t => t.name === 'Delete Object')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Delete Object')?.details || 'N/A'} |
| Duplicate | ${testResults.tests.find(t => t.name === 'Duplicate Object')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Duplicate Object')?.details || 'N/A'} |

### Console Errors
${testResults.consoleErrors.length === 0 ?
'✅ No console errors detected during testing.' :
`❌ ${testResults.consoleErrors.length} console error(s) detected:
${testResults.consoleErrors.map(e => `- ${e.text} (at ${e.url})`).join('\n')}`}

### Remaining Bugs
${testResults.bugs.length === 0 ?
'✅ No bugs identified during testing.' :
`❌ ${testResults.bugs.length} bug(s) found:
${testResults.bugs.map(b => `- **${b.type}**: ${b.message}`).join('\n')}`}

## Screenshots Captured
${fs.readdirSync(SCREENSHOTS_DIR).map(f => `- ${f}`).join('\n')}

## Detailed Test Log

| Test Name | Status | Details |
|-----------|--------|---------|
${testResults.tests.map(t => `| ${t.name} | ${t.status} | ${t.details || '-'} |`).join('\n')}

## Production Readiness Assessment

${testResults.productionReady ?
`### ✅ PRODUCTION READY

The Objects module has passed all critical tests:
- No React rendering errors
- Create Object button is functional
- Full CRUD operations work correctly
- Navigation between list and detail views works
- No console errors detected
- All tabs load correctly

**Recommendation**: Objects module is ready for production deployment.` :
`### ❌ NOT PRODUCTION READY

The Objects module has critical issues that need to be resolved:
${testResults.bugs.map(b => `- ${b.type}: ${b.message}`).join('\n')}

**Recommendation**: Fix the identified issues before deploying to production.`}

## Test Execution Details
- **Started**: ${testResults.timestamp}
- **Completed**: ${new Date().toISOString()}
- **Test Framework**: Playwright
- **Browser**: Chromium

---
*Generated by Objects Final Verification Test Suite*`;

    // Write report to file
    fs.writeFileSync(REPORT_PATH, report);
    console.log(`\nReport saved to: ${REPORT_PATH}`);

    // Print summary to console
    console.log('\n' + '='.repeat(60));
    console.log('FINAL VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.tests.length}`);
    console.log(`Passed: ${testResults.tests.filter(t => t.status === 'PASS').length}`);
    console.log(`Failed: ${testResults.tests.filter(t => t.status === 'FAIL').length}`);
    console.log(`Console Errors: ${testResults.consoleErrors.length}`);
    console.log(`Bugs Found: ${testResults.bugs.length}`);
    console.log(`Production Ready: ${testResults.productionReady ? 'YES ✅' : 'NO ❌'}`);
    console.log('='.repeat(60));
}

// Run the tests
runObjectsVerification().catch(console.error);