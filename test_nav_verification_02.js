const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const EMAIL = 'admin@evebeautyma.com';
const PASSWORD = 'TestPass123!';

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

async function runNavigationTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = [];
  let passCount = 0;
  let failCount = 0;

  try {
    console.log('=========================================');
    console.log('VERIFICATION #2: Navigation Testing');
    console.log('Testing 16 navigation links');
    console.log('=========================================\n');

    console.log('Step 1: Login...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    console.log('Login successful\n');

    for (let i = 0; i < navTests.length; i++) {
      const test = navTests[i];
      const testNum = i + 1;
      
      console.log(\);
      console.log(\);
      console.log(\);

      try {
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        console.log(\);
        await page.goto(BASE_URL + test.url, { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log(\);

        const is404 = await page.locator('text=404').count() > 0;
        if (is404) {
          console.log('FAIL: 404 error\n');
          await page.screenshot({ path: test.screenshot, fullPage: true });
          results.push({ name: test.name, status: 'FAIL', reason: '404', url: currentUrl });
          failCount++;
          continue;
        }

        await page.screenshot({ path: test.screenshot, fullPage: true });
        console.log(\);

        const bodyText = await page.locator('body').textContent();
        const hasContent = bodyText.trim().length > 100;

        if (!hasContent) {
          console.log('FAIL: Blank page\n');
          results.push({ name: test.name, status: 'FAIL', reason: 'Blank', url: currentUrl });
          failCount++;
        } else {
          console.log('PASS\n');
          results.push({ name: test.name, status: 'PASS', url: currentUrl, errors: consoleErrors.length });
          passCount++;
        }

      } catch (error) {
        console.log(\);
        try { await page.screenshot({ path: test.screenshot, fullPage: true }); } catch (e) {}
        results.push({ name: test.name, status: 'FAIL', reason: error.message, url: page.url() });
        failCount++;
      }
    }

    console.log('=========================================');
    console.log('VERIFICATION #2 RESULTS');
    console.log('=========================================');
    console.log(\);
    console.log(\);

    results.forEach((r, i) => {
      console.log(\);
      console.log(\);
      if (r.status === 'FAIL') console.log(\);
      console.log('');
    });

    console.log('=========================================');
    console.log(\);
    console.log('=========================================');

    fs.writeFileSync('test-results/verification-02-navigation-results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      passed: passCount,
      failed: failCount,
      results
    }, null, 2));

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

runNavigationTest().catch(console.error);
