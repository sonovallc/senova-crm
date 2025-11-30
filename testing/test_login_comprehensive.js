const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3004');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'testing/email-channel-screenshots/phase-0-reverification/debug-login-page.png', fullPage: true });
  const html = await page.content();
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());
  const inputs = await page.locator('input').count();
  console.log('Input count:', inputs);
  for (let i = 0; i < inputs; i++) {
    const type = await page.locator('input').nth(i).getAttribute('type');
    const name = await page.locator('input').nth(i).getAttribute('name');
    const placeholder = await page.locator('input').nth(i).getAttribute('placeholder');
    console.log('Input', i, '- type:', type, 'name:', name, 'placeholder:', placeholder);
  }
  await browser.close();
})().catch(console.error);
