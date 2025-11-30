const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = 'screenshots/debug-production-final';
const EMAIL = 'admin@evebeautyma.com';
const PASSWORD = 'TestPass123!';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results tracking
const results = {
  corsErrors: [],
  consoleErrors: [],
  features: {},
  bugFixes: {},
  screenshots: [],
  startTime: new Date().toISOString(),
};

// Helper: Capture console messages
function setupConsoleCapture(page) {
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${text}`);
      results.consoleErrors.push(text);

      // Check for CORS errors specifically
      if (text.includes('CORS') || text.includes('Access-Control-Allow-Origin')) {
        console.log(`[CORS ERROR DETECTED] ${text}`);
        results.corsErrors.push(text);
      }
    }
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    results.consoleErrors.push(error.message);
  });
}

// Helper: Take screenshot
async function screenshot(page, name) {
  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  results.screenshots.push(filename);
  console.log(`[SCREENSHOT] ${filename}`);
  return filename;
}

// Helper: Login
async function login(page) {
  console.log('\n=== LOGIN ===');
  await page.goto(`${APP_URL}/login`, { timeout: 60000 }); // Increased timeout for first load
  await page.waitForTimeout(2000);

  await screenshot(page, '01-login-page');

  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL(`${APP_URL}/dashboard`, { timeout: 60000 }); // Increased for initial compilation
  await page.waitForTimeout(3000);

  await screenshot(page, '02-dashboard-after-login');
  console.log('[LOGIN] Success');
}

// Helper: Test a feature page
async function testFeaturePage(page, name, url, checks = []) {
  console.log(`\n=== TESTING: ${name} ===`);
  const featureResult = {
    name,
    url,
    status: 'UNKNOWN',
    corsErrors: [],
    consoleErrors: [],
    screenshots: [],
    checks: {},
    error: null,
  };

  const beforeErrorCount = results.consoleErrors.length;
  const beforeCorsCount = results.corsErrors.length;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const screenshotName = await screenshot(page, `feature-${name.toLowerCase().replace(/\s+/g, '-')}`);
    featureResult.screenshots.push(screenshotName);

    // Check for CORS errors specific to this page
    const newCorsErrors = results.corsErrors.slice(beforeCorsCount);
    const newConsoleErrors = results.consoleErrors.slice(beforeErrorCount);

    featureResult.corsErrors = newCorsErrors;
    featureResult.consoleErrors = newConsoleErrors;

    // Run custom checks
    for (const check of checks) {
      try {
        const checkResult = await check.fn(page);
        featureResult.checks[check.name] = checkResult ? 'PASS' : 'FAIL';
        console.log(`  [CHECK] ${check.name}: ${checkResult ? 'PASS' : 'FAIL'}`);
      } catch (err) {
        featureResult.checks[check.name] = `ERROR: ${err.message}`;
        console.log(`  [CHECK] ${check.name}: ERROR - ${err.message}`);
      }
    }

    // Determine overall status
    if (newCorsErrors.length > 0) {
      featureResult.status = 'FAIL - CORS ERRORS';
      console.log(`[${name}] FAIL - CORS ERRORS DETECTED: ${newCorsErrors.length}`);
    } else if (Object.values(featureResult.checks).includes('FAIL')) {
      featureResult.status = 'FAIL - CHECK FAILED';
      console.log(`[${name}] FAIL - One or more checks failed`);
    } else if (Object.keys(featureResult.checks).length > 0) {
      featureResult.status = 'PASS';
      console.log(`[${name}] PASS`);
    } else {
      featureResult.status = 'PASS - Page Loaded';
      console.log(`[${name}] PASS - Page loaded successfully`);
    }

  } catch (error) {
    featureResult.status = 'FAIL - ERROR';
    featureResult.error = error.message;
    console.log(`[${name}] FAIL - ${error.message}`);
  }

  results.features[name] = featureResult;
  return featureResult;
}

// Main test function
async function runProductionVerification() {
  console.log('\n========================================');
  console.log('PRODUCTION FINAL VERIFICATION');
  console.log('========================================\n');
  console.log(`Start Time: ${results.startTime}`);
  console.log(`URL: ${APP_URL}`);
  console.log(`Credentials: ${EMAIL}`);
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Setup console capture
  setupConsoleCapture(page);

  try {
    // Login
    await login(page);

    // CRITICAL: CORS Verification on key pages
    console.log('\n========================================');
    console.log('CRITICAL: CORS VERIFICATION');
    console.log('========================================\n');

    await testFeaturePage(page, 'Campaigns Page - CORS Check', `${APP_URL}/dashboard/email/campaigns`, [
      {
        name: 'Page loads without CORS errors',
        fn: async (p) => {
          const corsErrorsBefore = results.corsErrors.length;
          await p.waitForTimeout(3000); // Wait for API calls
          return results.corsErrors.length === corsErrorsBefore;
        }
      }
    ]);

    await testFeaturePage(page, 'Autoresponders Page - CORS Check', `${APP_URL}/dashboard/email/autoresponders`, [
      {
        name: 'Page loads without CORS errors',
        fn: async (p) => {
          const corsErrorsBefore = results.corsErrors.length;
          await p.waitForTimeout(3000);
          return results.corsErrors.length === corsErrorsBefore;
        }
      }
    ]);

    await testFeaturePage(page, 'Mailgun Settings - CORS Check', `${APP_URL}/dashboard/settings/integrations/mailgun`, [
      {
        name: 'Page loads without CORS errors',
        fn: async (p) => {
          const corsErrorsBefore = results.corsErrors.length;
          await p.waitForTimeout(3000);
          return results.corsErrors.length === corsErrorsBefore;
        }
      }
    ]);

    await testFeaturePage(page, 'Email Settings - CORS Check', `${APP_URL}/dashboard/settings/email`, [
      {
        name: 'Page loads without CORS errors',
        fn: async (p) => {
          const corsErrorsBefore = results.corsErrors.length;
          await p.waitForTimeout(3000);
          return results.corsErrors.length === corsErrorsBefore;
        }
      }
    ]);

    // BUG FIX VERIFICATION
    console.log('\n========================================');
    console.log('BUG FIX VERIFICATION');
    console.log('========================================\n');

    // BUG-CAMPAIGNS-LOADING
    const campaignsBugResult = await testFeaturePage(page, 'BUG-CAMPAIGNS-LOADING', `${APP_URL}/dashboard/email/campaigns`, [
      {
        name: 'Campaigns table visible',
        fn: async (p) => {
          const table = await p.locator('table, [role="table"]').count();
          return table > 0;
        }
      },
      {
        name: 'Create Campaign button exists',
        fn: async (p) => {
          const btn = await p.getByRole('button', { name: /create campaign/i }).count();
          return btn > 0;
        }
      }
    ]);
    results.bugFixes['BUG-CAMPAIGNS-LOADING'] = campaignsBugResult.status === 'PASS' ? 'FIXED' : 'NOT FIXED';

    // BUG-INBOX-FILTERS
    const inboxBugResult = await testFeaturePage(page, 'BUG-INBOX-FILTERS', `${APP_URL}/dashboard/inbox`, [
      {
        name: 'All tab exists',
        fn: async (p) => {
          const allTab = await p.getByRole('button', { name: /^all$/i }).count();
          return allTab > 0;
        }
      },
      {
        name: 'Unread tab exists',
        fn: async (p) => {
          const unreadTab = await p.getByRole('button', { name: /unread/i }).count();
          return unreadTab > 0;
        }
      },
      {
        name: 'Read tab exists',
        fn: async (p) => {
          const readTab = await p.getByRole('button', { name: /^read$/i }).count();
          return readTab > 0;
        }
      },
      {
        name: 'Archived tab exists',
        fn: async (p) => {
          const archivedTab = await p.getByRole('button', { name: /archived/i }).count();
          return archivedTab > 0;
        }
      }
    ]);
    results.bugFixes['BUG-INBOX-FILTERS'] = inboxBugResult.status === 'PASS' ? 'FIXED' : 'NOT FIXED';

    // BUG-MAILGUN-404
    const mailgunBugResult = await testFeaturePage(page, 'BUG-MAILGUN-404', `${APP_URL}/dashboard/settings/integrations/mailgun`, [
      {
        name: 'Page loads (not 404)',
        fn: async (p) => {
          const notFound = await p.getByText(/404|not found/i).count();
          return notFound === 0;
        }
      },
      {
        name: 'Mailgun settings form exists',
        fn: async (p) => {
          const inputs = await p.locator('input').count();
          return inputs > 0;
        }
      }
    ]);
    results.bugFixes['BUG-MAILGUN-404'] = mailgunBugResult.status === 'PASS' ? 'FIXED' : 'NOT FIXED';

    // BUG-CORS-001
    results.bugFixes['BUG-CORS-001'] = results.corsErrors.length === 0 ? 'FIXED' : 'NOT FIXED';

    // FULL FEATURE TESTING
    console.log('\n========================================');
    console.log('FULL FEATURE TESTING');
    console.log('========================================\n');

    await testFeaturePage(page, 'Email Composer', `${APP_URL}/dashboard/email/compose`, [
      {
        name: 'To field exists',
        fn: async (p) => {
          const toField = await p.locator('input[placeholder*="Select"]').first().count();
          return toField > 0;
        }
      },
      {
        name: 'Subject field exists',
        fn: async (p) => {
          const subject = await p.locator('input[placeholder*="Subject"]').count();
          return subject > 0;
        }
      },
      {
        name: 'Template selector exists',
        fn: async (p) => {
          const template = await p.getByText(/select template/i).count();
          return template > 0;
        }
      },
      {
        name: 'Send button exists',
        fn: async (p) => {
          const send = await p.getByRole('button', { name: /send/i }).count();
          return send > 0;
        }
      }
    ]);

    await testFeaturePage(page, 'Email Templates', `${APP_URL}/dashboard/email/templates`, [
      {
        name: 'Create Template button exists',
        fn: async (p) => {
          const btn = await p.getByRole('button', { name: /create template/i }).count();
          return btn > 0;
        }
      },
      {
        name: 'Templates grid/list visible',
        fn: async (p) => {
          const grid = await p.locator('[class*="grid"], table').count();
          return grid > 0;
        }
      }
    ]);

    await testFeaturePage(page, 'Email Campaigns', `${APP_URL}/dashboard/email/campaigns`, [
      {
        name: 'Create Campaign button exists',
        fn: async (p) => {
          const btn = await p.getByRole('button', { name: /create campaign/i }).count();
          return btn > 0;
        }
      }
    ]);

    await testFeaturePage(page, 'Autoresponders', `${APP_URL}/dashboard/email/autoresponders`, [
      {
        name: 'Create Autoresponder button exists',
        fn: async (p) => {
          const btn = await p.getByRole('button', { name: /create autoresponder/i }).count();
          return btn > 0;
        }
      }
    ]);

    await testFeaturePage(page, 'Unified Inbox', `${APP_URL}/dashboard/inbox`, [
      {
        name: 'Inbox content area exists',
        fn: async (p) => {
          const content = await p.locator('[class*="inbox"], [role="main"]').count();
          return content > 0;
        }
      }
    ]);

    await testFeaturePage(page, 'Mailgun Settings', `${APP_URL}/dashboard/settings/integrations/mailgun`);

    await testFeaturePage(page, 'Email Settings', `${APP_URL}/dashboard/settings/email`);

    await testFeaturePage(page, 'Closebot AI', `${APP_URL}/dashboard/settings/integrations/closebot`, [
      {
        name: 'Coming Soon message visible',
        fn: async (p) => {
          const comingSoon = await p.getByText(/coming soon/i).count();
          return comingSoon > 0;
        }
      }
    ]);

    // FINAL SUMMARY
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');

    const totalFeatures = Object.keys(results.features).length;
    const passedFeatures = Object.values(results.features).filter(f => f.status === 'PASS' || f.status === 'PASS - Page Loaded').length;
    const passRate = ((passedFeatures / totalFeatures) * 100).toFixed(1);

    console.log(`Total Features Tested: ${totalFeatures}`);
    console.log(`Passed: ${passedFeatures}`);
    console.log(`Failed: ${totalFeatures - passedFeatures}`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`\nCORS Errors: ${results.corsErrors.length}`);
    console.log(`Console Errors: ${results.consoleErrors.length}`);
    console.log(`Screenshots Captured: ${results.screenshots.length}`);

    console.log('\nBug Fix Status:');
    Object.entries(results.bugFixes).forEach(([bug, status]) => {
      console.log(`  ${bug}: ${status}`);
    });

    results.endTime = new Date().toISOString();
    results.summary = {
      totalFeatures,
      passedFeatures,
      failedFeatures: totalFeatures - passedFeatures,
      passRate: parseFloat(passRate),
      totalCorsErrors: results.corsErrors.length,
      totalConsoleErrors: results.consoleErrors.length,
      totalScreenshots: results.screenshots.length,
    };

    // Determine production readiness
    const productionReady =
      results.corsErrors.length === 0 &&
      Object.values(results.bugFixes).every(status => status === 'FIXED') &&
      passRate >= 90;

    results.productionReady = productionReady ? 'YES' : 'NO';

    console.log(`\n========================================`);
    console.log(`PRODUCTION READINESS: ${results.productionReady}`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('\n[FATAL ERROR]', error);
    results.fatalError = error.message;
    results.productionReady = 'NO';
  } finally {
    await browser.close();

    // Save results to JSON
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'test-results.json'),
      JSON.stringify(results, null, 2)
    );

    console.log(`\nResults saved to: ${path.join(SCREENSHOT_DIR, 'test-results.json')}`);
  }

  return results;
}

// Run the test
runProductionVerification()
  .then((results) => {
    console.log('\n✓ Production verification complete');
    process.exit(results.productionReady === 'YES' ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n✗ Production verification failed:', error);
    process.exit(1);
  });
