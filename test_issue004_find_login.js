const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    const routes = [
      'http://localhost:3004/login',
      'http://localhost:3004/auth/login',
      'http://localhost:3004/dashboard/login',
      'http://localhost:3004/admin/login',
      'http://localhost:3004/dashboard',
      'http://localhost:3004/dashboard/contacts'
    ];

    for (const route of routes) {
      console.log('\n=== Testing:', route, '===');
      try {
        await page.goto(route, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);

        const url = page.url();
        console.log('Current URL:', url);

        const passwordInputs = await page.locator('input[type="password"]').count();
        console.log('Password inputs found:', passwordInputs);

        const emailInputs = await page.locator('input[type="email"]').count();
        console.log('Email inputs found:', emailInputs);

        if (passwordInputs > 0 && emailInputs > 0) {
          console.log('*** LOGIN PAGE FOUND ***');
          await page.screenshot({ path: 'testing/production-fixes/found-login.png', fullPage: true });
          break;
        }
      } catch (error) {
        console.log('Error:', error.message);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await browser.close();
  }
})();
