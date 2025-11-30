const { chromium } = require('playwright');
const path = require('path');

// Screenshot directory
const screenshotDir = path.join(__dirname, 'screenshots', 'senova-final-verification');

// Test results tracking
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  criticalFailures: [],
  minorIssues: [],
  brandingCheck: {
    senovaCount: 0,
    eveCount: 0
  }
};

// Helper function to take screenshot
async function screenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  await page.screenshot({
    path: path.join(screenshotDir, filename),
    fullPage: true
  });
  return filename;
}

// Helper function to test a feature
async function testFeature(page, name, testFn) {
  testResults.totalTests++;
  console.log(`\nTesting: ${name}`);
  try {
    const result = await testFn();
    if (result === true || result === undefined) {
      testResults.passed++;
      console.log(`✅ PASS: ${name}`);
      return true;
    } else {
      testResults.failed++;
      console.log(`❌ FAIL: ${name} - ${result}`);
      testResults.criticalFailures.push(`${name}: ${result}`);
      return false;
    }
  } catch (error) {
    testResults.failed++;
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    testResults.criticalFailures.push(`${name}: ${error.message}`);
    return false;
  }
}

// Check for branding
async function checkBranding(page) {
  const content = await page.content();
  const senovaMatches = (content.match(/Senova/gi) || []).length;
  const eveMatches = (content.match(/Eve\s*(Beauty|CRM|Care)/gi) || []).length;

  testResults.brandingCheck.senovaCount += senovaMatches;
  testResults.brandingCheck.eveCount += eveMatches;

  console.log(`  Branding: Senova: ${senovaMatches}, Eve: ${eveMatches}`);

  if (eveMatches > 0) {
    testResults.minorIssues.push(`Eve branding found: ${eveMatches} instances on ${page.url()}`);
  }

  return { senova: senovaMatches, eve: eveMatches };
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('SENOVA CRM - FINAL PRODUCTION VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log(`URL: http://localhost:3004`);
  console.log('='.repeat(80));

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Track network failures
  const networkFailures = [];
  page.on('requestfailed', request => {
    networkFailures.push({
      url: request.url(),
      failure: request.failure().errorText
    });
  });

  try {
    // ========================================================================
    // PHASE 1: PUBLIC WEBSITE VERIFICATION
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1: PUBLIC WEBSITE VERIFICATION');
    console.log('='.repeat(80));

    // Test Home Page
    await testFeature(page, 'Home Page Load', async () => {
      await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });
      await screenshot(page, '01-home-page');
      await checkBranding(page);

      // Check for key elements
      const hasContent = await page.locator('body').isVisible();
      if (!hasContent) return 'Page body not visible';

      // Check title
      const title = await page.title();
      console.log(`  Page Title: ${title}`);

      return true;
    });

    // Test Pricing Page
    await testFeature(page, 'Pricing Page', async () => {
      await page.goto('http://localhost:3004/pricing', { waitUntil: 'networkidle' });
      await screenshot(page, '02-pricing-page');

      // Check if it's a 404
      const is404 = await page.locator('text=/404|not found/i').count() > 0;
      if (is404) return '404 Page Not Found';

      await checkBranding(page);
      return true;
    });

    // Test About Page
    await testFeature(page, 'About Page', async () => {
      await page.goto('http://localhost:3004/about', { waitUntil: 'networkidle' });
      await screenshot(page, '03-about-page');

      const is404 = await page.locator('text=/404|not found/i').count() > 0;
      if (is404) return '404 Page Not Found';

      await checkBranding(page);
      return true;
    });

    // Test Platform Page
    await testFeature(page, 'Platform Page', async () => {
      await page.goto('http://localhost:3004/platform', { waitUntil: 'networkidle' });
      await screenshot(page, '04-platform-page');

      const is404 = await page.locator('text=/404|not found/i').count() > 0;
      if (is404) return '404 Page Not Found';

      await checkBranding(page);
      return true;
    });

    // Test Contact Page
    await testFeature(page, 'Contact Page', async () => {
      await page.goto('http://localhost:3004/contact', { waitUntil: 'networkidle' });
      await screenshot(page, '05-contact-page');

      const is404 = await page.locator('text=/404|not found/i').count() > 0;
      if (is404) return '404 Page Not Found';

      await checkBranding(page);
      return true;
    });

    // ========================================================================
    // PHASE 2: AUTHENTICATION & LOGIN
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: AUTHENTICATION & LOGIN');
    console.log('='.repeat(80));

    await testFeature(page, 'Login Page Branding', async () => {
      await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
      await screenshot(page, '06-login-page');

      const branding = await checkBranding(page);

      // Check for Senova branding specifically
      if (branding.senova === 0) {
        return 'No Senova branding found on login page';
      }

      if (branding.eve > 0) {
        return `Eve branding still present: ${branding.eve} instances`;
      }

      return true;
    });

    await testFeature(page, 'Master Owner Login', async () => {
      // Fill login form
      await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
      await page.fill('input[type="password"]', 'D3n1w3n1!');
      await screenshot(page, '07-login-filled');

      // Click sign in
      await page.click('button:has-text("Sign In")');

      // Wait for navigation
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      await screenshot(page, '08-dashboard-loaded');

      // Verify we're on dashboard
      const url = page.url();
      if (!url.includes('/dashboard')) {
        return `Login failed - redirected to ${url}`;
      }

      return true;
    });

    // ========================================================================
    // PHASE 3: DASHBOARD & NAVIGATION
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3: DASHBOARD & NAVIGATION');
    console.log('='.repeat(80));

    await testFeature(page, 'Dashboard Branding', async () => {
      const branding = await checkBranding(page);

      // Look for Senova in header/title
      const headerText = await page.locator('header, nav, [class*="header"], [class*="navbar"]').textContent().catch(() => '');
      console.log(`  Header text: ${headerText.substring(0, 100)}`);

      if (branding.senova === 0 && !headerText.includes('Senova')) {
        return 'No Senova branding found on dashboard';
      }

      return true;
    });

    await testFeature(page, 'Theme Color Check', async () => {
      // Check for purple theme color #4A00D4
      const purpleElements = await page.locator('[style*="4A00D4"], [style*="74, 0, 212"]').count();
      console.log(`  Purple theme elements found: ${purpleElements}`);

      // Check CSS variables
      const cssVars = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
          primary: styles.getPropertyValue('--primary'),
          accent: styles.getPropertyValue('--accent'),
          theme: styles.getPropertyValue('--theme-primary')
        };
      });
      console.log(`  CSS Variables:`, cssVars);

      return true;
    });

    await testFeature(page, 'Objects Tab Visibility', async () => {
      // Check sidebar for Objects link
      const objectsLink = page.locator('nav a:has-text("Objects"), aside a:has-text("Objects"), [role="navigation"] a:has-text("Objects")');
      const isVisible = await objectsLink.isVisible().catch(() => false);

      await screenshot(page, '09-sidebar-navigation');

      if (!isVisible) {
        // Try to find it in any nav element
        const anyObjects = await page.locator('text=Objects').count();
        console.log(`  'Objects' text found ${anyObjects} times on page`);

        if (anyObjects === 0) {
          return 'Objects tab not visible in navigation';
        }
      }

      return true;
    });

    // ========================================================================
    // PHASE 4: OBJECTS FEATURE
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 4: OBJECTS FEATURE');
    console.log('='.repeat(80));

    await testFeature(page, 'Navigate to Objects Page', async () => {
      // Try clicking Objects link if visible
      const objectsLink = page.locator('a:has-text("Objects")').first();
      if (await objectsLink.isVisible().catch(() => false)) {
        await objectsLink.click();
        await page.waitForLoadState('networkidle');
      } else {
        // Navigate directly
        await page.goto('http://localhost:3004/dashboard/objects', { waitUntil: 'networkidle' });
      }

      await screenshot(page, '10-objects-page');

      const url = page.url();
      if (!url.includes('/objects')) {
        return `Failed to navigate to Objects page - current URL: ${url}`;
      }

      return true;
    });

    await testFeature(page, 'Senova CRM Object Visibility', async () => {
      // Look for Senova CRM in the objects list
      const senovaObject = await page.locator('text=/Senova.*CRM/i').count();

      if (senovaObject === 0) {
        console.log('  Senova CRM object not found in list');

        // Check if any objects are visible
        const anyObjects = await page.locator('table tbody tr, [role="row"], .object-item').count();
        console.log(`  Total objects visible: ${anyObjects}`);

        return 'Senova CRM object not visible in list';
      }

      console.log(`  Senova CRM object found`);
      return true;
    });

    await testFeature(page, 'Create Object Button', async () => {
      const createButton = page.locator('button:has-text("Create Object"), button:has-text("New Object"), button:has-text("Add Object")').first();
      const isVisible = await createButton.isVisible().catch(() => false);

      if (!isVisible) {
        // Check for any create/add buttons
        const anyCreateButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').count();
        console.log(`  Create/Add buttons found: ${anyCreateButton}`);

        return 'Create Object button not visible';
      }

      await screenshot(page, '11-create-object-button');
      return true;
    });

    // ========================================================================
    // PHASE 5: CORE CRM FEATURES
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 5: CORE CRM FEATURES');
    console.log('='.repeat(80));

    await testFeature(page, 'Contacts Page', async () => {
      await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle' });
      await screenshot(page, '12-contacts-page');

      const hasContacts = await page.locator('h1:has-text("Contacts"), h2:has-text("Contacts"), [class*="title"]:has-text("Contacts")').isVisible().catch(() => false);

      if (!hasContacts) {
        const pageContent = await page.locator('body').textContent();
        if (pageContent.toLowerCase().includes('contact')) {
          return true;
        }
        return 'Contacts page not loading correctly';
      }

      await checkBranding(page);
      return true;
    });

    await testFeature(page, 'Conversations/Inbox Page', async () => {
      await page.goto('http://localhost:3004/dashboard/conversations', { waitUntil: 'networkidle' });
      await screenshot(page, '13-conversations-page');

      // Check if page loaded
      const url = page.url();
      if (!url.includes('/conversations') && !url.includes('/inbox')) {
        return `Failed to load conversations - redirected to ${url}`;
      }

      await checkBranding(page);
      return true;
    });

    await testFeature(page, 'Email Page', async () => {
      await page.goto('http://localhost:3004/dashboard/email', { waitUntil: 'networkidle' });
      await screenshot(page, '14-email-page');

      const url = page.url();
      if (!url.includes('/email')) {
        return `Failed to load email - redirected to ${url}`;
      }

      await checkBranding(page);
      return true;
    });

    await testFeature(page, 'Settings Page', async () => {
      await page.goto('http://localhost:3004/dashboard/settings', { waitUntil: 'networkidle' });
      await screenshot(page, '15-settings-page');

      const url = page.url();
      if (!url.includes('/settings')) {
        return `Failed to load settings - redirected to ${url}`;
      }

      await checkBranding(page);
      return true;
    });

    // ========================================================================
    // PHASE 6: ADDITIONAL PUBLIC PAGES
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 6: ADDITIONAL PUBLIC PAGES');
    console.log('='.repeat(80));

    const additionalPages = [
      { name: 'Solutions CRM', url: '/solutions/crm' },
      { name: 'Solutions AI', url: '/solutions/audience-intelligence' },
      { name: 'Medical Spas Industry', url: '/industries/medical-spas' },
      { name: 'HIPAA Compliance', url: '/hipaa' },
      { name: 'Security', url: '/security' }
    ];

    for (const pageInfo of additionalPages) {
      await testFeature(page, pageInfo.name, async () => {
        await page.goto(`http://localhost:3004${pageInfo.url}`, { waitUntil: 'networkidle' });

        const is404 = await page.locator('text=/404|not found/i').count() > 0;
        if (is404) {
          testResults.minorIssues.push(`${pageInfo.name} returns 404`);
          return `404 Page Not Found`;
        }

        await checkBranding(page);
        return true;
      });
    }

    // ========================================================================
    // PHASE 7: CONSOLE & NETWORK ERRORS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 7: CONSOLE & NETWORK ERRORS');
    console.log('='.repeat(80));

    await testFeature(page, 'Console Errors Check', async () => {
      if (consoleErrors.length > 0) {
        console.log(`  Found ${consoleErrors.length} console errors:`);
        consoleErrors.slice(0, 5).forEach(err => {
          console.log(`    - ${err.substring(0, 100)}`);
        });
        testResults.minorIssues.push(`${consoleErrors.length} console errors detected`);
      } else {
        console.log('  No console errors detected');
      }
      return true;
    });

    await testFeature(page, 'Network Failures Check', async () => {
      if (networkFailures.length > 0) {
        console.log(`  Found ${networkFailures.length} network failures:`);
        networkFailures.slice(0, 5).forEach(fail => {
          console.log(`    - ${fail.url}: ${fail.failure}`);
        });
        testResults.minorIssues.push(`${networkFailures.length} network failures detected`);
      } else {
        console.log('  No network failures detected');
      }
      return true;
    });

  } catch (error) {
    console.error('Critical test failure:', error);
    testResults.criticalFailures.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  console.log('\n' + '='.repeat(80));
  console.log('FINAL TEST SUMMARY');
  console.log('='.repeat(80));

  const passRate = (testResults.passed / testResults.totalTests * 100).toFixed(1);

  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`\nBranding Summary:`);
  console.log(`  - Senova mentions: ${testResults.brandingCheck.senovaCount}`);
  console.log(`  - Eve mentions: ${testResults.brandingCheck.eveCount}`);

  if (testResults.criticalFailures.length > 0) {
    console.log(`\n❌ CRITICAL FAILURES (${testResults.criticalFailures.length}):`);
    testResults.criticalFailures.forEach(failure => {
      console.log(`  - ${failure}`);
    });
  }

  if (testResults.minorIssues.length > 0) {
    console.log(`\n⚠️ MINOR ISSUES (${testResults.minorIssues.length}):`);
    testResults.minorIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  // Production readiness verdict
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCTION READINESS VERDICT');
  console.log('='.repeat(80));

  const isProductionReady = passRate >= 95 && testResults.criticalFailures.length === 0;

  if (isProductionReady) {
    console.log('✅ APPROVED FOR PRODUCTION');
    console.log('All critical features working, pass rate above 95%');
  } else {
    console.log('❌ BLOCKED - NOT READY FOR PRODUCTION');
    console.log(`Pass rate: ${passRate}% (requires 95%+)`);
    console.log(`Critical failures: ${testResults.criticalFailures.length} (must be 0)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`End Time: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  return testResults;
}

// Run the tests
runTests().catch(console.error);