const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'screenshots', 'templates-bugfix-verification');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  
  console.log('=== BUG FIX VERIFICATION TEST ===');
  console.log('Bug: Create Template button unclickable (30s timeout)');
  console.log('Fix: Added pointer-events-auto to DialogContent');
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
    
    console.log('');
    console.log('Step 2: Navigate to Templates...');
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '02-templates.png'), fullPage: true });
    console.log('PASS - Templates page');
    
    console.log('');
    console.log('Step 3: Open modal...');
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(dir, '03-modal.png'), fullPage: true });
    console.log('PASS - Modal opened');
    
    console.log('');
    console.log('Step 4: Fill form...');
    const templateName = 'Bug Fix Test ' + timestamp;
    
    await page.fill('#name', templateName);
    console.log('  - Name: ' + templateName);
    
    await page.click('button[role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('text="General"');
    console.log('  - Category: General');
    
    await page.fill('#subject', 'Test Subject {{contact_name}}');
    console.log('  - Subject with variable');
    
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.fill('Hello, test template body.');
    console.log('  - Body entered');
    
    await page.screenshot({ path: path.join(dir, '04-filled.png'), fullPage: true });
    console.log('PASS - Form filled');
    
    console.log('');
    console.log('Step 5: CRITICAL - Click Create Template button...');
    
    const modalEvents = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? window.getComputedStyle(d).pointerEvents : 'not-found';
    });
    console.log('  - Modal pointer-events: ' + modalEvents);
    
    const createBtn = page.locator('button:has-text("Create Template")');
    const vis = await createBtn.isVisible();
    const ena = await createBtn.isEnabled();
    console.log('  - Button visible: ' + vis);
    console.log('  - Button enabled: ' + ena);
    
    const start = Date.now();
    console.log('  - Clicking button...');
    await createBtn.click({ timeout: 5000 });
    const clickTime = Date.now() - start;
    console.log('  - Click completed in ' + clickTime + ' ms');
    
    await page.screenshot({ path: path.join(dir, '05-clicked.png'), fullPage: true });
    
    console.log('');
    console.log('Step 6: Verify success...');
    const toast = page.locator('text="Template created"');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    console.log('PASS - Toast appeared');
    
    await page.screenshot({ path: path.join(dir, '06-toast.png'), fullPage: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '07-final.png'), fullPage: true });
    
    console.log('');
    console.log('=== RESULT ===');
    console.log('Modal pointer-events: ' + modalEvents + ' (expected: auto)');
    console.log('Click time: ' + clickTime + ' ms (bug was 30000ms)');
    console.log('');
    
    if (modalEvents === 'auto' && clickTime < 1000) {
      console.log('BUG FIX STATUS: VERIFIED FIXED');
      console.log('');
      console.log('SUCCESS VERIFICATION:');
      console.log('  - pointer-events-auto applied correctly');
      console.log('  - Button immediately clickable');
      console.log('  - No 30-second timeout');
      console.log('  - Template creation works end-to-end');
      console.log('  - Success toast appears');
    } else {
      console.log('BUG FIX STATUS: NEEDS REVIEW');
    }
    
  } catch (error) {
    console.error('');
    console.error('TEST FAILED: ' + error.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
    console.log('');
    console.log('BUG FIX STATUS: STILL BROKEN');
  } finally {
    await browser.close();
    console.log('');
    console.log('Screenshots: ' + dir);
  }
})();
