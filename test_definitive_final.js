const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = path.join(process.cwd(), 'screenshots', 'definitive-final-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = {
    corsErrors: [],
    consoleErrors: [],
    tests: {}
  };

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (text.includes('CORS') || text.includes('cors')) {
      results.corsErrors.push({ type, text, url: page.url() });
    }

    if (type === 'error') {
      results.consoleErrors.push({ text, url: page.url() });
    }

    console.log('[' + type.toUpperCase() + '] ' + text);
  });

  try {
    console.log('\n=== STARTING DEFINITIVE FINAL TEST ===\n');

    // LOGIN
    console.log('1. LOGGING IN...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);

    console.log('✓ Login successful\n');

    // TEST 1: CAMPAIGNS PAGE (CRITICAL CORS TEST)
    console.log('2. TESTING CAMPAIGNS PAGE (CORS CHECK)...');
    const corsBeforeCampaigns = results.corsErrors.length;
    const errorsBeforeCampaigns = results.consoleErrors.length;

    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '02-campaigns-page.png'), fullPage: true });

    const corsAfterCampaigns = results.corsErrors.length;
    const errorsAfterCampaigns = results.consoleErrors.length;

    // Check if data loaded (not stuck on "Loading...")
    const campaignsContent = await page.content();
    const hasLoadingSpinner = campaignsContent.includes('Loading...') || campaignsContent.includes('spinner');

    results.tests.campaigns = {
      corsErrors: corsAfterCampaigns - corsBeforeCampaigns,
      consoleErrors: errorsAfterCampaigns - errorsBeforeCampaigns,
      stuckLoading: hasLoadingSpinner,
      passed: (corsAfterCampaigns === corsBeforeCampaigns) && !hasLoadingSpinner
    };

    console.log('   CORS errors: ' + results.tests.campaigns.corsErrors);
    console.log('   Console errors: ' + results.tests.campaigns.consoleErrors);
    console.log('   Stuck loading: ' + hasLoadingSpinner);
    console.log('   RESULT: ' + (results.tests.campaigns.passed ? 'PASS' : 'FAIL') + '\n');

    // TEST 2: AUTORESPONDERS PAGE (CRITICAL CORS TEST)
    console.log('3. TESTING AUTORESPONDERS PAGE (CORS CHECK)...');
    const corsBeforeAuto = results.corsErrors.length;
    const errorsBeforeAuto = results.consoleErrors.length;

    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '03-autoresponders-page.png'), fullPage: true });

    const corsAfterAuto = results.corsErrors.length;
    const errorsAfterAuto = results.consoleErrors.length;

    results.tests.autoresponders = {
      corsErrors: corsAfterAuto - corsBeforeAuto,
      consoleErrors: errorsAfterAuto - errorsBeforeAuto,
      passed: corsAfterAuto === corsBeforeAuto
    };

    console.log('   CORS errors: ' + results.tests.autoresponders.corsErrors);
    console.log('   Console errors: ' + results.tests.autoresponders.consoleErrors);
    console.log('   RESULT: ' + (results.tests.autoresponders.passed ? 'PASS' : 'FAIL') + '\n');

    // TEST 3: INBOX FILTER TABS
    console.log('4. TESTING INBOX FILTER TABS...');
    await page.goto('http://localhost:3004/dashboard/email/inbox', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '04-inbox-filters.png'), fullPage: true });

    const filterButtons = await page.$$('button[role="tab"]');
    results.tests.inboxFilters = {
      tabCount: filterButtons.length,
      passed: filterButtons.length === 4
    };

    console.log('   Filter tabs found: ' + filterButtons.length);
    console.log('   RESULT: ' + (results.tests.inboxFilters.passed ? 'PASS' : 'FAIL') + '\n');

    // TEST 4: MAILGUN SETTINGS (404 CHECK)
    console.log('5. TESTING MAILGUN SETTINGS PAGE...');
    const errorsBeforeMailgun = results.consoleErrors.length;

    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '05-mailgun-settings.png'), fullPage: true });

    const mailgunContent = await page.content();
    const is404 = mailgunContent.includes('404') || mailgunContent.includes('Not Found');
    const errorsAfterMailgun = results.consoleErrors.length;

    results.tests.mailgun = {
      is404: is404,
      consoleErrors: errorsAfterMailgun - errorsBeforeMailgun,
      passed: !is404
    };

    console.log('   Is 404: ' + is404);
    console.log('   Console errors: ' + results.tests.mailgun.consoleErrors);
    console.log('   RESULT: ' + (results.tests.mailgun.passed ? 'PASS' : 'FAIL') + '\n');

    // TEST 5: ALL EMAIL PAGES LOAD
    console.log('6. TESTING ALL EMAIL PAGES...');
    const emailPages = [
      { url: '/dashboard/email/compose', name: 'compose' },
      { url: '/dashboard/email/templates', name: 'templates' },
      { url: '/dashboard/email/campaigns', name: 'campaigns-recheck' },
      { url: '/dashboard/email/autoresponders', name: 'autoresponders-recheck' },
      { url: '/dashboard/settings/integrations/mailgun', name: 'mailgun-recheck' }
    ];

    results.tests.allEmailPages = { passed: true, details: {} };

    for (const emailPage of emailPages) {
      const errorsBeforePage = results.consoleErrors.length;
      await page.goto('http://localhost:3004' + emailPage.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
      const errorsAfterPage = results.consoleErrors.length;

      const pageContent = await page.content();
      const pageHasErrors = pageContent.includes('404') || pageContent.includes('Error');
      const pageErrors = errorsAfterPage - errorsBeforePage;

      results.tests.allEmailPages.details[emailPage.name] = {
        errors: pageErrors,
        hasErrorText: pageHasErrors,
        passed: !pageHasErrors
      };

      if (pageHasErrors) {
        results.tests.allEmailPages.passed = false;
      }

      console.log('   ' + emailPage.name + ': ' + (pageHasErrors ? 'FAIL' : 'PASS') + ' (' + pageErrors + ' errors)');
    }

    await page.screenshot({ path: path.join(screenshotDir, '06-all-pages-complete.png'), fullPage: true });
    console.log('   RESULT: ' + (results.tests.allEmailPages.passed ? 'PASS' : 'FAIL') + '\n');

    // FINAL SUMMARY
    console.log('\n=== DEFINITIVE FINAL TEST RESULTS ===\n');

    const totalTests = Object.keys(results.tests).length;
    const passedTests = Object.values(results.tests).filter(t => t.passed).length;
    const passRate = Math.round((passedTests / totalTests) * 100);

    console.log('ANSWER KEY:');
    console.log('1. CORS errors present? ' + (results.corsErrors.length > 0 ? 'YES' : 'NO') + ' (' + results.corsErrors.length + ' total)');
    console.log('2. Campaigns page loads? ' + (results.tests.campaigns.passed ? 'YES' : 'NO'));
    console.log('3. Inbox filter tabs (4 visible)? ' + (results.tests.inboxFilters.passed ? 'YES' : 'NO'));
    console.log('4. Mailgun settings loads? ' + (results.tests.mailgun.passed ? 'YES' : 'NO'));
    console.log('5. All email pages load? ' + (results.tests.allEmailPages.passed ? 'YES' : 'NO'));
    console.log('6. Total console errors: ' + results.consoleErrors.length);
    console.log('7. Pass rate: ' + passRate + '%');
    console.log('\n**PRODUCTION READY: ' + (passRate === 100 && results.corsErrors.length === 0 ? 'YES' : 'NO') + '**\n');

    if (results.corsErrors.length > 0) {
      console.log('\nCORS ERRORS DETECTED:');
      results.corsErrors.forEach((err, i) => {
        console.log((i + 1) + '. [' + err.url + '] ' + err.text);
      });
    }

    if (results.consoleErrors.length > 0) {
      console.log('\nCONSOLE ERRORS:');
      results.consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log((i + 1) + '. [' + err.url + '] ' + err.text);
      });
      if (results.consoleErrors.length > 10) {
        console.log('... and ' + (results.consoleErrors.length - 10) + ' more');
      }
    }

    // Save detailed results
    fs.writeFileSync(
      path.join(screenshotDir, 'test-results.json'),
      JSON.stringify(results, null, 2)
    );

  } catch (error) {
    console.error('TEST FAILED WITH ERROR:', error.message);
    results.criticalError = error.message;
  } finally {
    await browser.close();
  }
})();
