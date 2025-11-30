const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:3004/home');
  await page.close();

  // ---------------------
  await context.storageState({ path: 'auth.json' });
  await context.close();
  await browser.close();
})();