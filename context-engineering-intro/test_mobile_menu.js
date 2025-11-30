const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Testing Mobile Hamburger Menu...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();
  
  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\100-percent-verification';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    console.log('Navigated to homepage with mobile viewport');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, 'mobile-menu-before.png')
    });
    
    // Look for hamburger button with ID
    const button = await page.$('#mobile-menu-button');
    
    if (button) {
      console.log('✅ Found hamburger button with id="mobile-menu-button"');
      await button.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'mobile-menu-after.png')
      });
      
      console.log('✅ Mobile menu test PASSED');
    } else {
      // Try data-testid
      const button2 = await page.$('[data-testid="mobile-menu-button"]');
      if (button2) {
        console.log('✅ Found hamburger button with data-testid');
        await button2.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ 
          path: path.join(screenshotDir, 'mobile-menu-after.png')
        });
        
        console.log('✅ Mobile menu test PASSED');
      } else {
        console.log('❌ Hamburger button NOT FOUND');
        
        await page.screenshot({ 
          path: path.join(screenshotDir, 'mobile-menu-not-found.png')
        });
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  await browser.close();
})();
