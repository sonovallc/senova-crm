const { test, expect } = require('@playwright/test');

test('Verify Mailgun UI on localhost', async ({ page }) => {
  console.log('Starting Mailgun UI test...');
  
  // Go to localhost
  await page.goto('http://localhost:3004');
  
  // Login
  await page.fill('input[type="email"]', 'owner@senova.com');
  await page.fill('input[type="password"]', 'Test123!@#');
  await page.screenshot({ path: 'screenshots/mailgun-ui-verification/01-login.png' });
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForTimeout(3000);
  
  // Navigate to Objects
  await page.click('a:has-text("Objects")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/mailgun-ui-verification/02-objects.png' });
  
  // Click first object
  const firstObject = page.locator('tbody tr').first();
  if (await firstObject.isVisible()) {
    await firstObject.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/mailgun-ui-verification/03-object-detail.png' });
    
    // Look for Mailgun tab
    const mailgunTab = page.locator('button:has-text("Mailgun")');
    if (await mailgunTab.isVisible()) {
      await mailgunTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/mailgun-ui-verification/04-mailgun-tab.png' });
    }
  }
});
