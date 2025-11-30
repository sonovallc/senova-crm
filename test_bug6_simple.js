const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => { console.log('PAGE ERROR:', err.message); errors.push(err.message); });
  page.on('requestfailed', req => { console.log('NETWORK FAIL:', req.url()); errors.push(req.url()); });

  try {
    console.log('=== BUG-6: Autoresponder Edit Network Error ===\n');
    
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Step 2: Go to Settings');
    await page.goto('http://localhost:3004/settings');
    await page.waitForTimeout(2000);
    
    console.log('Step 3: Click Autoresponders');
    await page.click('text=Autoresponders');
    await page.waitForTimeout(2000);
    
    console.log('Step 4: Screenshot autoresponders list');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-1-autoresponders-list.png', fullPage: true });
    console.log('Saved: bug-6-reproduce-1-autoresponders-list.png');
    
    const editCount = await page.locator('button:has-text("Edit")').count();
    console.log('Edit buttons found:', editCount);
    
    if (editCount > 0) {
      console.log('Step 5: Click Edit button');
      await page.locator('button:has-text("Edit")').first().click();
      await page.waitForTimeout(3000);
      
      console.log('Step 6: Screenshot result');
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
      console.log('Saved: bug-6-reproduce-2-edit-result.png');
      
      const errorCount = await page.locator('text=/error|network/i').count();
      console.log('Error messages visible:', errorCount);
      
      const modalCount = await page.locator('[role="dialog"]').count();
      console.log('Modals visible:', modalCount);
      
      console.log('\n=== RESULTS ===');
      console.log('Network errors:', errors.length);
      console.log('Error UI elements:', errorCount);
      console.log('Modal dialogs:', modalCount);
      
      if (errors.length > 0 || errorCount > 0 || modalCount > 0) {
        console.log('\nBUG-6 CONFIRMED - Network error on edit');
        if (errors.length > 0) console.log('Errors:', errors);
      } else {
        console.log('\nNO ERROR DETECTED - Bug may be fixed');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-error.png' });
  } finally {
    await browser.close();
  }
})();
