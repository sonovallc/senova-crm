const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'screenshots', 'templates-bugfix-verification');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  console.log('=== SIMPLE CLICK TEST ===');
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
    
    // Check computed styles
    const styles = await page.evaluate(() => {
      const overlay = document.querySelector('.fixed.inset-0.z-50.bg-black\/80');
      const dialog = document.querySelector('[role="dialog"]');
      
      return {
        overlay: overlay ? {
          pointerEvents: window.getComputedStyle(overlay).pointerEvents,
          zIndex: window.getComputedStyle(overlay).zIndex
        } : 'not found',
        dialog: dialog ? {
          pointerEvents: window.getComputedStyle(dialog).pointerEvents,
          zIndex: window.getComputedStyle(dialog).zIndex
        } : 'not found'
      };
    });
    
    console.log('Overlay pointer-events:', styles.overlay.pointerEvents, 'z-index:', styles.overlay.zIndex);
    console.log('Dialog pointer-events:', styles.dialog.pointerEvents, 'z-index:', styles.dialog.zIndex);
    console.log('');
    
    // Try clicking Create Template with force
    console.log('Clicking Create Template button with force:true...');
    const createBtn = page.locator('button:has-text("Create Template")');
    const start = Date.now();
    await createBtn.click({ force: true, timeout: 3000 });
    const time = Date.now() - start;
    console.log('SUCCESS - Clicked in ' + time + ' ms with force:true');
    
    await page.screenshot({ path: path.join(dir, 'force-click-result.png'), fullPage: true });
    
    console.log('');
    console.log('RESULT:');
    if (styles.dialog.pointerEvents === 'auto') {
      console.log('✓ Dialog HAS pointer-events-auto');
    } else {
      console.log('✗ Dialog MISSING pointer-events-auto');
    }
    
    if (styles.overlay.pointerEvents === 'none') {
      console.log('✓ Overlay HAS pointer-events-none');
    } else {
      console.log('✗ Overlay WRONG pointer-events');
    }
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
    await page.screenshot({ path: path.join(dir, 'error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
