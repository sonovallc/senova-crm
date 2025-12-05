import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing LOCAL Mailgun UI at localhost:3004...');

try {
  // Navigate to local CRM
  await page.goto('http://localhost:3004');
  await page.waitForTimeout(3000);

  // Login if needed
  const emailField = await page.locator('input[type="email"]').first();
  if (await emailField.isVisible()) {
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'owner@senova.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    await page.screenshot({ path: 'screenshots/mailgun-ui-verification/01-login-local.png' });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
  }

  // Navigate to Objects
  console.log('Going to Objects page...');
  const objectsLink = await page.locator('a[href="/dashboard/objects"], a:has-text("Objects")').first();
  if (await objectsLink.isVisible()) {
    await objectsLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/mailgun-ui-verification/02-objects-local.png' });
    
    // Look for objects in the list
    const objectRows = await page.locator('tbody tr, a[href*="/dashboard/objects/"]');
    const count = await objectRows.count();
    console.log('Found ' + count + ' objects');
    
    if (count > 0) {
      console.log('Opening first object...');
      await objectRows.first().click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/mailgun-ui-verification/03-object-detail-local.png' });
      
      // Look for tabs
      const tabs = await page.locator('[role="tablist"] button, button[role="tab"]');
      const tabCount = await tabs.count();
      console.log('Found ' + tabCount + ' tabs');
      
      for (let i = 0; i < tabCount; i++) {
        const tabText = await tabs.nth(i).textContent();
        console.log('  Tab: ' + tabText);
      }
      
      // Look for Mailgun tab
      const mailgunTab = await page.locator('button:has-text("Mailgun"), [role="tab"]:has-text("Mailgun")').first();
      if (await mailgunTab.isVisible()) {
        console.log('Found Mailgun tab! Clicking...');
        await mailgunTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/mailgun-ui-verification/04-mailgun-tab-local.png' });
        
        // Check for form fields
        const apiKeyCount = await page.locator('input[name*="api"], input[placeholder*="API"]').count();
        const domainCount = await page.locator('input[name*="domain"], input[placeholder*="domain"]').count();
        console.log('  API Key field: ' + (apiKeyCount > 0));
        console.log('  Domain field: ' + (domainCount > 0));
      } else {
        console.log('Mailgun tab not visible');
      }
    }
  }
} catch (error) {
  console.error('Error:', error.message);
  await page.screenshot({ path: 'screenshots/mailgun-ui-verification/error-local.png' });
}

console.log('Test complete. Check screenshots folder.');
await browser.close();
