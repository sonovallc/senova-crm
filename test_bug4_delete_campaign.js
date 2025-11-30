const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots', 'bug4-verify');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('=== BUG-4: Campaign Delete Verification ===');
    
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    console.log('Step 2: Navigating to campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    
    console.log('Step 3: Taking initial screenshot...');
    await page.screenshot({ path: path.join(screenshotDir, '1-campaigns-list-initial.png'), fullPage: true });
    
    console.log('Step 4: Analyzing campaigns...');
    const campaigns = await page.$$('[data-testid^="campaign-card-"]');
    console.log('Found campaigns:', campaigns.length);

    let targetId = null;
    let targetName = null;

    for (const camp of campaigns) {
      const tid = await camp.getAttribute('data-testid');
      const cid = tid.replace('campaign-card-', '');
      const sts = await camp.getAttribute('data-campaign-status');
      const nel = await camp.$('[data-testid^="campaign-name-"]');
      const nam = nel ? await nel.textContent() : 'Unknown';
      
      console.log('  Campaign:', nam, 'Status:', sts);
      
      if (sts === 'draft' || sts === 'cancelled') {
        targetId = cid;
        targetName = nam;
        console.log('  Found deletable:', nam);
        break;
      }
    }

    if (!targetId && campaigns.length > 0) {
      const camp = campaigns[0];
      const tid = await camp.getAttribute('data-testid');
      targetId = tid.replace('campaign-card-', '');
      const nel = await camp.$('[data-testid^="campaign-name-"]');
      targetName = nel ? await nel.textContent() : 'Campaign';
      console.log('Using first campaign:', targetName);
    }

    if (!targetId) {
      throw new Error('No campaigns found to delete');
    }

    console.log('Step 6: Deleting campaign:', targetName);
    const initialCount = campaigns.length;
    console.log('Initial count:', initialCount);
    
    const menuBtn = await page.$('[data-testid="campaign-menu-button-' + targetId + '"]');
    if (!menuBtn) throw new Error('Menu button not found');
    
    await menuBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '4-delete-menu.png'), fullPage: true });
    
    const delBtn = await page.$('[data-testid="campaign-delete-option-' + targetId + '"]');
    if (!delBtn) throw new Error('Delete option not found');
    
    page.once('dialog', dialog => dialog.accept());
    await delBtn.click();
    await page.waitForTimeout(2000);
    
    console.log('Step 7: Verifying deletion...');
    await page.screenshot({ path: path.join(screenshotDir, '5-after-delete.png'), fullPage: true });
    
    const stillExists = await page.$('[data-testid="campaign-card-' + targetId + '"]');
    if (stillExists) throw new Error('Campaign still exists after delete');
    
    const finalCamps = await page.$$('[data-testid^="campaign-card-"]');
    console.log('Final count:', finalCamps.length);
    
    console.log('=== PASS: Campaign deleted successfully ===');
    console.log('Campaign:', targetName);
    console.log('Count changed from', initialCount, 'to', finalCamps.length);

  } catch (error) {
    console.error('FAIL:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
