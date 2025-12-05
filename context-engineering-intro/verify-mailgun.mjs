import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing production Mailgun UI...');

// Navigate to CRM
await page.goto('https://crm.senovallc.com');
await page.waitForTimeout(3000);

// Login
const emailField = await page.locator('input[type="email"]').first();
if (await emailField.isVisible()) {
  console.log('Logging in...');
  await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
  await page.fill('input[type="password"]', 'D3n1w3n1!');
  await page.screenshot({ path: 'screenshots/mailgun-ui-verification/01-login.png' });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
}

// Navigate to Objects
console.log('Going to Objects page...');
const objectsLink = await page.locator('a:has-text("Objects")').first();
if (await objectsLink.isVisible()) {
  await objectsLink.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/mailgun-ui-verification/02-objects.png' });
  
  // Click first object
  const firstObject = await page.locator('tbody tr').first();
  if (await firstObject.isVisible()) {
    console.log('Opening first object...');
    await firstObject.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/mailgun-ui-verification/03-object-detail.png' });
    
    // Look for Mailgun tab
    const mailgunTab = await page.locator('button:has-text("Mailgun")').first();
    if (await mailgunTab.isVisible()) {
      console.log('Found Mailgun tab!');
      await mailgunTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/mailgun-ui-verification/04-mailgun-tab.png' });
    } else {
      console.log('Mailgun tab not found');
    }
  }
}

console.log('Test complete. Check screenshots folder.');
await browser.close();
