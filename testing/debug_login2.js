const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3004/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'testing/email-channel-screenshots/phase-0-reverification/debug-login-page.png', fullPage: true });
  console.log('URL:', page.url());
  const inputs = await page.locator('input').count();
  console.log('Input count:', inputs);
  for (let i = 0; i < inputs; i++) {
    const type = await page.locator('input').nth(i).getAttribute('type');
    const name = await page.locator('input').nth(i).getAttribute('name');
    const id = await page.locator('input').nth(i).getAttribute('id');
    console.log('Input', i, '- type:', type, 'name:', name, 'id:', id);
  }
  await browser.close();
})().catch(console.error);
