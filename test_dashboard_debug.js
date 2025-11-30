const { chromium } = require('playwright');

async function debugDashboard() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('🔍 Debugging Dashboard...\n');

  try {
    // Go directly to dashboard
    console.log('📌 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(3000);

    // Check what page we're actually on
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for main structural elements
    const elementCheck = await page.evaluate(() => {
      return {
        hasSidebar: !!document.querySelector('.w-64'),
        hasMain: !!document.querySelector('main'),
        hasLoginForm: !!document.querySelector('input[type="email"]'),
        bodyClasses: document.body.className,
        // Get all major divs with classes
        majorDivs: Array.from(document.querySelectorAll('div')).slice(0, 10).map(div => ({
          classes: div.className.substring(0, 100),
          hasText: div.textContent.substring(0, 50).trim()
        })),
        // Look for any element with 'sidebar' in class name
        sidebarLikeElements: Array.from(document.querySelectorAll('[class*="sidebar" i], [class*="side-bar" i], [class*="nav" i]')).map(el => ({
          tag: el.tagName,
          classes: el.className.substring(0, 100)
        })),
        // Look for layout containers
        layoutContainers: Array.from(document.querySelectorAll('[class*="flex"], [class*="grid"]')).slice(0, 5).map(el => ({
          tag: el.tagName,
          classes: el.className.substring(0, 100)
        }))
      };
    });

    console.log('\n📋 Element Check:');
    console.log('  Has .w-64 sidebar:', elementCheck.hasSidebar);
    console.log('  Has main element:', elementCheck.hasMain);
    console.log('  Has login form:', elementCheck.hasLoginForm);
    console.log('  Body classes:', elementCheck.bodyClasses);

    if (elementCheck.majorDivs.length > 0) {
      console.log('\n  Major divs found:');
      elementCheck.majorDivs.forEach((div, i) => {
        if (div.classes) {
          console.log(`    ${i}: ${div.classes}`);
          if (div.hasText) {
            console.log(`       Text: "${div.hasText}"`);
          }
        }
      });
    }

    if (elementCheck.sidebarLikeElements.length > 0) {
      console.log('\n  Sidebar-like elements:');
      elementCheck.sidebarLikeElements.forEach(el => {
        console.log(`    ${el.tag}: ${el.classes}`);
      });
    }

    if (elementCheck.layoutContainers.length > 0) {
      console.log('\n  Layout containers:');
      elementCheck.layoutContainers.forEach(el => {
        console.log(`    ${el.tag}: ${el.classes}`);
      });
    }

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/dashboard-debug.png',
      fullPage: false
    });

    // If we're not logged in, try to login
    if (elementCheck.hasLoginForm) {
      console.log('\n📝 Login form detected, attempting login...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForTimeout(5000);

      console.log('\nAfter login attempt:');
      console.log('  URL:', page.url());

      // Re-check for dashboard elements
      const afterLogin = await page.evaluate(() => {
        const sidebar = document.querySelector('.w-64, [class*="sidebar"]');
        const main = document.querySelector('main');

        return {
          hasSidebar: !!sidebar,
          hasMain: !!main,
          sidebarClasses: sidebar ? sidebar.className : null,
          mainClasses: main ? main.className : null,
          // Look for any fixed positioned elements
          fixedElements: Array.from(document.querySelectorAll('[class*="fixed"], [class*="sticky"]')).map(el => ({
            tag: el.tagName,
            classes: el.className.substring(0, 100)
          }))
        };
      });

      console.log('\n📋 After Login Check:');
      console.log('  Has sidebar:', afterLogin.hasSidebar);
      console.log('  Has main:', afterLogin.hasMain);
      if (afterLogin.sidebarClasses) {
        console.log('  Sidebar classes:', afterLogin.sidebarClasses);
      }
      if (afterLogin.mainClasses) {
        console.log('  Main classes:', afterLogin.mainClasses);
      }

      if (afterLogin.fixedElements.length > 0) {
        console.log('\n  Fixed/Sticky elements:');
        afterLogin.fixedElements.forEach(el => {
          console.log(`    ${el.tag}: ${el.classes}`);
        });
      }

      // Take screenshot after login
      await page.screenshot({
        path: 'screenshots/dashboard-after-login.png',
        fullPage: false
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
    console.log('\n✅ Debug complete!');
  }
}

debugDashboard().catch(console.error);