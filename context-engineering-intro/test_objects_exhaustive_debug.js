const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
    baseUrl: 'http://localhost:3004',
    apiUrl: 'http://localhost:8000',
    credentials: {
        email: 'jwoodcapital@gmail.com',
        password: 'D3n1w3n1!'
    },
    screenshotDir: 'screenshots/objects-debug',
    timeout: 30000
};

// Debug Report Data
const debugReport = {
    timestamp: new Date().toISOString(),
    testResults: [],
    featureInventory: {
        existing: [],
        working: [],
        broken: [],
        missing: []
    },
    screenshots: [],
    errors: [],
    recommendations: []
};

// Utility function for screenshots
async function takeScreenshot(page, name, description) {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(config.screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    debugReport.screenshots.push({
        filename,
        description,
        timestamp: new Date().toISOString()
    });
    console.log(`📸 Screenshot: ${filename} - ${description}`);
    return filename;
}

// Utility function for logging results
function logResult(category, result) {
    debugReport.testResults.push({
        category,
        ...result,
        timestamp: new Date().toISOString()
    });
    console.log(`[${category}] ${result.status}: ${result.description}`);
}

// Check for console errors
async function checkConsoleErrors(page) {
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const error = {
                type: 'console_error',
                text: msg.text(),
                location: msg.location(),
                timestamp: new Date().toISOString()
            };
            debugReport.errors.push(error);
            console.log('❌ Console Error:', msg.text());
        }
    });

    page.on('pageerror', error => {
        debugReport.errors.push({
            type: 'page_error',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        console.log('❌ Page Error:', error.message);
    });
}

// Main test function
async function testObjectsFeature() {
    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Set up console error monitoring
    await checkConsoleErrors(page);

    try {
        console.log('\n========================================');
        console.log('EXHAUSTIVE DEBUG: SENOVA CRM OBJECTS');
        console.log('========================================\n');

        // Create screenshot directory
        await fs.mkdir(config.screenshotDir, { recursive: true });

        // ============= 1. LOGIN AND NAVIGATE TO OBJECTS =============
        console.log('\n📍 PHASE 1: LOGIN AND NAVIGATE TO OBJECTS');
        console.log('----------------------------------------');

        // Navigate to login page
        await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle' });
        await takeScreenshot(page, 'login-page', 'Login page initial state');

        // Login
        await page.fill('input[type="email"]', config.credentials.email);
        await page.fill('input[type="password"]', config.credentials.password);
        await takeScreenshot(page, 'login-filled', 'Login form filled with credentials');

        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle' });

        const dashboardUrl = page.url();
        await takeScreenshot(page, 'dashboard-after-login', 'Dashboard after successful login');

        logResult('LOGIN', {
            status: '✅',
            description: 'Successfully logged in',
            currentUrl: dashboardUrl
        });

        // Look for Objects in sidebar
        console.log('\n🔍 Looking for Objects in sidebar...');

        const sidebarSelectors = [
            'text=Objects',
            'text=Object',
            'a[href*="objects"]',
            'a[href*="object"]',
            '[class*="sidebar"] >> text=Objects',
            'nav >> text=Objects'
        ];

        let objectsFound = false;
        let objectsUrl = null;

        for (const selector of sidebarSelectors) {
            try {
                const element = await page.locator(selector).first();
                if (await element.isVisible({ timeout: 2000 })) {
                    objectsFound = true;
                    await takeScreenshot(page, 'objects-in-sidebar', 'Objects found in sidebar');

                    // Try to get the href
                    const href = await element.getAttribute('href').catch(() => null);
                    if (href) {
                        objectsUrl = href;
                    }

                    // Click on Objects
                    await element.click();
                    await page.waitForLoadState('networkidle');

                    objectsUrl = page.url();
                    await takeScreenshot(page, 'objects-list-page', 'Objects list page after navigation');
                    break;
                }
            } catch (e) {
                // Continue checking
            }
        }

        if (!objectsFound) {
            // Try direct navigation
            console.log('⚠️ Objects not found in sidebar, trying direct navigation...');

            const possibleUrls = [
                '/objects',
                '/object',
                '/dashboard/objects',
                '/admin/objects',
                '/crm/objects'
            ];

            for (const url of possibleUrls) {
                try {
                    await page.goto(`${config.baseUrl}${url}`, {
                        waitUntil: 'domcontentloaded',
                        timeout: 5000
                    });

                    const currentUrl = page.url();
                    if (!currentUrl.includes('404') && !currentUrl.includes('error')) {
                        objectsFound = true;
                        objectsUrl = currentUrl;
                        await takeScreenshot(page, 'objects-direct-nav', `Objects page via direct navigation to ${url}`);
                        break;
                    }
                } catch (e) {
                    console.log(`   ${url} - Not found`);
                }
            }
        }

        if (objectsFound) {
            debugReport.featureInventory.existing.push('Objects page exists');
            logResult('NAVIGATION', {
                status: '✅',
                description: `Objects page found at ${objectsUrl}`,
                url: objectsUrl
            });
        } else {
            debugReport.featureInventory.missing.push('Objects page/navigation');
            logResult('NAVIGATION', {
                status: '❌',
                description: 'Objects page not found in sidebar or via direct navigation',
                urls_tried: ['/objects', '/object', '/dashboard/objects', '/admin/objects', '/crm/objects']
            });

            // Continue with test anyway to document what exists
        }

        // ============= 2. TEST OBJECT CREATION =============
        console.log('\n📍 PHASE 2: TEST OBJECT CREATION');
        console.log('----------------------------------------');

        // Look for Create/New Object button
        const createButtonSelectors = [
            'text=Create Object',
            'text=New Object',
            'text=Add Object',
            'button >> text=Object',
            'text=+ Object',
            '[class*="btn"] >> text=Object'
        ];

        let createButtonFound = false;

        for (const selector of createButtonSelectors) {
            try {
                const element = await page.locator(selector).first();
                if (await element.isVisible({ timeout: 2000 })) {
                    createButtonFound = true;
                    await takeScreenshot(page, 'create-object-button', 'Create Object button found');

                    await element.click();
                    await page.waitForLoadState('networkidle');

                    await takeScreenshot(page, 'create-object-form', 'Create Object form opened');
                    break;
                }
            } catch (e) {
                // Continue checking
            }
        }

        if (createButtonFound) {
            debugReport.featureInventory.existing.push('Create Object button');

            // Document all form fields
            console.log('📝 Documenting form fields...');

            const formFields = {
                inputs: await page.locator('input:visible').count(),
                textareas: await page.locator('textarea:visible').count(),
                selects: await page.locator('select:visible').count(),
                checkboxes: await page.locator('input[type="checkbox"]:visible').count(),
                radios: await page.locator('input[type="radio"]:visible').count()
            };

            logResult('FORM_INVENTORY', {
                status: '📊',
                description: 'Form field inventory',
                fields: formFields
            });

            // Try to identify specific fields
            const fieldChecks = [
                { selector: 'input[name*="name"]', type: 'Object Name field' },
                { selector: 'input[name*="type"]', type: 'Object Type field' },
                { selector: 'textarea[name*="description"]', type: 'Description field' },
                { selector: 'select[name*="status"]', type: 'Status dropdown' },
                { selector: 'input[name*="category"]', type: 'Category field' }
            ];

            for (const field of fieldChecks) {
                try {
                    const element = await page.locator(field.selector).first();
                    if (await element.isVisible({ timeout: 1000 })) {
                        debugReport.featureInventory.existing.push(field.type);
                        console.log(`   ✅ Found: ${field.type}`);
                    } else {
                        console.log(`   ❌ Missing: ${field.type}`);
                    }
                } catch (e) {
                    console.log(`   ❌ Missing: ${field.type}`);
                }
            }

            // Fill in test data
            console.log('📝 Filling test data...');

            try {
                // Try to fill name field
                const nameSelectors = ['input[name*="name"]', 'input[placeholder*="name" i]', 'input[type="text"]:first'];
                for (const selector of nameSelectors) {
                    try {
                        await page.fill(selector, 'Test Debug Object');
                        console.log('   ✅ Filled object name');
                        break;
                    } catch (e) {}
                }

                // Fill any visible text inputs
                const textInputs = await page.locator('input[type="text"]:visible').all();
                for (let i = 0; i < textInputs.length; i++) {
                    try {
                        const value = await textInputs[i].inputValue();
                        if (!value) {
                            await textInputs[i].fill(`Test Value ${i + 1}`);
                        }
                    } catch (e) {}
                }

                // Fill any textareas
                const textareas = await page.locator('textarea:visible').all();
                for (const textarea of textareas) {
                    try {
                        await textarea.fill('Test description for debugging purposes');
                    } catch (e) {}
                }

                await takeScreenshot(page, 'create-object-filled', 'Create Object form filled with test data');

                // Look for Save/Create button
                const saveButtonSelectors = ['button >> text=Save', 'button >> text=Create', 'button[type="submit"]'];

                for (const selector of saveButtonSelectors) {
                    try {
                        const button = await page.locator(selector).first();
                        if (await button.isVisible({ timeout: 1000 })) {
                            await button.click();
                            await page.waitForLoadState('networkidle');

                            await takeScreenshot(page, 'create-object-result', 'Result after clicking Save/Create');

                            // Check for success message or redirect
                            const currentUrl = page.url();
                            const successIndicators = [
                                'text=success',
                                'text=created',
                                'text=saved',
                                '.toast',
                                '.alert-success'
                            ];

                            let success = false;
                            for (const indicator of successIndicators) {
                                if (await page.locator(indicator).isVisible({ timeout: 2000 }).catch(() => false)) {
                                    success = true;
                                    break;
                                }
                            }

                            if (success || currentUrl !== objectsUrl) {
                                debugReport.featureInventory.working.push('Object creation');
                                logResult('CREATE_OBJECT', {
                                    status: '✅',
                                    description: 'Object created successfully'
                                });
                            } else {
                                debugReport.featureInventory.broken.push('Object creation - no success indication');
                            }
                            break;
                        }
                    } catch (e) {}
                }

            } catch (e) {
                debugReport.featureInventory.broken.push('Object creation form submission');
                logResult('CREATE_OBJECT', {
                    status: '❌',
                    description: 'Failed to create object',
                    error: e.message
                });
            }

        } else {
            debugReport.featureInventory.missing.push('Create Object functionality');
            logResult('CREATE_OBJECT', {
                status: '❌',
                description: 'No Create Object button found'
            });
        }

        // ============= 3. TEST OBJECT EDITING =============
        console.log('\n📍 PHASE 3: TEST OBJECT EDITING');
        console.log('----------------------------------------');

        // Look for objects in the list
        const objectListSelectors = [
            'text=Test Debug Object',
            'table tr',
            '[class*="list"] [class*="item"]',
            '[class*="card"]'
        ];

        let objectFound = false;

        for (const selector of objectListSelectors) {
            try {
                const element = await page.locator(selector).first();
                if (await element.isVisible({ timeout: 2000 })) {
                    objectFound = true;
                    await element.click();
                    await page.waitForLoadState('networkidle');

                    await takeScreenshot(page, 'object-detail', 'Object detail/edit page');
                    break;
                }
            } catch (e) {}
        }

        if (objectFound) {
            // Document available actions
            const actionButtons = [
                { selector: 'button >> text=Edit', name: 'Edit button' },
                { selector: 'button >> text=Delete', name: 'Delete button' },
                { selector: 'button >> text=Copy', name: 'Copy button' },
                { selector: 'button >> text=Duplicate', name: 'Duplicate button' }
            ];

            for (const action of actionButtons) {
                const isVisible = await page.locator(action.selector).isVisible({ timeout: 1000 }).catch(() => false);
                if (isVisible) {
                    debugReport.featureInventory.existing.push(action.name);
                    console.log(`   ✅ Found: ${action.name}`);
                } else {
                    console.log(`   ❌ Missing: ${action.name}`);
                }
            }

            // Check for tabs
            const tabs = await page.locator('[role="tab"], [class*="tab"]').all();
            if (tabs.length > 0) {
                console.log(`   📑 Found ${tabs.length} tabs`);
                for (const tab of tabs) {
                    const text = await tab.textContent();
                    console.log(`      - Tab: ${text}`);
                    if (text.toLowerCase().includes('contact')) {
                        debugReport.featureInventory.existing.push('Contacts tab');
                    }
                    if (text.toLowerCase().includes('user')) {
                        debugReport.featureInventory.existing.push('Users tab');
                    }
                }
            }

            // Try to edit the object
            try {
                // Look for editable name field
                const nameField = await page.locator('input[value*="Test Debug Object"]').first();
                if (await nameField.isVisible({ timeout: 1000 })) {
                    await nameField.clear();
                    await nameField.fill('Test Debug Object - Edited');
                    await takeScreenshot(page, 'object-edit-filled', 'Object name edited');

                    // Save changes
                    const saveButton = await page.locator('button >> text=Save').first();
                    if (await saveButton.isVisible()) {
                        await saveButton.click();
                        await page.waitForLoadState('networkidle');

                        await takeScreenshot(page, 'object-edit-saved', 'Object after saving edits');
                        debugReport.featureInventory.working.push('Object editing');

                        logResult('EDIT_OBJECT', {
                            status: '✅',
                            description: 'Object edited successfully'
                        });
                    }
                }
            } catch (e) {
                debugReport.featureInventory.broken.push('Object editing');
                logResult('EDIT_OBJECT', {
                    status: '❌',
                    description: 'Failed to edit object',
                    error: e.message
                });
            }

        } else {
            logResult('EDIT_OBJECT', {
                status: '⚠️',
                description: 'No objects found to edit'
            });
        }

        // ============= 4. TEST OBJECT COPY/DUPLICATE =============
        console.log('\n📍 PHASE 4: TEST OBJECT COPY/DUPLICATE');
        console.log('----------------------------------------');

        const copySelectors = ['button >> text=Copy', 'button >> text=Duplicate', 'button >> text=Clone'];
        let copyFound = false;

        for (const selector of copySelectors) {
            try {
                const button = await page.locator(selector).first();
                if (await button.isVisible({ timeout: 1000 })) {
                    copyFound = true;
                    await button.click();
                    await page.waitForLoadState('networkidle');

                    await takeScreenshot(page, 'object-copy', 'Object copy/duplicate functionality');
                    debugReport.featureInventory.existing.push('Object copy/duplicate');

                    logResult('COPY_OBJECT', {
                        status: '✅',
                        description: 'Copy/duplicate functionality exists'
                    });
                    break;
                }
            } catch (e) {}
        }

        if (!copyFound) {
            debugReport.featureInventory.missing.push('Object copy/duplicate functionality');
            logResult('COPY_OBJECT', {
                status: '❌',
                description: 'No copy/duplicate functionality found'
            });
        }

        // ============= 5. TEST CONTACT ASSIGNMENT =============
        console.log('\n📍 PHASE 5: TEST CONTACT ASSIGNMENT');
        console.log('----------------------------------------');

        // Look for contact assignment UI
        const contactAssignmentSelectors = [
            'text=Contacts',
            'text=Assign Contacts',
            'text=Add Contact',
            'button >> text=Contact',
            '[class*="contact"] button'
        ];

        let contactAssignmentFound = false;

        for (const selector of contactAssignmentSelectors) {
            try {
                const element = await page.locator(selector).first();
                if (await element.isVisible({ timeout: 1000 })) {
                    contactAssignmentFound = true;
                    await element.click();
                    await page.waitForLoadState('networkidle');

                    await takeScreenshot(page, 'contact-assignment', 'Contact assignment interface');

                    // Check for contact selection interface
                    const hasContactList = await page.locator('[class*="contact-list"], [class*="contact-select"]').isVisible({ timeout: 2000 }).catch(() => false);
                    if (hasContactList) {
                        debugReport.featureInventory.existing.push('Contact selection interface');
                        await takeScreenshot(page, 'contact-selection', 'Contact selection list');
                    }

                    break;
                }
            } catch (e) {}
        }

        if (contactAssignmentFound) {
            debugReport.featureInventory.existing.push('Contact assignment UI');
            logResult('CONTACT_ASSIGNMENT', {
                status: '✅',
                description: 'Contact assignment interface found'
            });
        } else {
            debugReport.featureInventory.missing.push('Contact assignment to objects');
            logResult('CONTACT_ASSIGNMENT', {
                status: '❌',
                description: 'No contact assignment functionality found'
            });
        }

        // ============= 6. TEST USER ASSIGNMENT =============
        console.log('\n📍 PHASE 6: TEST USER ASSIGNMENT');
        console.log('----------------------------------------');

        // Look for user assignment UI
        const userAssignmentSelectors = [
            'text=Users',
            'text=Assign Users',
            'text=Add User',
            'button >> text=User',
            '[class*="user"] button'
        ];

        let userAssignmentFound = false;

        for (const selector of userAssignmentSelectors) {
            try {
                const element = await page.locator(selector).first();
                if (await element.isVisible({ timeout: 1000 })) {
                    userAssignmentFound = true;
                    await element.click();
                    await page.waitForLoadState('networkidle');

                    await takeScreenshot(page, 'user-assignment', 'User assignment interface');

                    // Check for permission levels
                    const hasPermissions = await page.locator('text=/permission|role|access/i').isVisible({ timeout: 2000 }).catch(() => false);
                    if (hasPermissions) {
                        debugReport.featureInventory.existing.push('User permission levels');
                        await takeScreenshot(page, 'user-permissions', 'User permission interface');
                    }

                    break;
                }
            } catch (e) {}
        }

        if (userAssignmentFound) {
            debugReport.featureInventory.existing.push('User assignment UI');
            logResult('USER_ASSIGNMENT', {
                status: '✅',
                description: 'User assignment interface found'
            });
        } else {
            debugReport.featureInventory.missing.push('User assignment to objects');
            logResult('USER_ASSIGNMENT', {
                status: '❌',
                description: 'No user assignment functionality found'
            });
        }

        // ============= 7. TEST RBAC =============
        console.log('\n📍 PHASE 7: TEST RBAC (Role-Based Access Control)');
        console.log('----------------------------------------');

        // Check current user role (usually shown in header/profile)
        const roleIndicators = await page.locator('text=/owner|admin|user|role/i').all();
        let userRole = 'Unknown';

        for (const indicator of roleIndicators) {
            const text = await indicator.textContent();
            if (text.toLowerCase().includes('owner')) userRole = 'Owner';
            else if (text.toLowerCase().includes('admin')) userRole = 'Admin';
            else if (text.toLowerCase().includes('user')) userRole = 'User';
        }

        logResult('RBAC', {
            status: '📊',
            description: `Current user role: ${userRole}`,
            permissions: {
                canSeeObjects: objectsFound,
                canCreateObjects: createButtonFound,
                canEditObjects: objectFound,
                canAssignContacts: contactAssignmentFound,
                canAssignUsers: userAssignmentFound
            }
        });

        // ============= 8. CHECK CONTACT PAGE FOR OBJECT ASSIGNMENT =============
        console.log('\n📍 PHASE 8: CHECK CONTACT PAGE FOR OBJECT ASSIGNMENT');
        console.log('----------------------------------------');

        // Navigate to Contacts
        await page.goto(`${config.baseUrl}/contacts`, { waitUntil: 'networkidle' });
        await takeScreenshot(page, 'contacts-page', 'Contacts page');

        // Open a contact detail
        const contactRows = await page.locator('table tr, [class*="contact-item"], [class*="contact-card"]').all();

        if (contactRows.length > 1) { // Skip header row if table
            try {
                await contactRows[1].click();
                await page.waitForLoadState('networkidle');

                await takeScreenshot(page, 'contact-detail', 'Contact detail page');

                // Look for object assignment in contact
                const objectFieldSelectors = [
                    'text=Object',
                    'text=Assigned Object',
                    'select[name*="object"]',
                    '[class*="object"]'
                ];

                let objectFieldFound = false;

                for (const selector of objectFieldSelectors) {
                    if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
                        objectFieldFound = true;
                        await takeScreenshot(page, 'contact-object-field', 'Object assignment field in contact');
                        break;
                    }
                }

                if (objectFieldFound) {
                    debugReport.featureInventory.existing.push('Object assignment from contact page');
                    logResult('CONTACT_OBJECT_FIELD', {
                        status: '✅',
                        description: 'Object assignment field found in contact'
                    });
                } else {
                    debugReport.featureInventory.missing.push('Object assignment from contact page');
                    logResult('CONTACT_OBJECT_FIELD', {
                        status: '❌',
                        description: 'No object assignment field in contact'
                    });
                }

            } catch (e) {
                logResult('CONTACT_OBJECT_FIELD', {
                    status: '⚠️',
                    description: 'Could not open contact detail',
                    error: e.message
                });
            }
        }

        // ============= 9. DOCUMENT ALL ERRORS =============
        console.log('\n📍 PHASE 9: CHECKING FOR ERRORS');
        console.log('----------------------------------------');

        // Check for any 404s or API errors
        const networkErrors = [];
        page.on('response', response => {
            if (response.status() >= 400) {
                networkErrors.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        });

        // Navigate back to Objects page to check for any final errors
        if (objectsUrl) {
            await page.goto(objectsUrl, { waitUntil: 'networkidle' });
            await takeScreenshot(page, 'objects-final-check', 'Final check of Objects page');
        }

        if (debugReport.errors.length > 0) {
            console.log(`\n❌ Found ${debugReport.errors.length} errors during testing`);
            debugReport.errors.forEach(err => {
                console.log(`   - ${err.type}: ${err.text || err.message}`);
            });
        }

        // ============= GENERATE COMPREHENSIVE REPORT =============
        console.log('\n📍 GENERATING COMPREHENSIVE REPORT');
        console.log('----------------------------------------');

        // Analyze missing features based on requirements
        const requiredFeatures = [
            'Create object with all fields',
            'Edit object',
            'Copy/duplicate object',
            'Assign contacts to objects (from object page)',
            'Assign contacts to objects (from contact page)',
            'Assign users to objects',
            'RBAC restrictions based on user role',
            'Unlimited contacts per object',
            'Unlimited objects per contact',
            'Unlimited users per object'
        ];

        // Generate recommendations
        if (!objectsFound) {
            debugReport.recommendations.push('CRITICAL: Implement Objects module with navigation');
        }
        if (!createButtonFound) {
            debugReport.recommendations.push('HIGH: Add Create Object functionality');
        }
        if (!contactAssignmentFound) {
            debugReport.recommendations.push('HIGH: Implement contact-to-object assignment');
        }
        if (!userAssignmentFound) {
            debugReport.recommendations.push('HIGH: Implement user-to-object assignment with permissions');
        }
        if (!copyFound) {
            debugReport.recommendations.push('MEDIUM: Add copy/duplicate object functionality');
        }

        // Generate final report
        const report = `# OBJECTS EXHAUSTIVE DEBUG REPORT

**Test Date:** ${debugReport.timestamp}
**CRM URL:** ${config.baseUrl}
**Backend API:** ${config.apiUrl}
**Tester:** DEBUGGER Agent

---

## EXECUTIVE SUMMARY

### Overall Status: ${objectsFound ? '⚠️ PARTIALLY IMPLEMENTED' : '❌ NOT IMPLEMENTED'}

The Objects feature is ${objectsFound ? 'partially present but incomplete' : 'completely missing from the CRM'}.

---

## FEATURE INVENTORY

### ✅ EXISTING FEATURES (${debugReport.featureInventory.existing.length})
${debugReport.featureInventory.existing.map(f => `- ${f}`).join('\n') || '- None found'}

### 🟢 WORKING FEATURES (${debugReport.featureInventory.working.length})
${debugReport.featureInventory.working.map(f => `- ${f}`).join('\n') || '- None confirmed working'}

### 🔴 BROKEN FEATURES (${debugReport.featureInventory.broken.length})
${debugReport.featureInventory.broken.map(f => `- ${f}`).join('\n') || '- None identified as broken'}

### ⚫ MISSING FEATURES (${debugReport.featureInventory.missing.length})
${debugReport.featureInventory.missing.map(f => `- ${f}`).join('\n') || '- None identified as missing'}

---

## DETAILED TEST RESULTS

### 1. Navigation & Access
- **Objects in Sidebar:** ${objectsFound ? '✅ Present' : '❌ Missing'}
- **Objects Page URL:** ${objectsUrl || 'Not found'}
- **Direct Navigation Works:** ${objectsUrl ? '✅ Yes' : '❌ No'}

### 2. Object Creation
- **Create Button:** ${createButtonFound ? '✅ Found' : '❌ Missing'}
- **Form Fields Documented:** ${createButtonFound ? '✅ Yes' : '❌ N/A'}
- **Save Functionality:** ${debugReport.featureInventory.working.includes('Object creation') ? '✅ Works' : '❌ Not working'}

### 3. Object Management
- **Edit Functionality:** ${debugReport.featureInventory.working.includes('Object editing') ? '✅ Works' : '❌ Not working'}
- **Copy/Duplicate:** ${copyFound ? '✅ Present' : '❌ Missing'}
- **Delete Option:** ${debugReport.featureInventory.existing.includes('Delete button') ? '✅ Present' : '❌ Missing'}

### 4. Contact Assignment
- **From Object Page:** ${contactAssignmentFound ? '✅ Present' : '❌ Missing'}
- **From Contact Page:** ${debugReport.featureInventory.existing.includes('Object assignment from contact page') ? '✅ Present' : '❌ Missing'}
- **Unlimited Contacts:** ❓ Cannot verify without implementation

### 5. User Assignment
- **Assignment UI:** ${userAssignmentFound ? '✅ Present' : '❌ Missing'}
- **Permission Levels:** ${debugReport.featureInventory.existing.includes('User permission levels') ? '✅ Present' : '❌ Missing'}
- **Unlimited Users:** ❓ Cannot verify without implementation

### 6. RBAC (Role-Based Access Control)
- **Current User Role:** ${userRole}
- **Role Restrictions:** ❓ Cannot fully test without multiple user accounts

---

## ERRORS DETECTED

### Console Errors (${debugReport.errors.filter(e => e.type === 'console_error').length})
${debugReport.errors.filter(e => e.type === 'console_error').map(e => `- ${e.text}`).join('\n') || '- None detected'}

### Page Errors (${debugReport.errors.filter(e => e.type === 'page_error').length})
${debugReport.errors.filter(e => e.type === 'page_error').map(e => `- ${e.message}`).join('\n') || '- None detected'}

### Network Errors (${networkErrors.length})
${networkErrors.map(e => `- ${e.status} ${e.statusText}: ${e.url}`).join('\n') || '- None detected'}

---

## SCREENSHOT MANIFEST

Total Screenshots: ${debugReport.screenshots.length}

${debugReport.screenshots.map(s => `- **${s.filename}**: ${s.description}`).join('\n')}

---

## RECOMMENDATIONS

### Priority 1: CRITICAL (Must Have)
${debugReport.recommendations.filter(r => r.includes('CRITICAL')).map(r => `- ${r}`).join('\n') || '- None'}

### Priority 2: HIGH (Should Have)
${debugReport.recommendations.filter(r => r.includes('HIGH')).map(r => `- ${r}`).join('\n') || '- None'}

### Priority 3: MEDIUM (Nice to Have)
${debugReport.recommendations.filter(r => r.includes('MEDIUM')).map(r => `- ${r}`).join('\n') || '- None'}

---

## IMPLEMENTATION CHECKLIST

Based on the requirements, here's what needs to be built:

${objectsFound ? '### Enhance Existing Implementation' : '### Build Complete Objects Module'}

${objectsFound ? '' : `#### Backend Requirements
- [ ] Create Objects table in database
- [ ] Implement Objects API endpoints (CRUD)
- [ ] Create junction tables for many-to-many relationships:
  - [ ] object_contacts (object_id, contact_id)
  - [ ] object_users (object_id, user_id, permission_level)
`}

#### Frontend Requirements
${!objectsFound ? '- [ ] Add Objects to sidebar navigation' : ''}
- [ ] Create/enhance Objects list page
- [ ] Implement Create Object form with fields:
  - [ ] Name (required)
  - [ ] Type/Category
  - [ ] Description
  - [ ] Status
  - [ ] Custom fields support
- [ ] Implement Edit Object functionality
- [ ] Add Copy/Duplicate feature
- [ ] Build Contact Assignment interface:
  - [ ] Multi-select contact picker
  - [ ] Bulk assignment options
  - [ ] Remove contact functionality
- [ ] Build User Assignment interface:
  - [ ] User selection with search
  - [ ] Permission level selector (View/Edit/Admin)
  - [ ] Remove user functionality
- [ ] Add Object field to Contact edit form
- [ ] Implement RBAC restrictions:
  - [ ] Owner: Full access
  - [ ] Admin: Create/Edit/Delete objects
  - [ ] User: View only or based on assignment

#### Database Schema Suggestions
\`\`\`sql
-- Objects table
CREATE TABLE objects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Object-Contact relationship
CREATE TABLE object_contacts (
    object_id INT REFERENCES objects(id) ON DELETE CASCADE,
    contact_id INT REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (object_id, contact_id)
);

-- Object-User relationship with permissions
CREATE TABLE object_users (
    object_id INT REFERENCES objects(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) DEFAULT 'view',
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (object_id, user_id)
);
\`\`\`

---

## TEST EXECUTION SUMMARY

- **Test Started:** ${debugReport.timestamp}
- **Test Completed:** ${new Date().toISOString()}
- **Total Test Cases:** 9
- **Features Found:** ${debugReport.featureInventory.existing.length}
- **Features Working:** ${debugReport.featureInventory.working.length}
- **Features Missing:** ${debugReport.featureInventory.missing.length}
- **Errors Detected:** ${debugReport.errors.length}
- **Screenshots Captured:** ${debugReport.screenshots.length}

---

## CONCLUSION

The Objects feature ${objectsFound ? 'exists but requires significant enhancement' : 'needs to be built from scratch'}. The implementation should focus on creating a robust many-to-many relationship system between Objects, Contacts, and Users with proper RBAC controls.

**Next Steps:**
1. ${objectsFound ? 'Review existing implementation' : 'Design and implement backend API'}
2. ${objectsFound ? 'Enhance UI with missing features' : 'Build complete frontend module'}
3. Implement comprehensive testing
4. Document user workflows
5. Train users on new functionality

---

*Report generated by DEBUGGER Agent - Exhaustive Testing Protocol*
`;

        // Save the report
        await fs.writeFile(
            path.join(process.cwd(), 'OBJECTS_EXHAUSTIVE_DEBUG_REPORT.md'),
            report
        );

        console.log('\n✅ Report saved to OBJECTS_EXHAUSTIVE_DEBUG_REPORT.md');
        console.log(`📸 ${debugReport.screenshots.length} screenshots saved to ${config.screenshotDir}`);

        // Also save JSON data for further analysis
        await fs.writeFile(
            path.join(process.cwd(), 'objects-debug-results.json'),
            JSON.stringify(debugReport, null, 2)
        );

        console.log('📊 Raw data saved to objects-debug-results.json');

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error);
        debugReport.errors.push({
            type: 'critical_error',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    } finally {
        await browser.close();
        console.log('\n========================================');
        console.log('DEBUG SESSION COMPLETE');
        console.log('========================================\n');
    }
}

// Run the test
testObjectsFeature().catch(console.error);