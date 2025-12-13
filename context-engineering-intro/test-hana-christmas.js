const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to Hana Beauty Christmas page...');
  await page.goto('http://localhost:3004/hana-beauty-december-2025', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(2000);
  
  // Full page screenshot
  await page.screenshot({ 
    path: 'screenshots/hana-beauty-christmas-colors-verified/01-full-page-christmas-theme.png',
    fullPage: true 
  });
  
  // Check colors
  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log('Background color:', bgColor);
  
  // Scroll to gift boxes area
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  
  await page.screenshot({ 
    path: 'screenshots/hana-beauty-christmas-colors-verified/06-all-three-boxes-together.png'
  });
  
  // Mobile view
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'screenshots/hana-beauty-christmas-colors-verified/05-mobile-view-christmas.png',
    fullPage: true 
  });
  
  console.log('Screenshots saved!');
  await browser.close();
})();
