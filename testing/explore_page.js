const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const dir = '../screenshots/login-test';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  console.log('Navigating to http://localhost:3004...');
  await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  await page.screenshot({ path: dir + '/exploration-1.png', fullPage: true });
  
  const inputs = await page.locator('input').count();
  console.log('Input count:', inputs);
  
  for (let i = 0; i < inputs; i++) {
    const type = await page.locator('input').nth(i).getAttribute('type');
    const name = await page.locator('input').nth(i).getAttribute('name');
    const id = await page.locator('input').nth(i).getAttribute('id');
    const placeholder = await page.locator('input').nth(i).getAttribute('placeholder');
    console.log('Input', i, '- type:', type, 'name:', name, 'id:', id, 'placeholder:', placeholder);
  }
  
  const buttons = await page.locator('button').count();
  console.log('Button count:', buttons);
  
  for (let i = 0; i < Math.min(buttons, 5); i++) {
    const txt = await page.locator('button').nth(i).textContent();
    const type = await page.locator('button').nth(i).getAttribute('type');
    console.log('Button', i, '- text:', txt.trim(), 'type:', type);
  }
  
  await browser.close();
})().catch(console.error);
