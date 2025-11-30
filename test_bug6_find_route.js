const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Finding autoresponders route...\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Trying different routes:');
    
    const routes = [
      'http://localhost:3004/dashboard/settings',
      'http://localhost:3004/dashboard/settings/autoresponders',
      'http://localhost:3004/settings/autoresponders',
      'http://localhost:3004/dashboard/email/autoresponders'
    ];
    
    for (const route of routes) {
      console.log('Trying:', route);
      await page.goto(route);
      await page.waitForTimeout(1500);
      
      const is404 = await page.locator('text=404').isVisible();
      if (!is404) {
        console.log('SUCCESS - Route works:', route);
        await page.screenshot({ path: 'screenshots/round2-bugfix/found-route.png', fullPage: true });
        
        const editCount = await page.locator('button:has-text("Edit")').count();
        console.log('Edit buttons found:', editCount);
        break;
      } else {
        console.log('404 - Route does not exist');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
