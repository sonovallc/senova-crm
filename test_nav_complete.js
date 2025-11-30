const { chromium } = require('playwright');

const MAIN_LINKS = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Inbox', href: '/dashboard/inbox' },
  { name: 'Contacts', href: '/dashboard/contacts' },
  { name: 'Activity Log', href: '/dashboard/activity-log' },
  { name: 'Payments', href: '/dashboard/payments' },
  { name: 'AI Tools', href: '/dashboard/ai' },
  { name: 'Feature Flags', href: '/dashboard/settings/feature-flags' },
  { name: 'Deleted Contacts', href: '/dashboard/contacts/deleted' },
];

const EMAIL_LINKS = [
  { name: 'Compose', href: '/dashboard/email/compose' },
  { name: 'Templates', href: '/dashboard/email/templates' },
  { name: 'Campaigns', href: '/dashboard/email/campaigns' },
  { name: 'Autoresponders', href: '/dashboard/email/autoresponders' },
];

const SETTINGS_LINKS = [
  { name: 'Users', href: '/dashboard/settings/users' },
  { name: 'Tags', href: '/dashboard/settings/tags' },
  { name: 'Fields', href: '/dashboard/settings/fields' },
  { name: 'Email (Settings)', href: '/dashboard/settings/email' },
  { name: 'Mailgun', href: '/dashboard/settings/integrations/mailgun' },
  { name: 'Closebot', href: '/dashboard/settings/integrations/closebot' },
];

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  let passed = 0, failed = 0;
  const results = [];

  try {
    // Login
    console.log('=== LOGGING IN ===\n');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful\n');

    // Test main navigation links
    console.log('=== MAIN NAVIGATION LINKS ===\n');
    for (const link of MAIN_LINKS) {
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForLoadState('networkidle');

      const linkEl = await page.$(`a[href="${link.href}"]`);
      if (linkEl) {
        await linkEl.click();
        await page.waitForTimeout(1500);
        const url = new URL(page.url()).pathname;
        if (url === link.href) {
          console.log(`[PASS] ${link.name}`);
          results.push({ name: link.name, status: 'PASS', href: link.href });
          passed++;
        } else {
          console.log(`[FAIL] ${link.name} - Expected ${link.href}, got ${url}`);
          results.push({ name: link.name, status: 'FAIL', href: link.href, actual: url });
          failed++;
        }
      } else {
        console.log(`[FAIL] ${link.name} - Link not found`);
        results.push({ name: link.name, status: 'FAIL', href: link.href, error: 'Not found' });
        failed++;
      }
    }

    // Test Email submenu links
    console.log('\n=== EMAIL SUBMENU LINKS ===\n');
    for (const link of EMAIL_LINKS) {
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForLoadState('networkidle');

      // Expand Email menu
      const emailBtn = await page.$('button:has-text("Email")');
      if (emailBtn) {
        await emailBtn.click();
        await page.waitForTimeout(500);
      }

      const linkEl = await page.$(`a[href="${link.href}"]`);
      if (linkEl) {
        await linkEl.click();
        await page.waitForTimeout(1500);
        const url = new URL(page.url()).pathname;
        if (url === link.href) {
          console.log(`[PASS] ${link.name}`);
          results.push({ name: link.name, status: 'PASS', href: link.href });
          passed++;
        } else {
          console.log(`[FAIL] ${link.name} - Expected ${link.href}, got ${url}`);
          results.push({ name: link.name, status: 'FAIL', href: link.href, actual: url });
          failed++;
        }
      } else {
        console.log(`[FAIL] ${link.name} - Link not found after expanding Email`);
        results.push({ name: link.name, status: 'FAIL', href: link.href, error: 'Not found' });
        failed++;
      }
    }

    // Test Settings submenu links
    console.log('\n=== SETTINGS SUBMENU LINKS ===\n');
    for (const link of SETTINGS_LINKS) {
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForLoadState('networkidle');

      // Expand Settings menu
      const settingsBtn = await page.$('button:has-text("Settings")');
      if (settingsBtn) {
        await settingsBtn.click();
        await page.waitForTimeout(500);
      }

      const linkEl = await page.$(`a[href="${link.href}"]`);
      if (linkEl) {
        await linkEl.click();
        await page.waitForTimeout(1500);
        const url = new URL(page.url()).pathname;
        if (url === link.href) {
          console.log(`[PASS] ${link.name}`);
          results.push({ name: link.name, status: 'PASS', href: link.href });
          passed++;
        } else {
          console.log(`[FAIL] ${link.name} - Expected ${link.href}, got ${url}`);
          results.push({ name: link.name, status: 'FAIL', href: link.href, actual: url });
          failed++;
        }
      } else {
        console.log(`[FAIL] ${link.name} - Link not found after expanding Settings`);
        results.push({ name: link.name, status: 'FAIL', href: link.href, error: 'Not found' });
        failed++;
      }
    }

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }

  const total = passed + failed;
  console.log('\n========================================');
  console.log('NAVIGATION TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Links: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error || 'Expected ' + r.href + ', got ' + r.actual}`);
    });
  }

  return { passed, failed, total, passRate: ((passed / total) * 100).toFixed(1) };
}

runTests().catch(console.error);
