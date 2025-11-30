const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Attempting to navigate to dashboard inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log('Current URL: ' + currentUrl);
    
    if (currentUrl.includes('login')) {
      console.log('Redirected to login, attempting to log in...');
      await page.screenshot({ path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/login-page.png', fullPage: true });
      
      // Try different selectors for email
      const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email', '[placeholder*="email" i]'];
      for (const sel of emailSelectors) {
        try {
          await page.fill(sel, 'admin@evebeautyma.com', { timeout: 5000 });
          console.log('Filled email with selector: ' + sel);
          break;
        } catch (e) {}
      }
      
      // Try different selectors for password
      const passSelectors = ['input[type="password"]', 'input[name="password"]', '#password', '[placeholder*="password" i]'];
      for (const sel of passSelectors) {
        try {
          await page.fill(sel, 'TestPass123!', { timeout: 5000 });
          console.log('Filled password with selector: ' + sel);
          break;
        } catch (e) {}
      }
      
      // Try to submit
      const submitSelectors = ['button[type="submit"]', 'button:has-text("Login")', 'button:has-text("Sign")', 'input[type="submit"]'];
      for (const sel of submitSelectors) {
        try {
          await page.click(sel, { timeout: 5000 });
          console.log('Clicked submit with selector: ' + sel);
          break;
        } catch (e) {}
      }
      
      await page.waitForTimeout(5000);
      console.log('After login, URL: ' + page.url());
    }
    
    // Now try to access inbox
    console.log('Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { timeout: 90000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/bug-2-inbox-list.png',
      fullPage: true 
    });
    console.log('Screenshot 1 saved: inbox list');
    
  } catch (error) {
    console.error('Error: ' + error.message);
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/round2-bugfix/error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
