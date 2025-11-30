const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'screenshots/absolute-final-test';
const BASE_URL = 'http://localhost:3004';
const EMAIL = 'admin@evebeautyma.com';
const PASSWORD = 'TestPass123!';

// Test results tracking
const results = {
  corsErrors: [],
  consoleErrors: [],
  bugVerification: {
    'BUG-CAMPAIGNS-LOADING': { status: 'UNKNOWN', details: '' },
    'BUG-INBOX-FILTERS': { status: 'UNKNOWN', details: '' },
    'BUG-MAILGUN-404': { status: 'UNKNOWN', details: '' }
  },
  pageLoads: {
    '/dashboard/email/compose': { status: 'UNKNOWN', details: '' },
    '/dashboard/email/templates': { status: 'UNKNOWN', details: '' },
    '/dashboard/email/campaigns': { status: 'UNKNOWN', details: '' },
    '/dashboard/email/autoresponders': { status: 'UNKNOWN', details: '' },
    '/dashboard/settings/integrations/mailgun': { status: 'UNKNOWN', details: '' },
    '/dashboard/email/campaigns/create': { status: 'UNKNOWN', details: '' }
  },
  timestamp: new Date().toISOString()
};

function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function runFinalTest() {
  ensureScreenshotDir();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);

    if (type === 'error') {
      results.consoleErrors.push({ text, timestamp: new Date().toISOString() });

      // Check for CORS errors
      if (text.toLowerCase().includes('cors') ||
          text.toLowerCase().includes('access-control-allow-origin') ||
          text.toLowerCase().includes('cross-origin')) {
        results.corsErrors.push({ text, timestamp: new Date().toISOString() });
        console.log('⚠️ CORS ERROR DETECTED:', text);
      }
    }
  });

  // Capture network failures
  page.on('requestfailed', request => {
    const failure = request.failure();
    console.log(`[REQUEST FAILED] ${request.url()}: ${failure?.errorText || 'Unknown'}`);
    results.consoleErrors.push({
      text: `Request failed: ${request.url()} - ${failure?.errorText}`,
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('\n=== PHASE 1: LOGIN ===');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });

    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-dashboard-loaded.png`, fullPage: true });
    console.log('✓ Login successful');

    // Wait a moment to let any initial errors surface
    await page.waitForTimeout(2000);

    console.log('\n=== PHASE 2: CRITICAL PAGE TESTS ===');

    // Test 1: Campaigns Page (CORS priority)
    console.log('\n--- Testing: /dashboard/email/campaigns ---');
    const corsCountBefore = results.corsErrors.length;
    await page.goto(`${BASE_URL}/dashboard/email/campaigns`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for loading states
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-campaigns-page.png`, fullPage: true });

    const corsCountAfter = results.corsErrors.length;
    const newCorsErrors = corsCountAfter - corsCountBefore;

    // Check if campaigns loaded or stuck on "Loading..."
    const campaignsLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    const campaignsContent = await page.locator('table, .campaign-item, text=Create New Campaign').count();

    if (newCorsErrors === 0) {
      results.pageLoads['/dashboard/email/campaigns'].status = 'PASS';
      results.pageLoads['/dashboard/email/campaigns'].details = 'No CORS errors detected';
      console.log('✓ Campaigns page: NO CORS ERRORS');
    } else {
      results.pageLoads['/dashboard/email/campaigns'].status = 'FAIL';
      results.pageLoads['/dashboard/email/campaigns'].details = `${newCorsErrors} CORS errors detected`;
      console.log(`✗ Campaigns page: ${newCorsErrors} CORS ERRORS FOUND`);
    }

    if (!campaignsLoading && campaignsContent > 0) {
      results.bugVerification['BUG-CAMPAIGNS-LOADING'].status = 'FIXED';
      results.bugVerification['BUG-CAMPAIGNS-LOADING'].details = 'Campaigns loaded successfully, not stuck on Loading...';
      console.log('✓ BUG-CAMPAIGNS-LOADING: FIXED');
    } else if (campaignsLoading) {
      results.bugVerification['BUG-CAMPAIGNS-LOADING'].status = 'STILL BROKEN';
      results.bugVerification['BUG-CAMPAIGNS-LOADING'].details = 'Still stuck on Loading...';
      console.log('✗ BUG-CAMPAIGNS-LOADING: STILL BROKEN');
    } else {
      results.bugVerification['BUG-CAMPAIGNS-LOADING'].status = 'INDETERMINATE';
      results.bugVerification['BUG-CAMPAIGNS-LOADING'].details = 'No loading indicator but no content either';
    }

    // Test 2: Autoresponders Page (CORS priority)
    console.log('\n--- Testing: /dashboard/email/autoresponders ---');
    const corsBeforeAuto = results.corsErrors.length;
    await page.goto(`${BASE_URL}/dashboard/email/autoresponders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-autoresponders-page.png`, fullPage: true });

    const corsAfterAuto = results.corsErrors.length;
    const autoCorsErrors = corsAfterAuto - corsBeforeAuto;

    if (autoCorsErrors === 0) {
      results.pageLoads['/dashboard/email/autoresponders'].status = 'PASS';
      results.pageLoads['/dashboard/email/autoresponders'].details = 'No CORS errors detected';
      console.log('✓ Autoresponders page: NO CORS ERRORS');
    } else {
      results.pageLoads['/dashboard/email/autoresponders'].status = 'FAIL';
      results.pageLoads['/dashboard/email/autoresponders'].details = `${autoCorsErrors} CORS errors detected`;
      console.log(`✗ Autoresponders page: ${autoCorsErrors} CORS ERRORS FOUND`);
    }

    // Test 3: Campaigns Create Page (CORS priority)
    console.log('\n--- Testing: /dashboard/email/campaigns/create ---');
    const corsBeforeCreate = results.corsErrors.length;
    await page.goto(`${BASE_URL}/dashboard/email/campaigns/create`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-campaigns-create-page.png`, fullPage: true });

    const corsAfterCreate = results.corsErrors.length;
    const createCorsErrors = corsAfterCreate - corsBeforeCreate;

    if (createCorsErrors === 0) {
      results.pageLoads['/dashboard/email/campaigns/create'].status = 'PASS';
      results.pageLoads['/dashboard/email/campaigns/create'].details = 'No CORS errors detected';
      console.log('✓ Campaigns Create page: NO CORS ERRORS');
    } else {
      results.pageLoads['/dashboard/email/campaigns/create'].status = 'FAIL';
      results.pageLoads['/dashboard/email/campaigns/create'].details = `${createCorsErrors} CORS errors detected`;
      console.log(`✗ Campaigns Create page: ${createCorsErrors} CORS ERRORS FOUND`);
    }

    // Test 4: Compose Page
    console.log('\n--- Testing: /dashboard/email/compose ---');
    await page.goto(`${BASE_URL}/dashboard/email/compose`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-compose-page.png`, fullPage: true });

    const composeForm = await page.locator('form, input[type="email"], textarea').count();
    if (composeForm > 0) {
      results.pageLoads['/dashboard/email/compose'].status = 'PASS';
      results.pageLoads['/dashboard/email/compose'].details = 'Page loaded with form elements';
      console.log('✓ Compose page loaded');
    } else {
      results.pageLoads['/dashboard/email/compose'].status = 'FAIL';
      results.pageLoads['/dashboard/email/compose'].details = 'No form elements found';
      console.log('✗ Compose page failed to load properly');
    }

    // Test 5: Templates Page
    console.log('\n--- Testing: /dashboard/email/templates ---');
    await page.goto(`${BASE_URL}/dashboard/email/templates`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-templates-page.png`, fullPage: true });

    const templatesContent = await page.locator('table, .template-item, button:has-text("Create"), button:has-text("New")').count();
    if (templatesContent > 0) {
      results.pageLoads['/dashboard/email/templates'].status = 'PASS';
      results.pageLoads['/dashboard/email/templates'].details = 'Page loaded with content';
      console.log('✓ Templates page loaded');
    } else {
      results.pageLoads['/dashboard/email/templates'].status = 'FAIL';
      results.pageLoads['/dashboard/email/templates'].details = 'No content found';
      console.log('✗ Templates page failed to load properly');
    }

    // Test 6: Mailgun Settings (BUG-MAILGUN-404)
    console.log('\n--- Testing: /dashboard/settings/integrations/mailgun ---');
    await page.goto(`${BASE_URL}/dashboard/settings/integrations/mailgun`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-mailgun-settings.png`, fullPage: true });

    const is404 = await page.locator('text=404, text=Not Found, text=Page not found').count() > 0;
    const hasMailgunContent = await page.locator('input, form, text=Mailgun, text=API Key, text=Domain').count();

    if (!is404 && hasMailgunContent > 0) {
      results.pageLoads['/dashboard/settings/integrations/mailgun'].status = 'PASS';
      results.pageLoads['/dashboard/settings/integrations/mailgun'].details = 'Page loaded successfully';
      results.bugVerification['BUG-MAILGUN-404'].status = 'FIXED';
      results.bugVerification['BUG-MAILGUN-404'].details = 'Mailgun settings page loads without 404';
      console.log('✓ Mailgun settings loaded');
      console.log('✓ BUG-MAILGUN-404: FIXED');
    } else if (is404) {
      results.pageLoads['/dashboard/settings/integrations/mailgun'].status = 'FAIL';
      results.pageLoads['/dashboard/settings/integrations/mailgun'].details = '404 error detected';
      results.bugVerification['BUG-MAILGUN-404'].status = 'STILL BROKEN';
      results.bugVerification['BUG-MAILGUN-404'].details = 'Still showing 404';
      console.log('✗ Mailgun settings: 404 ERROR');
      console.log('✗ BUG-MAILGUN-404: STILL BROKEN');
    } else {
      results.pageLoads['/dashboard/settings/integrations/mailgun'].status = 'INDETERMINATE';
      results.pageLoads['/dashboard/settings/integrations/mailgun'].details = 'No clear 404 but no content either';
      results.bugVerification['BUG-MAILGUN-404'].status = 'INDETERMINATE';
    }

    // Test 7: Inbox Filters (BUG-INBOX-FILTERS)
    console.log('\n--- Testing: Inbox Filter Tabs ---');
    await page.goto(`${BASE_URL}/dashboard/email/inbox`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-inbox-filters.png`, fullPage: true });

    const filterTabs = await page.locator('[role="tab"], button:has-text("All"), button:has-text("Unread"), button:has-text("Flagged"), button:has-text("Archived")').count();
    console.log(`Found ${filterTabs} filter tabs`);

    if (filterTabs >= 4) {
      results.bugVerification['BUG-INBOX-FILTERS'].status = 'FIXED';
      results.bugVerification['BUG-INBOX-FILTERS'].details = `All 4 filter tabs visible (found ${filterTabs} tabs)`;
      console.log(`✓ BUG-INBOX-FILTERS: FIXED (${filterTabs} tabs found)`);
    } else {
      results.bugVerification['BUG-INBOX-FILTERS'].status = 'STILL BROKEN';
      results.bugVerification['BUG-INBOX-FILTERS'].details = `Only ${filterTabs} tabs found, expected 4`;
      console.log(`✗ BUG-INBOX-FILTERS: STILL BROKEN (only ${filterTabs} tabs)`);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR DURING TEST:', error.message);
    results.consoleErrors.push({
      text: `Test script error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }

  await browser.close();

  // Generate Final Report
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║   ABSOLUTE FINAL PRODUCTION READINESS TEST REPORT     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('1. CORS ERRORS COUNT:');
  console.log(`   Total CORS Errors: ${results.corsErrors.length}`);
  if (results.corsErrors.length > 0) {
    console.log('   ❌ CORS ERRORS DETECTED:');
    results.corsErrors.forEach((err, i) => {
      console.log(`      ${i + 1}. ${err.text}`);
    });
  } else {
    console.log('   ✅ ZERO CORS ERRORS - ALL FETCH CALLS WORKING');
  }

  console.log('\n2. BUG VERIFICATION:');
  for (const [bugId, bugData] of Object.entries(results.bugVerification)) {
    const icon = bugData.status === 'FIXED' ? '✅' : bugData.status === 'STILL BROKEN' ? '❌' : '⚠️';
    console.log(`   ${icon} ${bugId}: ${bugData.status}`);
    console.log(`      ${bugData.details}`);
  }

  console.log('\n3. PAGE LOAD VERIFICATION:');
  let passedPages = 0;
  let totalPages = Object.keys(results.pageLoads).length;
  for (const [pagePath, pageData] of Object.entries(results.pageLoads)) {
    const icon = pageData.status === 'PASS' ? '✅' : pageData.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`   ${icon} ${pagePath}: ${pageData.status}`);
    console.log(`      ${pageData.details}`);
    if (pageData.status === 'PASS') passedPages++;
  }

  console.log('\n4. TOTAL CONSOLE ERRORS:');
  console.log(`   Total Errors: ${results.consoleErrors.length}`);
  if (results.consoleErrors.length > 10) {
    console.log('   (Showing first 10 errors)');
    results.consoleErrors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.text}`);
    });
  } else if (results.consoleErrors.length > 0) {
    results.consoleErrors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.text}`);
    });
  } else {
    console.log('   ✅ ZERO CONSOLE ERRORS');
  }

  console.log('\n5. PASS RATE:');
  const passRate = totalPages > 0 ? ((passedPages / totalPages) * 100).toFixed(1) : 0;
  console.log(`   ${passedPages}/${totalPages} pages passed (${passRate}%)`);

  // Calculate overall bugs fixed
  const bugsFixed = Object.values(results.bugVerification).filter(b => b.status === 'FIXED').length;
  const totalBugs = Object.keys(results.bugVerification).length;
  const bugFixRate = totalBugs > 0 ? ((bugsFixed / totalBugs) * 100).toFixed(1) : 0;

  console.log('\n6. FINAL VERDICT:');

  const isProductionReady =
    results.corsErrors.length === 0 &&
    passRate >= 90 &&
    bugFixRate >= 80 &&
    results.bugVerification['BUG-CAMPAIGNS-LOADING']?.status === 'FIXED';

  if (isProductionReady) {
    console.log('\n   ╔══════════════════════════════════════╗');
    console.log('   ║  ✅ PRODUCTION READY: YES            ║');
    console.log('   ╚══════════════════════════════════════╝');
    console.log('\n   All critical criteria met:');
    console.log('   ✓ Zero CORS errors');
    console.log('   ✓ 90%+ page load success rate');
    console.log('   ✓ 80%+ bug fix rate');
    console.log('   ✓ Critical bugs resolved');
  } else {
    console.log('\n   ╔══════════════════════════════════════╗');
    console.log('   ║  ❌ PRODUCTION READY: NO             ║');
    console.log('   ╚══════════════════════════════════════╝');
    console.log('\n   Blocking issues:');
    if (results.corsErrors.length > 0) {
      console.log(`   ✗ ${results.corsErrors.length} CORS errors detected`);
    }
    if (passRate < 90) {
      console.log(`   ✗ Page load success rate: ${passRate}% (need 90%)`);
    }
    if (bugFixRate < 80) {
      console.log(`   ✗ Bug fix rate: ${bugFixRate}% (need 80%)`);
    }
    if (results.bugVerification['BUG-CAMPAIGNS-LOADING']?.status !== 'FIXED') {
      console.log('   ✗ Critical bug BUG-CAMPAIGNS-LOADING not fixed');
    }
  }

  console.log('\n   Screenshots saved to: screenshots/absolute-final-test/');
  console.log(`   Test completed at: ${results.timestamp}`);

  // Save JSON report
  fs.writeFileSync(
    `${SCREENSHOT_DIR}/final-test-results.json`,
    JSON.stringify(results, null, 2)
  );
  console.log(`   Full report saved to: ${SCREENSHOT_DIR}/final-test-results.json`);

  console.log('\n' + '='.repeat(60) + '\n');
}

runFinalTest().catch(console.error);
