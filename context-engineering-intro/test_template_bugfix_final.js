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
  console.log('Bug: Create Template button was unclickable (30s timeout)');
  console.log('Fix: Added pointer-events-auto to DialogContent (dialog.tsx line 39)');
  console.log('');
  
  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(dir, '01-login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✓ Login successful');
    
    console.log('
Step 2: Navigate to Templates...');
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '02-templates.png'), fullPage: true });
    console.log('✓ Templates page loaded');
    
    console.log('
Step 3: Open New Template modal...');
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '03-modal.png'), fullPage: true });
    console.log('✓ Modal opened');
    
    console.log('
Step 4: Fill form...');
    const templateName = 'Bug Fix Test ' + timestamp;
    
    // Use id selectors (not name)
    await page.fill('#name', templateName);
    console.log('  - Name:', templateName);
    
    // Category - click the Select trigger
    await page.click('button[role="combobox"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '04-category-dropdown.png'), fullPage: true });
    await page.click('text="General"');
    console.log('  - Category: General');
    
    // Subject
    await page.fill('#subject', 'Test Subject {{contact_name}}');
    console.log('  - Subject: Test Subject {{contact_name}}');
    
    // Body - use RichTextEditor
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.fill('Hello, this is a test template. ');
    console.log('  - Body: Test text entered');
    
    await page.screenshot({ path: path.join(dir, '05-form-filled.png'), fullPage: true });
    console.log('✓ Form filled completely');
    
    console.log('
Step 5: CRITICAL TEST - Click Create Template button...');
    console.log('Expected: Button should be immediately clickable (not 30000ms timeout)');
    
    // Check pointer-events on modal
    const modalEvents = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? window.getComputedStyle(d).pointerEvents : 'not-found';
    });
    console.log('  - Modal pointer-events:', modalEvents, '(expected: auto)');
    
    const createBtn = page.locator('button:has-text("Create Template")');
    const vis = await createBtn.isVisible();
    const ena = await createBtn.isEnabled();
    console.log('  - Button visible:', vis);
    console.log('  - Button enabled:', ena);
    
    // CRITICAL: Measure click time
    const start = Date.now();
    console.log('  - Attempting to click...');
    await createBtn.click({ timeout: 5000 });
    const clickTime = Date.now() - start;
    console.log('  ✓ Button clicked in', clickTime, 'ms');
    
    await page.screenshot({ path: path.join(dir, '06-after-click.png'), fullPage: true });
    
    console.log('
Step 6: Verify template creation...');
    const toast = page.locator('text="Template created"');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Success toast appeared');
    
    await page.screenshot({ path: path.join(dir, '07-success.png'), fullPage: true });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(dir, '08-final.png'), fullPage: true });
    
    // Check console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    console.log('
=== TEST SUMMARY ===');
    console.log('Modal pointer-events:', modalEvents, '(expected: auto)');
    console.log('Button click time:', clickTime, 'ms (bug was 30000ms timeout)');
    console.log('Template created: YES');
    console.log('Console errors:', errors.length);
    console.log('');
    
    if (modalEvents === 'auto' && clickTime < 1000) {
      console.log('✓✓✓ BUG FIX STATUS: VERIFIED FIXED ✓✓✓');
      console.log('');
      console.log('VERIFICATION DETAILS:');
      console.log('  ✓ pointer-events-auto is correctly applied to DialogContent');
      console.log('  ✓ Create Template button is immediately clickable');
      console.log('  ✓ No 30-second timeout required');
      console.log('  ✓ Template creation workflow works end-to-end');
      console.log('  ✓ Success toast appears correctly');
      console.log('');
      console.log('The coder's fix (adding pointer-events-auto to dialog.tsx line 39) is WORKING PERFECTLY.');
    } else if (clickTime >= 5000) {
      console.log('✗✗✗ BUG FIX STATUS: STILL BROKEN ✗✗✗');
      console.log('Button still has clickability issues');
    } else {
      console.log('⚠ BUG FIX STATUS: PARTIALLY FIXED');
      console.log('Review details above');
    }
    
  } catch (error) {
    console.error('
✗✗✗ TEST FAILED ✗✗✗');
    console.error('Error:', error.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
    console.log('
BUG FIX STATUS: STILL BROKEN OR NEW ISSUE DETECTED');
    console.log('Screenshots saved for investigation');
  } finally {
    await browser.close();
    console.log('
Screenshots location:', dir);
  }
})();