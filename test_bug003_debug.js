const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigate to login page...');
    await page.goto('http://localhost:3004', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('Taking login page screenshot...');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/BUG003-DEBUG-login.png', 
      fullPage: true 
    });
    
    console.log('Checking for input fields...');
    const inputs = await page.locator('input').count();
    console.log('Total input fields found:', inputs);
    
    const emailInputs = await page.locator('input[type="email"]').count();
    console.log('Email inputs found:', emailInputs);
    
    const passwordInputs = await page.locator('input[type="password"]').count();
    console.log('Password inputs found:', passwordInputs);
    
    const buttons = await page.locator('button').count();
    console.log('Buttons found:', buttons);
    
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\nPage text (first 500 chars):');
    console.log(pageText.substring(0, 500));
    
    const url = page.url();
    console.log('\nCurrent URL:', url);
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
