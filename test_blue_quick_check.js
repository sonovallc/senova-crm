const { chromium } = require('playwright');

(async () => {
  console.log('\n=== QUICK BLUE COLOR CHECK ON PORT 3005 ===\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Check Public Pricing Page
    console.log('1. Checking Public Pricing Page...');
    await page.goto('http://localhost:3005/pricing', { waitUntil: 'domcontentloaded' });

    // Look for "Most Popular" badge
    const badges = await page.$$eval('*', elements => {
      return elements
        .filter(el => el.textContent?.includes('Most Popular'))
        .map(el => {
          const styles = window.getComputedStyle(el);
          return {
            text: el.textContent.trim(),
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });
    });

    if (badges.length > 0) {
      console.log('   Found "Most Popular" badge:');
      badges.forEach(badge => {
        console.log(`     Background: ${badge.backgroundColor}`);
        if (badge.backgroundColor.includes('0, 102, 255')) {
          console.log('     ✅ ELECTRIC BLUE CONFIRMED!');
        } else if (badge.backgroundColor.includes('255') && (badge.backgroundColor.includes('87') || badge.backgroundColor.includes('153'))) {
          console.log('     ⚠️ STILL ORANGE!');
        }
      });
    }

    // Look for buttons
    const buttons = await page.$$eval('button', elements => {
      return elements.slice(0, 3).map(el => {
        const styles = window.getComputedStyle(el);
        return {
          text: el.textContent?.trim(),
          backgroundColor: styles.backgroundColor
        };
      });
    });

    console.log('\n   Button colors:');
    buttons.forEach(btn => {
      console.log(`     "${btn.text}": ${btn.backgroundColor}`);
      if (btn.backgroundColor.includes('0, 102, 255')) {
        console.log('     ✅ ELECTRIC BLUE!');
      }
    });

    // 2. Check CRM Dashboard
    console.log('\n2. Checking CRM Dashboard...');
    await page.goto('http://localhost:3005/login', { waitUntil: 'domcontentloaded' });

    // Check login button
    const loginBtn = await page.$eval('button[type="submit"]', el => {
      const styles = window.getComputedStyle(el);
      return {
        text: el.textContent?.trim(),
        backgroundColor: styles.backgroundColor
      };
    });

    console.log(`   Login button: ${loginBtn.backgroundColor}`);
    if (loginBtn.backgroundColor.includes('74, 144, 226')) {
      console.log('   ✅ SKY BLUE LOGIN BUTTON!');
    } else if (loginBtn.backgroundColor.includes('255') && (loginBtn.backgroundColor.includes('87') || loginBtn.backgroundColor.includes('153'))) {
      console.log('   ⚠️ STILL ORANGE LOGIN BUTTON!');
    }

    // Login and check dashboard
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);

    // Go to dashboard if not redirected
    if (!page.url().includes('/dashboard')) {
      await page.goto('http://localhost:3005/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }

    // Check sidebar colors
    const sidebarLinks = await page.$$eval('nav a, aside a', elements => {
      return elements.slice(0, 3).map(el => {
        const styles = window.getComputedStyle(el);
        return {
          text: el.textContent?.trim(),
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });
    });

    console.log('\n   Sidebar navigation:');
    sidebarLinks.forEach(link => {
      console.log(`     "${link.text}": BG=${link.backgroundColor}, Color=${link.color}`);
      if (link.backgroundColor.includes('74, 144, 226') || link.color.includes('74, 144, 226')) {
        console.log('     ✅ SKY BLUE!');
      }
    });

    // Check stat cards
    const cards = await page.$$eval('.bg-white', elements => {
      return elements.slice(0, 3).map(el => {
        const styles = window.getComputedStyle(el);
        return {
          borderLeftColor: styles.borderLeftColor,
          borderTopColor: styles.borderTopColor
        };
      });
    });

    console.log('\n   Stat card borders:');
    cards.forEach((card, i) => {
      console.log(`     Card ${i+1}: Border-left=${card.borderLeftColor}`);
      if (card.borderLeftColor.includes('74, 144, 226')) {
        console.log('     ✅ SKY BLUE BORDER!');
      }
    });

    console.log('\n=== SUMMARY ===');
    console.log('Check complete. Review the color values above.');
    console.log('Expected colors:');
    console.log('  - Electric Blue: rgb(0, 102, 255)');
    console.log('  - Sky Blue: rgb(74, 144, 226)');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();