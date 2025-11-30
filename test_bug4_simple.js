const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBug4() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    storageState: 'auth.json'
  });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'bug4-manual-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('BUG-4 Campaign Deletion Test');

  try {
    console.log('Step 1: Navigate to campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-campaigns.png'), fullPage: true });
    
    console.log('Step 2: Find menu button');
    const menuBtn = await page.locator('button[aria-label*="menu"]').first();
    const hasMenu = await menuBtn.count();
    
    if (hasMenu > 0) {
      console.log('Step 3: Click menu');
      await menuBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '02-menu.png'), fullPage: true });
      
      console.log('Step 4: Click delete');
      const deleteBtn = await page.locator('button:has-text("Delete")').first();
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '03-delete.png'), fullPage: true });
      
      console.log('Step 5: Confirm if needed');
      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
      
      await page.screenshot({ path: path.join(screenshotDir, '04-after.png'), fullPage: true });
      
      console.log('Step 6: Check for errors');
      const errorMsg = await page.locator('text=/Failed to delete/i').first();
      const hasError = await errorMsg.count();
      
      if (hasError > 0) {
        console.log('FAIL: Error message found');
        await page.screenshot({ path: path.join(screenshotDir, '05-FAIL.png'), fullPage: true });
      } else {
        console.log('PASS: No error message');
        await page.screenshot({ path: path.join(screenshotDir, '05-PASS.png'), fullPage: true });
      }
    } else {
      console.log('INCONCLUSIVE: No menu button found');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testBug4();
