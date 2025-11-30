const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const dir = path.join(__dirname, 'screenshots', 'final-verification');
  
  console.log('TEST: BUG-4 Campaign Delete');
  console.log('='.repeat(60));
  
  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Navigate to campaigns...');
    await page.goto('http://localhost:3004/campaigns');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(dir, 'bug4-01-campaigns-page.png'), fullPage: true });
    console.log('Screenshot 1: campaigns page');
    
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: path.join(dir, 'bug4-02-delete-dialog.png'), fullPage: true });
      console.log('Screenshot 2: delete dialog');
      
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), div[role="dialog"] button:has-text("Delete")').first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: path.join(dir, 'bug4-03-delete-result.png'), fullPage: true });
        console.log('Screenshot 3: delete result');
        
        const bodyText = await page.textContent('body');
        if (bodyText.includes('Failed to delete campaign')) {
          console.log('\n❌ FAIL: Error message found');
        } else if (bodyText.toLowerCase().includes('success') || bodyText.toLowerCase().includes('deleted')) {
          console.log('\n✓ PASS: Success message found');
        } else {
          console.log('\n⚠ UNCLEAR: Check screenshots');
        }
      }
    } else {
      console.log('No delete buttons found');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
    await page.screenshot({ path: path.join(dir, 'bug4-error.png'), fullPage: true });
  }
  
  await browser.close();
})();
