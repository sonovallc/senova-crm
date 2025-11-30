const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing http://localhost:3000...');
    await page.goto('http://localhost:3000', { timeout: 10000 });
    console.log('Page loaded!');
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    await page.screenshot({ path: '../screenshots/server-test.png' });
    console.log('Screenshot saved');
  } catch (error) {
    console.error('Failed:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
