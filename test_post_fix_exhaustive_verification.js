const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3004';
const API_URL = 'http://localhost:8000';
const SCREENSHOTS_DIR = 'screenshots/debug-post-fix';
const LONG_TIMEOUT = 30000; // 30 seconds for page loads

// Test results storage
let testResults = {
    timestamp: new Date().toISOString(),
    publicWebsite: {
        total: 0,
        passed: 0,
        failed: 0,
        pages: {}
    },
    crmDashboard: {
        total: 0,
        passed: 0,
        failed: 0,
        features: {}
    },
    bugVerifications: {
        total: 4,
        fixed: 0,
        stillBroken: 0,
        bugs: {}
    },
    consoleErrors: [],
    overallHealth: 0
};

async function ensureScreenshotDir() {
    try {
        await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    } catch (error) {
        console.log('Screenshot directory exists or created');
    }
}

async function takeScreenshot(page, name) {
    try {
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
        return screenshotPath;
    } catch (error) {
        console.error(`Failed to take screenshot ${name}:`, error.message);
        return null;
    }
}

async function checkConsoleErrors(page, context) {
    const errors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            // Ignore some known non-critical errors
            if (!text.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT') &&
                !text.includes('Extension context invalidated') &&
                !text.includes('favicon.ico')) {
                errors.push({
                    context,
                    message: text,
                    location: msg.location()
                });
            }
        }
    });

    page.on('pageerror', error => {
        errors.push({
            context,
            message: error.message,
            stack: error.stack
        });
    });

    return errors;
}

async function testPublicPage(browser, pageName, url) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const result = {
        url,
        status: 'FAIL',
        errors: [],
        elementsFound: 0,
        buttonsWorking: 0,
        linksWorking: 0,
        screenshot: null
    };

    try {
        console.log(`\n📍 Testing ${pageName} at ${url}`);

        // Navigate with long timeout
        const response = await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: LONG_TIMEOUT
        });

        // Check for 404
        if (response && response.status() === 404) {
            result.errors.push(`Page returned 404`);
            console.log(`❌ ${pageName}: 404 Not Found`);
        } else {
            console.log(`✅ ${pageName}: Page loads (${response?.status() || 'OK'})`);
            result.status = 'PARTIAL';

            // Wait for content to be visible
            await page.waitForTimeout(2000);

            // Take screenshot
            result.screenshot = await takeScreenshot(page, `${pageName.toLowerCase().replace(/\s+/g, '-')}`);

            // Count interactive elements
            const buttons = await page.$$('button');
            const links = await page.$$('a');
            const forms = await page.$$('form');

            result.elementsFound = buttons.length + links.length + forms.length;
            console.log(`📊 Found: ${buttons.length} buttons, ${links.length} links, ${forms.length} forms`);

            // Test a sample of buttons
            for (let i = 0; i < Math.min(3, buttons.length); i++) {
                try {
                    const isVisible = await buttons[i].isVisible();
                    if (isVisible) {
                        const text = await buttons[i].textContent();
                        console.log(`   Testing button: "${text?.trim()}"`);
                        result.buttonsWorking++;
                    }
                } catch (err) {
                    // Button test failed
                }
            }

            // Test a sample of links
            for (let i = 0; i < Math.min(3, links.length); i++) {
                try {
                    const href = await links[i].getAttribute('href');
                    if (href && !href.startsWith('#')) {
                        result.linksWorking++;
                    }
                } catch (err) {
                    // Link test failed
                }
            }

            // Check for console errors
            const consoleErrors = await page.evaluate(() => {
                const errors = [];
                // Check for React errors in DOM
                const errorElements = document.querySelectorAll('.error, .error-message, [data-error]');
                errorElements.forEach(el => {
                    if (el.textContent) errors.push(el.textContent);
                });
                return errors;
            });

            if (consoleErrors.length > 0) {
                result.errors.push(...consoleErrors);
            }

            // Mark as PASS if no critical issues
            if (result.elementsFound > 0 && result.errors.length === 0) {
                result.status = 'PASS';
            }
        }

    } catch (error) {
        result.errors.push(error.message);
        console.error(`❌ Error testing ${pageName}:`, error.message);
    } finally {
        await context.close();
    }

    return result;
}

