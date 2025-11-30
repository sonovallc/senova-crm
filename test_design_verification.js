const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Pages to test
const PAGES_TO_TEST = [
  { url: '/', name: 'home', description: 'Home page' },
  { url: '/about', name: 'about', description: 'About page' },
  { url: '/platform', name: 'platform', description: 'Platform page' },
  { url: '/pricing', name: 'pricing', description: 'Pricing page' },
  { url: '/contact', name: 'contact', description: 'Contact page' },
  { url: '/demo', name: 'demo', description: 'Demo request page' },
  { url: '/solutions/crm', name: 'crm', description: 'CRM solution' },
  { url: '/solutions/audience-intelligence', name: 'audience-intelligence', description: 'Audience intelligence' },
  { url: '/solutions/visitor-identification', name: 'visitor-identification', description: 'Visitor identification' },
  { url: '/solutions/campaign-activation', name: 'campaign-activation', description: 'Campaign activation' },
  { url: '/solutions/analytics', name: 'analytics', description: 'Analytics solution' },
  { url: '/industries/restaurants', name: 'restaurants', description: 'Restaurants industry' },
  { url: '/industries/home-services', name: 'home-services', description: 'Home services industry' },
  { url: '/industries/retail', name: 'retail', description: 'Retail industry' },
  { url: '/industries/professional-services', name: 'professional-services', description: 'Professional services' },
  { url: '/privacy-policy', name: 'privacy-policy', description: 'Privacy policy' },
  { url: '/terms-of-service', name: 'terms-of-service', description: 'Terms of service' }
];

// Colors to check for (should NOT exist)
const FORBIDDEN_COLORS = {
  purple: ['#4A00D4', 'rgb(74, 0, 212)', '#9333ea', '#a855f7'],
  green: ['#B4F9B2', 'rgb(180, 249, 178)', '#10b981', '#22c55e']
};

// Expected colors
const EXPECTED_COLORS = {
  navy: ['#0f172a', 'rgb(15, 23, 42)'],
  gold: ['#d4a574', 'rgb(212, 165, 116)']
};

// Forbidden medical terms
const FORBIDDEN_TERMS = [
  'patient', 'medical', 'clinic', 'aesthetic', 'HIPAA',
  'dermatology', 'surgery', 'doctor', 'physician', 'treatment'
];

// Expected industries
const EXPECTED_INDUSTRIES = ['Restaurants', 'Home Services', 'Retail', 'Professional Services'];

