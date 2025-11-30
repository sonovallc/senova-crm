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
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/campaigns-verification.png', fullPage: true });
    
    const pageContent = await page.content();
    const hasNetworkError = pageContent.includes('Network Error');
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('Network Error present:', hasNetworkError);
    console.log('\n=== PAGE TEXT SAMPLE ===');
    console.log(bodyText.substring(0, 500));
    
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
