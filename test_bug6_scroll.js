const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
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
    
    console.log('Step 2: Go to Settings > Email Configuration');
    await page.goto('http://localhost:3004/dashboard/settings');
    await page.waitForTimeout(2000);
    await page.click('text=Email Configuration');
    await page.waitForTimeout(2000);
    
    console.log('Step 3: Scroll down to find Autoresponders');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-scroll-1.png', fullPage: true });
    
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-scroll-2.png', fullPage: true });
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-scroll-bottom.png', fullPage: true });
    
    console.log('Step 4: Look for Autoresponder heading');
    const autoHeading = await page.locator('h2:has-text("Autoresponder"), h3:has-text("Autoresponder")').count();
    console.log('Autoresponder headings found:', autoHeading);
    
    console.log('Step 5: Look for Edit buttons');
    const editCount = await page.locator('button:has-text("Edit")').count();
    console.log('Edit buttons found:', editCount);
    
    if (editCount > 0) {
      console.log('Step 6: Click first Edit button');
      await page.locator('button:has-text("Edit")').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-1-autoresponders-list.png', fullPage: true });
      
      await page.locator('button:has-text("Edit")').first().click();
      await page.waitForTimeout(3000);
      
      console.log('Step 7: Screenshot after clicking Edit');
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
      
      const errorCount = await page.locator('text=/error|network/i').count();
      const modalCount = await page.locator('[role="dialog"]').count();
      
      console.log('\n=== RESULTS ===');
      console.log('Network errors:', errors.length);
      console.log('Error UI elements:', errorCount);
      console.log('Modal dialogs:', modalCount);
      
      if (errors.length > 0) {
        console.log('\nNetwork errors:');
        errors.forEach(e => console.log('  -', e));
        console.log('\nBUG-6 CONFIRMED - Network error detected');
      } else if (errorCount > 0 || modalCount > 0) {
        console.log('\nBUG-6 CONFIRMED - Error UI displayed');
      } else {
        console.log('\nNO ERROR - Bug may be fixed or edit opened successfully');
      }
    } else {
      console.log('\nNo Edit buttons found');
      console.log('Autoresponders may not exist in database');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-error.png' });
  } finally {
    await browser.close();
  }
})();
