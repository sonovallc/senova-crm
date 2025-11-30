const { chromium } = require('playwright');
const fs = require('fs');

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const navTests = [
    { name: 'Dashboard', url: '/dashboard', screenshot: 'screenshots/02-nav-dashboard.png' },
    { name: 'Contacts', url: '/dashboard/contacts', screenshot: 'screenshots/02-nav-contacts.png' },
    { name: 'Inbox', url: '/dashboard/inbox', screenshot: 'screenshots/02-nav-inbox.png' },
    { name: 'Email Compose', url: '/dashboard/email/compose', screenshot: 'screenshots/02-nav-email-compose.png' },
    { name: 'Email Templates', url: '/dashboard/email/templates', screenshot: 'screenshots/02-nav-email-templates.png' },
    { name: 'Email Campaigns', url: '/dashboard/email/campaigns', screenshot: 'screenshots/02-nav-email-campaigns.png' },
    { name: 'Email Autoresponders', url: '/dashboard/email/autoresponders', screenshot: 'screenshots/02-nav-email-autoresponders.png' },
    { name: 'Settings Users', url: '/dashboard/settings/users', screenshot: 'screenshots/02-nav-settings-users.png' },
    { name: 'Settings Tags', url: '/dashboard/settings/tags', screenshot: 'screenshots/02-nav-settings-tags.png' },
    { name: 'Settings Fields', url: '/dashboard/settings/fields', screenshot: 'screenshots/02-nav-settings-fields.png' },
    { name: 'Settings Email', url: '/dashboard/settings/email', screenshot: 'screenshots/02-nav-settings-email.png' },
    { name: 'Settings Mailgun', url: '/dashboard/settings/integrations/mailgun', screenshot: 'screenshots/02-nav-settings-mailgun.png' },
    { name: 'Settings Closebot', url: '/dashboard/settings/closebot', screenshot: 'screenshots/02-nav-settings-closebot.png' },
    { name: 'Activity Log', url: '/dashboard/activity', screenshot: 'screenshots/02-nav-activity.png' },
    { name: 'Payments', url: '/dashboard/payments', screenshot: 'screenshots/02-nav-payments.png' },
    { name: 'AI Tools', url: '/dashboard/ai-tools', screenshot: 'screenshots/02-nav-ai-tools.png' }
  ];

  const results = [];
  let passCount = 0;
  let failCount = 0;

  try {
    console.log('========================================');
    console.log('VERIFICATION 2: Navigation Testing');
    console.log('========================================');
    console.log('');

    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(3000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('Login submitted, current URL: ' + page.url());
    console.log('');

    for (let i = 0; i < navTests.length; i++) {
      const test = navTests[i];
      const testNum = i + 1;
      
      console.log('----------------------------------------');
      console.log('Testing ' + testNum + '/16: ' + test.name);
      console.log('----------------------------------------');

      try {
        const consoleErrors = [];
        const errorHandler = function(msg) {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        };
        page.on('console', errorHandler);

        console.log('Navigating to: http://localhost:3004' + test.url);
        await page.goto('http://localhost:3004' + test.url, { timeout: 90000 });
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        console.log('Current URL: ' + currentUrl);

        const is404 = await page.locator('text=404').count() > 0;
        if (is404) {
          console.log('FAIL: 404 error');
          console.log('');
          await page.screenshot({ path: test.screenshot, fullPage: true });
          results.push({ name: test.name, status: 'FAIL', reason: '404', url: currentUrl });
          failCount++;
          page.removeListener('console', errorHandler);
          continue;
        }

        await page.screenshot({ path: test.screenshot, fullPage: true });
        console.log('Screenshot: ' + test.screenshot);

        const bodyText = await page.locator('body').textContent();
        const hasContent = bodyText.trim().length > 100;

        if (!hasContent) {
          console.log('FAIL: Blank page');
          console.log('');
          results.push({ name: test.name, status: 'FAIL', reason: 'Blank', url: currentUrl });
          failCount++;
        } else {
          console.log('PASS');
          console.log('');
          results.push({ name: test.name, status: 'PASS', url: currentUrl, errors: consoleErrors.length });
          passCount++;
        }

        page.removeListener('console', errorHandler);

      } catch (error) {
        console.log('FAIL: ' + error.message);
        console.log('');
        try { await page.screenshot({ path: test.screenshot, fullPage: true }); } catch (e) {}
        results.push({ name: test.name, status: 'FAIL', reason: error.message, url: page.url() });
        failCount++;
      }
    }

    console.log('========================================');
    console.log('VERIFICATION 2 RESULTS');
    console.log('========================================');
    console.log('Passed: ' + passCount + '/16');
    console.log('Failed: ' + failCount + '/16');
    console.log('');

    results.forEach(function(r, i) {
      console.log((i + 1) + '. ' + r.name + ': ' + r.status);
      console.log('   URL: ' + r.url);
      if (r.status === 'FAIL') console.log('   Reason: ' + r.reason);
      console.log('');
    });

    console.log('========================================');
    console.log('VERDICT: ' + (passCount === 16 ? 'PASS' : 'FAIL'));
    console.log('========================================');

    fs.writeFileSync('test-results/verification-02-navigation-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      passed: passCount,
      failed: failCount,
      results: results
    }, null, 2));

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
