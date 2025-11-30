const { chromium } = require('playwright');

async function checkDashboardLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('🔍 Checking Dashboard Layout Issue...\n');

  try {
    // Navigate directly to dashboard (will redirect to login)
    console.log('📌 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('📝 On login page, logging in...');

      // Login
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');

      // Take screenshot before login
      await page.screenshot({
        path: 'screenshots/login-page.png',
        fullPage: false
      });

      // Click login button
      await page.click('button[type="submit"]');

      // Wait a bit for navigation
      await page.waitForTimeout(5000);
      console.log('Current URL after login:', page.url());
    }

    // Take screenshot of whatever page we're on
    await page.screenshot({
      path: 'screenshots/after-login-attempt.png',
      fullPage: false
    });

    // If we made it to dashboard, analyze the layout
    if (page.url().includes('/dashboard')) {
      console.log('✅ On dashboard page');

      // Check layout classes directly
      const layoutInfo = await page.evaluate(() => {
        const sidebar = document.querySelector('.w-64');
        const main = document.querySelector('main');
        const body = document.body;

        // Get bounding boxes
        const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
        const mainRect = main ? main.getBoundingClientRect() : null;

        // Check for lg:ml-64 class on main
        const mainHasMarginClass = main ? main.classList.contains('lg:ml-64') : false;

        // Get all class names
        const mainClasses = main ? Array.from(main.classList) : [];
        const sidebarClasses = sidebar ? Array.from(sidebar.classList) : [];

        return {
          sidebarRect,
          mainRect,
          mainHasMarginClass,
          mainClasses,
          sidebarClasses,
          gap: sidebarRect && mainRect ? mainRect.left - sidebarRect.right : null
        };
      });

      console.log('\n📐 Layout Information:');
      if (layoutInfo.sidebarRect) {
        console.log(`  Sidebar: left=${layoutInfo.sidebarRect.left}px, right=${layoutInfo.sidebarRect.right}px, width=${layoutInfo.sidebarRect.width}px`);
      }
      if (layoutInfo.mainRect) {
        console.log(`  Main: left=${layoutInfo.mainRect.left}px, width=${layoutInfo.mainRect.width}px`);
      }
      console.log(`  Main has lg:ml-64 class: ${layoutInfo.mainHasMarginClass}`);
      console.log(`  Main classes: ${layoutInfo.mainClasses.join(', ')}`);
      console.log(`  Sidebar classes: ${layoutInfo.sidebarClasses.join(', ')}`);
      if (layoutInfo.gap !== null) {
        console.log(`  Gap between sidebar and main: ${layoutInfo.gap}px`);
        if (layoutInfo.gap > 10) {
          console.log('  ⚠️ WARNING: Unexpected gap detected!');
        }
      }

      // Add visual markers
      await page.evaluate(() => {
        const sidebar = document.querySelector('.w-64');
        const main = document.querySelector('main');

        if (sidebar) {
          sidebar.style.border = '3px solid green';
          sidebar.style.boxSizing = 'border-box';
        }

        if (main) {
          main.style.border = '3px solid blue';
          main.style.boxSizing = 'border-box';
        }

        // Check if there's a duplicate sidebar or extra margin
        const allSidebars = document.querySelectorAll('.w-64');
        console.log(`Found ${allSidebars.length} sidebar elements`);

        if (allSidebars.length > 1) {
          allSidebars.forEach((el, i) => {
            el.style.border = `3px solid ${i === 0 ? 'green' : 'red'}`;
          });
        }
      });

      // Take screenshot with borders
      await page.screenshot({
        path: 'screenshots/dashboard-with-borders.png',
        fullPage: false
      });
      console.log('✅ Dashboard screenshots captured');
    } else {
      console.log('⚠️ Not on dashboard page, current URL:', page.url());
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(3000); // Keep browser open to observe
    await browser.close();
    console.log('\n✅ Investigation complete!');
  }
}

checkDashboardLayout().catch(console.error);