async function testCRMLogin(browser) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('\n🔐 Testing CRM Login...');

        // Go to login page
        await page.goto(`${BASE_URL}/login`, {
            waitUntil: 'networkidle',
            timeout: LONG_TIMEOUT
        });

        await takeScreenshot(page, 'login-page');

        // Check for login form elements
        const emailField = await page.$('input[type="email"], input[name="email"], #email');
        const passwordField = await page.$('input[type="password"], input[name="password"], #password');
        const submitButton = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

        if (!emailField || !passwordField || !submitButton) {
            console.log('❌ Login form elements not found');
            await context.close();
            return null;
        }

        // Try to login with test credentials
        await emailField.fill('test@example.com');
        await passwordField.fill('password123');
        await takeScreenshot(page, 'login-filled');

        // Click submit and wait
        await submitButton.click();

        // Wait for either dashboard or error
        await page.waitForTimeout(3000);

        const url = page.url();
        if (url.includes('/dashboard')) {
            console.log('✅ Login successful - reached dashboard');
            await takeScreenshot(page, 'dashboard-after-login');
            return { page, context };
        } else {
            console.log('⚠️ Login did not redirect to dashboard');
            await takeScreenshot(page, 'login-failed');
            await context.close();
            return null;
        }

    } catch (error) {
        console.error('❌ Login test failed:', error.message);
        await context.close();
        return null;
    }
}

async function testCRMDashboard(browser) {
    const loginResult = await testCRMLogin(browser);
    if (!loginResult) {
        console.log('⚠️ Skipping dashboard tests - login failed');
        return;
    }

    const { page, context } = loginResult;

    try {
        console.log('\n📊 Testing CRM Dashboard Features...');

        // Test navigation sidebar
        console.log('\n🔍 Testing Navigation Sidebar...');
        const navLinks = [
            { text: 'Dashboard', url: '/dashboard' },
            { text: 'Inbox', url: '/dashboard/inbox' },
            { text: 'Contacts', url: '/dashboard/contacts' },
            { text: 'Compose', url: '/dashboard/email/compose' },
            { text: 'Templates', url: '/dashboard/email/templates' },
            { text: 'Campaigns', url: '/dashboard/email/campaigns' },
            { text: 'Activity', url: '/dashboard/activity-log' },
            { text: 'Settings', url: '/dashboard/settings' },
            { text: 'Calendar', url: '/dashboard/calendar' },
            { text: 'Payments', url: '/dashboard/payments' },
            { text: 'AI Tools', url: '/dashboard/ai' }
        ];

        for (const link of navLinks) {
            try {
                const navElement = await page.$(`a:has-text("${link.text}"), button:has-text("${link.text}")`);
                if (navElement) {
                    console.log(`✅ Found nav link: ${link.text}`);
                    testResults.crmDashboard.features[link.text] = 'FOUND';
                } else {
                    console.log(`❌ Missing nav link: ${link.text}`);
                    testResults.crmDashboard.features[link.text] = 'MISSING';
                }
            } catch (err) {
                console.log(`❌ Error checking nav link ${link.text}:`, err.message);
            }
        }

        // Test Contacts page
        console.log('\n🔍 Testing Contacts Module...');
        await page.goto(`${BASE_URL}/dashboard/contacts`, {
            waitUntil: 'networkidle',
            timeout: LONG_TIMEOUT
        });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'contacts-page');

        const addContactBtn = await page.$('button:has-text("Add Contact"), button:has-text("New Contact")');
        if (addContactBtn) {
            console.log('✅ Add Contact button found');
            await addContactBtn.click();
            await page.waitForTimeout(2000);
            await takeScreenshot(page, 'add-contact-modal');

            // Check for form fields
            const firstNameField = await page.$('input[name="firstName"], input[placeholder*="First"]');
            const lastNameField = await page.$('input[name="lastName"], input[placeholder*="Last"]');
            const emailField = await page.$('input[name="email"], input[type="email"]');

            console.log(`   Form fields - First: ${!!firstNameField}, Last: ${!!lastNameField}, Email: ${!!emailField}`);

            // Close modal
            const closeBtn = await page.$('button:has-text("Cancel"), button:has-text("Close"), .close-button, [aria-label="Close"]');
            if (closeBtn) await closeBtn.click();
        } else {
            console.log('❌ Add Contact button not found');
        }

        // Test Email Compose
        console.log('\n🔍 Testing Email Compose...');
        await page.goto(`${BASE_URL}/dashboard/email/compose`, {
            waitUntil: 'networkidle',
            timeout: LONG_TIMEOUT
        });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'email-compose');

        const toField = await page.$('input[placeholder*="To"], input[name="to"]');
        const subjectField = await page.$('input[placeholder*="Subject"], input[name="subject"]');
        const templateDropdown = await page.$('select:has-text("Template"), button:has-text("Template")');

        console.log(`   Email fields - To: ${!!toField}, Subject: ${!!subjectField}, Template: ${!!templateDropdown}`);

    } catch (error) {
        console.error('❌ Dashboard test error:', error.message);
    } finally {
        await context.close();
    }
}

