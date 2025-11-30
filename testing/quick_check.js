const { chromium } = require('playwright');

async function quickCheck() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(3000);
    
    console.log('Page title:', await page.title());
    console.log('\nLooking for navigation links...');
    
    const links = await page.locator('a').all();
    for (const link of links) {
      const text = await link.textContent();
      if (text) console.log('-', text.trim());
    }
    
    await page.screenshot({ path: 'quick-check.png', fullPage: true });
    console.log('\nScreenshot saved: quick-check.png');
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

quickCheck();
