const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshot directory
const screenshotDir = path.join(__dirname, 'screenshots', 'production-final');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Test results tracking
const results = {
  websitePages: { total: 23, passed: 0, failed: 0, failures: [] },
  dashboardPages: { total: 11, passed: 0, failed: 0, failures: [] },
  corsVerification: { passed: false, errors: [] },
  mobileNavigation: { website: false, dashboard: false },
  criticalErrors: [],
  screenshots: []
};

async function takeScreenshot(page, name, category) {
  const filename = `${category}-${name.replace(/\//g, '-')}-${Date.now()}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  results.screenshots.push({ name, category, file: filename });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

async function testPage(page, url, name, category, timeout = 60000) {
  console.log(`\nTesting ${category} - ${name}: ${url}`);

  try {
    // Navigate with extended timeout
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: timeout
    });

    // Check response status
    const status = response ? response.status() : 'unknown';
    console.log(`  Status: ${status}`);

    if (status === 404) {
      throw new Error(`404 Not Found`);
    }

    // Wait for content to be visible
    await page.waitForTimeout(2000);

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Take screenshot
    await takeScreenshot(page, name, category);

    // Check if page has content
    const bodyText = await page.textContent('body');
    if (!bodyText || bodyText.trim().length < 50) {
      throw new Error('Page appears empty');
    }

    if (errors.length > 0) {
      console.log(`  ⚠️ Console errors: ${errors.length}`);
    }

    console.log(`  ✅ PASS`);
    return { success: true, errors };

  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testWebsitePages(page) {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 1: ALL PUBLIC WEBSITE PAGES (23 pages)');
  console.log('='.repeat(50));

  const pages = [
    { url: 'http://localhost:3001/', name: 'homepage' },
    { url: 'http://localhost:3001/platform', name: 'platform' },
    { url: 'http://localhost:3001/pricing', name: 'pricing' },
    { url: 'http://localhost:3001/about', name: 'about' },
    { url: 'http://localhost:3001/contact', name: 'contact' },
    { url: 'http://localhost:3001/solutions/customer-service', name: 'solutions-customer-service' },
    { url: 'http://localhost:3001/solutions/sales-enablement', name: 'solutions-sales-enablement' },
    { url: 'http://localhost:3001/solutions/marketing-automation', name: 'solutions-marketing-automation' },
    { url: 'http://localhost:3001/solutions/team-collaboration', name: 'solutions-team-collaboration' },
    { url: 'http://localhost:3001/solutions/business-intelligence', name: 'solutions-business-intelligence' },
    { url: 'http://localhost:3001/industries/healthcare', name: 'industries-healthcare' },
    { url: 'http://localhost:3001/industries/finance', name: 'industries-finance' },
    { url: 'http://localhost:3001/industries/retail', name: 'industries-retail' },
    { url: 'http://localhost:3001/industries/technology', name: 'industries-technology' },
    { url: 'http://localhost:3001/privacy-policy', name: 'privacy-policy' },
    { url: 'http://localhost:3001/terms-of-service', name: 'terms-of-service' },
    { url: 'http://localhost:3001/hipaa', name: 'hipaa' },
    { url: 'http://localhost:3001/security', name: 'security' },
    { url: 'http://localhost:3001/compliance', name: 'compliance' },
    { url: 'http://localhost:3001/blog', name: 'blog' },
    { url: 'http://localhost:3001/case-studies', name: 'case-studies' },
    { url: 'http://localhost:3001/roi-calculator', name: 'roi-calculator' },
    { url: 'http://localhost:3001/docs', name: 'docs' }
  ];

  for (const pageInfo of pages) {
    const result = await testPage(page, pageInfo.url, pageInfo.name, 'website', 60000);
    if (result.success) {
      results.websitePages.passed++;
    } else {
      results.websitePages.failed++;
      results.websitePages.failures.push({
        page: pageInfo.name,
        error: result.error
      });
    }
  }

  console.log(`\nWebsite Pages Summary: ${results.websitePages.passed}/${results.websitePages.total} passed`);
}

async function testDashboard(browser) {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 2: CRM DASHBOARD');
  console.log('='.repeat(50));

  const context = await browser.newContext();
  const page = await context.newPage();

  // Login first
  console.log('\nLogging into dashboard...');
  await page.goto('http://localhost:3000/login', { timeout: 60000 });
  await page.waitForTimeout(2000);

  await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
  await page.fill('input[type="password"]', 'D3n1w3n1!');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  console.log('✅ Login successful');

  const dashboardPages = [
    { url: 'http://localhost:3000/dashboard', name: 'dashboard-home' },
    { url: 'http://localhost:3000/dashboard/contacts', name: 'contacts' },
    { url: 'http://localhost:3000/dashboard/inbox', name: 'inbox' },
    { url: 'http://localhost:3000/dashboard/objects', name: 'objects' },
    { url: 'http://localhost:3000/dashboard/settings', name: 'settings' },
    { url: 'http://localhost:3000/dashboard/closebot', name: 'closebot' },
    { url: 'http://localhost:3000/dashboard/calendar', name: 'calendar' },
    { url: 'http://localhost:3000/dashboard/email-templates', name: 'email-templates' },
    { url: 'http://localhost:3000/dashboard/campaigns', name: 'campaigns' },
    { url: 'http://localhost:3000/dashboard/autoresponders', name: 'autoresponders' },
    { url: 'http://localhost:3000/login', name: 'login-page' }
  ];

  for (const pageInfo of dashboardPages) {
    const result = await testPage(page, pageInfo.url, pageInfo.name, 'dashboard', 30000);
    if (result.success) {
      results.dashboardPages.passed++;
    } else {
      results.dashboardPages.failed++;
      results.dashboardPages.failures.push({
        page: pageInfo.name,
        error: result.error
      });
    }
  }

  console.log(`\nDashboard Pages Summary: ${results.dashboardPages.passed}/${results.dashboardPages.total} passed`);

  await context.close();
}

async function testCORS(browser) {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 3: CORS VERIFICATION');
  console.log('='.repeat(50));

  const context = await browser.newContext();
  const page = await context.newPage();

  const corsErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('CORS') || text.includes('Cross-Origin')) {
      corsErrors.push(text);
    }
  });

  // Login
  await page.goto('http://localhost:3000/login', { timeout: 60000 });
  await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
  await page.fill('input[type="password"]', 'D3n1w3n1!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // Test Contacts API
  console.log('\nTesting Contacts API...');
  await page.goto('http://localhost:3000/dashboard/contacts', { timeout: 30000 });
  await page.waitForTimeout(5000);

  // Check for data loading
  const contactsLoaded = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    return tables.length > 0;
  });

  if (contactsLoaded) {
    console.log('✅ Contacts data loaded successfully');
  } else {
    console.log('❌ Contacts data failed to load');
    results.corsVerification.errors.push('Contacts data failed to load');
  }

  // Test Inbox API
  console.log('\nTesting Inbox API...');
  await page.goto('http://localhost:3000/dashboard/inbox', { timeout: 30000 });
  await page.waitForTimeout(5000);

  const inboxLoaded = await page.evaluate(() => {
    const content = document.body.textContent;
    return content.includes('Inbox') || content.includes('No messages');
  });

  if (inboxLoaded) {
    console.log('✅ Inbox loaded successfully');
  } else {
    console.log('❌ Inbox failed to load');
    results.corsVerification.errors.push('Inbox failed to load');
  }

  if (corsErrors.length > 0) {
    console.log(`\n❌ CORS errors detected: ${corsErrors.length}`);
    results.corsVerification.errors = corsErrors;
  } else {
    console.log('\n✅ No CORS errors detected');
    results.corsVerification.passed = true;
  }

  await context.close();
}

async function testMobileNavigation(browser) {
  console.log('\n' + '='.repeat(50));
  console.log('TEST 4: MOBILE NAVIGATION');
  console.log('='.repeat(50));

  // Test website mobile nav
  const websiteContext = await browser.newContext({
    viewport: { width: 375, height: 812 }
  });
  const websitePage = await websiteContext.newPage();

  console.log('\nTesting website mobile navigation...');
  await websitePage.goto('http://localhost:3001/', { timeout: 60000 });
  await websitePage.waitForTimeout(2000);

  // Look for hamburger menu
  const hamburger = await websitePage.$('[aria-label*="menu"]') ||
                    await websitePage.$('button:has(svg)') ||
                    await websitePage.$('.mobile-menu-button');

  if (hamburger) {
    await hamburger.click();
    await websitePage.waitForTimeout(1000);
    await takeScreenshot(websitePage, 'mobile-menu-open', 'mobile');
    console.log('✅ Website mobile navigation works');
    results.mobileNavigation.website = true;
  } else {
    console.log('❌ Website mobile navigation not found');
  }

  await websiteContext.close();

  // Test dashboard mobile nav
  const dashboardContext = await browser.newContext({
    viewport: { width: 375, height: 812 }
  });
  const dashboardPage = await dashboardContext.newPage();

  console.log('\nTesting dashboard mobile navigation...');
  await dashboardPage.goto('http://localhost:3000/login', { timeout: 60000 });
  await dashboardPage.fill('input[type="email"]', 'jwoodcapital@gmail.com');
  await dashboardPage.fill('input[type="password"]', 'D3n1w3n1!');
  await dashboardPage.click('button[type="submit"]');
  await dashboardPage.waitForURL('**/dashboard', { timeout: 30000 });

  const mobileMenuButton = await dashboardPage.$('[aria-label*="menu"]') ||
                           await dashboardPage.$('.mobile-menu-toggle') ||
                           await dashboardPage.$('button:has-text("☰")');

  if (mobileMenuButton) {
    await mobileMenuButton.click();
    await dashboardPage.waitForTimeout(1000);
    await takeScreenshot(dashboardPage, 'dashboard-mobile-menu', 'mobile');
    console.log('✅ Dashboard mobile navigation works');
    results.mobileNavigation.dashboard = true;
  } else {
    console.log('❌ Dashboard mobile navigation not found');
  }

  await dashboardContext.close();
}

async function generateReport() {
  console.log('\n' + '='.repeat(50));
  console.log('GENERATING FINAL REPORT');
  console.log('='.repeat(50));

  const totalTests = results.websitePages.total + results.dashboardPages.total + 2; // +2 for CORS and mobile
  const totalPassed = results.websitePages.passed + results.dashboardPages.passed +
                     (results.corsVerification.passed ? 1 : 0) +
                     ((results.mobileNavigation.website && results.mobileNavigation.dashboard) ? 1 : 0);

  const passRate = Math.round((totalPassed / totalTests) * 100);
  const isProductionReady = passRate === 100 && results.criticalErrors.length === 0;

  const report = `# PRODUCTION READINESS FINAL REPORT

**Date:** ${new Date().toISOString()}
**System:** Senova CRM
**Environment:** Production Verification

---

## EXECUTIVE SUMMARY

### 🎯 VERDICT: ${isProductionReady ? '✅ PRODUCTION READY' : '❌ NOT PRODUCTION READY'}

**Overall Pass Rate:** ${passRate}%
**Total Tests:** ${totalTests}
**Passed:** ${totalPassed}
**Failed:** ${totalTests - totalPassed}

---

## TEST RESULTS

### TEST 1: Website Pages (23 pages)
**Result:** ${results.websitePages.passed}/${results.websitePages.total} PASSED

${results.websitePages.failures.length > 0 ?
`**Failures:**
${results.websitePages.failures.map(f => `- ${f.page}: ${f.error}`).join('\n')}` :
'✅ All pages loaded successfully'}

### TEST 2: Dashboard Pages (11 pages)
**Result:** ${results.dashboardPages.passed}/${results.dashboardPages.total} PASSED

${results.dashboardPages.failures.length > 0 ?
`**Failures:**
${results.dashboardPages.failures.map(f => `- ${f.page}: ${f.error}`).join('\n')}` :
'✅ All dashboard pages accessible'}

### TEST 3: CORS Verification
**Result:** ${results.corsVerification.passed ? '✅ PASS' : '❌ FAIL'}

${results.corsVerification.errors.length > 0 ?
`**Errors:**
${results.corsVerification.errors.map(e => `- ${e}`).join('\n')}` :
'✅ No CORS errors detected'}

### TEST 4: Mobile Navigation
**Website:** ${results.mobileNavigation.website ? '✅ PASS' : '❌ FAIL'}
**Dashboard:** ${results.mobileNavigation.dashboard ? '✅ PASS' : '❌ FAIL'}

---

## CRITICAL ISSUES

${results.criticalErrors.length > 0 ?
results.criticalErrors.map(e => `- ${e}`).join('\n') :
'None detected'}

---

## SCREENSHOTS CAPTURED

Total: ${results.screenshots.length}

${results.screenshots.slice(0, 10).map(s => `- ${s.category}/${s.name}: ${s.file}`).join('\n')}
${results.screenshots.length > 10 ? `\n... and ${results.screenshots.length - 10} more` : ''}

---

## RECOMMENDATION

${isProductionReady ?
`### ✅ SYSTEM IS PRODUCTION READY

The Senova CRM has passed all critical tests:
- All 23 website pages are accessible
- All 11 dashboard pages are functional
- CORS is properly configured
- Mobile navigation is working
- No critical errors detected

**The system can be deployed to production.**` :
`### ❌ SYSTEM NEEDS FIXES

The following issues must be resolved before production:
${[
  ...results.websitePages.failures.map(f => `- Fix ${f.page}: ${f.error}`),
  ...results.dashboardPages.failures.map(f => `- Fix ${f.page}: ${f.error}`),
  ...(results.corsVerification.errors.length > 0 ? ['- Resolve CORS configuration issues'] : []),
  ...(!results.mobileNavigation.website ? ['- Fix website mobile navigation'] : []),
  ...(!results.mobileNavigation.dashboard ? ['- Fix dashboard mobile navigation'] : [])
].join('\n')}

**DO NOT deploy until all issues are resolved.**`}

---

## TEST EXECUTION DETAILS

- Test Framework: Playwright
- Browser: Chromium
- Viewport: Desktop (1280x720) and Mobile (375x812)
- Timeout: 60 seconds per page
- Screenshot Evidence: ${results.screenshots.length} files in /screenshots/production-final/

---

*Generated by Debugger Agent - Final Production Verification*
`;

  // Save report
  const reportPath = path.join(__dirname, '..', 'PRODUCTION_READINESS_FINAL_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Report saved to: ${reportPath}`);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('FINAL VERDICT');
  console.log('='.repeat(50));
  console.log(`\n${isProductionReady ? '✅ PRODUCTION READY' : '❌ NOT PRODUCTION READY'}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`Website Pages: ${results.websitePages.passed}/${results.websitePages.total}`);
  console.log(`Dashboard Pages: ${results.dashboardPages.passed}/${results.dashboardPages.total}`);
  console.log(`CORS: ${results.corsVerification.passed ? 'PASS' : 'FAIL'}`);
  console.log(`Mobile Nav: ${results.mobileNavigation.website && results.mobileNavigation.dashboard ? 'PASS' : 'FAIL'}`);

  return isProductionReady;
}

async function main() {
  console.log('🚀 STARTING FINAL PRODUCTION VERIFICATION');
  console.log('Time:', new Date().toISOString());
  console.log('=' .repeat(50));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test 1: Website Pages
    const websitePage = await browser.newPage();
    await testWebsitePages(websitePage);
    await websitePage.close();

    // Test 2: Dashboard
    await testDashboard(browser);

    // Test 3: CORS
    await testCORS(browser);

    // Test 4: Mobile Navigation
    await testMobileNavigation(browser);

    // Generate Report
    const isReady = await generateReport();

    process.exit(isReady ? 0 : 1);

  } catch (error) {
    console.error('Critical test failure:', error);
    results.criticalErrors.push(error.message);
    await generateReport();
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);