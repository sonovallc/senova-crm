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
    
    // Get detailed CSS info
    const cssDebug = await page.evaluate(() => {
      const overlay = document.querySelector('[data-state="open"][aria-hidden="true"]');
      if (!overlay) return { error: 'overlay not found' };
      
      const computed = window.getComputedStyle(overlay);
      const allStyles = {};
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        if (prop.includes('pointer')) {
          allStyles[prop] = computed.getPropertyValue(prop);
        }
      }
      
      return {
        className: overlay.className,
        computedPointerEvents: computed.pointerEvents,
        allPointerProps: allStyles,
        tagName: overlay.tagName,
        dataState: overlay.getAttribute('data-state')
      };
    });
    
    console.log('CSS DEBUG INFO:');
    console.log(JSON.stringify(cssDebug, null, 2));
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
  } finally {
    await browser.close();
  }
})();
