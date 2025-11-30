const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  const dir = path.join(__dirname, 'screenshots', 'templates-bugfix-verification');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  
  console.log('=== BUG FIX VERIFICATION TEST ===');
  console.log('Testing: Create Template button clickability');
  console.log('Fix: pointer-events-auto added to DialogContent');
  console.log('');
  
  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(dir, '01-login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('PASS - Login');
    
    console.log('Step 2: Navigate to Templates...');
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '02-templates.png'), fullPage: true });
    console.log('PASS - Templates page');
    
    console.log('Step 3: Open modal...');
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '03-modal.png'), fullPage: true });
    console.log('PASS - Modal opened');
    
    console.log('Step 4: Fill form...');
    const templateName = 'Bug Fix Test ' + timestamp;
    await page.fill('input[name="name"]', templateName);
    await page.click('button:has-text("Select category")');
    await page.waitForTimeout(500);
    await page.click('text="General"');
    await page.fill('input[name="subject"]', 'Test {{contact_name}}');
    await page.fill('textarea[name="body"]', 'Test body ');
    await page.click('button:has-text("Variables")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '04-vars.png'), fullPage: true });
    await page.click('text="contact_name"');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '05-filled.png'), fullPage: true });
    console.log('PASS - Form filled');
    
    console.log('Step 5: CRITICAL - Click Create Template...');
    const modalEvents = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? window.getComputedStyle(d).pointerEvents : 'none';
    });
    console.log('Modal pointer-events:', modalEvents);
    
    const createBtn = page.locator('button:has-text("Create Template")');
    const vis = await createBtn.isVisible();
    const ena = await createBtn.isEnabled();
    console.log('Button visible:', vis, 'enabled:', ena);
    
    const start = Date.now();
    await createBtn.click({ timeout: 5000 });
    const time = Date.now() - start;
    console.log('Click time:', time, 'ms');
    
    await page.screenshot({ path: path.join(dir, '06-clicked.png'), fullPage: true });
    
    console.log('Step 6: Verify success...');
    const toast = page.locator('text="Template created successfully"');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    console.log('PASS - Toast appeared');
    await page.screenshot({ path: path.join(dir, '07-toast.png'), fullPage: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '08-final.png'), fullPage: true });
    
    console.log('');
    console.log('=== RESULT ===');
    console.log('Modal pointer-events:', modalEvents, '(expected: auto)');
    console.log('Click time:', time, 'ms (bug was 30000ms timeout)');
    
    if (modalEvents === 'auto' && time < 1000) {
      console.log('');
      console.log('BUG FIX STATUS: VERIFIED FIXED');
      console.log('- pointer-events-auto works correctly');
      console.log('- Button is immediately clickable');
      console.log('- Template creation successful');
    } else {
      console.log('');
      console.log('BUG FIX STATUS: NEEDS REVIEW');
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
    console.log('BUG FIX STATUS: STILL BROKEN');
  } finally {
    await browser.close();
  }
})();