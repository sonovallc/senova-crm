const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    const msgType = msg.type();
    const msgText = msg.text();
    consoleLogs.push(`[${msgType}] ${msgText}`);
  });

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    console.log('3. Waiting for dashboard...');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('4. Navigating to campaigns page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    
    console.log('5. Waiting 5 seconds for API response...');
    await page.waitForTimeout(5000);
    
    console.log('6. Taking screenshot...');
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/01-campaigns.png', fullPage: true });
    
    console.log('Attempting to click three-dot menu...');
    // The three-dot menu buttons are on the right side of campaign rows
    // Try clicking coordinates on the right side where the menu button should be
    await page.mouse.click(1295, 245); // Approximate position of first campaign's menu button based on screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/02-menu-click.png', fullPage: true });
    
    console.log('Looking for Delete option...');
    const deleteBtn = await page.locator('text=Delete').first();
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/03-delete-clicked.png', fullPage: true });
      
      const confirmBtn = await page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
      
      await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/04-after-delete.png', fullPage: true });
      
      const errorMsg = await page.locator('text=/Failed to delete/i').first();
      if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('FAIL: Error message appeared');
        await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/05-FAIL.png', fullPage: true });
      } else {
        console.log('PASS: Campaign deleted without errors');
        await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/05-PASS.png', fullPage: true });
      }
    } else {
      console.log('Delete button not found after menu click');
    }
    
    //await pagefinally {
    await browser.close();
  }
})();
