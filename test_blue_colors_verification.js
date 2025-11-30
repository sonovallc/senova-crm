const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console Error: ${msg.text()}`);
    }
  });

  const screenshotsDir = './screenshots/blue-colors-verification';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('\n========================================');
  console.log('BLUE COLOR VERIFICATION TEST - PORT 3005');
  console.log('========================================\n');

  try {
    // ===========================
    // 1. PUBLIC WEBSITE INSPECTION
    // ===========================
    console.log('📌 INSPECTING PUBLIC WEBSITE ON PORT 3005...\n');

    await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of homepage
    await page.screenshot({
      path: `${screenshotsDir}/01-public-homepage-3005.png`,
      fullPage: true
    });
    console.log('✅ Screenshot: Public Homepage (Port 3005)');

    // Check for electric blue on homepage
    console.log('\n🔍 Checking for Electric Blue (#0066ff / rgb(0, 102, 255)) on Homepage...');

    // Check hero CTA buttons
    const heroButtons = await page.$$('[class*="button"], [class*="btn"], button');
    console.log(`Found ${heroButtons.length} buttons on homepage`);

    for (let i = 0; i < Math.min(5, heroButtons.length); i++) {
      const btn = heroButtons[i];
      const bgColor = await btn.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const color = await btn.evaluate(el => window.getComputedStyle(el).color);
      const text = await btn.textContent().catch(() => 'No text');
      const classes = await btn.getAttribute('class').catch(() => 'No classes');
      console.log(`  Button ${i+1}: "${text?.trim()}" - BG: ${bgColor}, Color: ${color}`);

      // Check if it's electric blue
      if (bgColor.includes('0, 102, 255')) {
        console.log(`    ✅ ELECTRIC BLUE DETECTED!`);
      } else if (bgColor.includes('255, 87, 34') || bgColor.includes('255, 153, 0')) {
        console.log(`    ⚠️ STILL ORANGE!`);
      }
    }

    // Navigate to pricing page
    console.log('\n📌 Navigating to Pricing Page (Port 3005)...');
    await page.goto('http://localhost:3005/pricing', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${screenshotsDir}/02-public-pricing-3005.png`,
      fullPage: true
    });
    console.log('✅ Screenshot: Public Pricing Page (Port 3005)');

    // Check "Most Popular" badge
    console.log('\n🔍 Looking for "Most Popular" badge...');
    const mostPopularBadge = await page.locator('text="Most Popular"').first();
    if (await mostPopularBadge.count() > 0) {
      const badgeStyles = await mostPopularBadge.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });
      console.log(`  "Most Popular" Badge:`);
      console.log(`    Background: ${badgeStyles.backgroundColor}`);
      console.log(`    Text Color: ${badgeStyles.color}`);

      if (badgeStyles.backgroundColor.includes('0, 102, 255')) {
        console.log(`    ✅ ELECTRIC BLUE BACKGROUND CONFIRMED!`);
      } else if (badgeStyles.backgroundColor.includes('255, 87, 34') || badgeStyles.backgroundColor.includes('255, 153, 0')) {
        console.log(`    ⚠️ STILL ORANGE BACKGROUND!`);
      }
    } else {
      console.log(`  ⚠️ "Most Popular" badge not found`);
    }

    // Check "Save 20%" text
    console.log('\n🔍 Looking for "Save 20%" text...');
    const saveText = await page.locator('text="Save 20%"').first();
    if (await saveText.count() > 0) {
      const textColor = await saveText.evaluate(el => window.getComputedStyle(el).color);
      console.log(`  "Save 20%" Text Color: ${textColor}`);

      if (textColor.includes('0, 102, 255')) {
        console.log(`    ✅ ELECTRIC BLUE TEXT CONFIRMED!`);
      } else if (textColor.includes('255, 87, 34') || textColor.includes('255, 153, 0')) {
        console.log(`    ⚠️ STILL ORANGE TEXT!`);
      }
    } else {
      console.log(`  ⚠️ "Save 20%" text not found`);
    }

    // ===========================
    // 2. CRM DASHBOARD INSPECTION
    // ===========================
    console.log('\n\n📌 LOGGING INTO CRM DASHBOARD (Port 3005)...\n');

    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${screenshotsDir}/03-login-page-3005.png`
    });
    console.log('✅ Screenshot: Login Page (Port 3005)');

    // Check login button color
    const loginButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
    if (await loginButton.count() > 0) {
      const loginBtnColor = await loginButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
      console.log(`  Login Button Background: ${loginBtnColor}`);

      if (loginBtnColor.includes('74, 144, 226')) {
        console.log(`    ✅ SKY BLUE LOGIN BUTTON CONFIRMED!`);
      } else if (loginBtnColor.includes('255, 87, 34') || loginBtnColor.includes('255, 153, 0')) {
        console.log(`    ⚠️ STILL ORANGE LOGIN BUTTON!`);
      }
    }

    // Login
    await page.fill('input[type="email"], input[name="email"], #email', 'admin@example.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      console.log('  Note: Dashboard redirect timeout, navigating directly...');
    });

    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${screenshotsDir}/04-crm-dashboard-3005.png`,
      fullPage: false
    });
    console.log('✅ Screenshot: CRM Dashboard (Port 3005)');

    // Check for sky blue on dashboard
    console.log('\n🔍 Checking for Sky Blue (#4a90e2 / rgb(74, 144, 226)) on Dashboard...');

    // Check sidebar
    console.log('\nSidebar Navigation Items:');
    const sidebarItems = await page.$$('nav a, [class*="sidebar"] a, aside a');
    console.log(`Found ${sidebarItems.length} sidebar navigation items`);

    let skyBlueFound = false;
    let orangeFound = false;

    for (let i = 0; i < Math.min(5, sidebarItems.length); i++) {
      const item = sidebarItems[i];
      const styles = await item.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderColor: computed.borderColor,
          text: el.textContent?.trim()
        };
      });

      console.log(`  Nav ${i+1}: "${styles.text}"`);
      console.log(`    BG: ${styles.backgroundColor}`);
      console.log(`    Color: ${styles.color}`);

      if (styles.backgroundColor.includes('74, 144, 226') ||
          styles.color.includes('74, 144, 226')) {
        console.log(`    ✅ SKY BLUE DETECTED!`);
        skyBlueFound = true;
      } else if (styles.backgroundColor.includes('255, 87, 34') ||
                 styles.color.includes('255, 87, 34') ||
                 styles.backgroundColor.includes('255, 153, 0') ||
                 styles.color.includes('255, 153, 0')) {
        console.log(`    ⚠️ STILL ORANGE!`);
        orangeFound = true;
      }
    }

    // Check stat cards
    console.log('\nStat Cards Border Colors:');
    const statCards = await page.$$('[class*="card"], [class*="stat"], .bg-white');
    console.log(`Found ${statCards.length} cards/stats`);

    for (let i = 0; i < Math.min(4, statCards.length); i++) {
      const card = statCards[i];
      const borders = await card.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          borderLeftColor: computed.borderLeftColor,
          borderTopColor: computed.borderTopColor,
          borderColor: computed.borderColor
        };
      });

      console.log(`  Card ${i+1}:`);
      console.log(`    Border-left: ${borders.borderLeftColor}`);

      if (borders.borderLeftColor.includes('74, 144, 226')) {
        console.log(`    ✅ SKY BLUE BORDER CONFIRMED!`);
        skyBlueFound = true;
      } else if (borders.borderLeftColor.includes('255, 87, 34') ||
                 borders.borderLeftColor.includes('255, 153, 0')) {
        console.log(`    ⚠️ STILL ORANGE BORDER!`);
        orangeFound = true;
      }
    }

    // Navigate to Contacts page
    console.log('\n📌 Navigating to Contacts Page (Port 3005)...');
    await page.goto('http://localhost:3005/dashboard/contacts', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${screenshotsDir}/05-crm-contacts-3005.png`,
      fullPage: false
    });
    console.log('✅ Screenshot: CRM Contacts Page (Port 3005)');

    // Check table headers
    console.log('\nTable Headers:');
    const tableHeaders = await page.$$('th, thead td');
    console.log(`Found ${tableHeaders.length} table headers`);

    if (tableHeaders.length > 0) {
      const firstHeader = tableHeaders[0];
      const headerStyles = await firstHeader.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      console.log(`  Table header BG: ${headerStyles.backgroundColor}`);
      console.log(`  Table header Color: ${headerStyles.color}`);

      if (headerStyles.backgroundColor.includes('74, 144, 226')) {
        console.log(`    ✅ SKY BLUE TABLE HEADER!`);
      } else if (headerStyles.backgroundColor.includes('255, 87, 34') ||
                 headerStyles.backgroundColor.includes('255, 153, 0')) {
        console.log(`    ⚠️ STILL ORANGE TABLE HEADER!`);
      }
    }

    // Final Summary
    console.log('\n========================================');
    console.log('COLOR VERIFICATION SUMMARY');
    console.log('========================================\n');

    console.log('PUBLIC WEBSITE (Electric Blue #0066ff):');
    console.log('  Expected: rgb(0, 102, 255)');
    console.log('  Check screenshots in: screenshots/blue-colors-verification/');
    console.log('  - 01-public-homepage-3005.png');
    console.log('  - 02-public-pricing-3005.png');

    console.log('\nCRM DASHBOARD (Sky Blue #4a90e2):');
    console.log('  Expected: rgb(74, 144, 226)');
    console.log('  Check screenshots in: screenshots/blue-colors-verification/');
    console.log('  - 03-login-page-3005.png');
    console.log('  - 04-crm-dashboard-3005.png');
    console.log('  - 05-crm-contacts-3005.png');

    if (skyBlueFound && !orangeFound) {
      console.log('\n✅ SUCCESS: Blue colors have been applied!');
    } else if (orangeFound && !skyBlueFound) {
      console.log('\n⚠️ WARNING: Still seeing orange colors - blue colors may not be applied yet');
    } else {
      console.log('\n📝 Please review the screenshots and console output above');
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();