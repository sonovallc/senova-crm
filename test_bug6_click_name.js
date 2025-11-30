const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => { 
    const msg = 'PAGE ERROR: ' + err.message;
    errors.push(msg); 
    console.log(msg);
  });
  page.on('requestfailed', req => { 
    const msg = 'NETWORK FAIL: ' + req.url();
    errors.push(msg); 
    console.log(msg);
  });

  try {
    console.log('=== BUG-6: Click Autoresponder Name ===\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-1-autoresponders-list.png', fullPage: true });
    console.log('Screenshot: bug-6-reproduce-1-autoresponders-list.png');
    
    console.log('\nClicking on "Test response 1" text...');
    await page.click('text=Test response 1');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
    console.log('Screenshot: bug-6-reproduce-2-edit-result.png');
    
    const currentUrl = page.url();
    console.log('\nCurrent URL:', currentUrl);
    
    const modalCount = await page.locator('[role="dialog"]').count();
    const errorUICount = await page.locator('text=/error|network|fail/i').count();
    
    console.log('Modals visible:', modalCount);
    console.log('Error UI elements:', errorUICount);
    console.log('Network/page errors captured:', errors.length);
    
    if (errors.length > 0) {
      console.log('\n=== NETWORK/PAGE ERRORS DETECTED ===');
      errors.forEach(e => console.log('  ' + e));
      console.log('\n✓✓✓ BUG-6 CONFIRMED: Network error when opening autoresponder edit');
    } else if (errorUICount > 0) {
      console.log('\n=== ERROR UI SHOWN ===');
      const errorTexts = await page.locator('text=/error|network/i').allTextContents();
      errorTexts.forEach(t => console.log('  ' + t));
      console.log('\n✓✓✓ BUG-6 CONFIRMED: Error displayed in UI');
    } else if (modalCount > 0) {
      console.log('\nModal opened - checking content...');
      const modalText = await page.locator('[role="dialog"]').first().textContent();
      console.log('Modal content preview:', modalText.substring(0, 200));
      console.log('\nEdit form may have opened successfully - BUG-6 NOT CONFIRMED');
    } else {
      console.log('\nURL changed or page updated - checking if navigation occurred...');
      if (currentUrl.includes('edit') || currentUrl !== 'http://localhost:3004/dashboard/email/autoresponders') {
        console.log('Navigated to edit page - BUG-6 NOT CONFIRMED');
      } else {
        console.log('No change detected - unable to reproduce bug');
      }
    }
    
  } catch (error) {
    console.error('Test execution error:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-error.png' });
  } finally {
    await browser.close();
  }
})();
