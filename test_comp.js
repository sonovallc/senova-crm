const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const dir = path.join(__dirname, '..', 'screenshots', 'composer-comprehensive-test');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  console.log('Login...');
  await page.goto('http://localhost:3004/login');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@evebeautyma.com');
  await page.type('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 });
  
  console.log('Navigate to composer...');
  await page.goto('http://localhost:3004/dashboard/email/compose');
  await page.waitForSelector('h1');
  await page.screenshot({ path: path.join(dir, '01-load.png'), fullPage: true });
  
  console.log('Type in editor...');
  await page.click('.ProseMirror');
  await page.keyboard.type('Test text');
  await page.screenshot({ path: path.join(dir, '02-text.png'), fullPage: true });
  
  console.log('Test complete!');
  await browser.close();
})();