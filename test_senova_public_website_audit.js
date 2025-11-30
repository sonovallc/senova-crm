const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// List of all pages to test
const PAGES_TO_TEST = [
  // Core Pages
  { url: '/', name: 'Home', category: 'Core' },
  { url: '/platform', name: 'Platform', category: 'Core' },
  { url: '/pricing', name: 'Pricing', category: 'Core' },
  { url: '/about', name: 'About', category: 'Core' },
  { url: '/contact', name: 'Contact', category: 'Core', hasForm: true },

  // Solution Pages
  { url: '/solutions/crm', name: 'CRM Solution', category: 'Solutions' },
  { url: '/solutions/audience-intelligence', name: 'Audience Intelligence', category: 'Solutions' },
  { url: '/solutions/patient-identification', name: 'Patient Identification', category: 'Solutions' },
  { url: '/solutions/visitor-identification', name: 'Visitor Identification', category: 'Solutions' },
  { url: '/solutions/campaign-activation', name: 'Campaign Activation', category: 'Solutions' },
  { url: '/solutions/analytics', name: 'Analytics', category: 'Solutions' },

  // Industry Pages
  { url: '/industries/medical-spas', name: 'Medical Spas', category: 'Industries' },
  { url: '/industries/dermatology', name: 'Dermatology', category: 'Industries' },
  { url: '/industries/plastic-surgery', name: 'Plastic Surgery', category: 'Industries' },
  { url: '/industries/aesthetic-clinics', name: 'Aesthetic Clinics', category: 'Industries' },
  { url: '/industries/restaurants', name: 'Restaurants', category: 'Industries' },
  { url: '/industries/home-services', name: 'Home Services', category: 'Industries' },
  { url: '/industries/retail', name: 'Retail', category: 'Industries' },
  { url: '/industries/professional-services', name: 'Professional Services', category: 'Industries' },

  // Legal Pages
  { url: '/privacy-policy', name: 'Privacy Policy', category: 'Legal' },
  { url: '/terms-of-service', name: 'Terms of Service', category: 'Legal' },
  { url: '/hipaa', name: 'HIPAA', category: 'Legal' },
  { url: '/security', name: 'Security', category: 'Legal' },
  { url: '/compliance', name: 'Compliance', category: 'Legal' },

  // Auth Pages
  { url: '/login', name: 'Login', category: 'Auth', hasForm: true },
  { url: '/register', name: 'Register', category: 'Auth', hasForm: true },

  // Placeholder Pages
  { url: '/blog', name: 'Blog', category: 'Placeholder' },
  { url: '/case-studies', name: 'Case Studies', category: 'Placeholder' },
  { url: '/roi-calculator', name: 'ROI Calculator', category: 'Placeholder' },
  { url: '/docs', name: 'Documentation', category: 'Placeholder' }
];

