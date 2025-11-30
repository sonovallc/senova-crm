const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log(`[NETWORK ERROR]: ${request.url()} - ${request.failure().errorText}`);
  });

  // Capture API responses
  page.on('response', async response => {
    if (response.url().includes('/api/v1/campaigns')) {
      console.log(`[API RESPONSE]: ${response.url()}`);
      console.log(`[STATUS]: ${response.status()} ${response.statusText()}`);
      try {
        const body = await response.json();
        console.log('[RESPONSE BODY]:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('[RESPONSE BODY]: Not JSON or error reading');
      }
    }
  });

  try {
    console.log('\n=== Navigating to login page ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Logging in ===');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    console.log('\n=== Navigating to campaigns page ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');

    // Wait and watch what happens
    await page.waitForTimeout(10000);

    console.log('\n=== Taking screenshot ===');
    await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\context-engineering-intro\\campaigns_debug.png', fullPage: true });

    console.log('\n=== Checking page content ===');
    const pageContent = await page.content();
    console.log('Page has "Loading" text:', pageContent.includes('Loading'));

    const loadingText = await page.locator('text=Loading').count();
    console.log('Number of "Loading" elements:', loadingText);

  } catch (error) {
    console.error('Error during test:', error);
  }

  await browser.close();
})();
