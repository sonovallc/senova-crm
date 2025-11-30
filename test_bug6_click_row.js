const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => { console.log('PAGE ERROR:', err.message); errors.push('PAGE ERROR: ' + err.message); });
  page.on('requestfailed', req => { 
    const msg = 'REQUEST FAILED: ' + req.url() + ' - ' + req.failure().errorText;
    console.log(msg); 
    errors.push(msg); 
  });

  try {
    console.log('=== BUG-6: Autoresponder Edit Network Error ===\n');
    
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Step 2: Navigate to Autoresponders');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    
    console.log('Step 3: Take screenshot of autoresponders list');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-1-autoresponders-list.png', fullPage: true });
    console.log('Screenshot saved: bug-6-reproduce-1-autoresponders-list.png');
    
    console.log('\nStep 4: Look for Edit buttons or clickable rows');
    const editButtons = await page.locator('button:has-text("Edit"), [aria-label*="Edit"], [title*="Edit"]').count();
    console.log('Edit buttons found:', editButtons);
    
    const rowCount = await page.locator('tr:has-text("Test response")').count();
    console.log('Autoresponder rows found:', rowCount);
    
    if (editButtons > 0) {
      console.log('\nStep 5: Click Edit button');
      await page.locator('button:has-text("Edit")').first().click();
      await page.waitForTimeout(3000);
    } else if (rowCount > 0) {
      console.log('\nStep 5: Try clicking on autoresponder row');
      await page.locator('tr:has-text("Test response")').first().click();
      await page.waitForTimeout(3000);
    } else {
      console.log('\nNo autoresponders or edit buttons found');
    }
    
    console.log('\nStep 6: Take screenshot after interaction');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
    console.log('Screenshot saved: bug-6-reproduce-2-edit-result.png');
    
    const errorUICount = await page.locator('text=/error|network|fail/i').count();
    const modalCount = await page.locator('[role="dialog"], .modal').count();
    
    console.log('\n=== RESULTS ===');
    console.log('Network/Page errors captured:', errors.length);
    console.log('Error UI elements:', errorUICount);
    console.log('Modal dialogs:', modalCount);
    
    if (errors.length > 0) {
      console.log('\nERRORS DETECTED:');
      errors.forEach(e => console.log('  ' + e));
      console.log('\nBUG-6 CONFIRMED - Network error on autoresponder edit');
    } else if (errorUICount > 0 || modalCount > 0) {
      console.log('\nError UI visible - checking details...');
      const errorTexts = await page.locator('text=/error|network/i').allTextContents();
      errorTexts.forEach(t => console.log('  Error text:', t));
      console.log('\nBUG-6 LIKELY CONFIRMED');
    } else {
      console.log('\nNo errors detected - edit may have opened successfully');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-error.png' });
  } finally {
    await browser.close();
  }
})();
