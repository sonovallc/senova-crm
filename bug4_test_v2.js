const { chromium } = require('playwright');
const path = require('path');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500 
    });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    
    const dir = path.join(__dirname, 'screenshots', 'final-verification');
    
    console.log('TEST: BUG-4 Campaign Delete');
    console.log('='.repeat(60));
    
    console.log('Step 1: Navigate to login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    console.log('Step 2: Wait for email input...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('Step 3: Fill credentials...');
    await page.type('input[type="email"]', 'admin@evebeautyma.com', { delay: 100 });
    await page.type('input[type="password"]', 'TestPass123!', { delay: 100 });
    
    console.log('Step 4: Click login...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('Step 5: Navigate to campaigns...');
    await page.goto('http://localhost:3004/campaigns', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('Step 6: Screenshot campaigns page...');
    await page.screenshot({ path: path.join(dir, 'bug4-01-campaigns-page.png'), fullPage: true });
    console.log('  ✓ Saved: bug4-01-campaigns-page.png');
    
    console.log('Step 7: Look for delete buttons...');
    const deleteButtons = await page.$$('button:has-text("Delete")');
    console.log(`  Found ${deleteButtons.length} delete button(s)`);
    
    if (deleteButtons.length > 0) {
      console.log('Step 8: Click first delete button...');
      await deleteButtons[0].click();
      await page.waitForTimeout(3000);
      
      console.log('Step 9: Screenshot delete dialog...');
      await page.screenshot({ path: path.join(dir, 'bug4-02-delete-dialog.png'), fullPage: true });
      console.log('  ✓ Saved: bug4-02-delete-dialog.png');
      
      console.log('Step 10: Look for confirm button...');
      const confirmButtons = await page.$$('button:has-text("Confirm"), button:has-text("Yes")');
      const dialogDeleteButtons = await page.$$('div[role="dialog"] button:has-text("Delete")');
      
      const confirmButton = confirmButtons[0] || dialogDeleteButtons[0];
      
      if (confirmButton) {
        console.log('Step 11: Click confirm...');
        await confirmButton.click();
        await page.waitForTimeout(5000);
        
        console.log('Step 12: Screenshot result...');
        await page.screenshot({ path: path.join(dir, 'bug4-03-delete-result.png'), fullPage: true });
        console.log('  ✓ Saved: bug4-03-delete-result.png');
        
        console.log('Step 13: Check for error/success...');
        const bodyText = await page.textContent('body');
        
        console.log('\n' + '='.repeat(60));
        if (bodyText.includes('Failed to delete campaign')) {
          console.log('RESULT: ❌ FAIL');
          console.log('STATUS: BUG-4 CONFIRMED - "Failed to delete campaign" error shown');
        } else if (bodyText.toLowerCase().includes('success') || bodyText.toLowerCase().includes('deleted successfully')) {
          console.log('RESULT: ✓ PASS');
          console.log('STATUS: BUG-4 FIXED - Campaign deleted successfully');
        } else {
          console.log('RESULT: ⚠ UNCLEAR');
          console.log('STATUS: No clear error or success message - check screenshots');
        }
        console.log('='.repeat(60));
      } else {
        console.log('  ⚠ No confirm button found');
      }
    } else {
      console.log('  ⚠ No delete buttons found - may need to create a campaign first');
    }
    
    console.log('\nScreenshots saved to:');
    console.log(`  ${dir}`);
    
  } catch (error) {
    console.log('\n❌ TEST ERROR:', error.message);
    console.log(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('\nTest complete.');
  }
})();
