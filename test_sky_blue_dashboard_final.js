const { chromium } = require('playwright');

(async () => {
  let browser;

  try {
    console.log('=====================================');
    console.log('SKY BLUE COLOR VERIFICATION TEST');
    console.log('=====================================\n');

    browser = await chromium.launch({
      headless: false,
      slowMo: 300
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigate to login page
    console.log('1. NAVIGATING TO LOGIN PAGE...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    // Check login page colors (should be orange)
    console.log('\n2. CHECKING LOGIN PAGE COLORS (Expected: Orange)');
    const loginButton = await page.locator('button[type="submit"]').first();
    const loginButtonBg = await loginButton.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log('   Login button background:', loginButtonBg);

    await page.screenshot({
      path: 'screenshots/01-login-page-orange.png',
      fullPage: true
    });
    console.log('   Screenshot saved: 01-login-page-orange.png');

    // Login with created credentials
    console.log('\n3. LOGGING IN WITH CREDENTIALS...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123');

    // Click login button
    await page.click('button[type="submit"]');
    console.log('   Login button clicked...');

    // Wait for navigation
    try {
      await page.waitForURL('**/dashboard/**', { timeout: 5000 });
      console.log('   SUCCESS! Redirected to dashboard');
    } catch {
      // Check if we're on any other page than login
      const currentUrl = page.url();
      if (!currentUrl.includes('login')) {
        console.log('   SUCCESS! Logged in to:', currentUrl);
      } else {
        console.log('   WARNING: Still on login page');
      }
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait for any async loading

    // Take dashboard screenshot
    const dashboardUrl = page.url();
    console.log('\n4. DASHBOARD LOADED');
    console.log('   Current URL:', dashboardUrl);

    await page.screenshot({
      path: 'screenshots/02-dashboard-full.png',
      fullPage: true
    });
    console.log('   Screenshot saved: 02-dashboard-full.png');

    // Analyze sidebar colors
    console.log('\n5. ANALYZING SIDEBAR COLORS (Expected: Sky Blue #4a90e2)');
    console.log('   Target color: rgb(74, 144, 226) or #4a90e2\n');

    // Check sidebar element
    const sidebar = await page.locator('aside, nav[role="navigation"], .sidebar, [class*="sidebar"], .side-nav, .left-nav').first();
    if (await sidebar.count() > 0) {
      await sidebar.screenshot({ path: 'screenshots/03-sidebar-detail.png' });
      console.log('   Sidebar found and captured');

      // Check active menu items
      const activeMenuItems = await sidebar.locator('.active, [class*="active"], .bg-blue-50, .bg-sky-50, [class*="bg-blue"], [class*="text-blue"]').all();
      console.log(`   Active menu items found: ${activeMenuItems.length}`);

      if (activeMenuItems.length > 0) {
        for (let i = 0; i < Math.min(3, activeMenuItems.length); i++) {
          const item = activeMenuItems[i];
          const text = await item.textContent();
          const styles = await item.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              borderColor: computed.borderColor
            };
          });

          console.log(`\n   Menu Item ${i + 1}: "${text.trim().slice(0, 20)}"`);
          console.log(`     Background: ${styles.backgroundColor}`);
          console.log(`     Text Color: ${styles.color}`);
          console.log(`     Border: ${styles.borderColor}`);

          // Check if it's sky blue
          if (styles.backgroundColor.includes('74') && styles.backgroundColor.includes('144') && styles.backgroundColor.includes('226')) {
            console.log('     >>> SKY BLUE BACKGROUND FOUND!');
          }
          if (styles.color.includes('74') && styles.color.includes('144') && styles.color.includes('226')) {
            console.log('     >>> SKY BLUE TEXT FOUND!');
          }
        }
      }

      // Check sidebar icons
      const sidebarIcons = await sidebar.locator('svg').all();
      console.log(`\n   Sidebar icons found: ${sidebarIcons.length}`);

      if (sidebarIcons.length > 0) {
        const firstIcon = sidebarIcons[0];
        const iconColor = await firstIcon.evaluate((el) => window.getComputedStyle(el).color);
        console.log(`   First icon color: ${iconColor}`);
        if (iconColor.includes('74') && iconColor.includes('144') && iconColor.includes('226')) {
          console.log('   >>> SKY BLUE ICON FOUND!');
        }
      }
    }

    // Check stat cards or dashboard elements
    console.log('\n6. CHECKING DASHBOARD ELEMENTS FOR SKY BLUE...');

    // Look for cards with borders
    const cards = await page.locator('[class*="border-l-4"], [class*="border-left"], .card, .stat-card').all();
    console.log(`   Cards/Stats found: ${cards.length}`);

    let skyBlueElementsCount = 0;

    for (let i = 0; i < Math.min(5, cards.length); i++) {
      const card = cards[i];
      const styles = await card.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderLeftColor: computed.borderLeftColor,
          borderTopColor: computed.borderTopColor,
          backgroundColor: computed.backgroundColor
        };
      });

      if (styles.borderLeftColor.includes('74') && styles.borderLeftColor.includes('144') && styles.borderLeftColor.includes('226')) {
        skyBlueElementsCount++;
        console.log(`   Card ${i + 1}: SKY BLUE LEFT BORDER FOUND!`);
      }
    }

    // Check buttons
    console.log('\n7. CHECKING BUTTONS FOR SKY BLUE...');
    const buttons = await page.locator('button').all();
    let skyBlueButtons = 0;

    for (const button of buttons.slice(0, 10)) {
      const btnStyles = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          bg: computed.backgroundColor,
          color: computed.color
        };
      });

      if ((btnStyles.bg.includes('74') && btnStyles.bg.includes('144') && btnStyles.bg.includes('226')) ||
          (btnStyles.color.includes('74') && btnStyles.color.includes('144') && btnStyles.color.includes('226'))) {
        skyBlueButtons++;
        const btnText = await button.textContent();
        console.log(`   Button: "${btnText.trim().slice(0, 20)}" - SKY BLUE FOUND!`);
      }
    }

    // Get all Tailwind color classes
    console.log('\n8. TAILWIND COLOR CLASSES ANALYSIS...');
    const colorClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const classes = new Set();

      elements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls.includes('blue') || cls.includes('sky') || cls.includes('orange') || cls.includes('primary')) {
              classes.add(cls);
            }
          });
        }
      });

      return Array.from(classes).sort();
    });

    const skyClasses = colorClasses.filter(cls => cls.includes('sky'));
    const blueClasses = colorClasses.filter(cls => cls.includes('blue'));
    const orangeClasses = colorClasses.filter(cls => cls.includes('orange'));

    console.log(`   Sky classes (${skyClasses.length}):`, skyClasses.slice(0, 5).join(', '));
    console.log(`   Blue classes (${blueClasses.length}):`, blueClasses.slice(0, 5).join(', '));
    console.log(`   Orange classes (${orangeClasses.length}):`, orangeClasses.slice(0, 5).join(', '));

    // Check CSS variables
    console.log('\n9. CSS CUSTOM PROPERTIES CHECK...');
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      const vars = {};

      // Common variable names for primary colors
      const varNames = ['--primary', '--primary-color', '--brand-color', '--accent-color', '--theme-color'];

      varNames.forEach(varName => {
        const value = computed.getPropertyValue(varName);
        if (value) vars[varName] = value;
      });

      return vars;
    });

    console.log('   CSS Variables found:');
    for (const [key, value] of Object.entries(cssVars)) {
      console.log(`     ${key}: ${value}`);
      if (value.includes('4a90e2') || (value.includes('74') && value.includes('144') && value.includes('226'))) {
        console.log('     >>> SKY BLUE VARIABLE FOUND!');
      }
    }

    // Final screenshots
    console.log('\n10. TAKING DETAILED SCREENSHOTS...');

    // Try to find and screenshot specific elements
    const header = await page.locator('header, .header, nav.top-nav').first();
    if (await header.count() > 0) {
      await header.screenshot({ path: 'screenshots/04-header.png' });
      console.log('    Header captured');
    }

    const mainContent = await page.locator('main, .main-content, .content').first();
    if (await mainContent.count() > 0) {
      await mainContent.screenshot({ path: 'screenshots/05-main-content.png' });
      console.log('    Main content captured');
    }

    // Final summary
    console.log('\n=====================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('=====================================');
    console.log(`Dashboard URL: ${dashboardUrl}`);
    console.log(`\nSKY BLUE ELEMENTS FOUND:`);
    console.log(`  - Elements with sky blue: ${skyBlueElementsCount}`);
    console.log(`  - Sky blue buttons: ${skyBlueButtons}`);
    console.log(`  - Sky-prefixed classes: ${skyClasses.length}`);
    console.log(`  - Blue-prefixed classes: ${blueClasses.length}`);
    console.log(`  - Orange-prefixed classes: ${orangeClasses.length}`);

    console.log(`\nEXPECTED SKY BLUE COLOR:`);
    console.log(`  - Hex: #4a90e2`);
    console.log(`  - RGB: rgb(74, 144, 226)`);

    console.log(`\nSCREENSHOTS SAVED IN screenshots/:`);
    console.log(`  01-login-page-orange.png - Login page (should be orange)`);
    console.log(`  02-dashboard-full.png - Full dashboard view`);
    console.log(`  03-sidebar-detail.png - Sidebar close-up`);
    console.log(`  04-header.png - Header area`);
    console.log(`  05-main-content.png - Main content area`);

    if (skyBlueElementsCount > 0 || skyBlueButtons > 0 || skyClasses.length > 0) {
      console.log('\nRESULT: SKY BLUE THEME DETECTED ON DASHBOARD!');
    } else if (orangeClasses.length > blueClasses.length) {
      console.log('\nRESULT: ORANGE THEME STILL DOMINANT - Sky blue theme may not be applied');
    } else {
      console.log('\nRESULT: MIXED/UNCLEAR - Manual review of screenshots needed');
    }

    console.log('=====================================\n');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    if (browser) {
      console.log('Browser will remain open for 15 seconds for manual inspection...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      await browser.close();
    }
  }
})();