async function auditSenovaWebsite() {
  console.log('=====================================');
  console.log('SENOVA CRM PUBLIC WEBSITE AUDIT');
  console.log('Testing 30 pages for functionality');
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: false,
    timeout: 60000
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots', 'senova-audit');
  await fs.mkdir(screenshotsDir, { recursive: true });

  const results = [];
  const issues = {
    fourOhFour: [],
    consoleErrors: [],
    brokenImages: [],
    colorViolations: [],
    missingContent: [],
    brokenCTAs: [],
    formErrors: []
  };

  // Test each page
  for (let i = 0; i < PAGES_TO_TEST.length; i++) {
    const testPage = PAGES_TO_TEST[i];
    const fullUrl = `http://localhost:3004${testPage.url}`;

    console.log(`\n[${i + 1}/${PAGES_TO_TEST.length}] Testing: ${testPage.name} (${testPage.url})`);
    console.log('Category:', testPage.category);

    const pageResult = {
      url: testPage.url,
      name: testPage.name,
      category: testPage.category,
      status: 'PASS',
      issues: [],
      consoleErrors: [],
      timestamp: new Date().toISOString()
    };

    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    try {
      // Navigate to page with generous timeout
      console.log('  - Navigating to page...');
      const response = await page.goto(fullUrl, {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // Check for 404
      if (response.status() === 404) {
        console.log('  ❌ 404 ERROR');
        pageResult.status = 'FAIL';
        pageResult.issues.push('404 Page Not Found');
        issues.fourOhFour.push(testPage.url);
      } else {
        console.log(`  ✓ Page loaded (Status: ${response.status()})`);
      }

      // Wait for page to stabilize
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotName = `${testPage.url.replace(/\//g, '_').substring(1) || 'home'}.png`;
      await page.screenshot({
        path: path.join(screenshotsDir, screenshotName),
        fullPage: true
      });
      console.log('  ✓ Screenshot captured');

      // Check for console errors
      if (consoleErrors.length > 0) {
        console.log(`  ⚠ Console errors found: ${consoleErrors.length}`);
        pageResult.consoleErrors = consoleErrors;
        pageResult.issues.push(`${consoleErrors.length} console errors`);
        issues.consoleErrors.push({ url: testPage.url, errors: consoleErrors });
      }

      // Check for broken images
      const brokenImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images
          .filter(img => !img.complete || img.naturalWidth === 0)
          .map(img => img.src);
      });

      if (brokenImages.length > 0) {
        console.log(`  ⚠ Broken images: ${brokenImages.length}`);
        pageResult.issues.push(`${brokenImages.length} broken images`);
        issues.brokenImages.push({ url: testPage.url, images: brokenImages });
      }

      // Check for purple or green colors
      const colorViolations = await page.evaluate(() => {
        const violations = [];
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const color = styles.color;

          // Check for purple (rgb values where red and blue are high, green is low)
          // or green (rgb where green is dominant)
          const checkColor = (colorStr) => {
            if (!colorStr || colorStr === 'rgba(0, 0, 0, 0)') return false;

            const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const [_, r, g, b] = match.map(Number);

              // Purple detection: high red + blue, low green
              if ((r > 100 && b > 100 && g < 80) ||
                  (r > 150 && b > 150)) {
                return 'purple';
              }

              // Green detection: green dominant
              if (g > 100 && g > r + 30 && g > b + 30) {
                return 'green';
              }
            }
            return false;
          };

          const bgViolation = checkColor(bgColor);
          const textViolation = checkColor(color);

          if (bgViolation) {
            violations.push({
              element: el.tagName + (el.className ? `.${el.className}` : ''),
              type: 'background',
              color: bgViolation,
              value: bgColor
            });
          }

          if (textViolation) {
            violations.push({
              element: el.tagName + (el.className ? `.${el.className}` : ''),
              type: 'text',
              color: textViolation,
              value: color
            });
          }
        });

        return violations.slice(0, 5); // Limit to first 5 violations
      });

      if (colorViolations.length > 0) {
        console.log(`  ⚠ Color violations found: ${colorViolations.length}`);
        pageResult.issues.push(`Color violations: ${colorViolations.map(v => v.color).join(', ')}`);
        issues.colorViolations.push({ url: testPage.url, violations: colorViolations });
      }

      // Check for proper content (not just "Coming Soon")
      const pageContent = await page.textContent('body');
      if (pageContent.includes('Coming Soon') ||
          pageContent.includes('Under Construction') ||
          pageContent.includes('Page not found')) {
        console.log('  ⚠ Page has placeholder content');
        pageResult.issues.push('Placeholder content');
        issues.missingContent.push(testPage.url);
      }

      // Test CTA buttons
      const ctaButtons = await page.$$('button, a[href]:not([href=""]):not([href="#"])');
      if (ctaButtons.length > 0) {
        console.log(`  - Found ${ctaButtons.length} clickable elements`);

        // Test first CTA button
        try {
          const firstCTA = ctaButtons[0];
          const ctaText = await firstCTA.textContent();
          console.log(`  - Testing first CTA: "${ctaText?.trim()}"`);

          // Check if clickable
          const isClickable = await firstCTA.isVisible() && await firstCTA.isEnabled();
          if (!isClickable) {
            console.log('  ⚠ First CTA is not clickable');
            pageResult.issues.push('CTA not clickable');
            issues.brokenCTAs.push(testPage.url);
          } else {
            console.log('  ✓ CTA is clickable');
          }
        } catch (ctaError) {
          console.log('  ⚠ Error testing CTA:', ctaError.message);
        }
      }

      // Special tests for specific pages
      if (testPage.url === '/contact' && testPage.hasForm) {
        console.log('  - Testing contact form...');
        try {
          // Check if form exists
          const form = await page.$('form');
          if (form) {
            // Try to fill form fields
            await page.fill('input[name="name"], input[type="text"]', 'Test User', { timeout: 3000 }).catch(() => {});
            await page.fill('input[name="email"], input[type="email"]', 'test@example.com', { timeout: 3000 }).catch(() => {});
            await page.fill('textarea, input[name="message"]', 'Test message', { timeout: 3000 }).catch(() => {});

            console.log('  ✓ Contact form fields filled');

            // Try to submit (but don't actually submit in case it sends emails)
            const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
              console.log('  ✓ Submit button found');
            }
          } else {
            console.log('  ⚠ No form found on contact page');
            pageResult.issues.push('No contact form found');
            issues.formErrors.push(testPage.url);
          }
        } catch (formError) {
          console.log('  ⚠ Error testing form:', formError.message);
          issues.formErrors.push(testPage.url);
        }
      }

      if (testPage.url === '/login' && testPage.hasForm) {
        console.log('  - Testing login form...');
        try {
          // Fill login form
          await page.fill('input[type="email"], input[name="email"]', 'admin@evebeautyma.com', { timeout: 3000 });
          await page.fill('input[type="password"], input[name="password"]', 'TestPass123!', { timeout: 3000 });

          console.log('  ✓ Login form fields filled');

          // Find login button but don't click
          const loginBtn = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
          if (loginBtn) {
            console.log('  ✓ Login button found');
          } else {
            console.log('  ⚠ No login button found');
            pageResult.issues.push('No login button');
          }
        } catch (loginError) {
          console.log('  ⚠ Error testing login:', loginError.message);
          issues.formErrors.push(testPage.url);
        }
      }

      if (testPage.url === '/pricing') {
        console.log('  - Testing pricing CTAs...');
        try {
          const pricingCTAs = await page.$$('button:has-text("Start"), button:has-text("Get Started"), a:has-text("Start"), a:has-text("Get Started")');
          if (pricingCTAs.length > 0) {
            console.log(`  ✓ Found ${pricingCTAs.length} pricing CTAs`);

            // Test first pricing CTA
            const firstPricingCTA = pricingCTAs[0];
            const isClickable = await firstPricingCTA.isVisible() && await firstPricingCTA.isEnabled();
            if (isClickable) {
              console.log('  ✓ Pricing CTA is clickable');
            } else {
              console.log('  ⚠ Pricing CTA not clickable');
              pageResult.issues.push('Pricing CTA not clickable');
            }
          } else {
            console.log('  ⚠ No pricing CTAs found');
            pageResult.issues.push('No pricing CTAs');
          }
        } catch (pricingError) {
          console.log('  ⚠ Error testing pricing:', pricingError.message);
        }
      }

      // Determine overall status
      if (pageResult.issues.length === 0) {
        pageResult.status = 'PASS';
        console.log('  ✅ PAGE PASSED ALL CHECKS');
      } else {
        pageResult.status = 'FAIL';
        console.log(`  ❌ PAGE HAS ISSUES: ${pageResult.issues.join(', ')}`);
      }

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      pageResult.status = 'ERROR';
      pageResult.issues.push(`Test error: ${error.message}`);
    }

    results.push(pageResult);

    // Clear event listeners for next page
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }

  // Generate summary report
  console.log('\n=====================================');
  console.log('AUDIT SUMMARY REPORT');
  console.log('=====================================\n');

  const passedPages = results.filter(r => r.status === 'PASS').length;
  const failedPages = results.filter(r => r.status === 'FAIL').length;
  const errorPages = results.filter(r => r.status === 'ERROR').length;

  console.log(`Total Pages Tested: ${results.length}`);
  console.log(`✅ Passed: ${passedPages}`);
  console.log(`❌ Failed: ${failedPages}`);
  console.log(`⚠️  Errors: ${errorPages}`);
  console.log(`Pass Rate: ${((passedPages / results.length) * 100).toFixed(1)}%\n`);

  // Report issues by category
  console.log('ISSUES FOUND:');
  console.log('=============');

  if (issues.fourOhFour.length > 0) {
    console.log(`\n🔴 404 ERRORS (${issues.fourOhFour.length} pages):`);
    issues.fourOhFour.forEach(url => console.log(`  - ${url}`));
  }

  if (issues.consoleErrors.length > 0) {
    console.log(`\n⚠️  CONSOLE ERRORS (${issues.consoleErrors.length} pages):`);
    issues.consoleErrors.forEach(item => {
      console.log(`  - ${item.url}: ${item.errors.length} errors`);
      item.errors.slice(0, 2).forEach(err => console.log(`    • ${err.substring(0, 100)}`));
    });
  }

  if (issues.brokenImages.length > 0) {
    console.log(`\n🖼️  BROKEN IMAGES (${issues.brokenImages.length} pages):`);
    issues.brokenImages.forEach(item => {
      console.log(`  - ${item.url}: ${item.images.length} broken images`);
    });
  }

  if (issues.colorViolations.length > 0) {
    console.log(`\n🎨 COLOR VIOLATIONS (${issues.colorViolations.length} pages):`);
    issues.colorViolations.forEach(item => {
      console.log(`  - ${item.url}:`);
      item.violations.slice(0, 2).forEach(v =>
        console.log(`    • ${v.element} has ${v.color} ${v.type}`)
      );
    });
  }

  if (issues.missingContent.length > 0) {
    console.log(`\n📄 PLACEHOLDER CONTENT (${issues.missingContent.length} pages):`);
    issues.missingContent.forEach(url => console.log(`  - ${url}`));
  }

  if (issues.brokenCTAs.length > 0) {
    console.log(`\n🔘 BROKEN CTAs (${issues.brokenCTAs.length} pages):`);
    issues.brokenCTAs.forEach(url => console.log(`  - ${url}`));
  }

  if (issues.formErrors.length > 0) {
    console.log(`\n📝 FORM ERRORS (${issues.formErrors.length} pages):`);
    issues.formErrors.forEach(url => console.log(`  - ${url}`));
  }

  // Report by category
  console.log('\n\nRESULTS BY CATEGORY:');
  console.log('====================');

  const categories = [...new Set(results.map(r => r.category))];
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.status === 'PASS').length;
    console.log(`\n${cat}:`);
    console.log(`  Total: ${catResults.length} | Passed: ${catPassed} | Failed: ${catResults.length - catPassed}`);

    catResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      const issueText = r.issues.length > 0 ? ` - Issues: ${r.issues.join(', ')}` : '';
      console.log(`  ${icon} ${r.name} (${r.url})${issueText}`);
    });
  });

  // Save detailed report
  const report = {
    summary: {
      totalPages: results.length,
      passed: passedPages,
      failed: failedPages,
      errors: errorPages,
      passRate: ((passedPages / results.length) * 100).toFixed(1) + '%',
      timestamp: new Date().toISOString()
    },
    issues: issues,
    detailedResults: results,
    screenshotsPath: screenshotsDir
  };

  await fs.writeFile(
    path.join(__dirname, 'SENOVA_PUBLIC_WEBSITE_AUDIT_REPORT.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n\n✅ Audit complete!');
  console.log(`📸 Screenshots saved to: ${screenshotsDir}`);
  console.log('📊 Detailed report saved to: SENOVA_PUBLIC_WEBSITE_AUDIT_REPORT.json');

  await browser.close();

  // Return summary for quick reference
  return {
    passed: passedPages === results.length,
    summary: `${passedPages}/${results.length} pages passed`,
    criticalIssues: issues.fourOhFour.length + issues.formErrors.length,
    colorViolations: issues.colorViolations.length > 0
  };
}

// Run the audit
auditSenovaWebsite()
  .then(result => {
    console.log('\n\nFINAL STATUS:', result.passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    process.exit(result.passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Audit failed with error:', error);
    process.exit(1);
  });