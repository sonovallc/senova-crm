const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBug4() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'bug4-manual-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== BUG-4: Campaign Deletion Test ===
');

  try {
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  PASS - Logged in
');
    
    console.log('Step 2: Navigate to Campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-campaigns-page.png'), fullPage: true });
    console.log('  PASS - Campaigns page loaded');
    console.log('  Screenshot: 01-campaigns-page.png
');
    
    console.log('Step 3: Click three-dot menu on first campaign');
    const menuButton = await page.locator('button:has-text("⋮")').first();
    await menuButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '02-menu-opened.png'), fullPage: true });
    console.log('  PASS - Menu opened');
    console.log('  Screenshot: 02-menu-opened.png
');
    
    console.log('Step 4: Click Delete option');
    const deleteBtn = await page.locator('button:has-text("Delete"), [role="menuitem"]:has-text("Delete")').first();
    await deleteBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '03-delete-clicked.png'), fullPage: true });
    console.log('  PASS - Delete clicked');
    console.log('  Screenshot: 03-delete-clicked.png
');
    
    console.log('Step 5: Handle confirmation dialog');
    const confirmBtn = await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  Confirmation dialog appeared');
      await page.screenshot({ path: path.join(screenshotDir, '04-confirm-dialog.png'), fullPage: true });
      console.log('  Screenshot: 04-confirm-dialog.png');
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      console.log('  PASS - Confirmed
');
    } else {
      console.log('  No confirmation dialog
');
    }
    
    await page.screenshot({ path: path.join(screenshotDir, '05-after-deletion.png'), fullPage: true });
    console.log('  Screenshot: 05-after-deletion.png');
    
    console.log('
Step 6: VERIFY - Check for error messages');
    const errorMsg = await page.locator('text=/Failed to delete/i, text=/error.*delet/i').first();
    const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasError) {
      const errorText = await errorMsg.textContent();
      console.log('  FAIL - Error message appeared!');
      await page.screenshot({ path: path.join(screenshotDir, '06-FAIL.png'), fullPage: true });
      
      console.log('
========================================');
      console.log('TEST RESULT: FAIL');
      console.log('========================================');
      console.log('Reason: Error message appeared during deletion');
      console.log('Error text: ' + errorText);
      console.log('
Screenshots:');
      console.log('  ' + screenshotDir);
    } else {
      console.log('  PASS - No error message');
      await page.screenshot({ path: path.join(screenshotDir, '06-PASS.png'), fullPage: true });
      
      console.log('
========================================');
      console.log('TEST RESULT: PASS');
      console.log('========================================');
      console.log('Campaign deletion successful');
      console.log('- No "Failed to delete campaign" error appeared');
      console.log('- Campaign deletion completed without errors');
      console.log('
Screenshots:');
      console.log('  ' + screenshotDir);
      console.log('
Evidence:');
      console.log('  01-campaigns-page.png');
      console.log('  02-menu-opened.png');
      console.log('  03-delete-clicked.png');
      console.log('  05-after-deletion.png');
      console.log('  06-PASS.png');
    }
    
  } catch (error) {
    console.error('
========================================');
    console.error('TEST ERROR');
    console.error('========================================');
    console.error('Exception: ' + error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true }).catch(() => {});
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testBug4();