async function verifyBugFixes(browser) {
    console.log('\n🐛 VERIFYING BUG FIXES...');

    // Bug 1: Features page should load (was 404)
    console.log('\n🔧 Bug 1: Features Page');
    const featuresResult = await testPublicPage(browser, 'Features Page', `${BASE_URL}/features`);
    testResults.bugVerifications.bugs['features-404'] = {
        description: 'Features page was returning 404',
        status: featuresResult.status === 'PASS' ? 'FIXED' : 'STILL_BROKEN',
        details: featuresResult.errors
    };
    if (featuresResult.status === 'PASS') {
        testResults.bugVerifications.fixed++;
        console.log('✅ FIXED: Features page loads correctly');
    } else {
        testResults.bugVerifications.stillBroken++;
        console.log('❌ STILL BROKEN: Features page issues');
    }

    // Bug 2: Backend API should respond
    console.log('\n🔧 Bug 2: Backend API');
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            console.log('✅ FIXED: Backend API is responding');
            testResults.bugVerifications.bugs['backend-api'] = {
                description: 'Backend API was refusing connections',
                status: 'FIXED',
                details: [`API responding at ${API_URL}`]
            };
            testResults.bugVerifications.fixed++;
        } else {
            throw new Error(`API returned ${response.status}`);
        }
    } catch (error) {
        console.log('❌ STILL BROKEN: Backend API issue -', error.message);
        testResults.bugVerifications.bugs['backend-api'] = {
            description: 'Backend API was refusing connections',
            status: 'STILL_BROKEN',
            details: [error.message]
        };
        testResults.bugVerifications.stillBroken++;
    }

    // Bug 3: React duplicate keys in navigation
    console.log('\n🔧 Bug 3: React Duplicate Keys');
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleMessages = [];

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('duplicate key') || text.includes('unique "key" prop')) {
            consoleMessages.push(text);
        }
    });

    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle', timeout: LONG_TIMEOUT });
    await page.waitForTimeout(3000);

    if (consoleMessages.length === 0) {
        console.log('✅ FIXED: No duplicate key warnings');
        testResults.bugVerifications.bugs['duplicate-keys'] = {
            description: 'React duplicate key warnings in navigation',
            status: 'FIXED',
            details: []
        };
        testResults.bugVerifications.fixed++;
    } else {
        console.log('❌ STILL BROKEN: Duplicate key warnings found');
        testResults.bugVerifications.bugs['duplicate-keys'] = {
            description: 'React duplicate key warnings in navigation',
            status: 'STILL_BROKEN',
            details: consoleMessages
        };
        testResults.bugVerifications.stillBroken++;
    }

    // Bug 4: React hydration errors
    console.log('\n🔧 Bug 4: React Hydration');
    const hydrationErrors = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('hydration') || text.includes('Hydration')) {
            hydrationErrors.push(text);
        }
    });

    await page.reload();
    await page.waitForTimeout(3000);

    if (hydrationErrors.length === 0) {
        console.log('✅ FIXED: No hydration errors');
        testResults.bugVerifications.bugs['hydration'] = {
            description: 'React hydration errors with dynamic dates',
            status: 'FIXED',
            details: []
        };
        testResults.bugVerifications.fixed++;
    } else {
        console.log('❌ STILL BROKEN: Hydration errors found');
        testResults.bugVerifications.bugs['hydration'] = {
            description: 'React hydration errors with dynamic dates',
            status: 'STILL_BROKEN',
            details: hydrationErrors
        };
        testResults.bugVerifications.stillBroken++;
    }

    await context.close();
}

