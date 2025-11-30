const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  let passCount = 0;
  let failCount = 0;

  try {
    console.log('
=== VERIFICATION #2: Navigation (All Sidebar Links) ===
');

    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard/**', { timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    console.log('Login successful
');

    const navTests = [
      { name: 'Dashboard', selector: 'a[href="/dashboard"]', expectedUrl: '/dashboard', screenshot: 'screenshots/02-nav-dashboard.png' },
      { name: 'Contacts', selector: 'a[href="/dashboard/contacts"]', expectedUrl: '/dashboard/contacts', screenshot: 'screenshots/02-nav-contacts.png' },
      { name: 'Inbox', selector: 'a[href="/dashboard/inbox"]', expectedUrl: '/dashboard/inbox', screenshot: 'screenshots/02-nav-inbox.png' },
      { name: 'Email Compose', selector: 'a[href="/dashboard/email/compose"]', expectedUrl: '/dashboard/email/compose', screenshot: 'screenshots/02-nav-email-compose.png' },
      { name: 'Email Templates', selector: 'a[href="/dashboard/email/templates"]', expectedUrl: '/dashboard/email/templates', screenshot: 'screenshots/02-nav-email-templates.png' },
      { name: 'Email Campaigns', selector: 'a[href="/dashboard/email/campaigns"]', expectedUrl: '/dashboard/email/campaigns', screenshot: 'screenshots/02-nav-email-campaigns.png' },
      { name: 'Email Autoresponders', selector: 'a[href="/dashboard/email/autoresponders"]', expectedUrl: '/dashboard/email/autoresponders', screenshot: 'screenshots/02-nav-email-autoresponders.png' },
      { name: 'Settings Users', selector: 'a[href="/dashboard/settings/users"]', expectedUrl: '/dashboard/settings/users', screenshot: 'screenshots/02-nav-settings-users.png' },
      { name: 'Settings Tags', selector: 'a[href="/dashboard/settings/tags"]', expectedUrl: '/dashboard/settings/tags', screenshot: 'screenshots/02-nav-settings-tags.png' },
      { name: 'Settings Fields', selector: 'a[href="/dashboard/settings/fields"]', expectedUrl: '/dashboard/settings/fields', screenshot: 'screenshots/02-nav-settings-fields.png' },
      { name: 'Settings Email', selector: 'a[href="/dashboard/settings/email"]', expectedUrl: '/dashboard/settings/email', screenshot: 'screenshots/02-nav-settings-email.png' },
      { name: 'Settings Mailgun', selector: 'a[href="/dashboard/settings/integrations/mailgun"]', expectedUrl: '/dashboard/settings/integrations/mailgun', screenshot: 'screenshots/02-nav-settings-mailgun.png' },
      { name: 'Settings Closebot', selector: 'a[href="/dashboard/settings/closebot"]', expectedUrl: '/dashboard/settings/closebot', screenshot: 'screenshots/02-nav-settings-closebot.png' },
      { name: 'Activity Log', selector: 'a[href="/dashboard/activity"]', expectedUrl: '/dashboard/activity', screenshot: 'screenshots/02-nav-activity.png' },
      { name: 'Payments', selector: 'a[href="/dashboard/payments"]', expectedUrl: '/dashboard/payments', screenshot: 'screenshots/02-nav-payments.png' },
      { name: 'AI Tools', selector: 'a[href="/dashboard/ai-tools"]', expectedUrl: '/dashboard/ai-tools', screenshot: 'screenshots/02-nav-ai-tools.png' }
    ];

    for (let i = 0; i < navTests.length; i++) {
      const test = navTests[i];
      console.log();

      try {
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        const linkExists = await page.locator(test.selector).count() > 0;
        if (!linkExists) {
          console.log();
          results.push({ name: test.name, status: 'FAIL', reason: 'Link not found', url: 'N/A' });
          failCount++;
          continue;
        }

        await page.click(test.selector);
        console.log('  Waiting up to 90 seconds...');

        await page.waitForURL(, { timeout: 90000 });
        await page.waitForLoadState('networkidle', { timeout: 90000 });
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log();

        const is404 = await page.locator('text=404').count() > 0;
        if (is404) {
          console.log('FAIL: 404 error');
          await page.screenshot({ path: test.screenshot, fullPage: true });
          results.push({ name: test.name, status: 'FAIL', reason: '404', url: currentUrl });
          failCount++;
          continue;
        }

        await page.screenshot({ path: test.screenshot, fullPage: true });
        
        const bodyText = await page.locator('body').textContent();
        const hasContent = bodyText.trim().length > 100;

        if (!hasContent) {
          console.log('FAIL: Blank page');
          results.push({ name: test.name, status: 'FAIL', reason: 'Blank', url: currentUrl });
          failCount++;
        } else {
          console.log('PASS');
          results.push({ name: test.name, status: 'PASS', url: currentUrl, errors: consoleErrors.length });
          passCount++;
        }

      } catch (error) {
        console.log();
        try { await page.screenshot({ path: test.screenshot, fullPage: true }); } catch (e) {}
        results.push({ name: test.name, status: 'FAIL', reason: error.message, url: page.url() });
        failCount++;
      }
    }

    console.log('
=== RESULTS ===');
    console.log();
    console.log();

    results.forEach((r, i) => {
      console.log();
      console.log();
      if (r.status === 'FAIL') console.log();
    });

    console.log();

    const fs = require('fs');
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
})();
