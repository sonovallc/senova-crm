const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());
  
  await page.goto('http://localhost:3004/login');
  await page.waitForLoadState('networkidle');
  
  // Check what's on the page
  const pageContent = await page.content();
  console.log('Page title:', await page.title());
  
  // Find email input
  const emailInputs = await page.$$('input[type="email"], input[name="email"]');
  console.log('Email inputs found:', emailInputs.length);
  
  // Find password input  
  const passwordInputs = await page.$$('input[type="password"], input[name="password"]');
  console.log('Password inputs found:', passwordInputs.length);
  
  // Find submit button
  const submitButtons = await page.$$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
  console.log('Submit buttons found:', submitButtons.length);
  
  // Try to login
  if (emailInputs.length > 0 && passwordInputs.length > 0) {
    await emailInputs[0].fill('josh@audiencelab.io');
    await passwordInputs[0].fill('password123');
    
    if (submitButtons.length > 0) {
      console.log('Clicking submit button...');
      await submitButtons[0].click();
      
      // Wait and see what happens
      await page.waitForTimeout(5000);
      console.log('Current URL after login:', page.url());
    }
  }
  
  await browser.close();
})();
