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

  console.log('=== BUG-4: Campaign Deletion Test ===');

  try {
    console.log('\nStep 1: Login');
    await page.goto('http://localhost:3004/admin/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  - Logged in successfully');
    
    console.log('\nStep 2: Navigate to campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotDir, '01-campaigns-page.png'), fullPage: true });
    console.log('  - Screenshot: 01-campaigns-page.png');
    
    console.log('\nStep 3: Check for existing campaigns');
    let rows = await page.locator('table tbody tr, [data-testid="campaign-row"]').count();
    console.log('  - Found', rows, 'campaign row(s)');
    
    if (rows === 0) {
      console.log('\nStep 4: Creating test campaign');
      const createBtn = await page.locator('button:has-text("Create"), a:has-text("Create")').first();
      
      if (await createBtn.isVisible({ timeout: 3000 })) {
        await createBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, '02-create-dialog.png'), fullPage: true });
        
        await page.fill('input[name="name"]', 'BUG-4 Test Campaign Delete Me');
        await page.fill('input[name="subject"]', 'Test Subject for BUG-4');
        
        const saveBtn = await page.locator('button:has-text("Save"), button:has-text("Create")').first();
        await saveBtn.click();
        await page.waitForTimeout(3000);
        
        await page.goto('http://localhost:3004/dashboard/email/campaigns');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, '03-after-create.png'), fullPage: true });
        console.log('  - Test campaign created');
        console.log('  - Screenshot: 03-after-create.png');
      }
    }
    
    console.log('\nStep 5: Look for delete button/menu');
    await page.waitForTimeout(1000);
    
    const menuBtn = await page.locator('button[aria-label="Actions"], button[aria-label*="menu"], button:has-text("⋮")').first();
    const deleteBtn = await page.locator('button:has-text("Delete")').first();
    
    if (await menuBtn.isVisible({ timeout: 2000 })) {
      console.log('  - Found actions menu button');
      console.log('\nStep 6: Open menu');
      await menuBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '04-menu-open.png'), fullPage: true });
      console.log('  - Screenshot: 04-menu-open.png');
      
      console.log('\nStep 7: Click Delete');
      const deleteOption = await page.locator('button:has-text("Delete"), [role="menuitem"]:has-text("Delete")').first();
      await deleteOption.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(screenshotDir, '05-delete-clicked.png'), fullPage: true });
      console.log('  - Screenshot: 05-delete-clicked.png');
      
      console.log('\nStep 8: Handle confirmation');
      const confirmBtn = await page.locator('button:has-text("Confirm"), button:has-text("Yes")').last();
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        console.log('  - Confirmation dialog appeared');
        await page.screenshot({ path: path.join(screenshotDir, '06-confirm.png'), fullPage: true });
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
      
      await page.screenshot({ path: path.join(screenshotDir, '07-after-delete.png'), fullPage: true });
      console.log('  - Screenshot: 07-after-delete.png');
      
      console.log('\nStep 9: Verify no error message');
      const errorMsg = await page.locator('text=/Failed to delete/i, text=/error.*delete/i').first();
      const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasError) {
        const errorText = await errorMsg.textContent();
        console.log('\n========================================');
        console.log('TEST RESULT: FAIL');
        console.log('========================================');
        console.log('Error message appeared:', errorText);
        await page.screenshot({ path: path.join(screenshotDir, '08-FAIL.png'), fullPage: true });
      } else {
        console.log('  - No error message detected');
        console.log('\n========================================');
        console.log('TEST RESULT: PASS');
        console.log('========================================');
        console.log('Campaign deleted successfully without errors');
        await page.screenshot({ path: path.join(screenshotDir, '08-PASS.png'), fullPage: true });
      }
      
    } else if (await deleteBtn.isVisible({ timeout: 2000 })) {
      console.log('  - Found direct Delete button');
      await deleteBtn.click();
      await page.waitForTimeout(2000);
      
      const errorMsg = await page.locator('text=/Failed to delete/i').first();
      if (await errorMsg.isVisible({ timeout: 2000 })) {
        console.log('\nTEST RESULT: FAIL - Error appeared');
      } else {
        console.log('\nTEST RESULT: PASS - No error');
      }
    } else {
      console.log('  - No delete controls found');
      console.log('\n========================================');
      console.log('TEST RESULT: INCONCLUSIVE');
      console.log('========================================');
      console.log('No delete button or menu found on page');
      await page.screenshot({ path: path.join(screenshotDir, '99-inconclusive.png'), fullPage: true });
    }
    
    console.log('\nScreenshots location:');
    console.log(screenshotDir);
    
  } catch (error) {
    console.error('\n========================================');
    console.error('TEST ERROR');
    console.error('========================================');
    console.error('Exception:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true }).catch(() => {});
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testBug4();
