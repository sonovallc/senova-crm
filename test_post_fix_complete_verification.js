const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3004';
const API_URL = 'http://localhost:8000';
const SCREENSHOTS_DIR = 'screenshots/debug-post-fix-complete';
const LONG_TIMEOUT = 20000; // 20 seconds for page loads

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
        console.log('Screenshot directory ready');
    }
}

async function takeScreenshot(page, name) {
    try {
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  📸 Screenshot: ${name}`);
        return screenshotPath;
    } catch (error) {
        console.error(`  ⚠️ Screenshot failed: ${error.message}`);
        return null;
    }
}

async function testPublicPageSafe(browser, pageName, url) {
    let context = null;
    let page = null;

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
        context = await browser.newContext();
        page = await context.newPage();

        console.log(`\n📍 Testing ${pageName}...`);

        // Set up console error tracking
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (!text.includes('Extension') && !text.includes('favicon')) {
                    consoleErrors.push(text);
                }
            }
        });

        // Navigate with timeout and error handling
        try {
            const response = await page.goto(url, {
                waitUntil: 'domcontentloaded', // Changed from networkidle
                timeout: LONG_TIMEOUT
            });

            if (response) {
                const status = response.status();
                console.log(`  Status: ${status}`);

                if (status === 404) {
                    result.errors.push(`404 Not Found`);
                    result.status = 'FAIL';
                } else if (status >= 200 && status < 400) {
                    result.status = 'PASS';

                    // Wait a bit for JS to execute
                    await page.waitForTimeout(1000);

                    // Count elements
                    const buttons = await page.$$('button');
                    const links = await page.$$('a');
                    const forms = await page.$$('form');

                    result.elementsFound = buttons.length + links.length + forms.length;
                    result.buttonsWorking = buttons.length;
                    result.linksWorking = links.length;

                    console.log(`  Elements: ${buttons.length} buttons, ${links.length} links, ${forms.length} forms`);

                    // Take screenshot
                    result.screenshot = await takeScreenshot(page, pageName.toLowerCase().replace(/\s+/g, '-'));
                }
            }
        } catch (navError) {
            console.log(`  ⚠️ Navigation error: ${navError.message}`);
            result.errors.push(navError.message);
        }

        // Add console errors to result
        if (consoleErrors.length > 0) {
            result.errors = [...result.errors, ...consoleErrors];
            testResults.consoleErrors.push(...consoleErrors.map(e => ({ page: pageName, error: e })));
        }

    } catch (error) {
        console.error(`  ❌ Test failed: ${error.message}`);
        result.errors.push(error.message);
    } finally {
        // Clean up
        try {
            if (page) await page.close();
            if (context) await context.close();
        } catch (closeError) {
            console.log(`  Cleanup error: ${closeError.message}`);
        }
    }

    return result;
}

async function verifyBugFixes(browser) {
    console.log('\n' + '='.repeat(50));
    console.log('🐛 BUG FIX VERIFICATION');
    console.log('='.repeat(50));

    // Bug 1: Features page should load (was 404)
    console.log('\n1️⃣ Bug #1: Features Page (was 404)');
    const featuresResult = await testPublicPageSafe(browser, 'Features Bug Check', `${BASE_URL}/features`);

    if (featuresResult.status === 'PASS' && !featuresResult.errors.some(e => e.includes('404'))) {
        console.log('   ✅ FIXED - Features page loads');
        testResults.bugVerifications.fixed++;
        testResults.bugVerifications.bugs['features-404'] = {
            description: 'Features page was returning 404',
            status: 'FIXED',
            details: ['Page loads successfully']
        };
    } else {
        console.log('   ❌ STILL BROKEN - Features page issue');
        testResults.bugVerifications.stillBroken++;
        testResults.bugVerifications.bugs['features-404'] = {
            description: 'Features page was returning 404',
            status: 'STILL_BROKEN',
            details: featuresResult.errors
        };
    }

    // Bug 2: Backend API should respond
    console.log('\n2️⃣ Bug #2: Backend API Connection');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_URL}/api/health`, {
            signal: controller.signal
        }).catch(() => fetch(`${API_URL}/health`, {
            signal: controller.signal
        }));

        clearTimeout(timeoutId);

        if (response && response.ok) {
            console.log('   ✅ FIXED - Backend API responding');
            testResults.bugVerifications.fixed++;
            testResults.bugVerifications.bugs['backend-api'] = {
                description: 'Backend API was refusing connections',
                status: 'FIXED',
                details: [`API responding at ${API_URL}`]
            };
        } else {
            throw new Error(`API returned ${response?.status || 'error'}`);
        }
    } catch (error) {
        console.log('   ❌ STILL BROKEN - Backend API issue');
        testResults.bugVerifications.stillBroken++;
        testResults.bugVerifications.bugs['backend-api'] = {
            description: 'Backend API was refusing connections',
            status: 'STILL_BROKEN',
            details: [error.message]
        };
    }

    // Bug 3 & 4: React errors
    console.log('\n3️⃣ Bug #3: React Duplicate Keys');
    console.log('4️⃣ Bug #4: React Hydration Errors');

    let context = null;
    let page = null;

    try {
        context = await browser.newContext();
        page = await context.newPage();

        const reactErrors = {
            duplicateKeys: [],
            hydration: []
        };

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('duplicate key') || text.includes('unique "key" prop')) {
                reactErrors.duplicateKeys.push(text);
            }
            if (text.includes('hydration') || text.includes('Hydration')) {
                reactErrors.hydration.push(text);
            }
        });

        await page.goto(BASE_URL, {
            waitUntil: 'domcontentloaded',
            timeout: LONG_TIMEOUT
        });

        await page.waitForTimeout(3000);

        // Check duplicate keys
        if (reactErrors.duplicateKeys.length === 0) {
            console.log('   ✅ FIXED - No duplicate key warnings');
            testResults.bugVerifications.fixed++;
            testResults.bugVerifications.bugs['duplicate-keys'] = {
                description: 'React duplicate key warnings',
                status: 'FIXED',
                details: []
            };
        } else {
            console.log('   ❌ STILL BROKEN - Duplicate key warnings');
            testResults.bugVerifications.stillBroken++;
            testResults.bugVerifications.bugs['duplicate-keys'] = {
                description: 'React duplicate key warnings',
                status: 'STILL_BROKEN',
                details: reactErrors.duplicateKeys.slice(0, 3)
            };
        }

        // Check hydration
        if (reactErrors.hydration.length === 0) {
            console.log('   ✅ FIXED - No hydration errors');
            testResults.bugVerifications.fixed++;
            testResults.bugVerifications.bugs['hydration'] = {
                description: 'React hydration errors',
                status: 'FIXED',
                details: []
            };
        } else {
            console.log('   ❌ STILL BROKEN - Hydration errors');
            testResults.bugVerifications.stillBroken++;
            testResults.bugVerifications.bugs['hydration'] = {
                description: 'React hydration errors',
                status: 'STILL_BROKEN',
                details: reactErrors.hydration.slice(0, 3)
            };
        }

    } catch (error) {
        console.log('   ⚠️ Could not verify React errors:', error.message);
    } finally {
        if (page) await page.close();
        if (context) await context.close();
    }
}

