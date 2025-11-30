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

  console.log('BUG-4: Campaign Deletion Test');

  try {
    console.log('Step 1: Navigate to campaigns');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-campaigns.png'), fullPage: true });
    
    console.log('Step 2: Look for campaigns');
    let campaignRow = await page.locator('table tbody tr').first();
    let hasCampaign = await campaignRow.count() > 0;
    
    if (!hasCampaign) {
      console.log('Creating test campaign');
      const createBtn = await page.locator('button:has-text("Create")').first();
      
      if (await createBtn.count() > 0) {
        await createBtn.click();
        await page.waitForTimeout(2000);
        await page.fill('input[name="name"]', 'BUG-4 Test Campaign');
        await page.fill('input[name="subject"]', 'Test Subject');
        const saveBtn = await page.locator('button:has-text("Save")').first();
        await saveBtn.click();
        await page.waitForTimeout(3000);
        await page.goto('http://localhost:3004/dashboard/email/campaigns');
        await page.waitForTimeout(2000);
        console.log('Campaign created');
      }
    }
    
    console.log('Step 3: Find delete controls');
    const menuButton = await page.locator('button[aria-label*="menu"]').first();
    
    if (await menuButton.count() > 0) {
      console.log('Step 4: Open menu and delete');
      await menuButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '02-menu.png'), fullPage: true });
      
      const deleteBtn = await page.locator('button:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, '03-delete.png'), fullPage: true });
        
        const confirmBtn = await page.locator('button:has-text("Confirm")').last();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
        
        await page.screenshot({ path: path.join(screenshotDir, '04-after.png'), fullPage: true });
        
        console.log('Step 5: Check for errors');
        const errorMsg = await page.locator('text=/Failed to delete/i').first();
        
        if (await errorMsg.count() > 0 && await errorMsg.isVisible()) {
          const errorText = await errorMsg.textContent();
          console.log('FAIL: Error detected -', errorText);
          await page.screenshot({ path: path.join(screenshotDir, '05-FAIL.png'), fullPage: true });
          console.log('Screenshots:', screenshotDir);
        } else {
          console.log('PASS: No error message');
          await page.screenshot({ path: path.join(screenshotDir, '05-PASS.png'), fullPage: true });
          console.log('Screenshots:', screenshotDir);
        }
      } else {
        console.log('INCONCLUSIVE: Delete button not found');
      }
    } else {
      console.log('INCONCLUSIVE: Menu button not found');
      await page.screenshot({ path: path.join(screenshotDir, '99-no-menu.png'), fullPage: true });
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true }).catch(() => {});
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testBug4();
