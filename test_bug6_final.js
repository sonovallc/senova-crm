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
    await page.goto('http://localhost:3004/dashboard/settings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-step1-settings-page.png', fullPage: true });
    
    console.log('Step 3: Click Email Configuration tab');
    await page.click('text=Email Configuration');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-step2-email-config.png', fullPage: true });
    
    console.log('Step 4: Look for Autoresponders section');
    const autoresponderText = await page.locator('text=Autoresponder').isVisible();
    console.log('Autoresponder section visible:', autoresponderText);
    
    console.log('Step 5: Screenshot autoresponders area');
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-1-autoresponders-list.png', fullPage: true });
    
    const editCount = await page.locator('button:has-text("Edit")').count();
    console.log('Edit buttons found:', editCount);
    
    if (editCount > 0) {
      console.log('Step 6: Click first Edit button');
      await page.locator('button:has-text("Edit")').first().click();
      await page.waitForTimeout(3000);
      
      console.log('Step 7: Screenshot result after clicking Edit');
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
      
      const errorCount = await page.locator('text=/error|network/i').count();
      console.log('Error messages visible:', errorCount);
      
      const modalCount = await page.locator('[role="dialog"]').count();
      console.log('Modals visible:', modalCount);
      
      console.log('\n=== RESULTS ===');
      console.log('Network errors captured:', errors.length);
      console.log('Error UI elements:', errorCount);
      console.log('Modal dialogs:', modalCount);
      
      if (errors.length > 0) {
        console.log('\nNetwork errors detected:');
        errors.forEach(e => console.log('  -', e));
      }
      
      if (errors.length > 0 || errorCount > 0 || modalCount > 0) {
        console.log('\nBUG-6 CONFIRMED - Network error on autoresponder edit');
      } else {
        console.log('\nNO ERROR DETECTED - Bug may be fixed');
      }
    } else {
      console.log('\nNo Edit buttons found - cannot reproduce bug');
      console.log('Please check if autoresponders exist in the system');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-error.png' });
  } finally {
    await browser.close();
  }
})();
