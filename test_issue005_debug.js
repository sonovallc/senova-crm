const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to frontend...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'screenshots/ISSUE005-debug-login.png',
      fullPage: true
    });

    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ 
      path: 'screenshots/ISSUE005-debug-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
})();
