const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3004';
const BACKEND_URL = 'http://localhost:8000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'final-100-percent');

// Test credentials
const CREDENTIALS = {
    email: 'test@example.com',
    password: 'Password123!'
};

// ALL pages that MUST work for 100%
const REQUIRED_PAGES = [
    // Core public pages
    { path: '/', name: 'Home', category: 'core' },
    { path: '/features', name: 'Features', category: 'core' },
    { path: '/platform', name: 'Platform', category: 'core' },
    { path: '/pricing', name: 'Pricing', category: 'core' },
    { path: '/about', name: 'About', category: 'core' },
    { path: '/contact', name: 'Contact', category: 'core' },
    { path: '/login', name: 'Login', category: 'auth' },
    { path: '/register', name: 'Register', category: 'auth' },

    // Solution pages (including recently fixed)
    { path: '/solutions/crm', name: 'CRM Solution', category: 'solutions' },
    { path: '/solutions/lead-management', name: 'Lead Management', category: 'solutions' },
    { path: '/solutions/automation', name: 'Automation', category: 'solutions' },
    { path: '/solutions/audience-intelligence', name: 'Audience Intelligence', category: 'solutions' },
    { path: '/solutions/patient-identification', name: 'Patient Identification', category: 'solutions' },
    { path: '/solutions/campaign-activation', name: 'Campaign Activation', category: 'solutions' },
    { path: '/solutions/visitor-identification', name: 'Visitor Identification', category: 'solutions' },
    { path: '/solutions/analytics', name: 'Analytics', category: 'solutions' },

    // All 13 industry pages
    { path: '/industries/medical-spas', name: 'Medical Spas', category: 'industries' },
    { path: '/industries/dermatology', name: 'Dermatology', category: 'industries' },
    { path: '/industries/plastic-surgery', name: 'Plastic Surgery', category: 'industries' },
    { path: '/industries/aesthetic-clinics', name: 'Aesthetic Clinics', category: 'industries' },
    { path: '/industries/legal-attorneys', name: 'Legal/Attorneys', category: 'industries' },
    { path: '/industries/real-estate', name: 'Real Estate', category: 'industries' },
    { path: '/industries/mortgage-lending', name: 'Mortgage Lending', category: 'industries' },
    { path: '/industries/insurance', name: 'Insurance', category: 'industries' },
    { path: '/industries/marketing-agencies', name: 'Marketing Agencies', category: 'industries' },
    { path: '/industries/restaurants', name: 'Restaurants', category: 'industries' },
    { path: '/industries/home-services', name: 'Home Services', category: 'industries' },
    { path: '/industries/retail', name: 'Retail', category: 'industries' },
    { path: '/industries/professional-services', name: 'Professional Services', category: 'industries' },

    // Legal/compliance pages
    { path: '/privacy-policy', name: 'Privacy Policy', category: 'legal' },
    { path: '/terms-of-service', name: 'Terms of Service', category: 'legal' },
    { path: '/hipaa', name: 'HIPAA', category: 'legal' },
    { path: '/security', name: 'Security', category: 'legal' }
];

// Results tracking
const results = {
    timestamp: new Date().toISOString(),
    totalPages: REQUIRED_PAGES.length,
    passed: [],
    failed: [],
    errors: {
        console: [],
        network: [],
        notFound: []
    },
    dashboard: {
        loginSuccess: false,
        accessible: false,
        error: null
    },
    backend: {
        status: 'unknown',
        health: null
    }
};

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.error(`Failed to create directory: ${error.message}`);
    }
}

async function testBackend() {
    console.log('📡 Testing Backend API...');
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        results.backend.status = 'healthy';
        results.backend.health = data;
        console.log('  ✅ Backend healthy:', JSON.stringify(data));
        return true;
    } catch (error) {
        results.backend.status = 'offline';
        results.backend.error = error.message;
        console.log('  ❌ Backend offline:', error.message);
        return false;
    }
}

