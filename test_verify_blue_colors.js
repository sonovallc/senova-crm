const { chromium } = require('playwright');

async function verifyBlueColors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n========================================');
  console.log('SENOVA BLUE COLOR VERIFICATION TEST');
  console.log('========================================\n');

  const results = {
    publicWebsite: {},
    crmDashboard: {},
    errors: [],
    screenshots: []
  };

  try {
    // =======================
    // PUBLIC WEBSITE TESTS - Electric Blue (#0066ff)
    // =======================
    console.log('1. TESTING PUBLIC WEBSITE - PRICING PAGE');
    console.log('   Expected: Electric Blue (#0066ff)');
    console.log('   -----------------------------------------');

    await page.goto('http://localhost:3004/pricing', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Take screenshot of pricing page
    await page.screenshot({
      path: 'screenshots/pricing-page-blue-test.png',
      fullPage: true
    });
    results.screenshots.push('pricing-page-blue-test.png');
    console.log('   ✓ Screenshot saved: pricing-page-blue-test.png');

    // Check for Save 20% badge
    const save20Badge = await page.locator('text="Save 20%"').first();
    if (await save20Badge.count() > 0) {
      const save20Color = await save20Badge.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log(`   • "Save 20%" badge text color: ${save20Color}`);
      results.publicWebsite.save20Badge = save20Color;
    } else {
      console.log('   • "Save 20%" badge not found');
    }

    // Check for Most Popular badge
    const popularBadge = await page.locator('text="Most Popular"').first();
    if (await popularBadge.count() > 0) {
      const popularBgColor = await popularBadge.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`   • "Most Popular" badge background: ${popularBgColor}`);
      results.publicWebsite.popularBadge = popularBgColor;
    } else {
      console.log('   • "Most Popular" badge not found');
    }

    // Check pricing cards
    const pricingCards = await page.locator('.border-blue-600, .border-\\[\\#0066ff\\]');
    if (await pricingCards.count() > 0) {
      const borderColor = await pricingCards.first().evaluate(el =>
        window.getComputedStyle(el).borderColor
      );
      console.log(`   • Pricing card border color: ${borderColor}`);
      results.publicWebsite.pricingCardBorder = borderColor;
    }

    // =======================
    // HOME PAGE TEST
    // =======================
    console.log('\n2. TESTING PUBLIC WEBSITE - HOME PAGE');
    console.log('   Expected: Electric Blue (#0066ff)');
    console.log('   -----------------------------------------');

    await page.goto('http://localhost:3004/home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Take screenshot of home page
    await page.screenshot({
      path: 'screenshots/home-page-blue-test.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 800 }
    });
    results.screenshots.push('home-page-blue-test.png');
    console.log('   ✓ Screenshot saved: home-page-blue-test.png');

    // Check hero section secondary CTA
    const secondaryCTA = await page.locator('a:has-text("Learn More"), button:has-text("Learn More")').first();
    if (await secondaryCTA.count() > 0) {
      const ctaColor = await secondaryCTA.evaluate(el => ({
        color: window.getComputedStyle(el).color,
        borderColor: window.getComputedStyle(el).borderColor,
        backgroundColor: window.getComputedStyle(el).backgroundColor
      }));
      console.log(`   • Secondary CTA colors:`, ctaColor);
      results.publicWebsite.secondaryCTA = ctaColor;
    }

    // Check FAQ accordion arrows
    const faqArrows = await page.locator('[data-accordion] svg, .accordion svg').first();
    if (await faqArrows.count() > 0) {
      const arrowColor = await faqArrows.evaluate(el =>
        window.getComputedStyle(el).color || window.getComputedStyle(el).fill
      );
      console.log(`   • FAQ arrow color: ${arrowColor}`);
      results.publicWebsite.faqArrow = arrowColor;
    }

    // =======================
    // CRM DASHBOARD TESTS - Sky Blue (#4a90e2)
    // =======================
    console.log('\n3. LOGGING INTO CRM DASHBOARD');
    console.log('   -----------------------------------------');

    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Login
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');

    await page.click('button[type="submit"]');
    console.log('   ✓ Logged in successfully');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('\n4. TESTING CRM DASHBOARD');
    console.log('   Expected: Sky Blue (#4a90e2)');
    console.log('   -----------------------------------------');

    // Take screenshot of dashboard
    await page.screenshot({
      path: 'screenshots/dashboard-blue-test.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 800 }
    });
    results.screenshots.push('dashboard-blue-test.png');
    console.log('   ✓ Screenshot saved: dashboard-blue-test.png');

    // Check sidebar active nav items
    const activeNavItem = await page.locator('nav .bg-blue-500, nav .bg-\\[\\#4a90e2\\], nav [class*="active"]').first();
    if (await activeNavItem.count() > 0) {
      const navBgColor = await activeNavItem.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`   • Active nav item background: ${navBgColor}`);
      results.crmDashboard.activeNav = navBgColor;
    } else {
      // Try looking for any highlighted nav item
      const navLinks = await page.locator('nav a').all();
      for (const link of navLinks) {
        const bgColor = await link.evaluate(el => window.getComputedStyle(el).backgroundColor);
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          console.log(`   • Found nav item with background: ${bgColor}`);
          results.crmDashboard.navBackground = bgColor;
          break;
        }
      }
    }

    // Check stats cards
    const statsCard = await page.locator('[class*="border-l-4"], [class*="border-left"]').first();
    if (await statsCard.count() > 0) {
      const borderColor = await statsCard.evaluate(el =>
        window.getComputedStyle(el).borderLeftColor
      );
      console.log(`   • Stats card left border: ${borderColor}`);
      results.crmDashboard.statsCardBorder = borderColor;
    }

    // Check table headers
    const tableHeader = await page.locator('thead th, table th').first();
    if (await tableHeader.count() > 0) {
      const headerBg = await tableHeader.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`   • Table header background: ${headerBg}`);
      results.crmDashboard.tableHeader = headerBg;
    }

    // Check buttons
    const primaryButton = await page.locator('button.bg-blue-500, button.bg-\\[\\#4a90e2\\], button[class*="primary"]').first();
    if (await primaryButton.count() > 0) {
      const buttonBg = await primaryButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`   • Primary button background: ${buttonBg}`);
      results.crmDashboard.primaryButton = buttonBg;
    }

    // =======================
    // CHECK FOR ORANGE REMNANTS
    // =======================
    console.log('\n5. CHECKING FOR ORANGE COLOR REMNANTS');
    console.log('   -----------------------------------------');

    // Look for any orange colors that shouldn't be there
    const orangeElements = await page.locator('[class*="orange"], .bg-orange-500, .text-orange-500').all();
    if (orangeElements.length > 0) {
      console.log(`   ⚠ Found ${orangeElements.length} elements with orange classes`);
      for (const el of orangeElements.slice(0, 3)) {
        const className = await el.getAttribute('class');
        console.log(`     - Element with class: ${className}`);
      }
    } else {
      console.log('   ✓ No orange class remnants found');
    }

    // Check computed styles for orange colors
    const allElements = await page.locator('*').all();
    let orangeCount = 0;
    for (const el of allElements.slice(0, 100)) { // Check first 100 elements
      try {
        const styles = await el.evaluate(elem => {
          const computed = window.getComputedStyle(elem);
          return {
            bg: computed.backgroundColor,
            color: computed.color,
            border: computed.borderColor
          };
        });

        // Check if any color contains orange-ish values (rgb with high red, medium green, low blue)
        const isOrange = (color) => {
          if (!color || color === 'rgba(0, 0, 0, 0)') return false;
          const match = color.match(/rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const [_, r, g, b] = match.map(Number);
            return r > 200 && g > 100 && g < 180 && b < 100;
          }
          return false;
        };

        if (isOrange(styles.bg) || isOrange(styles.color) || isOrange(styles.border)) {
          orangeCount++;
          if (orangeCount <= 3) {
            const tagName = await el.evaluate(e => e.tagName);
            console.log(`   ⚠ Found orange color on ${tagName} element:`, styles);
          }
        }
      } catch (e) {
        // Skip elements that can't be evaluated
      }
    }

    if (orangeCount > 0) {
      console.log(`   ⚠ Total elements with orange colors: ${orangeCount}`);
    } else {
      console.log('   ✓ No orange colors detected in computed styles');
    }

    // =======================
    // CONSOLE ERRORS CHECK
    // =======================
    console.log('\n6. CHECKING FOR CONSOLE ERRORS');
    console.log('   -----------------------------------------');

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to a few pages to collect any errors
    await page.goto('http://localhost:3004/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      console.log(`   ⚠ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(err => console.log(`     - ${err}`));
      results.errors = consoleErrors;
    } else {
      console.log('   ✓ No console errors detected');
    }

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.message);
    results.errors.push(error.message);
  }

  // =======================
  // FINAL SUMMARY
  // =======================
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');

  console.log('PUBLIC WEBSITE (Expected: Electric Blue #0066ff):');
  console.log('  • Save 20% badge:', results.publicWebsite.save20Badge || 'Not found');
  console.log('  • Most Popular badge:', results.publicWebsite.popularBadge || 'Not found');
  console.log('  • Pricing card border:', results.publicWebsite.pricingCardBorder || 'Not found');
  console.log('  • Secondary CTA:', JSON.stringify(results.publicWebsite.secondaryCTA) || 'Not found');
  console.log('  • FAQ arrow:', results.publicWebsite.faqArrow || 'Not found');

  console.log('\nCRM DASHBOARD (Expected: Sky Blue #4a90e2):');
  console.log('  • Active nav:', results.crmDashboard.activeNav || 'Not found');
  console.log('  • Stats card border:', results.crmDashboard.statsCardBorder || 'Not found');
  console.log('  • Table header:', results.crmDashboard.tableHeader || 'Not found');
  console.log('  • Primary button:', results.crmDashboard.primaryButton || 'Not found');

  console.log('\nSCREENSHOTS SAVED:');
  results.screenshots.forEach(s => console.log(`  • ${s}`));

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    results.errors.forEach(e => console.log(`  • ${e}`));
  }

  console.log('\n========================================\n');

  // Check if colors match expected values
  const electricBlueVariants = ['rgb(0, 102, 255)', '#0066ff', 'rgba(0, 102, 255'];
  const skyBlueVariants = ['rgb(74, 144, 226)', '#4a90e2', 'rgba(74, 144, 226'];

  const publicHasBlue = Object.values(results.publicWebsite).some(color =>
    typeof color === 'string' && electricBlueVariants.some(variant => color.includes(variant))
  );

  const dashboardHasBlue = Object.values(results.crmDashboard).some(color =>
    typeof color === 'string' && skyBlueVariants.some(variant => color.includes(variant))
  );

  if (publicHasBlue && dashboardHasBlue) {
    console.log('✅ BLUE COLORS ARE PROPERLY IMPLEMENTED!');
  } else if (!publicHasBlue && !dashboardHasBlue) {
    console.log('❌ BLUE COLORS NOT DETECTED - Still showing default/orange colors');
  } else {
    console.log('⚠️  PARTIAL IMPLEMENTATION:');
    console.log(`  • Public website has blue: ${publicHasBlue ? 'Yes' : 'No'}`);
    console.log(`  • CRM dashboard has blue: ${dashboardHasBlue ? 'Yes' : 'No'}`);
  }

  await browser.close();
}

// Run the test
verifyBlueColors().catch(console.error);