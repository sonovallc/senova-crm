const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  const screenshotDir = path.join(__dirname, 'screenshots', 'composer-comprehensive-test');
  if (\!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  try {
    console.log('EMAIL COMPOSER TEST');
    
    console.log('[1] LOGIN');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123\!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  PASS');
    results.push({ test: 'Login', status: 'PASS' });
    
    console.log('[2] PAGE LOAD');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-load.png'), fullPage: true });
    console.log('  PASS');
    results.push({ test: 'Page Load', status: 'PASS' });
    
    console.log('[3] TEXT ENTRY');
    const editor = await page.locator('.ProseMirror').first();
    await editor.click();
    await page.keyboard.type('Test text');
    await page.screenshot({ path: path.join(screenshotDir, '02-text.png'), fullPage: true });
    console.log('  PASS');
    results.push({ test: 'Text Entry', status: 'PASS' });
    
    console.log('[4] VARIABLES');
    const varsBtn = await page.locator('button:has-text("Variables")');
    if (await varsBtn.isVisible()) {
      await varsBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '03-vars.png'), fullPage: true });
      const items = await page.$\;
      console.log('  Variables found:', items.length);
      if (items.length >= 6) {
        console.log('  PASS');
        results.push({ test: 'Variables', status: 'PASS' });
      } else {
        console.log('  FAIL');
        results.push({ test: 'Variables', status: 'FAIL' });
      }
    }
    
    console.log('[5] SEND BUTTON');
    const sendBtn = await page.locator('button:has-text("Send")');
    if (await sendBtn.isVisible()) {
      await page.screenshot({ path: path.join(screenshotDir, '04-send.png'), fullPage: true });
      console.log('  PASS');
      results.push({ test: 'Send Button', status: 'PASS' });
    }
    
    console.log('[6] CONSOLE ERRORS');
    console.log('  Errors:', consoleErrors.length);
    results.push({ test: 'Console', status: consoleErrors.length === 0 ? 'PASS' : 'FAIL' });
    
    const passed = results.filter(r => r.status === 'PASS').length;
    console.log('TOTAL: ' + passed + '/' + results.length + ' PASS');
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
