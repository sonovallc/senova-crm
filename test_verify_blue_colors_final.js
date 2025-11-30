const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  if (!fs.existsSync('./screenshots/color-verification')) {
    fs.mkdirSync('./screenshots/color-verification', { recursive: true });
  }

  console.log('\n========================================');
  console.log('BLUE COLOR VERIFICATION - PORT 3005');
  console.log('========================================\n');

  try {
    // ===========================
    // 1. PUBLIC WEBSITE - PRICING PAGE
    // ===========================
    console.log('1. PUBLIC WEBSITE - ELECTRIC BLUE (#0066ff)');
    console.log('-------------------------------------------');

    await page.goto('http://localhost:3005/pricing', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take full screenshot
    await page.screenshot({
      path: './screenshots/color-verification/01-pricing-page.png',
      fullPage: true
    });

    // Check "Most Popular" badge color
    const mostPopularElements = await page.$$eval('*', elements => {
      return elements
        .filter(el => el.textContent?.trim() === 'Most Popular')
        .map(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });
    });

    if (mostPopularElements.length > 0) {
      const badge = mostPopularElements[0];
      console.log('   "Most Popular" Badge:');
      console.log(`   Background: ${badge.backgroundColor}`);

      if (badge.backgroundColor.includes('0, 102, 255')) {
        console.log('   ✅ ELECTRIC BLUE CONFIRMED!');
      } else if (badge.backgroundColor.includes('255') && (badge.backgroundColor.includes('87') || badge.backgroundColor.includes('153'))) {
        console.log('   ❌ STILL ORANGE - NOT UPDATED!');
      } else {
        console.log(`   ⚠️  Different color: ${badge.backgroundColor}`);
      }
    }

    // Check pricing buttons
    const pricingButtons = await page.$$eval('button', elements => {
      return elements
        .filter(el => el.textContent?.includes('Get Started'))
        .slice(0, 3)
        .map(el => {
          const styles = window.getComputedStyle(el);
          return {
            text: el.textContent?.trim(),
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor
          };
        });
    });

    console.log('\n   Pricing Buttons:');
    pricingButtons.forEach((btn, i) => {
      console.log(`   Button ${i+1}: ${btn.backgroundColor}`);
      if (btn.backgroundColor.includes('0, 102, 255')) {
        console.log('   ✅ Electric blue button!');
      }
    });

    // ===========================
    // 2. CRM DASHBOARD - LOGIN & DASHBOARD
    // ===========================
    console.log('\n2. CRM DASHBOARD - SKY BLUE (#4a90e2)');
    console.log('--------------------------------------');

    // Navigate to login
    await page.goto('http://localhost:3005/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Take screenshot of login page
    await page.screenshot({
      path: './screenshots/color-verification/02-login-page.png'
    });

    // Check login button color
    const loginButtonColor = await page.$eval('button[type="submit"]', el => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log(`   Login Button: ${loginButtonColor}`);
    if (loginButtonColor.includes('74, 144, 226')) {
      console.log('   ✅ SKY BLUE LOGIN BUTTON!');
    } else if (loginButtonColor.includes('255') && (loginButtonColor.includes('87') || loginButtonColor.includes('107'))) {
      console.log('   ❌ STILL ORANGE LOGIN BUTTON!');
    }

    // Attempt to login and navigate to dashboard
    console.log('\n   Attempting login...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for potential navigation
    await page.waitForTimeout(3000);

    // Check if we're on the dashboard, if not navigate directly
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/dashboard')) {
      console.log('   Navigating directly to dashboard...');
      await page.goto('http://localhost:3005/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    // Take dashboard screenshot
    await page.screenshot({
      path: './screenshots/color-verification/03-dashboard.png',
      fullPage: false
    });

    // Check if we're actually on the dashboard
    const isDashboard = await page.$$eval('*', elements => {
      return elements.some(el =>
        el.textContent?.includes('Dashboard') ||
        el.textContent?.includes('Total Revenue') ||
        el.textContent?.includes('Active Campaigns')
      );
    });

    if (isDashboard) {
      console.log('   ✅ Successfully on dashboard page');

      // Check sidebar colors
      const sidebarLinks = await page.$$eval('nav a, aside a, [class*="sidebar"] a', elements => {
        return elements.slice(0, 5).map(el => {
          const styles = window.getComputedStyle(el);
          return {
            text: el.textContent?.trim(),
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            borderColor: styles.borderColor
          };
        });
      });

      if (sidebarLinks.length > 0) {
        console.log('\n   Sidebar Navigation:');
        sidebarLinks.forEach(link => {
          console.log(`   - "${link.text}": ${link.backgroundColor} / ${link.color}`);
          if (link.backgroundColor.includes('74, 144, 226') || link.color.includes('74, 144, 226')) {
            console.log('     ✅ Sky blue detected!');
          }
        });
      }

      // Check stat cards
      const statCards = await page.$$eval('[class*="card"], [class*="stat"], .bg-white', elements => {
        return elements.slice(0, 4).map(el => {
          const styles = window.getComputedStyle(el);
          return {
            borderLeftColor: styles.borderLeftColor,
            borderTopColor: styles.borderTopColor
          };
        });
      });

      if (statCards.length > 0) {
        console.log('\n   Stat Cards:');
        statCards.forEach((card, i) => {
          console.log(`   Card ${i+1}: Border-left: ${card.borderLeftColor}`);
          if (card.borderLeftColor.includes('74, 144, 226')) {
            console.log('   ✅ Sky blue border!');
          }
        });
      }
    } else {
      console.log('   ⚠️  Not on dashboard - may still be on login page');
    }

    // ===========================
    // FINAL SUMMARY
    // ===========================
    console.log('\n========================================');
    console.log('COLOR VERIFICATION SUMMARY');
    console.log('========================================\n');

    console.log('EXPECTED COLORS:');
    console.log('  Public Website: Electric Blue (#0066ff / rgb(0, 102, 255))');
    console.log('  CRM Dashboard:  Sky Blue (#4a90e2 / rgb(74, 144, 226))\n');

    console.log('SCREENSHOTS SAVED:');
    console.log('  ./screenshots/color-verification/01-pricing-page.png');
    console.log('  ./screenshots/color-verification/02-login-page.png');
    console.log('  ./screenshots/color-verification/03-dashboard.png\n');

    console.log('Please review the screenshots and console output above to verify colors.');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Keep browser open for 5 seconds to observe
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();