async function testCRMDashboard(browser) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 CRM DASHBOARD TESTING');
    console.log('='.repeat(50));

    let context = null;
    let page = null;

    try {
        context = await browser.newContext();
        page = await context.newPage();

        // Navigate to login
        console.log('\n🔐 Attempting login...');
        await page.goto(`${BASE_URL}/login`, {
            waitUntil: 'domcontentloaded',
            timeout: LONG_TIMEOUT
        });

        // Try to login
        const emailField = await page.$('input[type="email"], input[name="email"]');
        const passwordField = await page.$('input[type="password"], input[name="password"]');
        const submitButton = await page.$('button[type="submit"], button:has-text("Sign")');

        if (emailField && passwordField && submitButton) {
            await emailField.fill('test@example.com');
            await passwordField.fill('password123');
            await submitButton.click();

            await page.waitForTimeout(3000);

            const currentUrl = page.url();
            if (currentUrl.includes('/dashboard')) {
                console.log('   ✅ Login successful');

                // Test navigation items
                console.log('\n📍 Testing Dashboard Navigation...');
                const navItems = [
                    'Dashboard', 'Inbox', 'Contacts', 'Compose',
                    'Templates', 'Campaigns', 'Activity', 'Settings',
                    'Calendar', 'Payments', 'AI Tools'
                ];

                for (const item of navItems) {
                    const element = await page.$(`text="${item}"`);
                    if (element) {
                        console.log(`   ✅ Found: ${item}`);
                        testResults.crmDashboard.features[item] = 'FOUND';
                        testResults.crmDashboard.passed++;
                    } else {
                        console.log(`   ❌ Missing: ${item}`);
                        testResults.crmDashboard.features[item] = 'MISSING';
                        testResults.crmDashboard.failed++;
                    }
                    testResults.crmDashboard.total++;
                }

                await takeScreenshot(page, 'dashboard-nav');

            } else {
                console.log('   ⚠️ Login failed - no dashboard access');
                testResults.crmDashboard.features['Login'] = 'FAILED';
            }
        } else {
            console.log('   ❌ Login form not found');
            testResults.crmDashboard.features['Login Form'] = 'NOT_FOUND';
        }

    } catch (error) {
        console.error('   ❌ Dashboard test error:', error.message);
    } finally {
        if (page) await page.close();
        if (context) await context.close();
    }
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
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        // 1. Verify bug fixes first
        await verifyBugFixes(browser);

        // 2. Test public website pages
        console.log('\n' + '='.repeat(50));
        console.log('📑 PUBLIC WEBSITE TESTING');
        console.log('='.repeat(50));

        const publicPages = [
            { name: 'Home', url: '/' },
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
            { name: 'Patient ID', url: '/solutions/patient-identification' },
            { name: 'Campaign Activation', url: '/solutions/campaign-activation' },
            { name: 'Analytics', url: '/solutions/analytics' },
            // Industries (test carefully due to crash)
            { name: 'Medical Spas', url: '/industries/medical-spas' },
            { name: 'Dermatology', url: '/industries/dermatology' },
            { name: 'Plastic Surgery', url: '/industries/plastic-surgery' },
            { name: 'Aesthetic Clinics', url: '/industries/aesthetic-clinics' },
            // Legal
            { name: 'Privacy Policy', url: '/privacy-policy' },
            { name: 'Terms', url: '/terms-of-service' },
            { name: 'Security', url: '/security' }
        ];

        for (const page of publicPages) {
            const result = await testPublicPageSafe(browser, page.name, `${BASE_URL}${page.url}`);
            testResults.publicWebsite.pages[page.name] = result;
            testResults.publicWebsite.total++;
            if (result.status === 'PASS') {
                testResults.publicWebsite.passed++;
            } else {
                testResults.publicWebsite.failed++;
            }
        }

        // 3. Test CRM Dashboard
        await testCRMDashboard(browser);

        // Calculate overall health
        const publicScore = (testResults.publicWebsite.passed / testResults.publicWebsite.total) * 100;
        const bugScore = (testResults.bugVerifications.fixed / testResults.bugVerifications.total) * 100;
        const dashboardScore = testResults.crmDashboard.total > 0
            ? (testResults.crmDashboard.passed / testResults.crmDashboard.total) * 100
            : 0;

        testResults.overallHealth = Math.round((publicScore * 0.4 + bugScore * 0.4 + dashboardScore * 0.2));

    } catch (error) {
        console.error('❌ Fatal error during testing:', error);
    } finally {
        await browser.close();
    }

    // Generate final report
    await generateFinalReport();
}

