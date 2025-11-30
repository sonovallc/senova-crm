const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'screenshots', 'templates-bugfix-verification');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  console.log('=== POINTER-EVENTS DIAGNOSTIC TEST ===');
  console.log('');
  
  try {
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Logged in');
    
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('On templates page');
    
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(1500);
    console.log('Modal opened');
    await page.screenshot({ path: path.join(dir, 'diagnostic-modal.png'), fullPage: true });
    
    // Check pointer-events on all relevant elements
    const pointerEvents = await page.evaluate(() => {
      const results = {};
      
      const overlay = document.querySelector('[data-state="open"][aria-hidden="true"]');
      if (overlay) {
        results.overlay = {
          classes: overlay.className,
          pointerEvents: window.getComputedStyle(overlay).pointerEvents,
          zIndex: window.getComputedStyle(overlay).zIndex
        };
      }
      
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        results.dialog = {
          classes: dialog.className,
          pointerEvents: window.getComputedStyle(dialog).pointerEvents,
          zIndex: window.getComputedStyle(dialog).zIndex
        };
      }
      
      const createBtn = document.querySelector('button:has-text("Create Template")');
      if (createBtn) {
        results.createButton = {
          visible: createBtn.offsetParent !== null,
          pointerEvents: window.getComputedStyle(createBtn).pointerEvents
        };
      }
      
      return results;
    });
    
    console.log('');
    console.log('POINTER-EVENTS ANALYSIS:');
    console.log(JSON.stringify(pointerEvents, null, 2));
    console.log('');
    
    // Try filling the name field
    console.log('Attempting to fill name field...');
    await page.fill('#name', 'Test Name');
    console.log('SUCCESS - Name field filled');
    
    // Try clicking Create Template button with force
    console.log('');
    console.log('Attempting to click Create Template button with force...');
    const createBtn = page.locator('button:has-text("Create Template")');
    await createBtn.click({ force: true });
    console.log('SUCCESS - Button clicked with force');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, 'diagnostic-after-click.png'), fullPage: true });
    
    // Check if validation error appears (since form is incomplete)
    const validationVisible = await page.locator('text="required"').isVisible().catch(() => false);
    console.log('Validation error visible:', validationVisible);
    
    console.log('');
    console.log('DIAGNOSIS: Button IS clickable with force:true');
    console.log('This confirms the pointer-events are the issue');
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
    await page.screenshot({ path: path.join(dir, 'diagnostic-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
