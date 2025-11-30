const { chromium } = require('playwright');

const LINKS_TO_TEST = [
  { name: 'Dashboard', href: '/dashboard', selector: 'a[href="/dashboard"]' },
  { name: 'Contacts', href: '/dashboard/contacts', selector: 'a[href="/dashboard/contacts"]' },
  { name: 'Inbox', href: '/dashboard/inbox', selector: 'a[href="/dashboard/inbox"]' },
  { name: 'Compose', href: '/dashboard/email/compose', selector: 'a[href="/dashboard/email/compose"]' },
  { name: 'Templates', href: '/dashboard/email/templates', selector: 'a[href="/dashboard/email/templates"]' },
  { name: 'Campaigns', href: '/dashboard/email/campaigns', selector: 'a[href="/dashboard/email/campaigns"]' },
  { name: 'Autoresponders', href: '/dashboard/email/autoresponders', selector: 'a[href="/dashboard/email/autoresponders"]' },
  { name: 'Activity Log', href: '/dashboard/activity-log', selector: 'a[href="/dashboard/activity-log"]' },
  { name: 'Payments', href: '/dashboard/payments', selector: 'a[href="/dashboard/payments"]' },
  { name: 'AI Tools', href: '/dashboard/ai', selector: 'a[href="/dashboard/ai"]' },
  { name: 'Users', href: '/dashboard/settings/users', selector: 'a[href="/dashboard/settings/users"]' },
  { name: 'Tags', href: '/dashboard/settings/tags', selector: 'a[href="/dashboard/settings/tags"]' },
  { name: 'Fields', href: '/dashboard/settings/fields', selector: 'a[href="/dashboard/settings/fields"]' },
  { name: 'Email Settings', href: '/dashboard/settings/email', selector: 'a[href="/dashboard/settings/email"]' },
  { name: 'Feature Flags', href: '/dashboard/settings/feature-flags', selector: 'a[href="/dashboard/settings/feature-flags"]' },
  { name: 'Mailgun', href: '/dashboard/settings/integrations/mailgun', selector: 'a[href="/dashboard/settings/integrations/mailgun"]' },
  { name: 'Closebot', href: '/dashboard/settings/integrations/closebot', selector: 'a[href="/dashboard/settings/integrations/closebot"]' },
];

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  let passed = 0;
  let failed = 0;

  try {
    // Login first
    console.log('=== LOGGING IN ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful, on:', page.url());

    // Expand Email submenu
    console.log('\n=== EXPANDING EMAIL SUBMENU ===');
    const emailBtn = await page.$('button:has-text("Email")');
    if (emailBtn) {
      await emailBtn.click();
      await page.waitForTimeout(500);
      console.log('Email submenu expanded');
    }

    // Expand Settings submenu
    console.log('\n=== EXPANDING SETTINGS SUBMENU ===');
    const settingsBtn = await page.$('button:has-text("Settings")');
    if (settingsBtn) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      console.log('Settings submenu expanded');
    }

    // Take screenshot of expanded sidebar
    await page.screenshot({ path: 'screenshots/nav_expanded_sidebar.png', fullPage: false });

    // Test each link
    console.log('\n=== TESTING 17 NAVIGATION LINKS ===\n');

    for (const link of LINKS_TO_TEST) {
      const result = { name: link.name, expected: link.href, actual: '', status: 'FAIL', error: '' };

      try {
        // Re-expand submenus if needed (they may collapse)
        if (link.href.includes('/email/')) {
          const emailBtn = await page.$('button:has-text("Email")');
          if (emailBtn) {
            const isExpanded = await page.$('a[href="/dashboard/email/compose"]');
            if (!isExpanded) {
              await emailBtn.click();
              await page.waitForTimeout(300);
            }
          }
        }

        if (link.href.includes('/settings/')) {
          const settingsBtn = await page.$('button:has-text("Settings")');
          if (settingsBtn) {
            const isExpanded = await page.$('a[href="/dashboard/settings/users"]');
            if (!isExpanded) {
              await settingsBtn.click();
              await page.waitForTimeout(300);
            }
          }
        }

        // Find and click the link
        const linkEl = await page.$(link.selector);
        if (!linkEl) {
          result.error = 'Link not found in DOM';
          results.push(result);
          failed++;
          console.log(`[FAIL] ${link.name}: Link not found`);
          continue;
        }

        await linkEl.click();
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        result.actual = new URL(page.url()).pathname;

        if (result.actual === link.href) {
          result.status = 'PASS';
          passed++;
          console.log(`[PASS] ${link.name}: ${result.actual}`);
        } else {
          result.error = `Expected ${link.href}, got ${result.actual}`;
          failed++;
          console.log(`[FAIL] ${link.name}: Expected ${link.href}, got ${result.actual}`);
        }

        // Take screenshot
        await page.screenshot({ path: `screenshots/nav_${link.name.toLowerCase().replace(/\s+/g, '_')}.png` });

      } catch (err) {
        result.error = err.message;
        failed++;
        console.log(`[FAIL] ${link.name}: ${err.message}`);
      }

      results.push(result);
    }

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n========================================');
  console.log('NAVIGATION TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Links: ${LINKS_TO_TEST.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / LINKS_TO_TEST.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  // Print results table
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(80));
  for (const r of results) {
    console.log(`${r.status.padEnd(6)} | ${r.name.padEnd(20)} | ${r.expected.padEnd(40)} | ${r.actual || r.error}`);
  }

  return { passed, failed, total: LINKS_TO_TEST.length, results };
}

runTests().catch(console.error);
