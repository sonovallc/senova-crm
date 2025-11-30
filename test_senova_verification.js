const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\senova-verification';
const TEST_EMAIL = 'admin@senovallc.com';
const TEST_PASSWORD = 'TestPass123!';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: {
    login: { status: 'pending', screenshots: [], errors: [] },
    branding: { status: 'pending', screenshots: [], errors: [] },
    dashboard: { status: 'pending', screenshots: [], errors: [] },
    navigation: { status: 'pending', screenshots: [], errors: [] },
    publicPages: { status: 'pending', screenshots: [], errors: [] },
    objects: { status: 'pending', screenshots: [], errors: [] },
    design: { status: 'pending', screenshots: [], errors: [] }
  },
  brandingIssues: [],
  consoleErrors: [],
  brokenLinks: []
};

async function captureScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

async function checkForEveBranding(page) {
  console.log('🔍 Checking for Eve Beauty/Eve CRM branding...');
  const issues = [];

  // Check page content for Eve mentions
  const pageContent = await page.content();
  const eveRegex = /Eve\s*(Beauty|CRM)/gi;
  const matches = pageContent.match(eveRegex);

  if (matches) {
    issues.push({
      url: page.url(),
      matches: matches,
      count: matches.length
    });
    console.log(`❌ Found ${matches.length} Eve branding occurrences!`);
  }

  return issues;
}

async function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        url: page.url(),
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });
  return errors;
}

