const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Exploring sidebar for Autoresponders...\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3004/dashboard/settings');
    await page.waitForTimeout(2000);
    
    console.log('Checking sidebar Settings submenu...');
    await page.screenshot({ path: 'screenshots/round2-bugfix/sidebar-1.png', fullPage: true });
    
    const sidebarItems = await page.locator('nav a, nav button').allTextContents();
    console.log('Sidebar items:', sidebarItems);
    
    console.log('\nLooking for Email submenu...');
    const emailExpanded = await page.locator('text=Email').first().isVisible();
    if (emailExpanded) {
      console.log('Found Email menu item');
      await page.locator('text=Email').first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/round2-bugfix/sidebar-email-expanded.png', fullPage: true });
      
      const emailSubmenu = await page.locator('nav').allTextContents();
      console.log('Email submenu:', emailSubmenu);
    }
    
    console.log('\nTrying direct navigation to autoresponders routes...');
    const testRoutes = [
      'http://localhost:3004/dashboard/email/autoresponders',
      'http://localhost:3004/dashboard/settings/email/autoresponders',
      'http://localhost:3004/settings/email/autoresponders'
    ];
    
    for (const route of testRoutes) {
      console.log('Trying:', route);
      await page.goto(route);
      await page.waitForTimeout(2000);
      const is404 = await page.locator('text=404').isVisible();
      if (!is404) {
        console.log('SUCCESS! Route works');
        await page.screenshot({ path: 'screenshots/round2-bugfix/autoresponders-found.png', fullPage: true });
        
        const editButtons = await page.locator('button:has-text("Edit")').count();
        console.log('Edit buttons:', editButtons);
        break;
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
