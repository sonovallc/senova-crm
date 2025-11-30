const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture campaigns API responses
  page.on('response', async response => {
    if (response.url().includes('/campaigns')) {
      console.log(`\n[CAMPAIGNS API]: ${response.status()} ${response.statusText()}`);
      try {
        const body = await response.json();
        console.log('[RESPONSE]:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('[RESPONSE]: Could not parse JSON');
      }
    }
  });

  try {
    console.log('=== Logging in ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('\n=== Navigating to campaigns page ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(5000);

    console.log('\n=== Taking screenshot ===');
    await page.screenshot({
      path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\context-engineering-intro\\campaigns_final.png',
      fullPage: true
    });

    console.log('\n=== Page content check ===');
    const result = await page.evaluate(() => {
      return {
        hasError: document.body.textContent.includes('Failed to load'),
        hasNoCampaigns: document.body.textContent.includes('No campaigns yet'),
        hasLoading: document.body.textContent.includes('Loading'),
        hasCampaignsList: document.querySelector('[class*="grid gap-4"]') !== null
      };
    });
    console.log('Result:', result);

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
})();
