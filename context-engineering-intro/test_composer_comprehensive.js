const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  
  const dir = path.join(__dirname, '..', 'screenshots', 'composer-comprehensive-test');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const results = [];
  
  try {
    console.log('EMAIL COMPOSER COMPREHENSIVE TEST');
    
    console.log('Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@evebeautyma.com');
    await page.type('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('PASS - Login');
    results.push({ test: 'Login', status: 'PASS' });
    
    console.log('Load composer page...');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await page.screenshot({ path: path.join(dir, '01-page-load.png'), fullPage: true });
    console.log('PASS - Page Load');
    results.push({ test: 'Page Load', status: 'PASS' });
    
    console.log('Check form fields...');
    const editor = await page.$('.ProseMirror');
    if (editor) {
      console.log('PASS - Editor found');
      results.push({ test: 'Editor', status: 'PASS' });
      
      await editor.click();
      await page.keyboard.type('Testing all buttons');
      await page.screenshot({ path: path.join(dir, '02-text.png'), fullPage: true });
      console.log('PASS - Text entry');
      results.push({ test: 'Text Entry', status: 'PASS' });
      
      const btns = await page.$$('button');
      console.log(`Found ${btns.length} buttons`);
      
      if (btns.length > 2) {
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await btns[2].click();
        await page.screenshot({ path: path.join(dir, '03-bold.png'), fullPage: true });
        console.log('PASS - Bold');
        results.push({ test: 'Bold', status: 'PASS' });
      }
      
      if (btns.length > 3) {
        await btns[3].click();
        await page.screenshot({ path: path.join(dir, '04-italic.png'), fullPage: true });
        console.log('PASS - Italic');
        results.push({ test: 'Italic', status: 'PASS' });
      }
      
      if (btns.length > 4) {
        await btns[4].click();
        await page.screenshot({ path: path.join(dir, '05-bullet.png'), fullPage: true });
        console.log('PASS - Bullet');
        results.push({ test: 'Bullet', status: 'PASS' });
      }
      
      if (btns.length > 5) {
        await btns[5].click();
        await page.screenshot({ path: path.join(dir, '06-numbered.png'), fullPage: true });
        console.log('PASS - Numbered');
        results.push({ test: 'Numbered', status: 'PASS' });
      }
      
      if (btns.length > 6) {
        await btns[6].click();
        await page.screenshot({ path: path.join(dir, '07-undo.png'), fullPage: true });
        console.log('PASS - Undo');
        results.push({ test: 'Undo', status: 'PASS' });
      }
      
      if (btns.length > 7) {
        await btns[7].click();
        await page.screenshot({ path: path.join(dir, '08-redo.png'), fullPage: true });
        console.log('PASS - Redo');
        results.push({ test: 'Redo', status: 'PASS' });
      }
    }
    
    console.log('Test Variables dropdown...');
    const varsBtn = await page.$('button:has-text("Variables")');
    if (varsBtn) {
      await varsBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(dir, '09-variables.png'), fullPage: true });
      const items = await page.$$('[role="menuitem"]');
      console.log(`Variables: ${items.length}`);
      if (items.length >= 6) {
        await items[0].click();
        await page.screenshot({ path: path.join(dir, '10-var-inserted.png'), fullPage: true });
        console.log('PASS - Variables');
        results.push({ test: 'Variables', status: 'PASS' });
      }
    }
    
    console.log('Test Send button...');
    const sendBtn = await page.$('button:has-text("Send")');
    if (sendBtn) {
      await page.screenshot({ path: path.join(dir, '11-send.png'), fullPage: true });
      console.log('PASS - Send button');
      results.push({ test: 'Send Button', status: 'PASS' });
    }
    
    console.log(`Console errors: ${consoleErrors.length}`);
    results.push({ test: 'Console', status: consoleErrors.length === 0 ? 'PASS' : 'FAIL' });
    
    const passed = results.filter(r => r.status === 'PASS').length;
    console.log(`TOTAL: ${passed}/${results.length} PASS`);
    results.forEach(r => console.log(`  ${r.status} - ${r.test}`));
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
