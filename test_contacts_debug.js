const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Logged in');

    // Navigate to contacts
    console.log('Going to contacts page...');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/contacts_debug.png', fullPage: true });
    console.log('Screenshot saved');
    
    // Check if table exists
    const tableExists = await page.locator('table').count();
    console.log('Tables found:', tableExists);
    
    // Check rows
    const rowCount = await page.locator('table tbody tr').count();
    console.log('Table rows:', rowCount);
    
    // Get page content snippet
    const bodyText = await page.locator('body').textContent();
    console.log('Page text (first 500 chars):', bodyText.substring(0, 500));
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
