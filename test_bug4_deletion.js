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
    console.log('=== BUG-4: CAMPAIGN DELETION TEST ===
');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    console.log('3. Waiting for dashboard...');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('Step 2: Navigating to Campaigns page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    
    console.log('Step 3: Looking for campaigns and delete controls...');
    await page.waitForTimeout(5000);
    
    console.log('Step 4: Testing campaign deletion...');
    await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/bug4-manual-test/campaigns-page.png', fullPage: true });
    
    const pageContent = await page.content();
    const hasDeleteMenu = await page.locator("button[aria-label*=\"menu\"]").first().isVisible({ timeout: 3000 }).catch(() => false);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('Delete menu visible:', hasDeleteMenu);
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
