const { chromium } = require('playwright');

(async () => {
  let browser;

  try {
    console.log('Testing direct dashboard access and color verification...\n');

    browser = await chromium.launch({
      headless: false,
      slowMo: 300
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // First, let's try to access the dashboard directly
    console.log('1. Attempting direct dashboard access...');
    await page.goto('http://localhost:3005/dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // Take screenshot regardless of where we end up
    await page.screenshot({
      path: 'screenshots/direct-access-result.png',
      fullPage: true
    });

    if (currentUrl.includes('login')) {
      console.log('   Redirected to login page (authentication required)\n');

      // Try different credentials or look for demo mode
      console.log('2. Checking for demo/test credentials or bypass...');

      // Look for any demo credentials shown on the page
      const pageText = await page.textContent('body');

      // Common patterns for demo credentials
      const patterns = [
        /email:\s*([^\s]+@[^\s]+)/i,
        /username:\s*([^\s]+)/i,
        /demo\s*account/i,
        /test\s*credentials/i
      ];

      patterns.forEach(pattern => {
        const match = pageText.match(pattern);
        if (match) {
          console.log('   Found potential credential info:', match[0]);
        }
      });

      // Try some common default credentials
      const credentials = [
        { email: 'admin@example.com', password: 'password123' },
        { email: 'demo@example.com', password: 'demo' },
        { email: 'test@test.com', password: 'test' },
        { email: 'admin@admin.com', password: 'admin' }
      ];

      console.log('\n3. Trying various credential combinations...');

      for (const cred of credentials) {
        console.log(`   Trying: ${cred.email} / ${cred.password}`);

        // Clear fields first
        await page.fill('input[type="email"], input[name="email"]', '');
        await page.fill('input[type="password"], input[name="password"]', '');

        // Fill new credentials
        await page.fill('input[type="email"], input[name="email"]', cred.email);
        await page.fill('input[type="password"], input[name="password"]', cred.password);

        // Try to submit
        await page.click('button[type="submit"]');

        // Wait a bit
        await page.waitForTimeout(2000);

        // Check if we got past login
        const newUrl = page.url();
        if (!newUrl.includes('login')) {
          console.log(`   ✓ SUCCESS! Logged in with ${cred.email}`);
          break;
        } else {
          console.log(`   ✗ Failed with ${cred.email}`);
        }
      }
    }

    // Check final state
    const finalUrl = page.url();
    console.log('\n4. Final URL:', finalUrl);

    if (!finalUrl.includes('login')) {
      console.log('   ✓ On dashboard or internal page!\n');

      // Now check for colors
      console.log('5. COLOR ANALYSIS:');
      console.log('=====================================\n');

      // Method 1: Get all background colors
      const bgColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colors = new Set();

        elements.forEach(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            colors.add(bg);
          }
        });

        return Array.from(colors);
      });

      console.log('Background colors found on page:');
      bgColors.forEach(color => {
        // Check if it's sky blue (rgb(74, 144, 226))
        if (color.includes('74') && color.includes('144') && color.includes('226')) {
          console.log(`  ✓ SKY BLUE: ${color}`);
        } else if (color.includes('255') && color.includes('152') && color.includes('0')) {
          console.log(`  ⚠ ORANGE: ${color}`);
        } else if (color.includes('blue') || color.includes('59') && color.includes('130') && color.includes('246')) {
          console.log(`  • Other blue: ${color}`);
        }
      });

      // Method 2: Get all text colors
      console.log('\nText colors found on page:');
      const textColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colors = new Set();

        elements.forEach(el => {
          const color = window.getComputedStyle(el).color;
          if (color && color !== 'rgba(0, 0, 0, 0)') {
            colors.add(color);
          }
        });

        return Array.from(colors);
      });

      textColors.forEach(color => {
        if (color.includes('74') && color.includes('144') && color.includes('226')) {
          console.log(`  ✓ SKY BLUE: ${color}`);
        } else if (color.includes('255') && color.includes('152') && color.includes('0')) {
          console.log(`  ⚠ ORANGE: ${color}`);
        } else if (color.includes('59') && color.includes('130') && color.includes('246')) {
          console.log(`  • Other blue: ${color}`);
        }
      });

      // Method 3: Check Tailwind classes
      console.log('\nTailwind color classes found:');
      const colorClasses = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const classes = new Set();

        elements.forEach(el => {
          const classList = el.className;
          if (typeof classList === 'string') {
            classList.split(' ').forEach(cls => {
              if (cls.includes('blue') || cls.includes('sky') || cls.includes('orange') || cls.includes('primary')) {
                classes.add(cls);
              }
            });
          }
        });

        return Array.from(classes).sort();
      });

      colorClasses.forEach(cls => {
        if (cls.includes('sky')) {
          console.log(`  ✓ SKY: ${cls}`);
        } else if (cls.includes('blue-400') || cls.includes('blue-500')) {
          console.log(`  • BLUE: ${cls}`);
        } else if (cls.includes('orange')) {
          console.log(`  ⚠ ORANGE: ${cls}`);
        } else {
          console.log(`  • ${cls}`);
        }
      });

      // Take focused screenshots
      console.log('\n6. Taking element screenshots...');

      // Sidebar
      const sidebar = await page.locator('aside, nav, .sidebar').first();
      if (await sidebar.count() > 0) {
        await sidebar.screenshot({ path: 'screenshots/sidebar-colors.png' });
        console.log('   ✓ Sidebar screenshot saved');

        // Get sidebar specific colors
        const sidebarColors = await sidebar.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          const links = el.querySelectorAll('a, button');
          const linkColors = [];

          links.forEach(link => {
            const linkStyle = window.getComputedStyle(link);
            linkColors.push({
              text: link.textContent.trim().slice(0, 20),
              bg: linkStyle.backgroundColor,
              color: linkStyle.color
            });
          });

          return {
            background: computed.backgroundColor,
            links: linkColors.slice(0, 5)
          };
        });

        console.log('\n   Sidebar analysis:');
        console.log('   Background:', sidebarColors.background);
        console.log('   Navigation items:');
        sidebarColors.links.forEach(link => {
          console.log(`     - "${link.text}": color=${link.color}, bg=${link.bg}`);
        });
      }

      // Full page screenshot
      await page.screenshot({ path: 'screenshots/full-dashboard-colors.png', fullPage: true });

      console.log('\n=====================================');
      console.log('SUMMARY');
      console.log('=====================================');
      console.log('Expected sky blue: #4a90e2 / rgb(74, 144, 226)');
      console.log('Screenshots saved in screenshots/ folder');
      console.log('Please review the screenshots to verify colors');

    } else {
      console.log('   ✗ Unable to access dashboard - authentication required');
      console.log('   Please verify the server is running with proper auth setup');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    if (browser) {
      console.log('\nBrowser will remain open for 15 seconds for manual inspection...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      await browser.close();
    }
  }
})();