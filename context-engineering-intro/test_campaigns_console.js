const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || text.includes('campaign') || text.includes('error')) {
      console.log(`[CONSOLE ${type.toUpperCase()}]:`, text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
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
    await page.waitForTimeout(8000);

    console.log('\n=== Checking error state ===');
    const errorInfo = await page.evaluate(() => {
      const errorText = document.body.textContent;
      return {
        hasNetworkError: errorText.includes('Network Error'),
        hasFailedToLoad: errorText.includes('Failed to load'),
        fullErrorText: document.querySelector('[class*="text-muted-foreground"]')?.textContent || 'none'
      };
    });
    console.log('Error info:', errorInfo);

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
})();
