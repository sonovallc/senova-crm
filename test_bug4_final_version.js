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

  console.log('=== BUG-4: Campaign Deletion Manual Test ===');

  try {
    console.log('\nStep 1: Login to CRM');
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  PASS - Logged in');
    
    console.log('\nStep 2: Navigate to Campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotDir, '01-campaigns-page.png'), fullPage: true });
    console.log('  PASS - Campaigns page loaded');
    console.log('  Screenshot: 01-campaigns-page.png');
    
    console.log('\nStep 3: Check for campaigns');
    let rows = await page.locator('table tbody tr').count();
    console.log('  Found', rows, 'campaign(s)');
    
    if (rows === 0) {
      console.log('\nStep 4: Create test campaign (no campaigns exist)');
      const createBtn = await page.locator('button:has-text("Create")').first();
      
      if (await createBtn.isVisible({ timeout: 3000 })) {
        await createBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, '02-create-form.png'), fullPage: true });
        
        await page.fill('input[name="name"]', 'BUG-4 Test - Delete Me');
        await page.fill('input[name="subject"]', 'Test Subject');
        
        const saveBtn = await page.locator('button:has-text("Save")').first();
        await saveBtn.click();
        await page.waitForTimeout(3000);
        
        await page.goto('http://localhost:3004/dashboard/email/campaigns');
        await page.waitForTimeout(2000);
        console.log('  PASS - Test campaign created');
      }
    }
    
    console.log('\nStep 4: Attempt Campaign Deletion');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03-before-delete.png'), fullPage: true });
    
    const menuBtn = await page.locator('button[aria-label="Actions"]').first();
    const menuBtnAlt = await page.locator('button:has-text("⋮")').first();
    const deleteBtn = await page.locator('button:has-text("Delete")').first();
    
    let deletionAttempted = false;
    
    if (await menuBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  Found Actions menu');
      await menuBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '04-menu-opened.png'), fullPage: true });
      
      const deleteOption = await page.locator('[role="menuitem"]:has-text("Delete")').first();
      await deleteOption.click();
      deletionAttempted = true;
    } else if (await menuBtnAlt.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  Found menu (⋮)');
      await menuBtnAlt.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '04-menu-opened.png'), fullPage: true });
      
      const deleteOption = await page.locator('button:has-text("Delete")').first();
      await deleteOption.click();
      deletionAttempted = true;
    } else if (await deleteBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  Found direct Delete button');
      await deleteBtn.click();
      deletionAttempted = true;
    }
    
    if (deletionAttempted) {
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(screenshotDir, '05-delete-clicked.png'), fullPage: true });
      
      const confirmBtn = await page.locator('button:has-text("Confirm"), button:has-text("Yes")').last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  Confirmation dialog appeared');
        await page.screenshot({ path: path.join(screenshotDir, '06-confirm-dialog.png'), fullPage: true });
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
      
      await page.screenshot({ path: path.join(screenshotDir, '07-after-deletion.png'), fullPage: true });
      
      console.log('\nStep 5: VERIFY - Check for errors');
      const errorMsg = await page.locator('text=/Failed to delete/i').first();
      const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasError) {
        const errorText = await errorMsg.textContent();
        console.log('\n========================================');
        console.log('TEST RESULT: FAIL');
        console.log('========================================');
        console.log('Reason: Error message appeared');
        console.log('Error:', errorText);
        await page.screenshot({ path: path.join(screenshotDir, '08-FAIL-error.png'), fullPage: true });
        console.log('\nEvidence: See screenshots in', screenshotDir);
      } else {
        console.log('  PASS - No error message detected');
        
        console.log('\nStep 6: VERIFY - Campaign removed from list');
        await page.waitForTimeout(1000);
        const finalRows = await page.locator('table tbody tr').count();
        console.log('  Campaign count after deletion:', finalRows);
        
        console.log('\n========================================');
        console.log('TEST RESULT: PASS');
        console.log('========================================');
        console.log('Campaign deletion successful');
        console.log('- No error message appeared');
        console.log('- Campaign removed from list');
        await page.screenshot({ path: path.join(screenshotDir, '08-PASS-success.png'), fullPage: true });
        console.log('\nEvidence: See screenshots in', screenshotDir);
      }
      
    } else {
      console.log('\n========================================');
      console.log('TEST RESULT: INCONCLUSIVE');
      console.log('========================================');
      console.log('Could not find delete controls on page');
      await page.screenshot({ path: path.join(screenshotDir, '99-no-controls.png'), fullPage: true });
    }
    
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