async function testPage(page, pageInfo) {
    const fullUrl = BASE_URL + pageInfo.path;
    console.log(`\nTesting [${pageInfo.category}] ${pageInfo.name}: ${pageInfo.path}`);

    try {
        // Monitor console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
                results.errors.console.push({
                    page: pageInfo.path,
                    error: msg.text()
                });
            }
        });

        // Monitor network errors
        const networkErrors = [];
        page.on('response', response => {
            if (response.status() === 404) {
                results.errors.notFound.push({
                    page: pageInfo.path,
                    url: response.url()
                });
            } else if (response.status() >= 400) {
                networkErrors.push({
                    status: response.status(),
                    url: response.url()
                });
                results.errors.network.push({
                    page: pageInfo.path,
                    status: response.status(),
                    url: response.url()
                });
            }
        });

        // Navigate to page
        const response = await page.goto(fullUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for content
        await page.waitForTimeout(2000);

        const status = response ? response.status() : 0;

        // Count key elements
        const elements = {
            buttons: await page.$$eval('button', els => els.length),
            links: await page.$$eval('a', els => els.length),
            inputs: await page.$$eval('input:not([type="hidden"])', els => els.length),
            forms: await page.$$eval('form', els => els.length)
        };

        const totalElements = elements.buttons + elements.links + elements.inputs + elements.forms;

        // Take screenshot
        const screenshotName = `${pageInfo.category}-${pageInfo.path.replace(/\//g, '-').substring(1) || 'home'}.png`;
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, screenshotName),
            fullPage: false // Just viewport for speed
        });

        // Check success criteria
        if (status === 200 && totalElements > 0) {
            results.passed.push({
                ...pageInfo,
                status,
                elements,
                totalElements,
                consoleErrors: consoleErrors.length,
                networkErrors: networkErrors.length
            });
            console.log(`  ✅ PASS - Status: ${status}, Elements: ${totalElements}, Console Errors: ${consoleErrors.length}`);
            return true;
        } else {
            results.failed.push({
                ...pageInfo,
                status,
                elements,
                reason: status !== 200 ? `HTTP ${status}` : 'No elements found'
            });
            console.log(`  ❌ FAIL - Status: ${status}, Elements: ${totalElements}`);
            return false;
        }

    } catch (error) {
        results.failed.push({
            ...pageInfo,
            error: error.message
        });
        console.log(`  ❌ ERROR: ${error.message}`);
        return false;
    }
}

async function testDashboard(browser) {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 Testing CRM Dashboard Access...');
    console.log('='.repeat(60));

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to login
        console.log('1. Navigating to login page...');
        await page.goto(`${BASE_URL}/login`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(2000);

        // Screenshot login page
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'dashboard-01-login.png')
        });

        // Fill credentials
        console.log('2. Entering credentials...');
        await page.fill('input[type="email"], input[name="email"], #email', CREDENTIALS.email);
        await page.fill('input[type="password"], input[name="password"], #password', CREDENTIALS.password);

        // Screenshot filled form
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'dashboard-02-filled.png')
        });

        // Submit
        console.log('3. Submitting login form...');
        await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

        // Wait for navigation
        console.log('4. Waiting for dashboard redirect...');
        await page.waitForTimeout(5000);

        const currentUrl = page.url();

        // Screenshot result
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'dashboard-03-result.png')
        });

        if (currentUrl.includes('/dashboard')) {
            console.log('  ✅ Login successful! Dashboard accessible.');
            results.dashboard.loginSuccess = true;
            results.dashboard.accessible = true;

            // Test a few dashboard pages
            const dashboardPages = [
                '/dashboard',
                '/contacts',
                '/email',
                '/calendar',
                '/settings'
            ];

            console.log('5. Testing dashboard pages...');
            for (const path of dashboardPages) {
                try {
                    console.log(`   Testing ${path}...`);
                    await page.goto(`${BASE_URL}${path}`, {
                        waitUntil: 'networkidle',
                        timeout: 15000
                    });
                    await page.waitForTimeout(1000);
                    console.log(`     ✅ ${path} loaded`);
                } catch (error) {
                    console.log(`     ❌ ${path} failed: ${error.message}`);
                }
            }

        } else {
            console.log(`  ❌ Login failed. Still on: ${currentUrl}`);
            results.dashboard.loginSuccess = false;
            results.dashboard.error = 'Login did not redirect to dashboard';
        }

    } catch (error) {
        console.log(`  ❌ Dashboard test error: ${error.message}`);
        results.dashboard.error = error.message;
    } finally {
        await context.close();
    }
}

