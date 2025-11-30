const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  console.log('COMPREHENSIVE NAVIGATION TEST START\n');
  
  try {
    console.log('TEST 1: Login and Dashboard');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Dashboard URL:', page.url());
    await page.screenshot({ path: 'screenshots/final-nav-01-dashboard.png', fullPage: true });
    console.log('Screenshot: final-nav-01-dashboard.png\n');
    
    console.log('TEST 2: Email Section Visibility');
    await page.waitForTimeout(2000);
    const emailCount = await page.locator('text=Email').count();
    console.log('Email section instances:', emailCount);
    await page.screenshot({ path: 'screenshots/final-nav-02-email-section.png', fullPage: true });
    console.log('Screenshot: final-nav-02-email-section.png\n');
    
    console.log('TEST 3: Email Compose');
    await page.click('text=Compose', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Compose URL:', page.url());
    const is404_3 = await page.locator('text=404').count();
    console.log(is404_3 > 0 ? 'FAIL: 404 error' : 'PASS: Page loaded');
    await page.screenshot({ path: 'screenshots/final-nav-03-compose.png', fullPage: true });
    console.log('Screenshot: final-nav-03-compose.png\n');
    
    console.log('TEST 4: Email Inbox');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(2000);
    await page.click('text=Inbox', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Inbox URL:', page.url());
    const is404_4 = await page.locator('text=404').count();
    console.log(is404_4 > 0 ? 'FAIL: 404 error' : 'PASS: Page loaded');
    await page.screenshot({ path: 'screenshots/final-nav-04-inbox.png', fullPage: true });
    console.log('Screenshot: final-nav-04-inbox.png\n');
    
    console.log('TEST 5: Email Templates');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(2000);
    await page.click('text=Templates', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Templates URL:', page.url());
    const is404_5 = await page.locator('text=404').count();
    console.log(is404_5 > 0 ? 'FAIL: 404 error' : 'PASS: Page loaded');
    await page.screenshot({ path: 'screenshots/final-nav-05-templates.png', fullPage: true });
    console.log('Screenshot: final-nav-05-templates.png\n');
    
    console.log('TEST 6: Email Campaigns');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(2000);
    await page.click('text=Campaigns', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Campaigns URL:', page.url());
    const is404_6 = await page.locator('text=404').count();
    console.log(is404_6 > 0 ? 'FAIL: 404 error' : 'PASS: Page loaded');
    await page.screenshot({ path: 'screenshots/final-nav-06-campaigns.png', fullPage: true });
    console.log('Screenshot: final-nav-06-campaigns.png\n');
    
    console.log('TEST 7: Email Autoresponders');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(2000);
    await page.click('text=Autoresponders', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Autoresponders URL:', page.url());
    const is404_7 = await page.locator('text=404').count();
    console.log(is404_7 > 0 ? 'FAIL: 404 error' : 'PASS: Page loaded');
    await page.screenshot({ path: 'screenshots/final-nav-07-autoresponders.png', fullPage: true });
    console.log('Screenshot: final-nav-07-autoresponders.png\n');
    
    console.log('TEST 8: Settings Mailgun');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(2000);
    await page.click('text=Settings', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('text=Mailgun', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Mailgun URL:', page.url());
    const is404_8 = await page.locator('text=404').count();
    console.log(is404_8 > 0 ? 'FAIL: 404 error' : 'PASS: Page loaded');
    await page.screenshot({ path: 'screenshots/final-nav-08-mailgun.png', fullPage: true });
    console.log('Screenshot: final-nav-08-mailgun.png\n');
    
    console.log('TEST 9: Settings Closebot');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(2000);
    await page.click('text=Settings', { timeout: 5000 });
    await page.waitForTimeout(1000);
    const hasIntegrations = await page.locator('text=Integrations').count();
    if (hasIntegrations > 0) {
      await page.click('text=Integrations', { timeout: 5000 });
      await page.waitForTimeout(1000);
    }
    await page.click('text=Closebot', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Closebot URL:', page.url());
    const is404_9 = await page.locator('text=404').count();
    const comingSoon = await page.locator('text=Coming Soon').count();
    console.log(is404_9 > 0 ? 'FAIL: 404 error' : comingSoon > 0 ? 'PASS: Coming Soon badge present' : 'WARNING: No Coming Soon badge');
    await page.screenshot({ path: 'screenshots/final-nav-09-closebot.png', fullPage: true });
    console.log('Screenshot: final-nav-09-closebot.png\n');
    
    console.log('TEST 10: Other Links');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(3000);
    const dashboardCount = await page.locator('text=Dashboard').count();
    const contactsCount = await page.locator('text=Contacts').count();
    console.log('Dashboard links:', dashboardCount);
    console.log('Contacts links:', contactsCount);
    await page.screenshot({ path: 'screenshots/final-nav-10-other-links.png', fullPage: true });
    console.log('Screenshot: final-nav-10-other-links.png\n');
    
    console.log('COMPREHENSIVE NAVIGATION TEST COMPLETE');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/final-nav-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
