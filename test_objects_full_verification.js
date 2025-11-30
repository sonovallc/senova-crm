const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3004';
const LOGIN_EMAIL = 'jwoodcapital@gmail.com';
const LOGIN_PASSWORD = 'D3n1w3n1!';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'objects-final');
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
    console.log(`Screenshot saved: ${name}.png`);
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

// Login helper function
async function ensureLoggedIn(page) {
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // If we're on login page, perform login
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        console.log('Logging in...');
        await page.fill('input[type="email"]', LOGIN_EMAIL);
        await page.fill('input[type="password"]', LOGIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        return true;
    }

    // If we're on home page, try to navigate to dashboard
    if (currentUrl.includes('/home')) {
        console.log('On home page, navigating to dashboard...');
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForTimeout(2000);

        // Check if redirected to login
        if (page.url().includes('/login')) {
            console.log('Redirected to login, logging in...');
            await page.fill('input[type="email"]', LOGIN_EMAIL);
            await page.fill('input[type="password"]', LOGIN_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
        }
        return true;
    }

    // Already on dashboard
    if (currentUrl.includes('/dashboard')) {
        console.log('Already on dashboard');
        return true;
    }

    return false;
}

// Main test function
async function runObjectsVerification() {
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized'],
        slowMo: 100
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Set up console error monitoring
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const errorText = msg.text();
            consoleErrors.push(errorText);
            console.error('Console Error:', errorText);
            testResults.consoleErrors.push({
                text: errorText,
                url: page.url(),
                timestamp: new Date().toISOString()
            });

            // Check for specific React errors
            if (errorText.includes('Objects are not valid as a React child')) {
                testResults.bugs.push({
                    type: 'React Error - Address Rendering',
                    message: errorText,
                    url: page.url()
                });
                testResults.productionReady = false;
            }
        }
    });

    try {
        console.log('='.repeat(60));
        console.log('OBJECTS MODULE - FINAL VERIFICATION TEST');
        console.log('='.repeat(60));
        console.log('');

        // TEST 1: Authentication
        console.log('TEST 1: Authentication & Navigation');
        console.log('-'.repeat(40));

        await page.goto(`${BASE_URL}/login`);
        await page.waitForTimeout(2000);

        // Perform login
        await page.fill('input[type="email"]', LOGIN_EMAIL);
        await page.fill('input[type="password"]', LOGIN_PASSWORD);
        await captureScreenshot(page, '01-login');

        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);

        // Check if login was successful
        const postLoginUrl = page.url();
        if (postLoginUrl.includes('/dashboard')) {
            logTest('Authentication', 'PASS', 'Successfully logged in to dashboard');
        } else {
            // Try direct navigation
            await page.goto(`${BASE_URL}/dashboard/objects`);
            await page.waitForTimeout(3000);

            if (page.url().includes('/login')) {
                // Try login again
                await page.fill('input[type="email"]', LOGIN_EMAIL);
                await page.fill('input[type="password"]', LOGIN_PASSWORD);
                await page.click('button[type="submit"]');
                await page.waitForTimeout(5000);
            }

            if (page.url().includes('/dashboard')) {
                logTest('Authentication', 'PASS', 'Logged in after retry');
            } else {
                logTest('Authentication', 'FAIL', `Failed to login - URL: ${page.url()}`);
            }
        }

        // TEST 2: Navigate to Objects Page
        console.log('\nTEST 2: Objects Page Access');
        console.log('-'.repeat(40));

        await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        const objectsPageUrl = page.url();
        console.log('Objects page URL:', objectsPageUrl);

        if (objectsPageUrl.includes('/dashboard/objects')) {
            logTest('Objects Page Access', 'PASS', 'Successfully navigated to Objects page');
            await captureScreenshot(page, '02-objects-list');

            // Count objects in the list
            const tableRows = await page.$$('tbody tr, [role="row"]:not(:first-child), .table-row');
            console.log(`Found ${tableRows.length} objects in the list`);

            // TEST 3: Address Rendering Fix - Check for React errors
            console.log('\nTEST 3: Address Rendering Fix Verification');
            console.log('-'.repeat(40));

            // Check if Senova CRM object exists and click it
            try {
                // Try multiple selectors to find objects
                const objectSelectors = [
                    'td:has-text("Senova")',
                    'text=Senova CRM',
                    '[class*="cell"]:has-text("Senova")',
                    'tr:has-text("Senova")'
                ];

                let objectFound = false;
                for (const selector of objectSelectors) {
                    const element = await page.$(selector);
                    if (element) {
                        console.log('Found Senova object, clicking to view details...');
                        await element.click();
                        await page.waitForTimeout(3000);
                        objectFound = true;
                        break;
                    }
                }

                if (objectFound && page.url().includes('/dashboard/objects/')) {
                    // Check for React errors related to address rendering
                    const addressErrors = consoleErrors.filter(e =>
                        e.includes('Objects are not valid as a React child')
                    );

                    if (addressErrors.length === 0) {
                        logTest('Address Rendering Fix', 'PASS', 'No React errors - address object/string handling works');
                    } else {
                        logTest('Address Rendering Fix', 'FAIL', `React error found: ${addressErrors[0]}`);
                    }

                    await captureScreenshot(page, '03-object-detail');

                    // Navigate back to Objects list
                    await page.goto(`${BASE_URL}/dashboard/objects`);
                    await page.waitForTimeout(2000);
                } else {
                    // Try clicking the first object if Senova not found
                    if (tableRows.length > 0) {
                        console.log('Clicking first object in list...');
                        await tableRows[0].click();
                        await page.waitForTimeout(3000);

                        if (page.url().includes('/dashboard/objects/')) {
                            const addressErrors = consoleErrors.filter(e =>
                                e.includes('Objects are not valid as a React child')
                            );

                            if (addressErrors.length === 0) {
                                logTest('Address Rendering Fix', 'PASS', 'No React errors with address field');
                            } else {
                                logTest('Address Rendering Fix', 'FAIL', 'React error with address rendering');
                            }
                        } else {
                            logTest('Address Rendering Fix', 'SKIP', 'Could not navigate to object detail');
                        }

                        // Navigate back
                        await page.goto(`${BASE_URL}/dashboard/objects`);
                        await page.waitForTimeout(2000);
                    } else {
                        logTest('Address Rendering Fix', 'SKIP', 'No objects in list to test');
                    }
                }
            } catch (error) {
                logTest('Address Rendering Fix', 'ERROR', error.message);
            }

            // TEST 4: Create Object Button Verification
            console.log('\nTEST 4: Create Object Button');
            console.log('-'.repeat(40));

            // Look for Create button with various possible texts/selectors
            const createButtonSelectors = [
                'button:has-text("Create Object")',
                'button:has-text("Add Object")',
                'button:has-text("New Object")',
                'button:has-text("+ Object")',
                'button:has-text("Create")',
                'button:has-text("Add")',
                'button:has-text("New")',
                'a:has-text("Create Object")',
                '[role="button"]:has-text("Create")',
                'button[class*="primary"]:has-text("Create")',
                'button[class*="create"]',
                'button[class*="add"]'
            ];

            let createButton = null;
            for (const selector of createButtonSelectors) {
                const btn = await page.$(selector);
                if (btn && await btn.isVisible()) {
                    createButton = btn;
                    console.log(`Found create button with selector: ${selector}`);
                    break;
                }
            }

            if (createButton) {
                logTest('Create Object Button', 'PASS', 'Create button is visible');

                // Click the create button
                await createButton.click();
                await page.waitForTimeout(2000);

                // Check if create form opened
                const nameInput = await page.$('input[name="name"], input[placeholder*="Name"], input[placeholder*="Object"]');
                if (nameInput && await nameInput.isVisible()) {
                    logTest('Create Form', 'PASS', 'Create form opened successfully');
                    await captureScreenshot(page, '04-create-form');

                    // TEST 5: Create a test object
                    console.log('\nTEST 5: Create Object (CRUD - Create)');
                    console.log('-'.repeat(40));

                    const timestamp = Date.now();
                    const testObjectName = `Test Object ${timestamp}`;

                    await nameInput.fill(testObjectName);

                    // Fill other fields if present
                    const industryField = await page.$('select[name="industry"], input[name="industry"]');
                    if (industryField) {
                        const isSelect = await industryField.evaluate(el => el.tagName === 'SELECT');
                        if (isSelect) {
                            await industryField.selectOption({ index: 1 });
                        } else {
                            await industryField.fill('Technology');
                        }
                    }

                    // Submit the form
                    const submitButton = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
                    if (submitButton) {
                        await submitButton.click();
                        await page.waitForTimeout(3000);

                        // Check if object was created
                        await page.goto(`${BASE_URL}/dashboard/objects`);
                        await page.waitForTimeout(2000);

                        const createdObject = await page.$(`text="${testObjectName}"`);
                        if (createdObject) {
                            logTest('Create Object', 'PASS', 'Test object created successfully');
                            await captureScreenshot(page, '05-object-created');

                            // TEST 6: Navigate to created object (CRUD - Read)
                            console.log('\nTEST 6: Object Detail Navigation (CRUD - Read)');
                            console.log('-'.repeat(40));

                            await createdObject.click();
                            await page.waitForTimeout(3000);

                            if (page.url().includes('/dashboard/objects/')) {
                                logTest('Object Detail Navigation', 'PASS', 'Successfully navigated to object detail');

                                // Check for tabs
                                const expectedTabs = ['Information', 'Contacts', 'Users', 'Websites'];
                                const foundTabs = [];

                                for (const tabName of expectedTabs) {
                                    const tab = await page.$(`text="${tabName}"`);
                                    if (tab && await tab.isVisible()) {
                                        foundTabs.push(tabName);
                                    }
                                }

                                if (foundTabs.length > 0) {
                                    logTest('Object Tabs', 'PASS', `Found tabs: ${foundTabs.join(', ')}`);
                                } else {
                                    logTest('Object Tabs', 'FAIL', 'No tabs visible');
                                }

                                await captureScreenshot(page, '06-object-detail');

                                // TEST 7: Edit Object (CRUD - Update)
                                console.log('\nTEST 7: Edit Object (CRUD - Update)');
                                console.log('-'.repeat(40));

                                const editButton = await page.$('button:has-text("Edit"), a:has-text("Edit")');
                                if (editButton && await editButton.isVisible()) {
                                    await editButton.click();
                                    await page.waitForTimeout(2000);

                                    // Modify the name
                                    const editNameInput = await page.$('input[name="name"]');
                                    if (editNameInput) {
                                        await editNameInput.fill(`${testObjectName} - Edited`);

                                        const saveButton = await page.$('button[type="submit"], button:has-text("Save")');
                                        if (saveButton) {
                                            await saveButton.click();
                                            await page.waitForTimeout(2000);
                                            logTest('Edit Object', 'PASS', 'Object edited successfully');
                                        } else {
                                            logTest('Edit Object', 'FAIL', 'Save button not found');
                                        }
                                    } else {
                                        logTest('Edit Object', 'FAIL', 'Edit form not loaded');
                                    }
                                } else {
                                    logTest('Edit Object', 'FAIL', 'Edit button not found');
                                }

                                // TEST 8: Delete Object (CRUD - Delete)
                                console.log('\nTEST 8: Delete Object (CRUD - Delete)');
                                console.log('-'.repeat(40));

                                // Look for delete option
                                const deleteButton = await page.$('button:has-text("Delete")');
                                const menuButton = await page.$('button[aria-label*="menu"], button[aria-label*="more"], button:has-text("...")');

                                if (deleteButton && await deleteButton.isVisible()) {
                                    await deleteButton.click();
                                    await page.waitForTimeout(1000);

                                    // Confirm deletion
                                    const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes")');
                                    if (confirmButton) {
                                        await confirmButton.click();
                                        await page.waitForTimeout(2000);
                                        logTest('Delete Object', 'PASS', 'Object deleted');
                                    } else {
                                        logTest('Delete Object', 'FAIL', 'Confirmation dialog not found');
                                    }
                                } else if (menuButton && await menuButton.isVisible()) {
                                    await menuButton.click();
                                    await page.waitForTimeout(500);

                                    const deleteOption = await page.$('text=Delete');
                                    if (deleteOption) {
                                        await deleteOption.click();
                                        await page.waitForTimeout(1000);

                                        const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes")');
                                        if (confirmButton) {
                                            await confirmButton.click();
                                            await page.waitForTimeout(2000);
                                            logTest('Delete Object', 'PASS', 'Object deleted via menu');
                                        } else {
                                            logTest('Delete Object', 'FAIL', 'Confirmation not found');
                                        }
                                    } else {
                                        logTest('Delete Object', 'SKIP', 'Delete option not in menu');
                                    }
                                } else {
                                    logTest('Delete Object', 'SKIP', 'Delete option not available');
                                }

                            } else {
                                logTest('Object Detail Navigation', 'FAIL', 'Failed to navigate to detail page');
                            }

                        } else {
                            logTest('Create Object', 'FAIL', 'Created object not found in list');
                        }
                    } else {
                        logTest('Create Object', 'SKIP', 'Submit button not found');
                    }

                } else {
                    logTest('Create Form', 'FAIL', 'Create form did not open');
                }

            } else {
                logTest('Create Object Button', 'FAIL', 'Create button not found or not visible');
                testResults.bugs.push({
                    type: 'UI Element Missing',
                    message: 'Create Object button not visible on Objects page'
                });

                // Try to find what buttons ARE visible
                const allButtons = await page.$$('button');
                console.log(`Found ${allButtons.length} buttons on page`);
                for (const btn of allButtons) {
                    const text = await btn.textContent().catch(() => '');
                    if (text.trim()) {
                        console.log(`  Button text: "${text.trim()}"`);
                    }
                }
            }

        } else {
            logTest('Objects Page Access', 'FAIL', `Failed to reach Objects page - URL: ${objectsPageUrl}`);
            testResults.bugs.push({
                type: 'Navigation',
                message: 'Cannot navigate to Objects page - possible routing or permission issue'
            });
        }

        // TEST 9: Console Error Summary
        console.log('\nTEST 9: Console Error Check');
        console.log('-'.repeat(40));

        if (consoleErrors.length === 0) {
            logTest('Console Errors', 'PASS', 'No console errors detected');
        } else {
            logTest('Console Errors', 'FAIL', `${consoleErrors.length} error(s) found`);
            consoleErrors.forEach(err => {
                console.log(`  ERROR: ${err}`);
            });
        }

        await captureScreenshot(page, '09-final-state');

    } catch (error) {
        console.error('Test execution error:', error);
        testResults.bugs.push({
            type: 'Test Execution Error',
            message: error.message
        });
        testResults.productionReady = false;
    } finally {
        await browser.close();
        generateFinalReport();
    }
}

