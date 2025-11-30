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
    timeout: 10000  // Shorter timeout
};

// Debug Report Data
const debugReport = {
    timestamp: new Date().toISOString(),
    findings: [],
    screenshots: []
};

// Utility function for screenshots
async function takeScreenshot(page, name, description) {
    try {
        const filename = `${name}-${Date.now()}.png`;
        const filepath = path.join(config.screenshotDir, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        debugReport.screenshots.push({ filename, description });
        console.log(`📸 Screenshot: ${filename} - ${description}`);
        return filename;
    } catch (e) {
        console.log(`⚠️ Failed to capture screenshot: ${name}`);
    }
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

    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log('❌ Console Error:', msg.text());
        }
    });

    try {
        console.log('\n========================================');
        console.log('OBJECTS FEATURE - QUICK DEBUG');
        console.log('========================================\n');

        // Create screenshot directory
        await fs.mkdir(config.screenshotDir, { recursive: true });

        // ============= LOGIN =============
        console.log('📍 STEP 1: LOGIN');
        await page.goto(`${config.baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.fill('input[type="email"]', config.credentials.email);
        await page.fill('input[type="password"]', config.credentials.password);
        await page.click('button[type="submit"]');

        try {
            await page.waitForURL('**/dashboard/**', { timeout: 5000 });
            console.log('✅ Logged in successfully');
        } catch {
            await page.waitForTimeout(2000);
        }

        await takeScreenshot(page, 'after-login', 'After login');

        // ============= CHECK SIDEBAR FOR OBJECTS =============
        console.log('\n📍 STEP 2: LOOKING FOR OBJECTS IN SIDEBAR');

        let objectsFound = false;
        let objectsUrl = null;

        // Check for Objects in sidebar
        const sidebarItems = await page.locator('aside a, nav a, [class*="sidebar"] a').all();

        for (const item of sidebarItems) {
            try {
                const text = await item.textContent();
                if (text && text.toLowerCase().includes('object')) {
                    objectsFound = true;
                    const href = await item.getAttribute('href');
                    console.log(`✅ Found "Objects" in sidebar: ${text.trim()}`);
                    debugReport.findings.push(`Objects link in sidebar: "${text.trim()}" -> ${href}`);

                    // Click on Objects
                    await item.click();
                    await page.waitForTimeout(2000);
                    objectsUrl = page.url();
                    await takeScreenshot(page, 'objects-page', 'Objects page after clicking sidebar');
                    break;
                }
            } catch (e) {}
        }

        if (!objectsFound) {
            console.log('❌ Objects NOT found in sidebar');
            debugReport.findings.push('MISSING: Objects link in sidebar navigation');
        }

        // ============= TRY DIRECT NAVIGATION =============
        console.log('\n📍 STEP 3: TRYING DIRECT NAVIGATION TO OBJECTS');

        const urlsToTry = ['/objects', '/dashboard/objects', '/admin/objects'];

        for (const url of urlsToTry) {
            try {
                console.log(`   Trying ${config.baseUrl}${url}...`);
                await page.goto(`${config.baseUrl}${url}`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 5000
                });

                const currentUrl = page.url();
                const pageTitle = await page.title();
                const hasContent = await page.locator('h1, h2, h3').first().textContent().catch(() => null);

                if (!currentUrl.includes('404') && !currentUrl.includes('error')) {
                    console.log(`   ✅ ${url} loaded: ${pageTitle}`);
                    debugReport.findings.push(`Direct navigation to ${url} works - Title: ${pageTitle}`);
                    await takeScreenshot(page, `objects-direct-${url.replace(/\//g, '-')}`, `Direct navigation to ${url}`);
                    objectsUrl = currentUrl;
                    objectsFound = true;
                } else {
                    console.log(`   ❌ ${url} - 404 or error`);
                }
            } catch (e) {
                console.log(`   ❌ ${url} - Failed to load`);
            }
        }

        // ============= CHECK CURRENT PAGE CONTENT =============
        console.log('\n📍 STEP 4: ANALYZING CURRENT PAGE CONTENT');

        if (objectsUrl) {
            // Check for Create button
            const createButtons = [
                'button:has-text("Create")',
                'button:has-text("New")',
                'button:has-text("Add")',
                'a:has-text("Create")',
                'a:has-text("New")'
            ];

            for (const selector of createButtons) {
                const button = await page.locator(selector).first();
                if (await button.isVisible().catch(() => false)) {
                    const text = await button.textContent();
                    console.log(`✅ Found button: "${text}"`);
                    debugReport.findings.push(`Create/Add button found: "${text}"`);
                    await takeScreenshot(page, 'create-button', 'Create/Add button found');

                    // Try clicking it
                    try {
                        await button.click();
                        await page.waitForTimeout(2000);
                        await takeScreenshot(page, 'after-create-click', 'After clicking create button');

                        // Check if a form opened
                        const formFields = await page.locator('input:visible, textarea:visible, select:visible').count();
                        if (formFields > 0) {
                            console.log(`   📝 Form opened with ${formFields} fields`);
                            debugReport.findings.push(`Create form has ${formFields} visible fields`);
                        }
                    } catch (e) {
                        console.log('   ⚠️ Could not click create button');
                    }
                    break;
                }
            }

            // Check for existing objects in a list/table
            const tableRows = await page.locator('table tbody tr').count();
            const listItems = await page.locator('[class*="list"] [class*="item"]').count();
            const cards = await page.locator('[class*="card"]').count();

            if (tableRows > 0) {
                console.log(`📊 Found table with ${tableRows} rows`);
                debugReport.findings.push(`Objects displayed in table format: ${tableRows} rows`);
            }
            if (listItems > 0) {
                console.log(`📊 Found list with ${listItems} items`);
                debugReport.findings.push(`Objects displayed in list format: ${listItems} items`);
            }
            if (cards > 0) {
                console.log(`📊 Found ${cards} cards`);
                debugReport.findings.push(`Objects displayed as cards: ${cards} cards`);
            }

            // Check for tabs
            const tabs = await page.locator('[role="tab"], [class*="tab"]').all();
            if (tabs.length > 0) {
                console.log(`📑 Found ${tabs.length} tabs:`);
                for (const tab of tabs) {
                    const text = await tab.textContent();
                    console.log(`   - ${text}`);
                    debugReport.findings.push(`Tab found: "${text}"`);
                }
            }
        }

        // ============= CHECK CONTACTS PAGE =============
        console.log('\n📍 STEP 5: CHECKING CONTACTS PAGE FOR OBJECTS');

        try {
            await page.goto(`${config.baseUrl}/contacts`, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            await takeScreenshot(page, 'contacts-page', 'Contacts page');

            // Click on first contact if available
            const firstContact = await page.locator('table tbody tr, [class*="contact"]').first();
            if (await firstContact.isVisible().catch(() => false)) {
                await firstContact.click();
                await page.waitForTimeout(2000);
                await takeScreenshot(page, 'contact-detail', 'Contact detail page');

                // Look for object-related fields
                const objectFields = await page.locator('text=/object/i').all();
                if (objectFields.length > 0) {
                    console.log(`✅ Found ${objectFields.length} object-related fields in contact`);
                    debugReport.findings.push(`Contact page has ${objectFields.length} object-related fields`);
                } else {
                    console.log('❌ No object fields found in contact detail');
                    debugReport.findings.push('MISSING: Object assignment fields in contact detail');
                }
            }
        } catch (e) {
            console.log('⚠️ Could not check contacts page:', e.message);
        }

        // ============= CHECK API ENDPOINTS =============
        console.log('\n📍 STEP 6: CHECKING API ENDPOINTS');

        try {
            const apiEndpoints = [
                '/api/objects',
                '/api/object',
                '/objects',
                '/object'
            ];

            for (const endpoint of apiEndpoints) {
                try {
                    const response = await page.evaluate(async (url) => {
                        try {
                            const res = await fetch(url, {
                                credentials: 'include',
                                headers: {
                                    'Accept': 'application/json'
                                }
                            });
                            return {
                                status: res.status,
                                ok: res.ok,
                                url: res.url
                            };
                        } catch (e) {
                            return { error: e.message };
                        }
                    }, `${config.apiUrl}${endpoint}`);

                    if (response.ok) {
                        console.log(`✅ API endpoint ${endpoint}: ${response.status}`);
                        debugReport.findings.push(`API endpoint working: ${endpoint} (${response.status})`);
                    } else if (response.status) {
                        console.log(`❌ API endpoint ${endpoint}: ${response.status}`);
                    }
                } catch (e) {}
            }
        } catch (e) {
            console.log('⚠️ Could not check API endpoints');
        }

        // ============= GENERATE SUMMARY =============
        console.log('\n========================================');
        console.log('SUMMARY OF FINDINGS');
        console.log('========================================\n');

        const hasObjectsModule = objectsFound;
        const hasCreateFunction = debugReport.findings.some(f => f.includes('Create') || f.includes('Add'));
        const hasContactIntegration = debugReport.findings.some(f => f.includes('object-related fields'));
        const hasApiEndpoint = debugReport.findings.some(f => f.includes('API endpoint working'));

        console.log('FEATURE STATUS:');
        console.log(`- Objects Module: ${hasObjectsModule ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`- Create Function: ${hasCreateFunction ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`- Contact Integration: ${hasContactIntegration ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`- API Backend: ${hasApiEndpoint ? '✅ EXISTS' : '❌ MISSING'}`);

        console.log('\nCONSOLE ERRORS:', consoleErrors.length || 'None');

        // Generate report
        const report = `# OBJECTS FEATURE - DEBUG REPORT

**Test Date:** ${debugReport.timestamp}
**CRM URL:** ${config.baseUrl}

## QUICK ASSESSMENT

| Component | Status |
|-----------|--------|
| Objects in Sidebar | ${objectsFound ? '✅ Found' : '❌ Missing'} |
| Objects Page | ${objectsUrl ? `✅ ${objectsUrl}` : '❌ Not accessible'} |
| Create/Add Button | ${hasCreateFunction ? '✅ Found' : '❌ Missing'} |
| Contact Integration | ${hasContactIntegration ? '✅ Found' : '❌ Missing'} |
| API Endpoints | ${hasApiEndpoint ? '✅ Working' : '❌ Not found'} |

## DETAILED FINDINGS

${debugReport.findings.map(f => `- ${f}`).join('\n')}

## CONSOLE ERRORS

${consoleErrors.length ? consoleErrors.map(e => `- ${e}`).join('\n') : 'No console errors detected'}

## SCREENSHOTS CAPTURED

${debugReport.screenshots.map(s => `- ${s.filename}: ${s.description}`).join('\n')}

## RECOMMENDATIONS

${!hasObjectsModule ? '1. **CRITICAL**: Implement Objects module with proper navigation\n' : ''}
${!hasCreateFunction ? '2. **HIGH**: Add Create/New Object functionality\n' : ''}
${!hasContactIntegration ? '3. **HIGH**: Integrate Objects with Contacts (many-to-many relationship)\n' : ''}
${!hasApiEndpoint ? '4. **CRITICAL**: Implement backend API for Objects CRUD operations\n' : ''}
${hasObjectsModule && !hasCreateFunction ? '5. **MEDIUM**: Add user assignment and RBAC controls\n' : ''}

## NEXT STEPS

Based on this quick assessment, the Objects feature ${hasObjectsModule ? 'exists but needs significant enhancement' : 'needs to be built from scratch'}.

${!hasObjectsModule ? `
### Implementation Priority:
1. Create database schema (objects, object_contacts, object_users tables)
2. Implement backend API endpoints
3. Add Objects to sidebar navigation
4. Build Objects list page with CRUD operations
5. Integrate with Contacts module
6. Add user assignment and permissions
` : `
### Enhancement Priority:
1. Complete CRUD operations (Create, Edit, Delete, Duplicate)
2. Add contact assignment interface
3. Add user assignment with permissions
4. Implement RBAC based on user roles
5. Add bulk operations support
`}

---
*Generated by DEBUGGER Agent - Quick Assessment*
`;

        // Save the report
        await fs.writeFile(
            path.join(process.cwd(), 'OBJECTS_QUICK_DEBUG_REPORT.md'),
            report
        );

        console.log('\n✅ Report saved to OBJECTS_QUICK_DEBUG_REPORT.md');
        console.log(`📸 ${debugReport.screenshots.length} screenshots saved to ${config.screenshotDir}`);

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error);
        debugReport.findings.push(`CRITICAL ERROR: ${error.message}`);
    } finally {
        await browser.close();
        console.log('\n========================================');
        console.log('DEBUG SESSION COMPLETE');
        console.log('========================================\n');
    }
}

// Run the test
testObjectsFeature().catch(console.error);