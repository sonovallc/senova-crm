const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => { errors.push('PAGE ERROR: ' + err.message); });
  page.on('requestfailed', req => { errors.push('NETWORK FAIL: ' + req.url()); });

  try {
    console.log('=== Finding Edit button on Autoresponders ===\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    
    console.log('Looking for action buttons...');
    
    const row = page.locator('tr:has-text("Test response")').first();
    await row.hover();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-row-hover.png', fullPage: true });
    
    console.log('Checking for buttons in or near the row...');
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons on page:', allButtons);
    
    const buttonsInRow = await row.locator('button').count();
    console.log('Buttons in autoresponder row:', buttonsInRow);
    
    if (buttonsInRow > 0) {
      const rowButtons = await row.locator('button').allTextContents();
      console.log('Row buttons:', rowButtons);
      
      const editBtn = row.locator('button').first();
      const btnText = await editBtn.textContent();
      console.log('First button text:', btnText);
      
      console.log('\nClicking first button in row...');
      await editBtn.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-after-click.png', fullPage: true });
      
      console.log('\nChecking for errors...');
      const modalCount = await page.locator('[role="dialog"]').count();
      console.log('Modals:', modalCount);
      console.log('Network errors:', errors.length);
      
      if (errors.length > 0) {
        console.log('\nERRORS:');
        errors.forEach(e => console.log('  ' + e));
      }
    } else {
      console.log('\nNo buttons found in row - looking for menu dots or icons...');
      const icons = await row.locator('svg, [class*="icon"]').count();
      console.log('Icons in row:', icons);
      
      if (icons > 0) {
        console.log('Clicking first icon...');
        await row.locator('svg, [class*="icon"]').first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-menu-opened.png', fullPage: true });
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-error.png' });
  } finally {
    await browser.close();
  }
})();