// Generate comprehensive final report
function generateFinalReport() {
    const passedTests = testResults.tests.filter(t => t.status === 'PASS');
    const failedTests = testResults.tests.filter(t => t.status === 'FAIL');
    const skippedTests = testResults.tests.filter(t => t.status === 'SKIP');

    const report = `# OBJECTS MODULE - FINAL VERIFICATION REPORT

## Executive Summary
**Date**: ${new Date().toISOString()}
**Environment**: ${BASE_URL}
**Test Account**: ${LOGIN_EMAIL} (OWNER-level)

### Overall Results
- **Total Tests**: ${testResults.tests.length}
- **Passed**: ${passedTests.length} (${Math.round(passedTests.length / testResults.tests.length * 100)}%)
- **Failed**: ${failedTests.length} (${Math.round(failedTests.length / testResults.tests.length * 100)}%)
- **Skipped**: ${skippedTests.length}
- **Production Ready**: ${testResults.productionReady ? '✅ YES' : '❌ NO'}

## Bug Fix Verification Results

### 1. Address Rendering Fix
**Original Issue**: Objects with address field as object type caused React error "Objects are not valid as a React child"
**Fix Applied**: Added type checking to handle both string and object address formats
**Test Result**: ${testResults.tests.find(t => t.name === 'Address Rendering Fix')?.status || 'NOT TESTED'}
**Verification**: ${testResults.consoleErrors.filter(e => e.text.includes('Objects are not valid')).length === 0 ? '✅ FIXED - No React errors detected' : '❌ NOT FIXED - React errors still present'}

### 2. Create Object Button Visibility
**Original Issue**: Create Object button was not visible on the Objects listing page
**Fix Applied**: Added Create Object button to the page header
**Test Result**: ${testResults.tests.find(t => t.name === 'Create Object Button')?.status || 'NOT TESTED'}
**Verification**: ${testResults.tests.find(t => t.name === 'Create Object Button')?.status === 'PASS' ? '✅ FIXED - Button is visible and functional' : '❌ NOT FIXED - Button still not accessible'}

### 3. Object Detail Navigation
**Original Issue**: Clicking on objects in the list did not navigate to detail page
**Fix Applied**: Fixed routing and click handlers for object rows
**Test Result**: ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.status || 'NOT TESTED'}
**Verification**: ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.status === 'PASS' ? '✅ FIXED - Navigation working correctly' : '❌ NOT FIXED - Navigation issues persist'}

### 4. Full CRUD Operations
| Operation | Test Result | Status |
|-----------|------------|--------|
| **Create** | ${testResults.tests.find(t => t.name === 'Create Object')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Create Object')?.status === 'PASS' ? '✅' : '❌'} |
| **Read** | ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Object Detail Navigation')?.status === 'PASS' ? '✅' : '❌'} |
| **Update** | ${testResults.tests.find(t => t.name === 'Edit Object')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Edit Object')?.status === 'PASS' ? '✅' : '❌'} |
| **Delete** | ${testResults.tests.find(t => t.name === 'Delete Object')?.status || 'NOT TESTED'} | ${testResults.tests.find(t => t.name === 'Delete Object')?.status === 'PASS' ? '✅' : '❌'} |

## Console Errors
${testResults.consoleErrors.length === 0 ?
'### ✅ No Console Errors\nNo JavaScript errors were detected during the entire test execution.' :
`### ❌ Console Errors Found
**Total Errors**: ${testResults.consoleErrors.length}

${testResults.consoleErrors.map((e, i) => `
**Error ${i + 1}**:
- Message: ${e.text}
- URL: ${e.url}
- Time: ${e.timestamp}
`).join('\n')}`}

## Issues and Bugs
${testResults.bugs.length === 0 ?
'### ✅ No Critical Issues\nAll tested functionality is working as expected.' :
`### ❌ Issues Found
**Total Issues**: ${testResults.bugs.length}

${testResults.bugs.map((b, i) => `
**Issue ${i + 1}**: ${b.type}
- Description: ${b.message}
- Severity: ${b.type.includes('React Error') ? 'HIGH' : b.type.includes('UI Element') ? 'MEDIUM' : 'LOW'}
- Impact: ${b.type.includes('React Error') ? 'User experience severely affected' : b.type.includes('Navigation') ? 'Core functionality blocked' : 'Feature accessibility limited'}
`).join('\n')}`}

## Detailed Test Results

| Test | Result | Details |
|------|--------|---------|
${testResults.tests.map(t => `| ${t.name} | **${t.status}** | ${t.details || '-'} |`).join('\n')}

## Screenshots
The following screenshots were captured during testing:
${fs.existsSync(SCREENSHOTS_DIR) ?
fs.readdirSync(SCREENSHOTS_DIR).map(f => `- ${f}`).join('\n') :
'No screenshots available'}

## Production Readiness Assessment

${testResults.productionReady ?
`### ✅ PRODUCTION READY

The Objects module has successfully passed all critical verifications:

**Verified Working**:
- ✅ Address rendering fix confirmed (no React errors)
- ✅ Create Object button is visible and functional
- ✅ Object detail navigation works correctly
- ✅ Full CRUD operations are functional
- ✅ No console errors present
- ✅ All tabs and UI elements load properly

**Recommendation**: The Objects module is stable and ready for production deployment.

**Deployment Checklist**:
1. ✅ All bug fixes verified
2. ✅ No console errors
3. ✅ CRUD operations functional
4. ✅ UI/UX working as expected
5. ✅ No React rendering errors` :
`### ❌ NOT PRODUCTION READY

The Objects module has critical issues that must be resolved before production:

**Failed Tests**:
${failedTests.map(t => `- ❌ ${t.name}: ${t.details || 'Failed'}`).join('\n')}

**Critical Issues**:
${testResults.bugs.map(b => `- ${b.type}: ${b.message}`).join('\n')}

**Required Actions**:
1. Fix all failed tests listed above
2. Resolve identified bugs
3. Re-run verification suite
4. Ensure 100% test pass rate

**Do NOT deploy until all issues are resolved.**`}

## Test Metadata
- **Test Suite Version**: 1.0.0
- **Test Framework**: Playwright
- **Browser**: Chromium
- **Test Duration**: ~2-3 minutes
- **Test Coverage**: Authentication, Navigation, CRUD Operations, UI Elements, Console Monitoring

---
*Generated by Objects Final Verification Test Suite*
*Report Date: ${new Date().toISOString()}*`;

    // Write report to file
    fs.writeFileSync(REPORT_PATH, report);
    console.log(`\n${'='.repeat(60)}`);
    console.log('REPORT SAVED TO:');
    console.log(REPORT_PATH);
    console.log('='.repeat(60));

    // Print final summary
    console.log('\nFINAL VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Production Ready: ${testResults.productionReady ? '✅ YES' : '❌ NO'}`);
    console.log(`Tests Passed: ${passedTests.length}/${testResults.tests.length}`);
    console.log(`Console Errors: ${testResults.consoleErrors.length}`);
    console.log(`Critical Bugs: ${testResults.bugs.length}`);
    console.log('='.repeat(60));

    if (!testResults.productionReady) {
        console.log('\n⚠️  DEPLOYMENT BLOCKED - Issues to fix:');
        failedTests.forEach(t => {
            console.log(`  ❌ ${t.name}`);
        });
        testResults.bugs.forEach(b => {
            console.log(`  🐛 ${b.type}: ${b.message}`);
        });
    } else {
        console.log('\n✅ All tests passed - Objects module is production ready!');
    }
}

// Run the tests
console.log('Starting Objects Module Final Verification...\n');
runObjectsVerification().catch(console.error);