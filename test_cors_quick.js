const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const corsErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
      corsErrors.push(msg.text());
      console.log('CORS ERROR:', msg.text());
    }
  });

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('Testing Campaigns page for CORS...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(3000);

    console.log('Testing Autoresponders page for CORS...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(3000);

    console.log('Testing Mailgun Settings for CORS...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun');
    await page.waitForTimeout(3000);

    console.log(`\n=== CORS TEST RESULTS ===`);
    console.log(`Total CORS errors: ${corsErrors.length}`);
    if (corsErrors.length === 0) {
      console.log('✓ CORS FIX VERIFIED - No CORS errors!');
      process.exit(0);
    } else {
      console.log('✗ CORS STILL BROKEN');
      corsErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
      process.exit(1);
    }

  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
