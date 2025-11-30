const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\all-containers-rebuilt-test';

async function run() {
  console.log('=== FINAL PRODUCTION VERIFICATION TEST ===\n');
  console.log('Testing after complete container rebuild...\n');

  const results = {
    corsErrors: [],
    consoleErrors: [],
    tests: {
      campaignsLoad: false,
      inboxFilterTabs: false,
      mailgunSettingsLoad: false,
      composeLoad: false,
      templatesLoad: false,
      autoresponderLoad: false
    }
  };

  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console errors and CORS errors
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('CORS') || text.includes('cors')) {
      results.corsErrors.push(text);
      console.log('❌ CORS ERROR:', text);
    }
    if (msg.type() === 'error') {
      results.consoleErrors.push(text);
      console.log('❌ CONSOLE ERROR:', text);
    }
  });

  page.on('pageerror', error => {
    results.consoleErrors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });

  try {
    // LOGIN
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, '02-dashboard.png'), fullPage: true });
    console.log('✓ Login successful\n');

    // TEST 1: CAMPAIGNS PAGE (CORS Test #1)
    console.log('TEST 1: Campaigns Page (CORS Test)...');
    const corsErrorsBefore = results.corsErrors.length;

    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for data to load
    await page.screenshot({ path: path.join(screenshotDir, '03-campaigns-page.png'), fullPage: true });

    // Check if data loaded (look for campaign elements or table)
    const campaignElements = await page.$$('[class*="campaign"], table tbody tr, [data-testid*="campaign"]');
    const hasContent = campaignElements.length > 0 || await page.locator('text=/campaign/i').count() > 0;

    results.tests.campaignsLoad = hasContent;
    const corsErrorsAfter = results.corsErrors.length;
    const campaignsCorsErrors = corsErrorsAfter - corsErrorsBefore;

    console.log(`   Data loaded: ${hasContent ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   CORS errors: ${campaignsCorsErrors}`);
    console.log('');

    // TEST 2: AUTORESPONDERS PAGE (CORS Test #2)
    console.log('TEST 2: Autoresponders Page (CORS Test)...');
    const corsErrorsBefore2 = results.corsErrors.length;

    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '04-autoresponders-page.png'), fullPage: true });

    const autoElements = await page.$$('[class*="auto"], table tbody tr, [data-testid*="auto"]');
    const hasAutoContent = autoElements.length > 0 || await page.locator('text=/autoresponder/i').count() > 0;

    results.tests.autoresponderLoad = hasAutoContent;
    const corsErrorsAfter2 = results.corsErrors.length;
    const autoCorsErrors = corsErrorsAfter2 - corsErrorsBefore2;

    console.log(`   Data loaded: ${hasAutoContent ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   CORS errors: ${autoCorsErrors}`);
    console.log('');

    // TEST 3: INBOX FILTER TABS (Bug verification)
    console.log('TEST 3: Inbox Filter Tabs (at /dashboard/inbox)...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '05-inbox-page.png'), fullPage: true });

    // Look for the 4 filter tabs: All, Unread, Read, Archived
    const allTab = await page.locator('text=/^All$/i').count();
    const unreadTab = await page.locator('text=/^Unread$/i').count();
    const readTab = await page.locator('text=/^Read$/i').count();
    const archivedTab = await page.locator('text=/^Archived$/i').count();

    const allTabsPresent = allTab > 0 && unreadTab > 0 && readTab > 0 && archivedTab > 0;
    results.tests.inboxFilterTabs = allTabsPresent;

    console.log(`   All tab: ${allTab > 0 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   Unread tab: ${unreadTab > 0 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   Read tab: ${readTab > 0 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   Archived tab: ${archivedTab > 0 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   All 4 tabs present: ${allTabsPresent ? 'YES ✓' : 'NO ✗'}`);
    console.log('');

    // TEST 4: MAILGUN SETTINGS
    console.log('TEST 4: Mailgun Settings Page...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '06-mailgun-settings.png'), fullPage: true });

    // Check if page loaded (look for Mailgun-related content)
    const mailgunContent = await page.locator('text=/mailgun/i').count();
    const hasMailgunFields = await page.$$('input[name*="mailgun"], input[id*="mailgun"], input[placeholder*="domain"], input[placeholder*="key"]');

    results.tests.mailgunSettingsLoad = mailgunContent > 0 || hasMailgunFields.length > 0;
    console.log(`   Page loaded: ${results.tests.mailgunSettingsLoad ? 'YES ✓' : 'NO ✗'}`);
    console.log('');

    // TEST 5: COMPOSE PAGE
    console.log('TEST 5: Email Compose Page...');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '07-compose-page.png'), fullPage: true });

    const composeFields = await page.$$('input, textarea, [contenteditable="true"]');
    results.tests.composeLoad = composeFields.length > 0;
    console.log(`   Page loaded: ${results.tests.composeLoad ? 'YES ✓' : 'NO ✗'}`);
    console.log('');

    // TEST 6: TEMPLATES PAGE
    console.log('TEST 6: Email Templates Page...');
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '08-templates-page.png'), fullPage: true });

    const templateElements = await page.$$('table, [class*="template"], [data-testid*="template"]');
    results.tests.templatesLoad = templateElements.length > 0;
    console.log(`   Page loaded: ${results.tests.templatesLoad ? 'YES ✓' : 'NO ✗'}`);
    console.log('');

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    results.consoleErrors.push(error.message);
    await page.screenshot({ path: path.join(screenshotDir, '99-error-state.png'), fullPage: true });
  } finally {
    await browser.close();
  }

  // FINAL REPORT
  console.log('\n========================================');
  console.log('FINAL PRODUCTION TEST RESULTS');
  console.log('========================================\n');

  console.log('1. CORS ERRORS:', results.corsErrors.length);
  if (results.corsErrors.length > 0) {
    results.corsErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }
  console.log('');

  console.log('2. CAMPAIGNS LOADS:', results.tests.campaignsLoad ? 'YES ✓' : 'NO ✗');
  console.log('3. INBOX FILTER TABS (at /dashboard/inbox):', results.tests.inboxFilterTabs ? 'YES ✓' : 'NO ✗');
  console.log('4. MAILGUN SETTINGS LOADS:', results.tests.mailgunSettingsLoad ? 'YES ✓' : 'NO ✗');
  console.log('5. COMPOSE LOADS:', results.tests.composeLoad ? 'YES ✓' : 'NO ✗');
  console.log('6. TEMPLATES LOADS:', results.tests.templatesLoad ? 'YES ✓' : 'NO ✗');
  console.log('7. AUTORESPONDERS LOADS:', results.tests.autoresponderLoad ? 'YES ✓' : 'NO ✗');
  console.log('');

  console.log('8. CONSOLE ERRORS:', results.consoleErrors.length);
  if (results.consoleErrors.length > 0 && results.consoleErrors.length <= 10) {
    results.consoleErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err.substring(0, 100)}...`));
  }
  console.log('');

  // Calculate pass rate
  const totalTests = Object.keys(results.tests).length;
  const passedTests = Object.values(results.tests).filter(Boolean).length;
  const passRate = Math.round((passedTests / totalTests) * 100);

  console.log(`PASS RATE: ${passedTests}/${totalTests} = ${passRate}%`);
  console.log('');

  // Final verdict
  const productionReady = passRate === 100 && results.corsErrors.length === 0;

  console.log('========================================');
  console.log(`FINAL VERDICT: PRODUCTION READY? ${productionReady ? 'YES ✓✓✓' : 'NO ✗✗✗'}`);
  console.log('========================================');

  if (!productionReady) {
    console.log('\nISSUES PREVENTING PRODUCTION:');
    if (results.corsErrors.length > 0) console.log(`- ${results.corsErrors.length} CORS errors detected`);
    if (!results.tests.campaignsLoad) console.log('- Campaigns page not loading data');
    if (!results.tests.inboxFilterTabs) console.log('- Inbox filter tabs missing');
    if (!results.tests.mailgunSettingsLoad) console.log('- Mailgun settings page not loading');
    if (!results.tests.composeLoad) console.log('- Compose page not loading');
    if (!results.tests.templatesLoad) console.log('- Templates page not loading');
    if (!results.tests.autoresponderLoad) console.log('- Autoresponders page not loading');
  }

  console.log(`\nScreenshots saved to: ${screenshotDir}`);
}

run().catch(console.error);