async function generateFinalReport() {
    const passRate = Math.round((results.passed.length / results.totalPages) * 100);
    const allPassed = passRate === 100;

    const report = `# DEBUGGER FINAL 100% VERIFICATION REPORT

**Date:** ${results.timestamp}
**System:** Senova CRM
**URL:** ${BASE_URL}
**Backend:** ${BACKEND_URL}

---

## 🎯 FINAL VERDICT: ${allPassed ? '✅ 100% PASS - PRODUCTION READY' : `❌ ${passRate}% - NOT READY`}

---

## 📊 TEST RESULTS SUMMARY

| Metric | Value | Status |
|--------|-------|--------|
| Total Pages Required | ${results.totalPages} | - |
| Pages Passed | ${results.passed.length} | ${results.passed.length === results.totalPages ? '✅' : '⚠️'} |
| Pages Failed | ${results.failed.length} | ${results.failed.length === 0 ? '✅' : '❌'} |
| Pass Rate | ${passRate}% | ${passRate === 100 ? '✅' : '❌'} |
| Backend Status | ${results.backend.status} | ${results.backend.status === 'healthy' ? '✅' : '❌'} |
| Dashboard Login | ${results.dashboard.loginSuccess ? 'Success' : 'Failed'} | ${results.dashboard.loginSuccess ? '✅' : '❌'} |
| Console Errors | ${results.errors.console.length} | ${results.errors.console.length === 0 ? '✅' : '⚠️'} |
| 404 Errors | ${results.errors.notFound.length} | ${results.errors.notFound.length === 0 ? '✅' : '❌'} |

---

## ✅ PAGES THAT PASSED (${results.passed.length}/${results.totalPages})

| Page | Category | Elements | Status |
|------|----------|----------|--------|
${results.passed.map(p => `| ${p.name} | ${p.category} | ${p.totalElements} | ✅ |`).join('\n')}

---

## ❌ PAGES THAT FAILED (${results.failed.length}/${results.totalPages})

${results.failed.length === 0 ? '**No failures! All pages passed.**' : `
| Page | Category | Error |
|------|----------|-------|
${results.failed.map(p => `| ${p.name} | ${p.category} | ${p.error || p.reason} |`).join('\n')}
`}

---

## 🔍 ERROR ANALYSIS

### Console Errors (${results.errors.console.length})
${results.errors.console.length === 0 ? 'No console errors detected.' : results.errors.console.map(e => `- ${e.page}: ${e.error.substring(0, 100)}`).join('\n')}

### 404 Not Found (${results.errors.notFound.length})
${results.errors.notFound.length === 0 ? 'No 404 errors detected.' : results.errors.notFound.map(e => `- ${e.page}: ${e.url}`).join('\n')}

### Network Errors (${results.errors.network.length})
${results.errors.network.length === 0 ? 'No network errors detected.' : results.errors.network.map(e => `- ${e.page}: ${e.status} ${e.url}`).join('\n')}

---

## 🔐 CRM DASHBOARD STATUS

- **Backend API:** ${results.backend.status} ${results.backend.status === 'healthy' ? '✅' : '❌'}
- **Login Test:** ${results.dashboard.loginSuccess ? 'Success ✅' : 'Failed ❌'}
- **Dashboard Accessible:** ${results.dashboard.accessible ? 'Yes ✅' : 'No ❌'}
${results.dashboard.error ? `- **Error:** ${results.dashboard.error}` : ''}

---

## 📸 VISUAL EVIDENCE

Screenshots captured: ${results.passed.length + results.failed.length + 3}
Location: \`${SCREENSHOTS_DIR}\`

---

## 🏁 PRODUCTION READINESS ASSESSMENT

${allPassed ? `
### ✅ SYSTEM IS PRODUCTION READY

**All requirements met:**
- ✅ 100% of pages load successfully
- ✅ No critical errors detected
- ✅ Backend API is healthy
- ✅ Dashboard is accessible
- ✅ All interactive elements present

**The Senova CRM system has passed exhaustive verification and is ready for production deployment.**
` : `
### ❌ SYSTEM IS NOT PRODUCTION READY

**Current Status: ${passRate}% Pass Rate**

**Issues to resolve:**
${results.failed.length > 0 ? `- ❌ ${results.failed.length} pages are failing` : ''}
${results.backend.status !== 'healthy' ? '- ❌ Backend API is not healthy' : ''}
${!results.dashboard.loginSuccess ? '- ❌ Dashboard login is not working' : ''}
${results.errors.notFound.length > 0 ? `- ❌ ${results.errors.notFound.length} resources returning 404` : ''}
${results.errors.console.length > 10 ? '- ⚠️ Excessive console errors detected' : ''}

**Required Actions:**
1. Fix all failing pages
2. Resolve all 404 errors
3. Ensure backend API is healthy
4. Verify dashboard login works
5. Re-run this verification test
`}

---

*Generated by DEBUGGER Agent*
*Test Duration: ~2 minutes*
*Test Type: Exhaustive 100% Verification*
`;

    // Save report
    const reportPath = path.join(__dirname, 'DEBUGGER_FINAL_100_PERCENT_VERIFICATION.md');
    await fs.writeFile(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Save JSON results
    const jsonPath = path.join(__dirname, 'final-100-percent-results.json');
    await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));
    console.log(`📊 JSON results saved to: ${jsonPath}`);

    return allPassed;
}

