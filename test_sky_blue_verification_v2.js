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

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page (should be orange)
    await page.screenshot({
      path: 'screenshots/login-page-orange.png',
      fullPage: true
    });
    console.log('   ✓ Login page screenshot saved (should have orange accents)');

    // Check what's on the login page
    const emailInput = await page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], #password').first();
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();

    console.log('\n2. Login form elements found:');
    console.log('   Email input exists:', await emailInput.count() > 0);
    console.log('   Password input exists:', await passwordInput.count() > 0);
    console.log('   Submit button exists:', await submitButton.count() > 0);

    if (await submitButton.count() > 0) {
      const buttonText = await submitButton.textContent();
      console.log('   Submit button text:', buttonText);
    }

    // Fill login form
    console.log('\n3. Filling login form...');
    if (await emailInput.count() > 0) {
      await emailInput.fill('admin@example.com');
      console.log('   ✓ Email entered');
    }

    if (await passwordInput.count() > 0) {
      await passwordInput.fill('password123');
      console.log('   ✓ Password entered');
    }

    // Take screenshot before clicking
    await page.screenshot({
      path: 'screenshots/login-filled.png',
      fullPage: true
    });

    // Click login button
    console.log('\n4. Clicking login button...');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      console.log('   ✓ Login button clicked');
    }

    // Wait for navigation or error
    console.log('\n5. Waiting for response...');
    try {
      // Try multiple possible dashboard URLs
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 5000 }),
        page.waitForURL('**/dashboard/**', { timeout: 5000 }),
        page.waitForURL('**/admin', { timeout: 5000 }),
        page.waitForURL('**/home', { timeout: 5000 }),
        page.waitForSelector('.dashboard', { timeout: 5000 }),
        page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 })
      ]);
      console.log('   ✓ Navigation successful');
    } catch (navError) {
      console.log('   ⚠ Navigation timeout - checking current URL');
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);

      // Check for error messages
      const errorMessage = await page.locator('.error, .alert, .text-red-500, [role="alert"]').first();
      if (await errorMessage.count() > 0) {
        const errorText = await errorMessage.textContent();
        console.log('   Error message found:', errorText);
      }

      // Take screenshot of current state
      await page.screenshot({
        path: 'screenshots/after-login-attempt.png',
        fullPage: true
      });

      // If still on login page, might be a different flow
      if (currentUrl.includes('login')) {
        console.log('   Still on login page - checking for different login flow...');

        // Try looking for a demo/test login button
        const demoButton = await page.locator('button:has-text("Demo"), button:has-text("Test")').first();
        if (await demoButton.count() > 0) {
          console.log('   Found demo button - clicking...');
          await demoButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Check current state
    const finalUrl = page.url();
    console.log('\n6. Current page URL:', finalUrl);

    if (!finalUrl.includes('login')) {
      console.log('   ✓ Successfully logged in!\n');

      // Take dashboard screenshots
      await page.screenshot({
        path: 'screenshots/dashboard-full-view.png',
        fullPage: true
      });
      console.log('7. Dashboard screenshots captured');

      // Analyze colors on the dashboard
      console.log('\n8. Analyzing dashboard colors...');

      // Look for sidebar
      const sidebar = await page.locator('aside, nav[role="navigation"], .sidebar, [class*="sidebar"], .side-nav').first();
      if (await sidebar.count() > 0) {
        console.log('   ✓ Sidebar found');

        // Take sidebar screenshot
        await sidebar.screenshot({ path: 'screenshots/dashboard-sidebar.png' });

        // Check sidebar background
        const sidebarBg = await sidebar.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log('   Sidebar background color:', sidebarBg);

        // Check active menu items
        const activeItems = await sidebar.locator('.active, .bg-blue-50, .bg-sky-50, [class*="active"]').all();
        console.log(`   Active menu items found: ${activeItems.length}`);

        for (const item of activeItems.slice(0, 3)) {
          const itemText = await item.textContent();
          const itemBg = await item.evaluate((el) => window.getComputedStyle(el).backgroundColor);
          const itemColor = await item.evaluate((el) => window.getComputedStyle(el).color);
          console.log(`     - "${itemText.trim()}": bg=${itemBg}, color=${itemColor}`);
        }
      }

      // Check for sky blue elements anywhere
      console.log('\n9. Searching for sky blue elements (#4a90e2 / rgb(74, 144, 226))...');

      // Method 1: Check by class names
      const blueClassElements = await page.locator('[class*="blue"], [class*="sky"]').all();
      console.log(`   Elements with blue/sky classes: ${blueClassElements.length}`);

      // Method 2: Check computed styles
      const allVisibleElements = await page.locator('button, a, div[class*="card"], div[class*="stat"], .icon, svg').all();
      let skyBlueCount = 0;

      for (const element of allVisibleElements.slice(0, 50)) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            bg: computed.backgroundColor,
            color: computed.color,
            border: computed.borderColor
          };
        });

        // Check if any style contains sky blue (rgb(74, 144, 226))
        const hasSkyBlue = Object.values(styles).some(style =>
          style.includes('74') && style.includes('144') && style.includes('226')
        );

        if (hasSkyBlue) {
          skyBlueCount++;
          const tag = await element.evaluate(el => el.tagName);
          const text = await element.textContent();
          console.log(`   ✓ Sky blue element found: <${tag}> "${text.slice(0, 30)}..."`);
          console.log(`     Styles:`, styles);
        }
      }

      // Check primary color CSS variables
      const cssVariables = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = getComputedStyle(root);
        return {
          primary: computed.getPropertyValue('--primary'),
          primaryColor: computed.getPropertyValue('--primary-color'),
          brandColor: computed.getPropertyValue('--brand-color'),
          accentColor: computed.getPropertyValue('--accent-color')
        };
      });
      console.log('\n10. CSS Variables:', cssVariables);

      // Final color summary
      console.log('\n===========================================');
      console.log('COLOR VERIFICATION RESULTS');
      console.log('===========================================');
      console.log('Dashboard URL:', finalUrl);
      console.log('Sky blue elements found:', skyBlueCount);
      console.log('Blue/Sky class elements:', blueClassElements.length);
      console.log('\nExpected sky blue: #4a90e2 / rgb(74, 144, 226)');
      console.log('\nScreenshots saved in screenshots/ folder:');
      console.log('  - login-page-orange.png');
      console.log('  - dashboard-full-view.png');
      console.log('  - dashboard-sidebar.png');
      console.log('===========================================');

    } else {
      console.log('   ⚠ Failed to log in - still on login page');
      console.log('   Please check login credentials or authentication system');
    }

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