const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBug4CampaignDeletion() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'bug4-manual-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== FEATURE 4: Mass Email Campaigns Testing ===\n');

  try {
  console.log('Step 1: Navigate to campaigns and attempt deletion');
  await page.goto('http://localhost:3004/login');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  await page.goto('http://localhost:3004/dashboard/email/campaigns');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, 'bug4-01-campaigns.png'), fullPage: true });
  console.log('Screenshot: Campaigns page');
  
  const menuBtn = await page.locator('table tbody tr button').last();
  const hasmenu = await menuBtn.count();
  console.log(hasmenu > 0 ? 'PASS: Menu button found' : 'FAIL: No menu button');
  
  if (hasmenu > 0) {
    await menuBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug4-02-menu.png'), fullPage: true });
    
    const deleteBtn = await page.locator('button:has-text("Delete")').first();
    await deleteBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, 'bug4-03-delete-clicked.png'), fullPage: true });
    
    const confirmBtn = await page.locator('button:has-text("Confirm")').last();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: path.join(screenshotDir, 'bug4-04-after-deletion.png'), fullPage: true });
    
    const errorMsg = await page.locator('text=/Failed to delete/i').first();
    const hasError = await errorMsg.count();
    
    if (hasError > 0) {
      const errorText = await errorMsg.textContent();
      console.log('FAIL: Error message appeared -', errorText);
      await page.screenshot({ path: path.join(screenshotDir, 'bug4-05-FAIL.png'), fullPage: true });
    } else {
      console.log('PASS: Campaign deleted successfully without errors');
      await page.screenshot({ path: path.join(screenshotDir, 'bug4-05-PASS.png'), fullPage: true });
    }
  }
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-state.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testBug4CampaignDeletion().catch(console.error);
