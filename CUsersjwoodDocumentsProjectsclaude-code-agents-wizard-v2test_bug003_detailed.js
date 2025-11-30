const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all console and error messages
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  
  // Login
  await page.goto('http://localhost:3004/login');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Navigate to autoresponders
  console.log('\n=== NAVIGATING TO AUTORESPONDERS PAGE ===');
  await page.goto('http://localhost:3004/dashboard/email/autoresponders');
  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());
  
  await page.screenshot({ path: 'testing/production-fixes/BUG003-detailed-01-list.png', fullPage: true });
  
  // Check for the button
  const createButtonTop = await page.locator('[data-testid="autoresponder-create-button"]').first();
  const isVisible = await createButtonTop.isVisible();
  console.log('Top Create button visible:', isVisible);
  
  // Check if button is inside a Link
  const parentLink = await page.locator('[data-testid="autoresponder-create-button"]').locator('..').first();
  const parentTag = await parentLink.evaluate(el => el.tagName);
  const parentHref = await parentLink.evaluate(el => el.getAttribute('href'));
  console.log('Parent element:', parentTag, 'href:', parentHref);
  
  // Try clicking
  console.log('\n=== CLICKING CREATE BUTTON ===');
  await createButtonTop.click();
  await page.waitForTimeout(3000);
  
  console.log('URL after click:', page.url());
  await page.screenshot({ path: 'testing/production-fixes/BUG003-detailed-02-after-click.png', fullPage: true });
  
  // Check if we're on the create page
  if (page.url().includes('/create')) {
    console.log('✅ SUCCESS: Navigated to create page');
    
    // Wait for form to load
    await page.waitForTimeout(2000);
    
    // Check for form elements
    const nameInput = await page.locator('[data-testid="autoresponder-name-input"]').count();
    console.log('Name input found:', nameInput > 0);
    
    await page.screenshot({ path: 'testing/production-fixes/BUG003-detailed-03-create-form.png', fullPage: true });
  } else {
    console.log('❌ FAILED: Did not navigate to create page');
    console.log('Expected URL to contain: /create');
    console.log('Actual URL:', page.url());
  }
  
  await browser.close();
})();
