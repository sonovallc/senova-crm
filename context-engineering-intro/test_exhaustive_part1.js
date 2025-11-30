const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Feature 7 & Navigation Test ===');

    // Login
    console.log('\nLogging in...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test Feature 7: Closebot placeholder
    console.log('\n=== FEATURE 7: Closebot Placeholder ===');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/closebot');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/f7-closebot.png', fullPage: true });
    console.log('✓ Screenshot: f7-closebot.png');

    const comingSoon = await page.locator('text=Coming Soon').count();
    console.log(`Coming Soon text found: ${comingSoon > 0 ? 'YES ✓' : 'NO ✗'}`);

    // Test Navigation Links
    console.log('\n=== NAVIGATION LINKS TEST ===');

    // Email > Compose
    console.log('\nTesting: Email > Compose');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/nav-01-compose.png', fullPage: true });
    console.log('✓ Screenshot: nav-01-compose.png');

    // Email > Templates
    console.log('Testing: Email > Templates');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/nav-02-templates.png', fullPage: true });
    console.log('✓ Screenshot: nav-02-templates.png');

    // Email > Campaigns
    console.log('Testing: Email > Campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/nav-03-campaigns.png', fullPage: true });
    console.log('✓ Screenshot: nav-03-campaigns.png');

    // Email > Autoresponders
    console.log('Testing: Email > Autoresponders');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/nav-04-autoresponders.png', fullPage: true });
    console.log('✓ Screenshot: nav-04-autoresponders.png');

    // Settings > Integrations (Mailgun)
    console.log('Testing: Settings > Integrations > Mailgun');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/nav-05-mailgun.png', fullPage: true });
    console.log('✓ Screenshot: nav-05-mailgun.png');

    console.log('\n=== All Tests Complete ===');
    console.log('All screenshots saved to screenshots/');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/final-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
