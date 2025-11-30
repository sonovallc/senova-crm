const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'screenshots', 'templates-bugfix-verification');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  console.log('=== BUGFIX TEST WITH HARD RELOAD ===');
  console.log('');
  
  try {
    // Clear cache
    await context.clearCookies();
    
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    
    // Force hard reload
    await page.reload({ waitUntil: 'networkidle' });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Logged in');
    
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle' });
    // Force hard reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('Templates page loaded (hard reload)');
    
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(1500);
    console.log('Modal opened');
    
    // Check styles again
    const check = await page.evaluate(() => {
      const overlay = document.querySelector('[data-state="open"][aria-hidden="true"]');
      return {
        overlayClass: overlay ? overlay.className : null,
        overlayComputedPE: overlay ? window.getComputedStyle(overlay).pointerEvents : null
      };
    });
    
    console.log('');
    console.log('After hard reload:');
    console.log('  Overlay className includes pointer-events-none:', check.overlayClass.includes('pointer-events-none'));
    console.log('  Overlay computed pointer-events:', check.overlayComputedPE);
    
    if (check.overlayComputedPE === 'none') {
      console.log('');
      console.log('✓✓✓ SUCCESS - Hard reload fixed it!');
      console.log('The CSS is correct, browser was just caching old version.');
    } else {
      console.log('');
      console.log('✗✗✗ STILL BROKEN - pointer-events-none not working');
      console.log('This is a deeper CSS issue');
    }
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
  } finally {
    await browser.close();
  }
})();
