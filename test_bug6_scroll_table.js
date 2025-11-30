const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => { errors.push('PAGE ERROR: ' + err.message); console.log('PAGE ERROR:', err.message); });
  page.on('requestfailed', req => { 
    const msg = 'NETWORK FAIL: ' + req.url();
    errors.push(msg); 
    console.log(msg);
  });

  try {
    console.log('=== BUG-6: Finding Edit Button ===\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    
    console.log('Scrolling table to the right to see all columns...');
    const table = page.locator('table').first();
    await table.evaluate(el => el.scrollLeft = 1000);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-table-scrolled.png', fullPage: true });
    
    console.log('Looking for all clickable elements in the table row...');
    const row = page.locator('tr:has-text("Test response")').first();
    
    const links = await row.locator('a').count();
    console.log('Links in row:', links);
    
    const buttons = await row.locator('button').count();
    console.log('Buttons in row:', buttons);
    
    if (links > 0) {
      const linkTexts = await row.locator('a').allTextContents();
      console.log('Link texts:', linkTexts);
      
      console.log('\nClicking on autoresponder name link...');
      await row.locator('a, text="Test response 1"').first().click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-reproduce-2-edit-result.png', fullPage: true });
      
      console.log('\nChecking for errors or modals...');
      const modalCount = await page.locator('[role="dialog"]').count();
      const errorCount = await page.locator('text=/error|network/i').count();
      
      console.log('Modals:', modalCount);
      console.log('Error UI:', errorCount);
      console.log('Network errors:', errors.length);
      
      if (errors.length > 0) {
        console.log('\nNETWORK ERRORS:');
        errors.forEach(e => console.log('  ' + e));
        console.log('\n✓ BUG-6 CONFIRMED - Network error on edit');
      } else if (errorCount > 0) {
        console.log('\n✓ BUG-6 CONFIRMED - Error UI shown');
      } else if (modalCount > 0) {
        console.log('\nModal opened - checking if it\'s an error or edit form...');
      } else {
        console.log('\nNavigated successfully - checking URL...');
        console.log('Current URL:', page.url());
      }
    } else {
      console.log('\nNo links found - trying buttons...');
      for (let i = 0; i < buttons; i++) {
        const btn = row.locator('button').nth(i);
        const ariaLabel = await btn.getAttribute('aria-label');
        const title = await btn.getAttribute('title');
        console.log(`Button ${i}: aria-label="${ariaLabel}", title="${title}"`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'screenshots/round2-bugfix/bug-6-error.png' });
  } finally {
    await browser.close();
  }
})();
