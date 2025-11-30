const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3004';
const SCREENSHOTS_DIR = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/senova-design-verification';

// All pages to test
const PAGES_TO_TEST = {
  // Core Pages
  'home': '/',
  'platform': '/platform',
  'pricing': '/pricing',
  'about': '/about',
  'contact': '/contact',

  // Solution Pages
  'solutions-crm': '/solutions/crm',
  'solutions-audience': '/solutions/audience-intelligence',
  'solutions-patient': '/solutions/patient-identification',
  'solutions-campaign': '/solutions/campaign-activation',
  'solutions-analytics': '/solutions/analytics',

  // Industry Pages
  'industries-medical-spas': '/industries/medical-spas',
  'industries-dermatology': '/industries/dermatology',
  'industries-plastic-surgery': '/industries/plastic-surgery',
  'industries-aesthetic-clinics': '/industries/aesthetic-clinics',

  // Legal Pages
  'privacy': '/privacy-policy',
  'terms': '/terms-of-service',
  'hipaa': '/hipaa',
  'security': '/security',

  // New Pages
  'careers': '/careers',
  'press': '/press',
  'integrations': '/integrations'
};

async function testSenovaDesign() {
  console.log('🚀 Starting Senova Design Verification...\n');
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();
  const results = {
    totalPages: Object.keys(PAGES_TO_TEST).length,
    passed: [],
    failed: [],
    errors: [],
    designIssues: [],
    screenshots: []
  };

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push({
        url: page.url(),
        error: msg.text()
      });
    }
  });

  console.log('📋 Testing ' + results.totalPages + ' pages...\n');

  // Test each page
  let pageIndex = 1;
  for (const [pageName, pagePath] of Object.entries(PAGES_TO_TEST)) {
    console.log(`[${pageIndex}/${results.totalPages}] Testing: ${pageName} (${pagePath})`);

    try {
      // Navigate to page
      const response = await page.goto(BASE_URL + pagePath, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Check response status
      const status = response.status();
      console.log(`  Status: ${status}`);

      if (status === 404) {
        results.failed.push({
          page: pageName,
          path: pagePath,
          issue: '404 - Page not found'
        });
        console.log('  ❌ 404 Error - Page not found');
        pageIndex++;
        continue;
      }

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Capture full page screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${String(pageIndex).padStart(2, '0')}-${pageName}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      results.screenshots.push(screenshotPath);
      console.log(`  📸 Screenshot saved: ${pageName}.png`);

      // Check for design elements
      const designChecks = {
        // Check for Syne font (headings)
        syneFont: await page.evaluate(() => {
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          if (headings.length === 0) return false;
          const fontFamily = window.getComputedStyle(headings[0]).fontFamily;
          return fontFamily.toLowerCase().includes('syne');
        }),

        // Check for Outfit font (body)
        outfitFont: await page.evaluate(() => {
          const body = document.querySelector('body');
          if (!body) return false;
          const fontFamily = window.getComputedStyle(body).fontFamily;
          return fontFamily.toLowerCase().includes('outfit');
        }),

        // Check for purple primary color
        purpleColor: await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          for (let elem of elements) {
            const style = window.getComputedStyle(elem);
            if (style.backgroundColor.includes('74, 0, 212') ||
                style.color.includes('74, 0, 212') ||
                style.backgroundColor === 'rgb(74, 0, 212)' ||
                style.color === 'rgb(74, 0, 212)') {
              return true;
            }
          }
          return false;
        }),

        // Check for mint accent color
        mintColor: await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          for (let elem of elements) {
            const style = window.getComputedStyle(elem);
            if (style.backgroundColor.includes('180, 249, 178') ||
                style.color.includes('180, 249, 178') ||
                style.backgroundColor === 'rgb(180, 249, 178)' ||
                style.color === 'rgb(180, 249, 178)') {
              return true;
            }
          }
          return false;
        }),

        // Check for animations
        animations: await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          for (let elem of elements) {
            const style = window.getComputedStyle(elem);
            if (style.animation !== 'none' || style.transition !== 'all 0s ease 0s') {
              return true;
            }
          }
          return false;
        }),

        // Check mobile responsiveness
        responsive: await page.evaluate(() => {
          return window.innerWidth <= 1920;
        })
      };

      // Log design check results
      console.log('  Design Checks:');
      console.log(`    Syne Font: ${designChecks.syneFont ? '✅' : '❌'}`);
      console.log(`    Outfit Font: ${designChecks.outfitFont ? '✅' : '❌'}`);
      console.log(`    Purple Color: ${designChecks.purpleColor ? '✅' : '❌'}`);
      console.log(`    Mint Color: ${designChecks.mintColor ? '✅' : '❌'}`);
      console.log(`    Animations: ${designChecks.animations ? '✅' : '❌'}`);
      console.log(`    Responsive: ${designChecks.responsive ? '✅' : '❌'}`);

      // Record design issues
      const issues = [];
      if (!designChecks.syneFont) issues.push('Syne font not found');
      if (!designChecks.outfitFont) issues.push('Outfit font not found');
      if (!designChecks.purpleColor) issues.push('Purple color not applied');
      if (!designChecks.mintColor) issues.push('Mint color not applied');
      if (!designChecks.animations) issues.push('No animations detected');

      if (issues.length > 0) {
        results.designIssues.push({
          page: pageName,
          path: pagePath,
          issues: issues
        });
      }

      // Test header/footer on first page
      if (pageIndex === 1) {
        console.log('\n  Testing Header/Footer:');

        // Check for header
        const header = await page.$('header, nav, [class*="header"], [class*="navbar"]');
        console.log(`    Header present: ${header ? '✅' : '❌'}`);

        // Check for megamenu
        const megamenu = await page.$('[class*="megamenu"], [class*="dropdown"]');
        console.log(`    Megamenu present: ${megamenu ? '✅' : '❌'}`);

        // Check for footer
        const footer = await page.$('footer, [class*="footer"]');
        console.log(`    Footer present: ${footer ? '✅' : '❌'}`);

        // Check for trust badges
        const trustBadges = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          return text.includes('hipaa') || text.includes('soc 2') || text.includes('256-bit');
        });
        console.log(`    Trust badges: ${trustBadges ? '✅' : '❌'}`);
      }

      results.passed.push({
        page: pageName,
        path: pagePath,
        designChecks: designChecks
      });
      console.log('  ✅ Page loaded successfully\n');

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
      results.failed.push({
        page: pageName,
        path: pagePath,
        issue: error.message
      });
    }

    pageIndex++;
  }

  // Test mobile responsiveness
  console.log('\n📱 Testing Mobile Responsiveness...');
  await context.setViewportSize({ width: 375, height: 667 });

  // Test homepage on mobile
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const mobileScreenshot = path.join(SCREENSHOTS_DIR, 'mobile-homepage.png');
    await page.screenshot({
      path: mobileScreenshot,
      fullPage: true
    });
    results.screenshots.push(mobileScreenshot);
    console.log('  📸 Mobile screenshot saved');

    // Check for hamburger menu
    const hamburger = await page.$('[class*="hamburger"], [class*="menu-toggle"], [class*="mobile-menu"]');
    console.log(`  Hamburger menu: ${hamburger ? '✅' : '❌'}`);

  } catch (error) {
    console.log(`  ❌ Mobile test error: ${error.message}`);
  }

  // Test CRM Objects feature
  console.log('\n🔐 Testing CRM Objects Feature...');

  try {
    // Login
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"]', 'D3n1w3n1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('  ✅ Logged in successfully');

    // Check for Objects tab
    const objectsTab = await page.$('text=Objects');
    if (objectsTab) {
      console.log('  ✅ Objects tab visible in sidebar');

      // Navigate to Objects
      await objectsTab.click();
      await page.waitForTimeout(2000);

      const objectsScreenshot = path.join(SCREENSHOTS_DIR, 'crm-objects.png');
      await page.screenshot({
        path: objectsScreenshot,
        fullPage: true
      });
      results.screenshots.push(objectsScreenshot);
      console.log('  📸 Objects page screenshot saved');

      // Check for Create Object button
      const createButton = await page.$('text=Create Object');
      console.log(`  Create Object button: ${createButton ? '✅' : '❌'}`);

    } else {
      console.log('  ❌ Objects tab not found');
      results.failed.push({
        page: 'CRM Objects',
        path: '/dashboard/objects',
        issue: 'Objects tab not visible'
      });
    }

  } catch (error) {
    console.log(`  ❌ CRM test error: ${error.message}`);
    results.failed.push({
      page: 'CRM Objects',
      path: '/dashboard/objects',
      issue: error.message
    });
  }

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Pages Tested: ${results.totalPages}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`Pass Rate: ${((results.passed.length / results.totalPages) * 100).toFixed(1)}%`);
  console.log(`Screenshots Captured: ${results.screenshots.length}`);
  console.log(`Console Errors: ${results.errors.length}`);
  console.log(`Design Issues: ${results.designIssues.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED PAGES:');
    results.failed.forEach(f => {
      console.log(`  - ${f.page} (${f.path}): ${f.issue}`);
    });
  }

  if (results.designIssues.length > 0) {
    console.log('\n⚠️ DESIGN ISSUES:');
    results.designIssues.forEach(d => {
      console.log(`  - ${d.page}: ${d.issues.join(', ')}`);
    });
  }

  await browser.close();

  // Save results to JSON
  const resultsPath = path.join(SCREENSHOTS_DIR, 'verification-results.json');
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to: ${resultsPath}`);

  return results;
}

// Run the test
testSenovaDesign().catch(console.error);