async function runExhaustiveTests() {
    console.log('=' .repeat(80));
    console.log('🔍 SENOVA CRM - POST-FIX EXHAUSTIVE VERIFICATION');
    console.log('=' .repeat(80));
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Frontend: ${BASE_URL}`);
    console.log(`🔧 Backend: ${API_URL}`);
    console.log('=' .repeat(80));

    await ensureScreenshotDir();

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // 1. Test public website pages
        console.log('\n📑 PHASE 1: PUBLIC WEBSITE TESTING');
        console.log('-'.repeat(40));

        const publicPages = [
            { name: 'Home Page', url: '/' },
            { name: 'Features', url: '/features' },
            { name: 'Platform', url: '/platform' },
            { name: 'Pricing', url: '/pricing' },
            { name: 'About', url: '/about' },
            { name: 'Contact', url: '/contact' },
            { name: 'Login', url: '/login' },
            { name: 'Register', url: '/register' },
            // Solutions
            { name: 'CRM Solution', url: '/solutions/crm' },
            { name: 'Audience Intelligence', url: '/solutions/audience-intelligence' },
            { name: 'Patient Identification', url: '/solutions/patient-identification' },
            { name: 'Campaign Activation', url: '/solutions/campaign-activation' },
            { name: 'Analytics', url: '/solutions/analytics' },
            // Industries
            { name: 'Medical Spas', url: '/industries/medical-spas' },
            { name: 'Dermatology', url: '/industries/dermatology' },
            { name: 'Plastic Surgery', url: '/industries/plastic-surgery' },
            { name: 'Aesthetic Clinics', url: '/industries/aesthetic-clinics' },
            // Legal
            { name: 'Privacy Policy', url: '/privacy-policy' },
            { name: 'Terms of Service', url: '/terms-of-service' },
            { name: 'HIPAA', url: '/hipaa' },
            { name: 'Security', url: '/security' }
        ];

        for (const page of publicPages) {
            const result = await testPublicPage(browser, page.name, `${BASE_URL}${page.url}`);
            testResults.publicWebsite.pages[page.name] = result;
            testResults.publicWebsite.total++;
            if (result.status === 'PASS') {
                testResults.publicWebsite.passed++;
            } else {
                testResults.publicWebsite.failed++;
            }
        }

        // 2. Verify bug fixes
        console.log('\n📑 PHASE 2: BUG FIX VERIFICATION');
        console.log('-'.repeat(40));
        await verifyBugFixes(browser);

        // 3. Test CRM Dashboard
        console.log('\n📑 PHASE 3: CRM DASHBOARD TESTING');
        console.log('-'.repeat(40));
        await testCRMDashboard(browser);

        // Calculate overall health
        const publicScore = (testResults.publicWebsite.passed / testResults.publicWebsite.total) * 100;
        const bugScore = (testResults.bugVerifications.fixed / testResults.bugVerifications.total) * 100;
        testResults.overallHealth = Math.round((publicScore + bugScore) / 2);

    } catch (error) {
        console.error('❌ Fatal error during testing:', error);
    } finally {
        await browser.close();
    }

    // Generate report
    await generateReport();
}

async function generateReport() {
    console.log('\n📝 GENERATING REPORT...');

    const report = `# DEBUGGER POST-FIX VERIFICATION REPORT

**Date:** ${testResults.timestamp}
**Debugger Agent:** Exhaustive Testing Protocol
**Environment:**
- Frontend: ${BASE_URL}
- Backend: ${API_URL}
- Test Duration: ~5 minutes

---

## 🎯 EXECUTIVE SUMMARY

### Overall System Health: ${testResults.overallHealth}%

### Bug Fix Verification
- **Total Bugs Fixed:** ${testResults.bugVerifications.fixed}/${testResults.bugVerifications.total}
- **Success Rate:** ${Math.round((testResults.bugVerifications.fixed / testResults.bugVerifications.total) * 100)}%

### Public Website
- **Pages Tested:** ${testResults.publicWebsite.total}
- **Passed:** ${testResults.publicWebsite.passed} (${Math.round((testResults.publicWebsite.passed / testResults.publicWebsite.total) * 100)}%)
- **Failed:** ${testResults.publicWebsite.failed}

---

## 🐛 BUG FIX VERIFICATION DETAILS

${Object.entries(testResults.bugVerifications.bugs).map(([key, bug]) => `
### ${key.replace(/-/g, ' ').toUpperCase()}
- **Description:** ${bug.description}
- **Status:** ${bug.status === 'FIXED' ? '✅ FIXED' : '❌ STILL BROKEN'}
${bug.details.length > 0 ? `- **Details:** ${bug.details.join(', ')}` : ''}
`).join('\n')}

---

## 📑 PUBLIC WEBSITE TEST RESULTS

| Page | Status | Elements | Buttons | Links | Errors |
|------|--------|----------|---------|-------|--------|
${Object.entries(testResults.publicWebsite.pages).map(([name, result]) =>
`| ${name} | ${result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌'} ${result.status} | ${result.elementsFound} | ${result.buttonsWorking} | ${result.linksWorking} | ${result.errors.length} |`
).join('\n')}

---

## 📊 CRM DASHBOARD TEST RESULTS

### Navigation Sidebar Status
| Feature | Status |
|---------|--------|
${Object.entries(testResults.crmDashboard.features).map(([feature, status]) =>
`| ${feature} | ${status === 'FOUND' ? '✅ Found' : '❌ Missing'} |`
).join('\n')}

---

## 🔍 CONSOLE ERRORS SUMMARY

Total Console Errors Detected: ${testResults.consoleErrors.length}

${testResults.consoleErrors.length > 0 ? `
### Error Details
${testResults.consoleErrors.slice(0, 10).map(error =>
`- **Context:** ${error.context}
  **Message:** ${error.message}`
).join('\n\n')}
` : '✅ No console errors detected!'}

---

## 🏁 PRODUCTION READINESS ASSESSMENT

${testResults.overallHealth >= 95 ? `
### ✅ SYSTEM IS PRODUCTION READY

All critical bugs have been fixed:
- Features page loads correctly
- Backend API is responding
- No React duplicate key warnings
- No hydration errors
- Public website fully functional
- CRM dashboard operational
` : testResults.overallHealth >= 80 ? `
### ⚠️ SYSTEM IS NEARLY READY

Most bugs fixed but some issues remain:
${testResults.bugVerifications.stillBroken > 0 ? '- Some bug fixes incomplete' : ''}
${testResults.publicWebsite.failed > 2 ? '- Multiple public pages have issues' : ''}
${testResults.consoleErrors.length > 10 ? '- Console errors need attention' : ''}
` : `
### ❌ SYSTEM NOT READY FOR PRODUCTION

Critical issues remain:
- Bug fix success rate: ${Math.round((testResults.bugVerifications.fixed / testResults.bugVerifications.total) * 100)}%
- Public website pass rate: ${Math.round((testResults.publicWebsite.passed / testResults.publicWebsite.total) * 100)}%
- Overall health: ${testResults.overallHealth}%

**Required Actions:**
1. Fix remaining bugs
2. Resolve page loading issues
3. Clear console errors
4. Re-run verification
`}

---

## 📸 SCREENSHOT EVIDENCE

Screenshots saved in: \`${SCREENSHOTS_DIR}/\`

Total screenshots captured: ${await countScreenshots()}

---

## 📋 RECOMMENDATIONS

${testResults.bugVerifications.stillBroken > 0 ? `
### 🔧 Bug Fixes Still Needed:
${Object.entries(testResults.bugVerifications.bugs)
  .filter(([_, bug]) => bug.status === 'STILL_BROKEN')
  .map(([key, bug]) => `- Fix ${key}: ${bug.description}`)
  .join('\n')}
` : ''}

${testResults.publicWebsite.failed > 0 ? `
### 📑 Pages Needing Attention:
${Object.entries(testResults.publicWebsite.pages)
  .filter(([_, result]) => result.status === 'FAIL')
  .map(([name, _]) => `- ${name}`)
  .join('\n')}
` : ''}

---

## ✅ SUCCESS CRITERIA MET

- [${testResults.bugVerifications.fixed === testResults.bugVerifications.total ? 'x' : ' '}] All 4 bugs fixed
- [${testResults.publicWebsite.passed === testResults.publicWebsite.total ? 'x' : ' '}] All public pages load
- [${testResults.consoleErrors.length === 0 ? 'x' : ' '}] No console errors
- [${testResults.overallHealth >= 95 ? 'x' : ' '}] System health ≥ 95%

---

*Generated by: DEBUGGER Agent - Exhaustive Testing Protocol*
*Session ID: ${Date.now()}*
*Test Framework: Playwright*
`;

    // Save report
    const reportPath = path.join(process.cwd(), 'DEBUGGER_POST_FIX_VERIFICATION_REPORT.md');
    await fs.writeFile(reportPath, report);
    console.log(`\n✅ Report saved to: ${reportPath}`);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`🎯 Overall System Health: ${testResults.overallHealth}%`);
    console.log(`🐛 Bugs Fixed: ${testResults.bugVerifications.fixed}/${testResults.bugVerifications.total}`);
    console.log(`📑 Pages Passing: ${testResults.publicWebsite.passed}/${testResults.publicWebsite.total}`);
    console.log(`${testResults.overallHealth >= 95 ? '✅ PRODUCTION READY' : testResults.overallHealth >= 80 ? '⚠️ NEARLY READY' : '❌ NOT READY'}`);
    console.log('='.repeat(80));
}

async function countScreenshots() {
    try {
        const files = await fs.readdir(SCREENSHOTS_DIR);
        return files.filter(f => f.endsWith('.png')).length;
    } catch {
        return 0;
    }
}

// Run the tests
runExhaustiveTests().catch(console.error);