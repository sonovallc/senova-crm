const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(1500);
    
    // Get the actual class names
    const info = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const overlay = document.querySelector('[data-state="open"][aria-hidden="true"]');
      
      return {
        dialogClass: dialog ? dialog.className : null,
        overlayClass: overlay ? overlay.className : null
      };
    });
    
    console.log('DIALOG CLASSES:');
    console.log(info.dialogClass);
    console.log('');
    console.log('OVERLAY CLASSES:');
    console.log(info.overlayClass);
    console.log('');
    
    // Check if pointer-events-auto is in dialog class
    if (info.dialogClass && info.dialogClass.includes('pointer-events-auto')) {
      console.log('✓ Dialog HAS pointer-events-auto in className');
    } else {
      console.log('✗ Dialog MISSING pointer-events-auto in className');
    }
    
    // Check if pointer-events-none is in overlay class
    if (info.overlayClass && info.overlayClass.includes('pointer-events-none')) {
      console.log('✓ Overlay HAS pointer-events-none in className');
    } else {
      console.log('✗ Overlay MISSING pointer-events-none in className');
    }
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
  } finally {
    await browser.close();
  }
})();
