const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('BUG-4: Campaign Deletion Test');
    console.log('1. Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.waitForTimeout(2000);
    
    console.log('2. Navigating to campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/01-campaigns.png', fullPage: true });
    console.log('3. Campaigns page loaded');
    
    console.log('4. Clicking menu button (using mouse at known coordinates)...');
    await page.mouse.click(1295, 245);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/02-menu.png', fullPage: true });
    
    console.log('5. Clicking Delete...');
    const deleteBtn = await page.locator('text=Delete').first();
    await deleteBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/03-deleted.png', fullPage: true });
    
    console.log('6. Checking for confirm dialog...');
    const confirmBtn = await page.locator('button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/04-final.png', fullPage: true });
    
    console.log('7. Checking for errors...');
    const errorMsg = await page.locator('text=/Failed to delete/i').first();
    if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('RESULT: FAIL - Error message appeared');
    } else {
      console.log('RESULT: PASS - No error message');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