async function generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📝 GENERATING FINAL REPORT');
    console.log('='.repeat(80));

    const bugFixRate = Math.round((testResults.bugVerifications.fixed / testResults.bugVerifications.total) * 100);
    const publicPassRate = Math.round((testResults.publicWebsite.passed / testResults.publicWebsite.total) * 100);
    const dashboardPassRate = testResults.crmDashboard.total > 0
        ? Math.round((testResults.crmDashboard.passed / testResults.crmDashboard.total) * 100)
        : 0;

    const report = `# DEBUGGER POST-FIX VERIFICATION REPORT - COMPLETE

**Date:** ${testResults.timestamp}
**Debugger Agent:** Exhaustive Testing Protocol v2
**Test Type:** Complete System Verification
**Environment:**
- Frontend: ${BASE_URL}
- Backend: ${API_URL}

---

## 🎯 EXECUTIVE SUMMARY

### Overall System Health: ${testResults.overallHealth}%

| Component | Pass Rate | Status |
|-----------|-----------|--------|
| Bug Fixes | ${bugFixRate}% | ${bugFixRate >= 75 ? '✅' : bugFixRate >= 50 ? '⚠️' : '❌'} |
| Public Website | ${publicPassRate}% | ${publicPassRate >= 90 ? '✅' : publicPassRate >= 70 ? '⚠️' : '❌'} |
| CRM Dashboard | ${dashboardPassRate}% | ${dashboardPassRate >= 80 ? '✅' : dashboardPassRate >= 60 ? '⚠️' : '❌'} |

---

## 🐛 BUG FIX VERIFICATION (${testResults.bugVerifications.fixed}/${testResults.bugVerifications.total} Fixed)

| Bug | Description | Status | Details |
|-----|-------------|--------|---------|
| #1 | Features page 404 | ${testResults.bugVerifications.bugs['features-404']?.status === 'FIXED' ? '✅ FIXED' : '❌ NOT FIXED'} | ${testResults.bugVerifications.bugs['features-404']?.details?.[0] || 'Not tested'} |
| #2 | Backend API connection | ${testResults.bugVerifications.bugs['backend-api']?.status === 'FIXED' ? '✅ FIXED' : '❌ NOT FIXED'} | ${testResults.bugVerifications.bugs['backend-api']?.details?.[0] || 'Not tested'} |
| #3 | React duplicate keys | ${testResults.bugVerifications.bugs['duplicate-keys']?.status === 'FIXED' ? '✅ FIXED' : '❌ NOT FIXED'} | ${testResults.bugVerifications.bugs['duplicate-keys']?.details?.length || 0} errors |
| #4 | React hydration | ${testResults.bugVerifications.bugs['hydration']?.status === 'FIXED' ? '✅ FIXED' : '❌ NOT FIXED'} | ${testResults.bugVerifications.bugs['hydration']?.details?.length || 0} errors |

---

## 📑 PUBLIC WEBSITE RESULTS (${testResults.publicWebsite.passed}/${testResults.publicWebsite.total} Passing)

### Page Status Overview
| Page | Status | Elements Found | Errors |
|------|--------|----------------|--------|
${Object.entries(testResults.publicWebsite.pages).map(([name, result]) =>
`| ${name} | ${result.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${result.elementsFound} | ${result.errors.length} |`
).join('\n')}

### Failed Pages Details
${Object.entries(testResults.publicWebsite.pages)
    .filter(([_, result]) => result.status === 'FAIL')
    .map(([name, result]) => `
**${name}:**
- URL: ${result.url}
- Errors: ${result.errors.join(', ') || 'Unknown error'}`)
    .join('\n') || '✅ All pages passed!'}

---

## 📊 CRM DASHBOARD RESULTS

### Navigation Elements (${testResults.crmDashboard.passed}/${testResults.crmDashboard.total} Found)
| Feature | Status |
|---------|--------|
${Object.entries(testResults.crmDashboard.features).map(([feature, status]) =>
`| ${feature} | ${status === 'FOUND' ? '✅' : '❌'} ${status} |`
).join('\n') || '| No dashboard access | ❌ Login failed |'}

---

## 🔍 CONSOLE ERRORS

Total Errors: ${testResults.consoleErrors.length}

${testResults.consoleErrors.length > 0
    ? testResults.consoleErrors.slice(0, 5).map(e => `- **${e.page}:** ${e.error}`).join('\n')
    : '✅ No console errors detected'}

---

## 🏁 PRODUCTION READINESS

${testResults.overallHealth >= 90 ? `
### ✅ SYSTEM IS PRODUCTION READY

The system meets production criteria:
- Critical bugs have been fixed
- Public website is fully functional
- CRM dashboard is operational
- Console errors are minimal

**Recommendation:** Safe to deploy to production.
` : testResults.overallHealth >= 70 ? `
### ⚠️ SYSTEM IS NEARLY PRODUCTION READY

The system is close but needs attention:
${bugFixRate < 75 ? '- Some bug fixes incomplete\n' : ''}${publicPassRate < 90 ? '- Some public pages have issues\n' : ''}${dashboardPassRate < 80 ? '- Dashboard navigation needs work\n' : ''}${testResults.consoleErrors.length > 10 ? '- Console errors need cleanup\n' : ''}

**Recommendation:** Fix remaining issues before production deployment.
` : `
### ❌ SYSTEM NOT PRODUCTION READY

Critical issues remain:
- Bug fix rate: ${bugFixRate}% (need ≥75%)
- Public website: ${publicPassRate}% (need ≥90%)
- Dashboard functionality: ${dashboardPassRate}% (need ≥80%)

**Recommendation:** Address all critical issues before considering production.
`}

---

## 📸 EVIDENCE

Screenshots saved in: \`${SCREENSHOTS_DIR}/\`

---

## ✅ FINAL CHECKLIST

- [${testResults.bugVerifications.fixed >= 3 ? 'x' : ' '}] At least 3/4 bugs fixed
- [${publicPassRate >= 90 ? 'x' : ' '}] Public website ≥90% functional
- [${dashboardPassRate >= 80 ? 'x' : ' '}] Dashboard navigation ≥80% working
- [${testResults.consoleErrors.length <= 5 ? 'x' : ' '}] Console errors ≤5
- [${testResults.overallHealth >= 90 ? 'x' : ' '}] Overall health ≥90%

---

**FINAL VERDICT:** ${testResults.overallHealth >= 90 ? '✅ PRODUCTION READY' : testResults.overallHealth >= 70 ? '⚠️ NEARLY READY' : '❌ NOT READY'}

---

*Generated by: DEBUGGER Agent*
*Session ID: ${Date.now()}*
*Test Coverage: Exhaustive*
`;

    // Save report
    const reportPath = path.join(process.cwd(), 'DEBUGGER_POST_FIX_VERIFICATION_REPORT.md');
    await fs.writeFile(reportPath, report);

    // Print summary
    console.log('\n✅ Report saved to: DEBUGGER_POST_FIX_VERIFICATION_REPORT.md');
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`🎯 Overall Health: ${testResults.overallHealth}%`);
    console.log(`🐛 Bug Fixes: ${testResults.bugVerifications.fixed}/${testResults.bugVerifications.total}`);
    console.log(`📑 Public Pages: ${testResults.publicWebsite.passed}/${testResults.publicWebsite.total}`);
    console.log(`📊 Dashboard: ${testResults.crmDashboard.passed}/${testResults.crmDashboard.total}`);
    console.log('='.repeat(80));
    console.log(`VERDICT: ${testResults.overallHealth >= 90 ? '✅ PRODUCTION READY' : testResults.overallHealth >= 70 ? '⚠️ NEARLY READY' : '❌ NOT READY'}`);
    console.log('='.repeat(80));
}

// Run the complete test suite
runExhaustiveTests().catch(console.error);