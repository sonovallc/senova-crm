const { chromium } = require('playwright');

(async () => {
  let browser;

  try {
    console.log('Starting sky blue color verification test...\n');

    browser = await chromium.launch({
      headless: false,
      slowMo: 500
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page (should be orange)
    await page.screenshot({
      path: 'login-page-orange.png',
      fullPage: true
    });
    console.log('   ✓ Login page screenshot saved (should have orange accents)');

    // Login
    console.log('\n2. Logging in...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Click the sign in button
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    console.log('   Waiting for dashboard...');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log('   ✓ Successfully logged in and reached dashboard\n');

    // Take full dashboard screenshot
    await page.screenshot({
      path: 'dashboard-full-view.png',
      fullPage: true
    });
    console.log('3. Dashboard screenshots captured');

    // Check sidebar colors
    console.log('\n4. Analyzing sidebar colors...');

    // Check for active nav item
    const activeNavItem = await page.locator('.bg-blue-50, .bg-sky-50, [class*="bg-blue"], [class*="text-blue"], [class*="text-sky"]').first();
    if (await activeNavItem.count() > 0) {
      const activeNavClasses = await activeNavItem.getAttribute('class');
      console.log('   Active nav item classes:', activeNavClasses);

      // Get computed styles
      const activeNavStyles = await activeNavItem.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor
        };
      });
      console.log('   Active nav item styles:', activeNavStyles);
    }

    // Check sidebar icons
    const sidebarIcons = await page.locator('aside svg, nav svg, .sidebar svg').all();
    console.log(`   Found ${sidebarIcons.length} sidebar icons`);

    if (sidebarIcons.length > 0) {
      const firstIcon = sidebarIcons[0];
      const iconColor = await firstIcon.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      console.log('   First icon color:', iconColor);
    }

    // Check stat cards
    console.log('\n5. Checking stat cards...');
    const statCards = await page.locator('[class*="border-l-4"], [class*="border-left"]').all();
    console.log(`   Found ${statCards.length} elements with left borders`);

    if (statCards.length > 0) {
      const firstCard = statCards[0];
      const cardBorderColor = await firstCard.evaluate((el) => {
        return window.getComputedStyle(el).borderLeftColor;
      });
      console.log('   First card border color:', cardBorderColor);
    }

    // Check for any sky blue elements
    console.log('\n6. Searching for sky blue elements...');
    const skyBlueElements = await page.locator('[class*="sky"], [class*="blue-400"], [class*="blue-500"], [style*="4a90e2"], [style*="74, 144, 226"]').all();
    console.log(`   Found ${skyBlueElements.length} potential sky blue elements`);

    // Look for specific color values
    console.log('\n7. Checking specific elements for sky blue (#4a90e2)...');

    // Check buttons
    const buttons = await page.locator('button').all();
    let skyBlueButtons = 0;
    for (const button of buttons) {
      const bgColor = await button.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      if (bgColor.includes('74') && bgColor.includes('144') && bgColor.includes('226')) {
        skyBlueButtons++;
        const text = await button.textContent();
        console.log(`   ✓ Found sky blue button: "${text}" with color ${bgColor}`);
      }
    }

    // Check links
    const links = await page.locator('a').all();
    let skyBlueLinks = 0;
    for (const link of links) {
      const color = await link.evaluate((el) => window.getComputedStyle(el).color);
      if (color.includes('74') && color.includes('144') && color.includes('226')) {
        skyBlueLinks++;
        const text = await link.textContent();
        console.log(`   ✓ Found sky blue link: "${text}" with color ${color}`);
      }
    }

    // Take focused screenshots
    console.log('\n8. Taking detailed screenshots...');

    // Screenshot of just the sidebar
    const sidebar = await page.locator('aside, nav, .sidebar, [class*="sidebar"]').first();
    if (await sidebar.count() > 0) {
      await sidebar.screenshot({ path: 'dashboard-sidebar.png' });
      console.log('   ✓ Sidebar screenshot saved');
    }

    // Screenshot of the main content area
    const mainContent = await page.locator('main, .main-content, [class*="main"]').first();
    if (await mainContent.count() > 0) {
      await mainContent.screenshot({ path: 'dashboard-main-content.png' });
      console.log('   ✓ Main content screenshot saved');
    }

    // Visual inspection of page styles
    console.log('\n9. Extracting all color-related CSS classes...');
    const allElements = await page.locator('*').all();
    const colorClasses = new Set();

    for (const element of allElements.slice(0, 100)) { // Check first 100 elements
      const className = await element.getAttribute('class');
      if (className) {
        const classes = className.split(' ');
        classes.forEach(cls => {
          if (cls.includes('blue') || cls.includes('sky') || cls.includes('orange') || cls.includes('primary')) {
            colorClasses.add(cls);
          }
        });
      }
    }

    console.log('   Color-related classes found:', Array.from(colorClasses).join(', '));

    // Final summary
    console.log('\n===========================================');
    console.log('COLOR VERIFICATION SUMMARY');
    console.log('===========================================');
    console.log(`Sky blue buttons found: ${skyBlueButtons}`);
    console.log(`Sky blue links found: ${skyBlueLinks}`);
    console.log(`Total potential sky blue elements: ${skyBlueElements.length}`);
    console.log('\nScreenshots saved:');
    console.log('  - login-page-orange.png (should show orange theme)');
    console.log('  - dashboard-full-view.png (should show sky blue theme)');
    console.log('  - dashboard-sidebar.png (sidebar detail)');
    console.log('  - dashboard-main-content.png (main area detail)');
    console.log('\nExpected sky blue color: #4a90e2 / rgb(74, 144, 226)');
    console.log('===========================================');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    if (browser) {
      console.log('\nTest complete. Browser will remain open for 10 seconds for manual inspection...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
})();