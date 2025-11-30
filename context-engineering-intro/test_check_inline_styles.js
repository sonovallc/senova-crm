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
    
    // Check for inline styles
    const inlineCheck = await page.evaluate(() => {
      const overlay = document.querySelector('[data-state="open"][aria-hidden="true"]');
      if (!overlay) return { error: 'not found' };
      
      return {
        inlineStyle: overlay.getAttribute('style'),
        allAttributes: Array.from(overlay.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        }))
      };
    });
    
    console.log('INLINE STYLE CHECK:');
    console.log('Inline style attribute:', inlineCheck.inlineStyle);
    console.log('');
    console.log('All attributes:');
    inlineCheck.allAttributes.forEach(attr => {
      console.log(`  ${attr.name}: ${attr.value}`);
    });
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
  } finally {
    await browser.close();
  }
})();
