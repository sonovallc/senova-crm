const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('pageerror', err => { errors.push('PAGE: ' + err.message); });
  page.on('requestfailed', req => { errors.push('NET: ' + req.url()); });

  try {
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    errors.length = 0;
    
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-1-autoresponders-list.png', fullPage: true });
    console.log('Screenshot 1 saved');
    
    const row = page.locator('tr:has-text("Test response")').first();
    const buttons = await row.locator('button').count();
    console.log('Buttons in row:', buttons);
    
    for (let i = 0; i < buttons; i++) {
      console.log('Clicking button', i + 1);
      errors.length = 0;
      
      await row.locator('button').nth(i).click();
      await page.waitForTimeout(2000);
      
      if (errors.length > 0) {
        console.log('ERRORS on button', i + 1, ':', errors);
        await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
        console.log('BUG-6 CONFIRMED');
        break;
      }
      
      const modal = await page.locator('[role="dialog"]').count();
      if (modal > 0) {
        console.log('Modal opened by button', i + 1);
        await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
        break;
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();