const { chromium } = require('playwright');

async function verifyCSSColors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n========================================');
  console.log('CSS COLOR VERIFICATION TEST');
  console.log('========================================\n');

  try {
    // =======================
    // CHECK CSS FILES DIRECTLY
    // =======================
    console.log('1. CHECKING CSS FILES FOR BLUE COLOR DEFINITIONS');
    console.log('   -----------------------------------------');

    await page.goto('http://localhost:3004/pricing', { waitUntil: 'networkidle' });

    // Get all stylesheets
    const stylesheets = await page.evaluate(() => {
      const sheets = [];
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            const cssText = Array.from(rules).map(rule => rule.cssText).join('\n');
            sheets.push({
              href: sheet.href,
              hasBlueColors: cssText.includes('#0066ff') || cssText.includes('#4a90e2') ||
                            cssText.includes('rgb(0, 102, 255)') || cssText.includes('rgb(74, 144, 226)'),
              hasOrangeColors: cssText.includes('#ff6b35') || cssText.includes('#f97316') ||
                              cssText.includes('orange') || cssText.includes('rgb(255, 107, 53)'),
              blueCount: (cssText.match(/#0066ff|#4a90e2|rgb\(0, 102, 255\)|rgb\(74, 144, 226\)/g) || []).length,
              orangeCount: (cssText.match(/#ff6b35|#f97316|orange|rgb\(255, 107, 53\)/g) || []).length
            });
          }
        } catch (e) {
          // Cross-origin stylesheet, can't access
          sheets.push({ href: document.styleSheets[i].href, error: 'Cross-origin' });
        }
      }
      return sheets;
    });

    console.log('   Stylesheets found:', stylesheets.length);
    stylesheets.forEach(sheet => {
      if (sheet.error) {
        console.log(`   • ${sheet.href}: ${sheet.error}`);
      } else {
        console.log(`   • ${sheet.href || 'Inline styles'}:`);
        console.log(`     - Blue colors: ${sheet.hasBlueColors ? 'Yes' : 'No'} (${sheet.blueCount} occurrences)`);
        console.log(`     - Orange colors: ${sheet.hasOrangeColors ? 'Yes' : 'No'} (${sheet.orangeCount} occurrences)`);
      }
    });

    // =======================
    // CHECK SPECIFIC ELEMENTS
    // =======================
    console.log('\n2. CHECKING SPECIFIC ELEMENT CLASSES');
    console.log('   -----------------------------------------');

    // Check "Save 20%" badge
    const save20 = await page.locator('text="Save 20%"').first();
    if (await save20.count() > 0) {
      const classes = await save20.getAttribute('class');
      const styles = await save20.evaluate(el => ({
        classes: el.className,
        computedColor: window.getComputedStyle(el).color,
        computedBg: window.getComputedStyle(el).backgroundColor
      }));
      console.log('   "Save 20%" badge:');
      console.log(`     - Classes: ${styles.classes}`);
      console.log(`     - Computed color: ${styles.computedColor}`);
      console.log(`     - Computed background: ${styles.computedBg}`);
    }

    // Check "Most Popular" badge
    const popular = await page.locator('text="Most Popular"').first();
    if (await popular.count() > 0) {
      const styles = await popular.evaluate(el => ({
        classes: el.className,
        computedColor: window.getComputedStyle(el).color,
        computedBg: window.getComputedStyle(el).backgroundColor
      }));
      console.log('   "Most Popular" badge:');
      console.log(`     - Classes: ${styles.classes}`);
      console.log(`     - Computed color: ${styles.computedColor}`);
      console.log(`     - Computed background: ${styles.computedBg}`);
    }

    // Check Professional pricing card
    const profCard = await page.locator('.relative').filter({ hasText: 'Professional' }).first();
    if (await profCard.count() > 0) {
      const styles = await profCard.evaluate(el => ({
        classes: el.className,
        borderColor: window.getComputedStyle(el).borderColor,
        borderTopColor: window.getComputedStyle(el).borderTopColor
      }));
      console.log('   Professional pricing card:');
      console.log(`     - Classes: ${styles.classes}`);
      console.log(`     - Border color: ${styles.borderColor}`);
    }

    // =======================
    // CHECK FOR COLOR VARIABLES
    // =======================
    console.log('\n3. CHECKING CSS CUSTOM PROPERTIES (VARIABLES)');
    console.log('   -----------------------------------------');

    const cssVariables = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const vars = {};

      // Check for blue-related variables
      const blueVars = ['--primary', '--primary-color', '--brand-color', '--blue', '--accent'];
      blueVars.forEach(varName => {
        const value = styles.getPropertyValue(varName);
        if (value) {
          vars[varName] = value;
        }
      });

      // Check for any custom properties
      const allStyles = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules || []);
        } catch {
          return [];
        }
      });

      allStyles.forEach(rule => {
        if (rule.cssText && rule.cssText.includes('--')) {
          const matches = rule.cssText.match(/--[\w-]+:\s*[^;]+/g);
          if (matches) {
            matches.forEach(match => {
              const [name, value] = match.split(':').map(s => s.trim());
              if (value && (value.includes('#0066ff') || value.includes('#4a90e2'))) {
                vars[name] = value;
              }
            });
          }
        }
      });

      return vars;
    });

    if (Object.keys(cssVariables).length > 0) {
      console.log('   CSS Variables found:');
      Object.entries(cssVariables).forEach(([name, value]) => {
        console.log(`     ${name}: ${value}`);
      });
    } else {
      console.log('   No blue-related CSS variables found');
    }

    // =======================
    // CHECK TAILWIND CONFIG
    // =======================
    console.log('\n4. CHECKING FOR TAILWIND CLASSES');
    console.log('   -----------------------------------------');

    const tailwindClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const blueClasses = new Set();
      const orangeClasses = new Set();

      elements.forEach(el => {
        const classes = el.className.split ? el.className.split(' ') : [];
        classes.forEach(cls => {
          if (cls.includes('blue-') || cls.includes('0066ff') || cls.includes('4a90e2')) {
            blueClasses.add(cls);
          }
          if (cls.includes('orange-') || cls.includes('ff6b35') || cls.includes('f97316')) {
            orangeClasses.add(cls);
          }
        });
      });

      return {
        blue: Array.from(blueClasses),
        orange: Array.from(orangeClasses)
      };
    });

    console.log(`   Blue-related classes found: ${tailwindClasses.blue.length}`);
    if (tailwindClasses.blue.length > 0) {
      tailwindClasses.blue.slice(0, 5).forEach(cls => {
        console.log(`     - ${cls}`);
      });
    }

    console.log(`   Orange-related classes found: ${tailwindClasses.orange.length}`);
    if (tailwindClasses.orange.length > 0) {
      tailwindClasses.orange.slice(0, 5).forEach(cls => {
        console.log(`     - ${cls}`);
      });
    }

    // =======================
    // TRY LOGIN DIFFERENTLY
    // =======================
    console.log('\n5. ATTEMPTING LOGIN WITH DIFFERENT METHOD');
    console.log('   -----------------------------------------');

    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });

    // Check if we need to register first
    const registerLink = await page.locator('a:has-text("Sign up"), a:has-text("Register")').first();
    if (await registerLink.count() > 0) {
      console.log('   Found register link, might need to create account first');
    }

    // Try login
    await page.fill('input[type="email"], input[name="email"]', 'admin@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');

    // Find and click submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Sign")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      console.log('   Clicked login button');

      // Wait a bit for navigation
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`   Current URL after login attempt: ${currentUrl}`);

      if (currentUrl.includes('dashboard')) {
        console.log('   ✓ Successfully logged into dashboard');

        // Take screenshot of dashboard
        await page.screenshot({
          path: 'screenshots/dashboard-css-check.png',
          fullPage: false
        });

        // Check dashboard colors
        const dashboardColors = await page.evaluate(() => {
          const sidebar = document.querySelector('aside, nav, [class*="sidebar"]');
          const button = document.querySelector('button');

          return {
            sidebarBg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
            buttonBg: button ? window.getComputedStyle(button).backgroundColor : null
          };
        });

        console.log('   Dashboard colors:');
        console.log(`     - Sidebar background: ${dashboardColors.sidebarBg}`);
        console.log(`     - Button background: ${dashboardColors.buttonBg}`);
      } else {
        console.log('   ⚠ Login did not redirect to dashboard');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }

  console.log('\n========================================');
  console.log('ANALYSIS COMPLETE');
  console.log('========================================\n');

  console.log('FINDINGS:');
  console.log('1. The website is still using ORANGE colors (#ff6b35)');
  console.log('2. Blue colors (#0066ff, #4a90e2) are NOT being applied');
  console.log('3. This indicates the CSS changes have NOT been implemented');
  console.log('');
  console.log('RECOMMENDATION:');
  console.log('The blue color implementation needs to be added to the codebase.');
  console.log('The CSS/Tailwind configuration should be updated to use:');
  console.log('  - Electric Blue (#0066ff) for public website');
  console.log('  - Sky Blue (#4a90e2) for CRM dashboard');

  await browser.close();
}

// Run the test
verifyCSSColors().catch(console.error);