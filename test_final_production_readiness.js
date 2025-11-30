const { chromium } = require('playwright');

async function runFinalProductionTest() {
  console.log('=== FINAL PRODUCTION READINESS TEST ===\n');
  console.log('Testing post no-cache rebuild...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    corsStatus: 'UNKNOWN',
    corsErrors: [],
    inboxFilterTabs: 'NOT TESTED',
    tabsFound: [],
    pagesStatus: {},
    consoleErrors: [],
    productionReady: false
  };

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      results.consoleErrors.push(text);

      // Check for CORS errors specifically
      if (text.includes('CORS') || text.includes('Access-Control-Allow-Origin') ||
          text.includes('Cross-Origin') || text.includes('has been blocked by CORS')) {
        results.corsErrors.push(text);
      }
    }
  });

  try {
    // LOGIN
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000); // Wait for page to fully render
    await page.screenshot({ path: 'screenshots/final-production-test/01-login-page.png', fullPage: true });

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✓ Login successful\n');

    // CRITICAL TEST 1: CORS Check on Campaigns
    console.log('2. CRITICAL TEST 1: CORS Check');
    console.log('   Navigating to /dashboard/email/campaigns...');

    // Clear console errors collected so far
    results.consoleErrors = [];
    results.corsErrors = [];

    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000); // Wait for any async requests
    await page.screenshot({ path: 'screenshots/final-production-test/02-campaigns-cors-test.png', fullPage: true });

    if (results.corsErrors.length === 0) {
      results.corsStatus = '✅ PASS - No CORS errors detected';
      console.log('   ✅ PASS - No CORS errors detected');
    } else {
      results.corsStatus = '❌ FAIL - CORS errors found';
      console.log('   ❌ FAIL - CORS errors found:');
      results.corsErrors.forEach(err => console.log('      ' + err));
    }
    console.log('');

    // CRITICAL TEST 2: Inbox Filter Tabs
    console.log('3. CRITICAL TEST 2: Inbox Filter Tabs');
    console.log('   Navigating to /dashboard/inbox...');

    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/final-production-test/03-inbox-initial.png', fullPage: true });

    // Look for filter tabs - try multiple selectors
    const tabSelectors = [
      'button:has-text("All")',
      'button:has-text("Unread")',
      'button:has-text("Read")',
      'button:has-text("Archived")'
    ];

    for (const selector of tabSelectors) {
      const tab = await page.$(selector);
      if (tab) {
        const text = await tab.innerText();
        results.tabsFound.push(text);
      }
    }

    if (results.tabsFound.length === 4) {
      results.inboxFilterTabs = '✅ PASS - All 4 tabs visible';
      console.log('   ✅ PASS - All 4 tabs found:', results.tabsFound.join(', '));
    } else {
      results.inboxFilterTabs = `❌ FAIL - Only ${results.tabsFound.length}/4 tabs found`;
      console.log(`   ❌ FAIL - Only ${results.tabsFound.length}/4 tabs found:`, results.tabsFound.join(', '));
    }
    console.log('');

    // TEST 3: Quick Feature Check
    console.log('4. Quick Feature Check');
    const pagesToTest = [
      { url: '/dashboard/email/compose', name: 'Compose' },
      { url: '/dashboard/email/templates', name: 'Templates' },
      { url: '/dashboard/email/autoresponders', name: 'Autoresponders' },
      { url: '/dashboard/settings/integrations/mailgun', name: 'Mailgun Settings' }
    ];

    for (const testPage of pagesToTest) {
      try {
        console.log(`   Testing ${testPage.name}...`);
        const errorsBefore = results.consoleErrors.length;

        await page.goto(`http://localhost:3004${testPage.url}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);

        const screenshotName = testPage.name.toLowerCase().replace(/\s+/g, '-');
        await page.screenshot({
          path: `screenshots/final-production-test/04-${screenshotName}.png`,
          fullPage: true
        });

        const errorsAfter = results.consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;

        if (newErrors === 0) {
          results.pagesStatus[testPage.name] = '✅ PASS';
          console.log(`      ✅ PASS - ${testPage.name} loaded successfully`);
        } else {
          results.pagesStatus[testPage.name] = `⚠️ WARN - ${newErrors} console errors`;
          console.log(`      ⚠️ WARN - ${testPage.name} loaded with ${newErrors} console errors`);
        }
      } catch (error) {
        results.pagesStatus[testPage.name] = '❌ FAIL - ' + error.message;
        console.log(`      ❌ FAIL - ${testPage.name}: ${error.message}`);
      }
    }
    console.log('');

    // FINAL VERDICT
    console.log('=== FINAL VERDICT ===');
    console.log('1. CORS Status:', results.corsStatus);
    console.log('2. Inbox Filter Tabs:', results.inboxFilterTabs);
    console.log('3. Pages Tested:');
    Object.entries(results.pagesStatus).forEach(([name, status]) => {
      console.log(`   - ${name}: ${status}`);
    });
    console.log('4. Total Console Errors:', results.consoleErrors.length);
    console.log('5. Total CORS Errors:', results.corsErrors.length);
    console.log('');

    // Determine production readiness
    const criticalTestsPassed =
      results.corsErrors.length === 0 &&
      results.tabsFound.length === 4;

    const majorErrorsFound = Object.values(results.pagesStatus).some(status => status.includes('FAIL'));

    if (criticalTestsPassed && !majorErrorsFound) {
      results.productionReady = true;
      console.log('🎉 FINAL VERDICT: ✅ PRODUCTION READY');
      console.log('   - CORS issue resolved');
      console.log('   - All 4 inbox filter tabs present');
      console.log('   - All critical pages load successfully');
    } else {
      results.productionReady = false;
      console.log('❌ FINAL VERDICT: NOT PRODUCTION READY');
      if (results.corsErrors.length > 0) {
        console.log('   - CORS errors still present');
      }
      if (results.tabsFound.length !== 4) {
        console.log('   - Inbox filter tabs incomplete');
      }
      if (majorErrorsFound) {
        console.log('   - Critical page load failures');
      }
    }

    // Save detailed report
    const report = `# FINAL PRODUCTION READINESS TEST REPORT

**Date:** ${new Date().toISOString()}
**Test Type:** Post No-Cache Rebuild Verification

---

## CRITICAL TESTS

### 1. CORS Test
**Status:** ${results.corsStatus}
**CORS Errors Found:** ${results.corsErrors.length}

${results.corsErrors.length > 0 ? '**Errors:**\n' + results.corsErrors.map(e => '- ' + e).join('\n') : 'No CORS errors detected.'}

### 2. Inbox Filter Tabs
**Status:** ${results.inboxFilterTabs}
**Tabs Found:** ${results.tabsFound.join(', ') || 'None'}

---

## PAGE LOAD TESTS

${Object.entries(results.pagesStatus).map(([name, status]) => `- **${name}:** ${status}`).join('\n')}

---

## CONSOLE ERRORS

**Total Errors:** ${results.consoleErrors.length}

${results.consoleErrors.length > 0 ? results.consoleErrors.map((e, i) => `${i + 1}. ${e}`).join('\n') : 'No console errors detected.'}

---

## FINAL VERDICT

**PRODUCTION READY:** ${results.productionReady ? '✅ YES' : '❌ NO'}

${results.productionReady ?
`### ✅ PASSED
- CORS issue resolved (withCredentials: true working)
- All 4 inbox filter tabs visible
- All critical pages load successfully
- No blocking errors

**System is ready for production deployment.**` :
`### ❌ FAILED
${results.corsErrors.length > 0 ? '- CORS errors still present after no-cache rebuild\n' : ''}${results.tabsFound.length !== 4 ? '- Inbox filter tabs incomplete\n' : ''}${majorErrorsFound ? '- Critical page load failures\n' : ''}
**Additional fixes required before production deployment.**`
}

---

## SCREENSHOTS
- 01-login-page.png
- 02-campaigns-cors-test.png
- 03-inbox-initial.png
- 04-compose.png
- 04-templates.png
- 04-autoresponders.png
- 04-mailgun-settings.png
`;

    const fs = require('fs');
    fs.writeFileSync('screenshots/final-production-test/FINAL_PRODUCTION_READINESS_REPORT.md', report);
    console.log('\n📄 Report saved to: screenshots/final-production-test/FINAL_PRODUCTION_READINESS_REPORT.md');

  } catch (error) {
    console.error('\n❌ TEST EXECUTION ERROR:', error.message);
    results.productionReady = false;
  } finally {
    await browser.close();
  }

  return results;
}

runFinalProductionTest().catch(console.error);