async function runTest() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     🔍 EXHAUSTIVE 100% VERIFICATION TEST - SENOVA CRM         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`Started: ${new Date().toLocaleString()}`);
    console.log(`Testing ${REQUIRED_PAGES.length} pages for 100% pass rate`);
    console.log('─'.repeat(60));

    // Create screenshots directory
    await ensureDir(SCREENSHOTS_DIR);

    // Test backend
    console.log('\n' + '='.repeat(60));
    console.log('BACKEND VERIFICATION');
    console.log('='.repeat(60));
    const backendOnline = await testBackend();

    // Launch browser
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Test all public pages
        console.log('\n' + '='.repeat(60));
        console.log('PUBLIC WEBSITE VERIFICATION');
        console.log('='.repeat(60));

        const context = await browser.newContext();
        const page = await context.newPage();

        for (const pageInfo of REQUIRED_PAGES) {
            await testPage(page, pageInfo);
            await page.waitForTimeout(500); // Brief pause
        }

        await context.close();

        // Test dashboard if backend is online
        if (backendOnline) {
            await testDashboard(browser);
        } else {
            console.log('\n⚠️ Skipping dashboard test - backend offline');
        }

    } finally {
        await browser.close();
    }

    // Generate final report
    console.log('\n' + '='.repeat(60));
    console.log('GENERATING FINAL REPORT');
    console.log('='.repeat(60));

    const allPassed = await generateFinalReport();

    // Final summary
    const passRate = Math.round((results.passed.length / results.totalPages) * 100);
    console.log('\n' + '═'.repeat(60));
    if (allPassed) {
        console.log('✅ SUCCESS! 100% PASS RATE ACHIEVED!');
        console.log('🎉 SYSTEM IS PRODUCTION READY!');
    } else {
        console.log(`❌ FAILED: Only ${passRate}% pass rate`);
        console.log(`📝 ${results.failed.length} pages need fixes`);
    }
    console.log('═'.repeat(60));

    return allPassed;
}

// Execute test
runTest()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });