const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];

  try {
    // Login once
    console.log('=== LOGGING IN ===\n');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@evebeautyma.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful\n');

    // Helper function to test a link with proper reset
    async function testLink(name, href, needsExpand = null) {
      // ALWAYS start from fresh dashboard load
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Expand menu if needed
      if (needsExpand) {
        const expandBtn = await page.$(`button:has-text("${needsExpand}")`);
        if (expandBtn) {
          await expandBtn.click();
          await page.waitForTimeout(500);
        }
      }

      // Find and click the link
      const selector = `a[href="${href}"]`;
      const link = await page.$(selector);

      if (!link) {
        console.log(`[FAIL] ${name} - Link not found (${href})`);
        results.push({ name, href, status: 'FAIL', error: 'Link not found' });
        return;
      }

      // Click and wait for navigation
      await Promise.all([
        page.waitForURL(`**${href}**`, { timeout: 5000 }).catch(() => null),
        link.click()
      ]);

      await page.waitForTimeout(500);
      const currentUrl = new URL(page.url()).pathname;

      if (currentUrl === href) {
        console.log(`[PASS] ${name}`);
        results.push({ name, href, status: 'PASS', actual: currentUrl });
      } else {
        console.log(`[FAIL] ${name} - Expected ${href}, got ${currentUrl}`);
        results.push({ name, href, status: 'FAIL', actual: currentUrl });
      }
    }

    // Test main navigation (no menu expansion needed)
    console.log('=== MAIN NAVIGATION ===\n');
    await testLink('Dashboard', '/dashboard');
    await testLink('Inbox', '/dashboard/inbox');
    await testLink('Contacts', '/dashboard/contacts');
    await testLink('Activity Log', '/dashboard/activity-log');
    await testLink('Payments', '/dashboard/payments');
    await testLink('AI Tools', '/dashboard/ai');
    await testLink('Feature Flags', '/dashboard/settings/feature-flags');
    await testLink('Deleted Contacts', '/dashboard/contacts/deleted');

    // Test Email submenu
    console.log('\n=== EMAIL SUBMENU ===\n');
    await testLink('Compose', '/dashboard/email/compose', 'Email');
    await testLink('Templates', '/dashboard/email/templates', 'Email');
    await testLink('Campaigns', '/dashboard/email/campaigns', 'Email');
    await testLink('Autoresponders', '/dashboard/email/autoresponders', 'Email');

    // Test Settings submenu
    console.log('\n=== SETTINGS SUBMENU ===\n');
    await testLink('Users', '/dashboard/settings/users', 'Settings');
    await testLink('Tags', '/dashboard/settings/tags', 'Settings');
    await testLink('Fields', '/dashboard/settings/fields', 'Settings');
    await testLink('Email Settings', '/dashboard/settings/email', 'Settings');
    await testLink('Mailgun', '/dashboard/settings/integrations/mailgun', 'Settings');
    await testLink('Closebot', '/dashboard/settings/integrations/closebot', 'Settings');

    // Summary
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;

    console.log('\n========================================');
    console.log('NAVIGATION TEST RESULTS');
    console.log('========================================');
    console.log(`Total: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Pass Rate: ${((passed/total)*100).toFixed(1)}%`);
    console.log('========================================\n');

    if (failed > 0) {
      console.log('FAILED:');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.error || 'Got ' + r.actual}`);
      });
    }

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
}

runTests();