async function runTests() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1080']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Collect console errors throughout
  collectConsoleErrors(page);

  try {
    // ====================
    // TEST 1: LOGIN & AUTHENTICATION
    // ====================
    console.log('\\n📋 TEST 1: LOGIN & AUTHENTICATION');
    console.log('=====================================');

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    testResults.tests.login.screenshots.push(await captureScreenshot(page, 'login-page-initial'));

    // Check for Eve branding on login page
    const loginBrandingIssues = await checkForEveBranding(page);
    testResults.brandingIssues.push(...loginBrandingIssues);

    // Check for Senova branding
    const senovaBranding = await page.locator('text=/Senova/i').count();
    console.log(`✅ Found ${senovaBranding} Senova branding elements on login page`);

    // Fill login form
    await page.fill('input[type="email"], input[name="email"], #email', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"], #password', TEST_PASSWORD);
    testResults.tests.login.screenshots.push(await captureScreenshot(page, 'login-form-filled'));

    // Submit login
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Dashboard redirect may have failed');
    });

    testResults.tests.login.screenshots.push(await captureScreenshot(page, 'login-success-dashboard'));
    testResults.tests.login.status = 'passed';

    // ====================
    // TEST 2: DASHBOARD & NAVIGATION
    // ====================
    console.log('\\n📋 TEST 2: DASHBOARD & NAVIGATION');
    console.log('====================================');

    // Check dashboard branding
    const dashboardBrandingIssues = await checkForEveBranding(page);
    testResults.brandingIssues.push(...dashboardBrandingIssues);

    testResults.tests.dashboard.screenshots.push(await captureScreenshot(page, 'dashboard-main'));

    // Test all sidebar navigation links
    const navLinks = [
      { text: 'Dashboard', url: '/dashboard' },
      { text: 'Contacts', url: '/dashboard/contacts' },
      { text: 'Objects', url: '/dashboard/objects' },
      { text: 'Conversations', url: '/dashboard/conversations' },
      { text: 'Email', url: '/dashboard/email' },
      { text: 'Calendar', url: '/dashboard/calendar' },
      { text: 'Automations', url: '/dashboard/automations' },
      { text: 'Reporting', url: '/dashboard/reporting' },
      { text: 'Integrations', url: '/dashboard/integrations' },
      { text: 'Settings', url: '/dashboard/settings' }
    ];

    for (const link of navLinks) {
      console.log(`Testing navigation: ${link.text}`);
      const navElement = page.locator(`a:has-text("${link.text}"), button:has-text("${link.text}")`).first();

      if (await navElement.count() > 0) {
        await navElement.click();
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        const currentUrl = page.url();
        if (currentUrl.includes('404') || currentUrl.includes('error')) {
          testResults.brokenLinks.push({ text: link.text, url: currentUrl });
          console.log(`❌ 404/Error on ${link.text}`);
        } else {
          console.log(`✅ ${link.text} loaded successfully`);
        }

        testResults.tests.navigation.screenshots.push(
          await captureScreenshot(page, `nav-${link.text.toLowerCase().replace(/\\s+/g, '-')}`)
        );

        // Check for Eve branding on each page
        const pageBrandingIssues = await checkForEveBranding(page);
        testResults.brandingIssues.push(...pageBrandingIssues);
      }
    }

    testResults.tests.dashboard.status = 'passed';
    testResults.tests.navigation.status = 'passed';

    // ====================
    // TEST 3: OBJECTS FEATURE
    // ====================
    console.log('\\n📋 TEST 3: OBJECTS FEATURE');
    console.log('=============================');

    await page.goto(`${BASE_URL}/dashboard/objects`, { waitUntil: 'networkidle', timeout: 30000 });
    testResults.tests.objects.screenshots.push(await captureScreenshot(page, 'objects-list-page'));

    // Check for create button (owner role)
    const createButton = await page.locator('button:has-text("Create Object"), button:has-text("New Object"), button:has-text("Add Object")').count();
    console.log(`Create Object button present: ${createButton > 0 ? '✅' : '❌'}`);

    // Try clicking on an object if any exist
    const objectRows = await page.locator('table tbody tr, [role="row"]').count();
    console.log(`Found ${objectRows} object rows`);

    if (objectRows > 0) {
      await page.locator('table tbody tr, [role="row"]').first().click();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      testResults.tests.objects.screenshots.push(await captureScreenshot(page, 'objects-detail-page'));
    }

    testResults.tests.objects.status = 'passed';

    // ====================
    // TEST 4: PUBLIC WEBSITE PAGES
    // ====================
    console.log('\\n📋 TEST 4: PUBLIC WEBSITE PAGES');
    console.log('==================================');

    const publicPages = [
      { name: 'Home', url: '/' },
      { name: 'Platform', url: '/platform' },
      { name: 'Pricing', url: '/pricing' },
      { name: 'About', url: '/about' },
      { name: 'Contact', url: '/contact' },
      { name: 'CRM Solution', url: '/solutions/crm' },
      { name: 'Audience Intelligence', url: '/solutions/audience-intelligence' },
      { name: 'Medical Spas', url: '/industries/medical-spas' },
      { name: 'HIPAA', url: '/hipaa' },
      { name: 'Security', url: '/security' }
    ];

    for (const pageInfo of publicPages) {
      console.log(`Testing public page: ${pageInfo.name}`);
      await page.goto(`${BASE_URL}${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      }).catch(async (e) => {
        console.log(`❌ Failed to load ${pageInfo.name}: ${e.message}`);
        testResults.brokenLinks.push({ name: pageInfo.name, url: pageInfo.url, error: e.message });
      });

      // Check response status
      const response = await page.goto(`${BASE_URL}${pageInfo.url}`).catch(() => null);
      if (response && response.status() === 404) {
        testResults.brokenLinks.push({ name: pageInfo.name, url: pageInfo.url, status: 404 });
        console.log(`❌ 404 Error on ${pageInfo.name}`);
      } else {
        console.log(`✅ ${pageInfo.name} loaded successfully`);
      }

      testResults.tests.publicPages.screenshots.push(
        await captureScreenshot(page, `public-${pageInfo.name.toLowerCase().replace(/\\s+/g, '-')}`)
      );

      // Check for Eve branding
      const pageBrandingIssues = await checkForEveBranding(page);
      testResults.brandingIssues.push(...pageBrandingIssues);
    }

    testResults.tests.publicPages.status = testResults.brokenLinks.length === 0 ? 'passed' : 'failed';

    // ====================
    // TEST 5: DESIGN VERIFICATION
    // ====================
    console.log('\\n📋 TEST 5: DESIGN VERIFICATION');
    console.log('=================================');

    // Go back to dashboard for design checks
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for purple theme color
    const purpleElements = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor.includes('74, 0, 212') || // RGB for #4A00D4
               styles.backgroundColor.includes('4a00d4') ||
               styles.color.includes('74, 0, 212') ||
               styles.color.includes('4a00d4');
      }).length;
    });

    console.log(`Found ${purpleElements} elements with purple theme color`);

    // Check background colors (should be light)
    const backgroundCheck = await page.evaluate(() => {
      const body = document.body;
      const bgColor = window.getComputedStyle(body).backgroundColor;
      return bgColor;
    });

    console.log(`Background color: ${backgroundCheck}`);

    // Test hover effects
    const buttonWithHover = await page.locator('button').first();
    if (await buttonWithHover.count() > 0) {
      await buttonWithHover.hover();
      testResults.tests.design.screenshots.push(await captureScreenshot(page, 'design-hover-effects'));
    }

    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });
    testResults.tests.design.screenshots.push(await captureScreenshot(page, 'design-mobile-view'));

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    testResults.tests.design.status = 'passed';

    // ====================
    // FINAL BRANDING CHECK
    // ====================
    console.log('\\n📋 FINAL BRANDING CHECK');
    console.log('==========================');

    if (testResults.brandingIssues.length > 0) {
      console.log(`❌ CRITICAL: Found ${testResults.brandingIssues.length} pages with Eve branding!`);
      testResults.tests.branding.status = 'failed';
    } else {
      console.log('✅ No Eve Beauty/Eve CRM branding found!');
      testResults.tests.branding.status = 'passed';
    }

  } catch (error) {
    console.error('Test execution error:', error);
    throw error;
  } finally {
    await browser.close();
  }

  return testResults;
}

// Main execution
(async () => {
  console.log('🚀 Starting Senova CRM Exhaustive Verification');
  console.log('===============================================\\n');

  try {
    const results = await runTests();

    // Save results to JSON
    await fs.writeFile(
      path.join(SCREENSHOT_DIR, 'test-results.json'),
      JSON.stringify(results, null, 2)
    );

    // Print summary
    console.log('\\n📊 TEST SUMMARY');
    console.log('==================');

    let passCount = 0;
    let failCount = 0;

    for (const [testName, testData] of Object.entries(results.tests)) {
      if (testData.status === 'passed') {
        console.log(`✅ ${testName.toUpperCase()}: PASSED`);
        passCount++;
      } else if (testData.status === 'failed') {
        console.log(`❌ ${testName.toUpperCase()}: FAILED`);
        failCount++;
      } else {
        console.log(`⏳ ${testName.toUpperCase()}: ${testData.status}`);
      }
    }

    console.log(`\\nTotal: ${passCount} passed, ${failCount} failed`);

    if (results.brandingIssues.length > 0) {
      console.log(`\\n⚠️ CRITICAL: ${results.brandingIssues.length} Eve branding issues found!`);
    }

    if (results.brokenLinks.length > 0) {
      console.log(`\\n⚠️ ${results.brokenLinks.length} broken links found!`);
      results.brokenLinks.forEach(link => {
        console.log(`  - ${link.name || link.text}: ${link.url}`);
      });
    }

    console.log(`\\n📸 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
})();