async function testDesignChanges() {
  console.log('Starting Senova CRM Design Verification...');
  console.log('================================================\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  const results = [];

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // Test each page
  for (const pageInfo of PAGES_TO_TEST) {
    console.log(`\nTesting: ${pageInfo.description} (${pageInfo.url})`);
    console.log('-'.repeat(50));

    const pageResult = {
      url: pageInfo.url,
      name: pageInfo.name,
      description: pageInfo.description,
      status: null,
      issues: [],
      checks: {
        pageLoads: false,
        noConsoleErrors: false,
        colorSchemeCorrect: false,
        fontsCorrect: false,
        noMedicalLanguage: false,
        imagesLoad: false,
        navigationWorks: false,
        mobileResponsive: false
      }
    };

    try {
      // Clear console errors for this page
      consoleErrors.length = 0;

      // Navigate to page
      const response = await page.goto(`http://localhost:3004${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      pageResult.status = response.status();
      pageResult.checks.pageLoads = response.status() === 200;

      console.log(`  Status: ${response.status()}`);

      if (response.status() === 200) {
        // Wait for page to fully load
        await page.waitForTimeout(2000);

        // Check for console errors
        pageResult.checks.noConsoleErrors = consoleErrors.length === 0;
        if (consoleErrors.length > 0) {
          pageResult.issues.push(`Console errors: ${consoleErrors.map(e => e.text).join(', ')}`);
          console.log(`  ❌ Console errors found: ${consoleErrors.length}`);
        } else {
          console.log(`  ✓ No console errors`);
        }

        // Check color scheme
        const colorCheckResult = await page.evaluate((forbidden, expected) => {
          const elements = document.querySelectorAll('*');
          const foundForbidden = [];
          const foundExpected = [];

          elements.forEach(el => {
            const styles = window.getComputedStyle(el);
            const bgColor = styles.backgroundColor;
            const color = styles.color;
            const borderColor = styles.borderColor;

            // Check for forbidden colors
            Object.entries(forbidden).forEach(([colorName, values]) => {
              values.forEach(value => {
                if (bgColor.includes(value) || color.includes(value) || borderColor.includes(value)) {
                  foundForbidden.push({ element: el.tagName, colorName, value, property: 'various' });
                }
              });
            });

            // Check for expected colors
            Object.entries(expected).forEach(([colorName, values]) => {
              values.forEach(value => {
                if (bgColor.includes(value) || color.includes(value) || borderColor.includes(value)) {
                  foundExpected.push({ colorName, found: true });
                }
              });
            });
          });

          return { foundForbidden, hasExpectedColors: foundExpected.length > 0 };
        }, FORBIDDEN_COLORS, EXPECTED_COLORS);

        if (colorCheckResult.foundForbidden.length > 0) {
          pageResult.issues.push(`Forbidden colors found: ${colorCheckResult.foundForbidden.map(f => f.colorName).join(', ')}`);
          console.log(`  ❌ Forbidden colors found`);
        } else {
          console.log(`  ✓ No forbidden colors`);
        }

        pageResult.checks.colorSchemeCorrect = colorCheckResult.foundForbidden.length === 0 && colorCheckResult.hasExpectedColors;

        // Check fonts
        const fontCheck = await page.evaluate(() => {
          const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, span');
          let hasPlayfair = false;
          let hasJakarta = false;

          elements.forEach(el => {
            const fontFamily = window.getComputedStyle(el).fontFamily.toLowerCase();
            if (fontFamily.includes('playfair')) hasPlayfair = true;
            if (fontFamily.includes('jakarta')) hasJakarta = true;
          });

          return { hasPlayfair, hasJakarta };
        });

        pageResult.checks.fontsCorrect = fontCheck.hasPlayfair || fontCheck.hasJakarta;
        console.log(`  Fonts - Playfair: ${fontCheck.hasPlayfair ? '✓' : '✗'}, Jakarta: ${fontCheck.hasJakarta ? '✓' : '✗'}`);

        // Check for medical language
        const textContent = await page.textContent('body');
        const foundForbiddenTerms = FORBIDDEN_TERMS.filter(term =>
          textContent.toLowerCase().includes(term.toLowerCase())
        );

        if (foundForbiddenTerms.length > 0) {
          pageResult.issues.push(`Medical terms found: ${foundForbiddenTerms.join(', ')}`);
          console.log(`  ❌ Medical terms found: ${foundForbiddenTerms.join(', ')}`);
        } else {
          console.log(`  ✓ No medical terms`);
        }
        pageResult.checks.noMedicalLanguage = foundForbiddenTerms.length === 0;

        // Check images
        const imageCheck = await page.evaluate(() => {
          const images = document.querySelectorAll('img');
          let total = images.length;
          let loaded = 0;
          let broken = [];

          images.forEach(img => {
            if (img.complete && img.naturalHeight !== 0) {
              loaded++;
            } else {
              broken.push(img.src);
            }
          });

          return { total, loaded, broken };
        });

        pageResult.checks.imagesLoad = imageCheck.broken.length === 0;
        console.log(`  Images - Total: ${imageCheck.total}, Loaded: ${imageCheck.loaded}, Broken: ${imageCheck.broken.length}`);

        if (imageCheck.broken.length > 0) {
          pageResult.issues.push(`Broken images: ${imageCheck.broken.length}`);
        }

        // Check navigation
        const navLinks = await page.$$eval('nav a, header a', links =>
          links.map(a => ({ href: a.href, text: a.textContent.trim() }))
        );
        pageResult.checks.navigationWorks = navLinks.length > 0;
        console.log(`  Navigation links found: ${navLinks.length}`);

        // Check mobile responsive
        await context.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);

        const mobileCheck = await page.evaluate(() => {
          const viewport = window.innerWidth;
          const hasHorizontalScroll = document.documentElement.scrollWidth > viewport;
          return !hasHorizontalScroll;
        });

        pageResult.checks.mobileResponsive = mobileCheck;
        console.log(`  Mobile responsive: ${mobileCheck ? '✓' : '✗'}`);

        // Reset viewport
        await context.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // Take screenshot
        const screenshotPath = `C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\design-verification\\${pageInfo.name}-${Date.now()}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: pageInfo.name === 'home' // Full page for home, viewport for others
        });
        console.log(`  Screenshot saved: ${pageInfo.name}`);

      } else {
        pageResult.issues.push(`Page returned ${response.status()} status`);
      }

    } catch (error) {
      console.error(`  Error testing page: ${error.message}`);
      pageResult.issues.push(`Error: ${error.message}`);
    }

    results.push(pageResult);
  }

  // Generate summary
  console.log('\n\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  const totalPages = results.length;
  const successfulPages = results.filter(r => r.status === 200).length;
  const passedAllChecks = results.filter(r =>
    Object.values(r.checks).every(check => check === true)
  ).length;

  console.log(`\nPages Tested: ${totalPages}`);
  console.log(`Pages Loaded (200 status): ${successfulPages}/${totalPages}`);
  console.log(`Pages Passing All Checks: ${passedAllChecks}/${totalPages}`);
  console.log(`Overall Pass Rate: ${((passedAllChecks/totalPages) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n' + '-'.repeat(60));
  console.log('DETAILED RESULTS BY PAGE:');
  console.log('-'.repeat(60));

  results.forEach(result => {
    const checksPass = Object.values(result.checks).filter(c => c === true).length;
    const totalChecks = Object.keys(result.checks).length;
    const status = checksPass === totalChecks ? '✅ PASS' : '❌ FAIL';

    console.log(`\n${result.description} (${result.url})`);
    console.log(`  Status: ${result.status} | Overall: ${status} (${checksPass}/${totalChecks} checks)`);

    if (result.issues.length > 0) {
      console.log(`  Issues:`);
      result.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    console.log(`  Checks:`);
    Object.entries(result.checks).forEach(([check, passed]) => {
      console.log(`    ${passed ? '✓' : '✗'} ${check}`);
    });
  });

  // Save detailed report
  const reportPath = `C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\DEBUG_REPORT_DESIGN_VERIFICATION_${Date.now()}.json`;
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\nDetailed report saved to: ${reportPath}`);

  await browser.close();

  return results;
}

// Run the test
testDesignChanges().catch(console.error);