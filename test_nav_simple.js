const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotDir = path.join(__dirname, 'context-engineering-intro', 'testing', 'exhaustive-debug');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = [];
  let testNumber = 0;

  console.log('Starting exhaustive navigation test...\n');

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Logged in successfully\n');

    async function testNavLink(linkName, selector, expectedUrl, screenshotPrefix) {
      testNumber = testNumber + 1;
      console.log(`\n[${testNumber}] Testing: ${linkName}`);
      
      const result = {
        number: testNumber,
        linkName,
        expectedUrl,
        actualUrl: '',
        pageLoaded: false,
        result: 'FAIL',
        error: null
      };

      try {
        const beforeScreenshot = path.join(screenshotDir, screenshotPrefix + '_before.png');
        await page.screenshot({ path: beforeScreenshot, fullPage: true });

        await page.click(selector, { timeout: 5000 });
        await page.waitForTimeout(1500);

        result.actualUrl = page.url();

        const afterScreenshot = path.join(screenshotDir, screenshotPrefix + '_after.png');
        await page.screenshot({ path: afterScreenshot, fullPage: true });

        const urlMatch = result.actualUrl.includes(expectedUrl);
        const mainContent = await page.$('main');
        result.pageLoaded = mainContent !== null;

        if (urlMatch && result.pageLoaded) {
          result.result = 'PASS';
          console.log('  PASS');
        } else {
          console.log('  FAIL');
        }

      } catch (error) {
        result.error = error.message;
        result.result = 'ERROR';
        console.log('  ERROR: ' + error.message);
      }

      results.push(result);
      return result;
    }

    await testNavLink('Dashboard', 'a[href="/dashboard"]', '/dashboard', 'phase1_01_dashboard');
    await testNavLink('Contacts', 'a[href="/dashboard/contacts"]', '/dashboard/contacts', 'phase1_02_contacts');
    await testNavLink('Inbox', 'a[href="/dashboard/inbox"]', '/dashboard/inbox', 'phase1_03_inbox');
    
    await page.click('button:has-text("Email")');
    await page.waitForTimeout(500);
    
    await testNavLink('Email Compose', 'a[href="/dashboard/email/compose"]', '/dashboard/email/compose', 'phase1_05_email_compose');
    await testNavLink('Email Templates', 'a[href="/dashboard/email/templates"]', '/dashboard/email/templates', 'phase1_06_email_templates');
    await testNavLink('Email Campaigns', 'a[href="/dashboard/email/campaigns"]', '/dashboard/email/campaigns', 'phase1_07_email_campaigns');
    await testNavLink('Email Autoresponders', 'a[href="/dashboard/email/autoresponders"]', '/dashboard/email/autoresponders', 'phase1_08_email_autoresponders');
    
    await testNavLink('Activity Log', 'a[href="/dashboard/activity-log"]', '/dashboard/activity-log', 'phase1_09_activity_log');
    await testNavLink('Payments', 'a[href="/dashboard/payments"]', '/dashboard/payments', 'phase1_10_payments');
    await testNavLink('AI Tools', 'a[href="/dashboard/ai"]', '/dashboard/ai', 'phase1_11_ai_tools');
    
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(500);
    
    await testNavLink('Settings Users', 'a[href="/dashboard/settings/users"]', '/dashboard/settings/users', 'phase1_13_settings_users');
    await testNavLink('Settings Tags', 'a[href="/dashboard/settings/tags"]', '/dashboard/settings/tags', 'phase1_14_settings_tags');
    await testNavLink('Settings Fields', 'a[href="/dashboard/settings/fields"]', '/dashboard/settings/fields', 'phase1_15_settings_fields');
    await testNavLink('Settings Email', 'a[href="/dashboard/settings/email"]', '/dashboard/settings/email', 'phase1_16_settings_email');
    await testNavLink('Settings Feature Flags', 'a[href="/dashboard/settings/feature-flags"]', '/dashboard/settings/feature-flags', 'phase1_17_settings_feature_flags');
    await testNavLink('Settings Mailgun', 'a[href="/dashboard/settings/integrations/mailgun"]', '/dashboard/settings/integrations/mailgun', 'phase1_18_settings_mailgun');
    await testNavLink('Settings Closebot', 'a[href="/dashboard/settings/integrations/closebot"]', '/dashboard/settings/integrations/closebot', 'phase1_19_settings_closebot');

    console.log('\n\n=== NAVIGATION TEST RESULTS ===\n');
    console.log('| # | Link Name | Expected URL | Actual URL | Page Loaded | Result |');
    console.log('|---|-----------|--------------|------------|-------------|--------|');
    
    results.forEach(r => {
      const actualUrlShort = r.actualUrl.replace('http://localhost:3004', '');
      const pl = r.pageLoaded ? 'YES' : 'NO';
      console.log('| ' + r.number + ' | ' + r.linkName + ' | ' + r.expectedUrl + ' | ' + actualUrlShort + ' | ' + pl + ' | ' + r.result + ' |');
    });

    const passCount = results.filter(r => r.result === 'PASS').length;
    const totalTests = results.length;

    console.log('\n=== SUMMARY ===');
    console.log('Total Tests: ' + totalTests);
    console.log('PASS: ' + passCount + ' (' + ((passCount/totalTests)*100).toFixed(1) + '%)');

    const resultsFile = path.join(__dirname, 'navigation_test_results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await browser.close();
  }
})();
