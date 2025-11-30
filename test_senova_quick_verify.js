const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'screenshots', 'senova-final-verification');

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function quickVerify() {
  console.log('================================================================================');
  console.log('SENOVA CRM - FINAL PRODUCTION VERIFICATION');
  console.log('================================================================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('URL: http://localhost:3004');
  console.log('================================================================================\n');

  const results = {
    tests: [],
    branding: { senova: 0, eve: 0 },
    passed: 0,
    failed: 0
  };

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Track errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Helper to take screenshot
    async function screenshot(name) {
      const file = path.join(screenshotDir, `${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`  Screenshot: ${name}.png`);
      return file;
    }

    // Helper to check branding
    async function checkBranding() {
      const content = await page.content();
      const senova = (content.match(/Senova/gi) || []).length;
      const eve = (content.match(/Eve\s*(Beauty|CRM|Care)/gi) || []).length;

      results.branding.senova += senova;
      results.branding.eve += eve;

      console.log(`  Branding - Senova: ${senova}, Eve: ${eve}`);
      return { senova, eve };
    }

    // Helper to run test
    async function test(name, fn) {
      console.log(`\nTest: ${name}`);
      try {
        const result = await fn();
        if (result === true) {
          console.log(`  ✅ PASS`);
          results.passed++;
          results.tests.push({ name, status: 'PASS' });
        } else {
          console.log(`  ❌ FAIL: ${result}`);
          results.failed++;
          results.tests.push({ name, status: 'FAIL', reason: result });
        }
      } catch (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
        results.failed++;
        results.tests.push({ name, status: 'ERROR', reason: error.message });
      }
    }

    // ========== TEST 1: LOGIN PAGE ==========
    await test('1. Login Page Branding', async () => {
      await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
      await screenshot('01-login');

      const branding = await checkBranding();

      // Check page title
      const title = await page.title();
      console.log(`  Title: ${title}`);

      // Check for login form
      const hasEmail = await page.locator('input[type="email"]').isVisible();
      const hasPassword = await page.locator('input[type="password"]').isVisible();
      console.log(`  Login form: Email=${hasEmail}, Password=${hasPassword}`);

      if (branding.eve > 0) return `Eve branding found: ${branding.eve} instances`;
      if (branding.senova === 0) return 'No Senova branding found';
      if (!hasEmail || !hasPassword) return 'Login form missing';

      return true;
    });

    // ========== TEST 2: PUBLIC PAGES ==========
    const publicPages = [
      { name: 'Home', url: '/' },
      { name: 'Pricing', url: '/pricing' },
      { name: 'About', url: '/about' },
      { name: 'Platform', url: '/platform' },
      { name: 'Contact', url: '/contact' }
    ];

    for (const [index, pageInfo] of publicPages.entries()) {
      await test(`${index + 2}. ${pageInfo.name} Page`, async () => {
        await page.goto(`http://localhost:3004${pageInfo.url}`, { waitUntil: 'networkidle' });
        await screenshot(`0${index + 2}-${pageInfo.name.toLowerCase()}`);

        // Check for 404
        const content = await page.content();
        if (content.includes('404') || content.includes('Not Found')) {
          return '404 Page Not Found';
        }

        await checkBranding();
        return true;
      });
    }

    // ========== TEST 7: MASTER OWNER LOGIN ==========
    await test('7. Master Owner Login', async () => {
      await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });

      // Fill credentials
      await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
      await page.fill('input[type="password"]', 'D3n1w3n1!');
      await screenshot('07-login-filled');

      // Click sign in
      await page.click('button:has-text("Sign In")');

      // Wait for dashboard
      try {
        await page.waitForURL('**/dashboard**', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
      } catch (e) {
        return 'Login failed - did not redirect to dashboard';
      }

      await screenshot('08-dashboard');

      const url = page.url();
      console.log(`  Current URL: ${url}`);

      if (!url.includes('/dashboard')) {
        return `Wrong page after login: ${url}`;
      }

      return true;
    });

    // ========== TEST 8: DASHBOARD BRANDING ==========
    await test('8. Dashboard Branding', async () => {
      const branding = await checkBranding();

      // Check header for branding
      const headerText = await page.locator('header, nav, [class*="header"]').first().textContent().catch(() => '');
      console.log(`  Header contains: "${headerText.substring(0, 50)}..."`);

      if (branding.eve > 0) return `Eve branding found: ${branding.eve} instances`;
      if (branding.senova === 0 && !headerText.includes('Senova')) {
        return 'No Senova branding in dashboard';
      }

      return true;
    });

    // ========== TEST 9: OBJECTS TAB VISIBILITY ==========
    await test('9. Objects Tab in Navigation', async () => {
      await screenshot('09-sidebar');

      // Look for Objects in navigation
      const objectsVisible = await page.locator('a:has-text("Objects")').isVisible().catch(() => false);

      if (!objectsVisible) {
        // Check if text exists anywhere
        const objectsText = await page.locator('text=Objects').count();
        console.log(`  'Objects' text found ${objectsText} times`);

        if (objectsText === 0) {
          return 'Objects tab not found in navigation';
        }
      }

      console.log(`  Objects link visible: ${objectsVisible}`);
      return true;
    });

    // ========== TEST 10: OBJECTS PAGE ==========
    await test('10. Objects Page Access', async () => {
      // Navigate to Objects
      await page.goto('http://localhost:3004/dashboard/objects', { waitUntil: 'networkidle' });
      await screenshot('10-objects-page');

      const url = page.url();
      console.log(`  Current URL: ${url}`);

      if (!url.includes('/objects')) {
        return 'Failed to access Objects page';
      }

      // Check for Senova CRM object
      const senovaObject = await page.locator('text=/Senova.*CRM/i').count();
      console.log(`  Senova CRM object found: ${senovaObject > 0}`);

      // Check for Create button
      const createBtn = await page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first().isVisible().catch(() => false);
      console.log(`  Create button visible: ${createBtn}`);

      await checkBranding();

      if (senovaObject === 0) {
        return 'Senova CRM object not found in list';
      }

      return true;
    });

    // ========== TEST 11: THEME CHECK ==========
    await test('11. Purple Theme (#4A00D4)', async () => {
      // Check for purple color in styles
      const purpleElements = await page.evaluate(() => {
        const purple = '#4A00D4';
        const purpleRgb = '74, 0, 212';
        let found = 0;

        // Check all elements
        document.querySelectorAll('*').forEach(el => {
          const styles = getComputedStyle(el);
          if (styles.backgroundColor.includes(purpleRgb) ||
              styles.color.includes(purpleRgb) ||
              styles.borderColor.includes(purpleRgb)) {
            found++;
          }
        });

        return found;
      });

      console.log(`  Purple theme elements: ${purpleElements}`);

      if (purpleElements === 0) {
        return 'Purple theme not applied';
      }

      return true;
    });

    // ========== TEST 12-15: CORE CRM FEATURES ==========
    const crmPages = [
      { name: 'Contacts', url: '/dashboard/contacts' },
      { name: 'Conversations', url: '/dashboard/conversations' },
      { name: 'Email', url: '/dashboard/email' },
      { name: 'Settings', url: '/dashboard/settings' }
    ];

    for (const [index, pageInfo] of crmPages.entries()) {
      await test(`${12 + index}. ${pageInfo.name} Page`, async () => {
        await page.goto(`http://localhost:3004${pageInfo.url}`, { waitUntil: 'networkidle' });
        await screenshot(`${12 + index}-${pageInfo.name.toLowerCase()}`);

        const url = page.url();
        if (!url.includes(pageInfo.url.split('/').pop())) {
          return `Failed to load - redirected to ${url}`;
        }

        await checkBranding();
        return true;
      });
    }

    // ========== TEST 16: CONSOLE ERRORS ==========
    await test('16. Console Errors', async () => {
      console.log(`  Total errors: ${errors.length}`);
      if (errors.length > 0) {
        console.log(`  First error: ${errors[0].substring(0, 100)}`);
        return `${errors.length} console errors detected`;
      }
      return true;
    });

    console.log('\n================================================================================');
    console.log('FINAL RESULTS');
    console.log('================================================================================');

    const total = results.passed + results.failed;
    const passRate = (results.passed / total * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Pass Rate: ${passRate}%`);

    console.log(`\nBranding Summary:`);
    console.log(`  Total Senova mentions: ${results.branding.senova}`);
    console.log(`  Total Eve mentions: ${results.branding.eve}`);

    if (results.failed > 0) {
      console.log(`\nFailed Tests:`);
      results.tests.filter(t => t.status !== 'PASS').forEach(t => {
        console.log(`  - ${t.name}: ${t.reason || t.status}`);
      });
    }

    console.log('\n================================================================================');
    console.log('PRODUCTION READINESS VERDICT');
    console.log('================================================================================');

    const criticalFailures = results.tests.filter(t =>
      t.status !== 'PASS' &&
      (t.name.includes('Login') || t.name.includes('Objects') || t.name.includes('Branding'))
    );

    if (passRate >= 95 && criticalFailures.length === 0) {
      console.log('✅ APPROVED FOR PRODUCTION');
      console.log(`Pass rate: ${passRate}% (target: 95%+)`);
    } else {
      console.log('❌ BLOCKED - NOT READY FOR PRODUCTION');
      console.log(`Pass rate: ${passRate}% (requires 95%+)`);
      console.log(`Critical failures: ${criticalFailures.length}`);
    }

    console.log('================================================================================\n');

    return results;

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await browser.close();
  }
}

// Run verification
quickVerify().catch(console.error);