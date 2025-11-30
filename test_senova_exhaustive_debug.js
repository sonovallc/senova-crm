const { chromium } = require('playwright');
const fs = require('fs').promises;

// Screenshots directory
const SCREENSHOTS_DIR = 'screenshots/debug-senova-postfix';

// All pages to test
const PAGES_TO_TEST = [
  // Main Pages
  { name: 'Homepage', url: 'http://localhost:3004/', category: 'main' },
  { name: 'Platform', url: 'http://localhost:3004/platform', category: 'main' },
  { name: 'Pricing', url: 'http://localhost:3004/pricing', category: 'main' },
  { name: 'Demo', url: 'http://localhost:3004/demo', category: 'main' },
  { name: 'Contact', url: 'http://localhost:3004/contact', category: 'main' },
  { name: 'About', url: 'http://localhost:3004/about', category: 'main' },

  // Legal Pages
  { name: 'HIPAA', url: 'http://localhost:3004/hipaa', category: 'legal' },
  { name: 'Security', url: 'http://localhost:3004/security', category: 'legal' },
  { name: 'Privacy Policy', url: 'http://localhost:3004/privacy-policy', category: 'legal' },
  { name: 'Terms of Service', url: 'http://localhost:3004/terms-of-service', category: 'legal' },

  // Solution Pages
  { name: 'CRM Solution', url: 'http://localhost:3004/solutions/crm', category: 'solutions' },
  { name: 'Audience Intelligence', url: 'http://localhost:3004/solutions/audience-intelligence', category: 'solutions' },
  { name: 'Patient Identification', url: 'http://localhost:3004/solutions/patient-identification', category: 'solutions' },
  { name: 'Campaign Activation', url: 'http://localhost:3004/solutions/campaign-activation', category: 'solutions' },
  { name: 'Analytics', url: 'http://localhost:3004/solutions/analytics', category: 'solutions' },

  // Industry Pages
  { name: 'Medical Spas', url: 'http://localhost:3004/industries/medical-spas', category: 'industries' },
  { name: 'Dermatology', url: 'http://localhost:3004/industries/dermatology', category: 'industries' },
  { name: 'Plastic Surgery', url: 'http://localhost:3004/industries/plastic-surgery', category: 'industries' },
  { name: 'Aesthetic Clinics', url: 'http://localhost:3004/industries/aesthetic-clinics', category: 'industries' }
];

// Forbidden content patterns to check
const FORBIDDEN_PATTERNS = {
  soc2Certified: /SOC\s*2\s*Certified/gi,
  specificROI: /(\$100K|\$127K|\$180K|60%|67%|80%|3X|3\.2X)/g,
  guaranteedResults: /guaranteed\s+results?/gi,
  experienceClaims: /(30\+\s*years|500\+\s*(practices|clients))/gi
};

// Correct content patterns
const CORRECT_PATTERNS = {
  soc2Compliant: /SOC\s*2\s*(Type\s*II\s*)?Compliant/gi,
  email: /info@senovallc\.com|support@senovallc\.com/gi,
  address: /8 The Green #21994, Dover, DE 19901/gi
};

async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log(`✓ Screenshots directory ready: ${SCREENSHOTS_DIR}`);
  } catch (err) {
    console.error('Error creating screenshots directory:', err);
  }
}

async function testPage(page, pageInfo) {
  const results = {
    name: pageInfo.name,
    url: pageInfo.url,
    category: pageInfo.category,
    status: 'untested',
    errors: [],
    violations: [],
    buttons: [],
    links: [],
    forms: [],
    dropdowns: [],
    screenshots: []
  };

  const timestamp = Date.now();

  try {
    console.log(`\n📍 Testing: ${pageInfo.name} (${pageInfo.url})`);

    // Navigate to page with timeout
    const response = await page.goto(pageInfo.url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check response status
    const status = response ? response.status() : 0;
    if (status >= 400) {
      results.status = 'error';
      results.errors.push(`HTTP ${status} error`);
      console.log(`  ❌ HTTP ${status} error`);
      return results;
    }

    // Take initial screenshot
    const screenshotPath = `${SCREENSHOTS_DIR}/${pageInfo.category}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-initial-${timestamp}.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    results.screenshots.push(screenshotPath);
    console.log(`  📸 Screenshot: ${screenshotPath}`);

    // Get page content
    const content = await page.content();

    // Check for forbidden content
    console.log('  🔍 Checking content compliance...');

    // Check SOC 2 language
    const soc2CertifiedMatches = content.match(FORBIDDEN_PATTERNS.soc2Certified);
    if (soc2CertifiedMatches) {
      results.violations.push({
        type: 'SOC 2 Certified',
        found: soc2CertifiedMatches,
        severity: 'critical'
      });
      console.log(`    ❌ Found "SOC 2 Certified" (should be "Compliant")`);
    }

    // Check for specific ROI guarantees
    const roiMatches = content.match(FORBIDDEN_PATTERNS.specificROI);
    if (roiMatches) {
      results.violations.push({
        type: 'Specific ROI Guarantees',
        found: roiMatches,
        severity: 'critical'
      });
      console.log(`    ❌ Found specific ROI guarantees: ${roiMatches.join(', ')}`);
    }

    // Check for guaranteed results
    const guaranteedMatches = content.match(FORBIDDEN_PATTERNS.guaranteedResults);
    if (guaranteedMatches) {
      results.violations.push({
        type: 'Guaranteed Results',
        found: guaranteedMatches,
        severity: 'critical'
      });
      console.log(`    ❌ Found "guaranteed results" claims`);
    }

    // Check for experience claims
    const experienceMatches = content.match(FORBIDDEN_PATTERNS.experienceClaims);
    if (experienceMatches) {
      results.violations.push({
        type: 'Experience Claims',
        found: experienceMatches,
        severity: 'warning'
      });
      console.log(`    ⚠️ Found experience claims: ${experienceMatches.join(', ')}`);
    }

    // Find and test all buttons
    const buttons = await page.$$('button, [role="button"]');
    console.log(`  🔘 Found ${buttons.length} buttons`);

    for (let i = 0; i < buttons.length; i++) {
      try {
        const buttonText = await buttons[i].textContent();
        const isVisible = await buttons[i].isVisible();
        results.buttons.push({
          text: buttonText.trim(),
          visible: isVisible,
          index: i
        });

        if (isVisible && buttonText.trim()) {
          // Take screenshot of button
          const btnScreenshot = `${SCREENSHOTS_DIR}/${pageInfo.category}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-button-${i}-${timestamp}.png`;
          await buttons[i].screenshot({ path: btnScreenshot });
          results.screenshots.push(btnScreenshot);
        }
      } catch (err) {
        console.log(`    ⚠️ Error testing button ${i}: ${err.message}`);
      }
    }

    // Find and test all links
    const links = await page.$$('a[href]');
    console.log(`  🔗 Found ${links.length} links`);

    for (let i = 0; i < Math.min(links.length, 10); i++) { // Test first 10 links
      try {
        const href = await links[i].getAttribute('href');
        const text = await links[i].textContent();
        results.links.push({
          href: href,
          text: text.trim(),
          index: i
        });
      } catch (err) {
        console.log(`    ⚠️ Error testing link ${i}: ${err.message}`);
      }
    }

    // Find and test all forms
    const forms = await page.$$('form');
    console.log(`  📝 Found ${forms.length} forms`);

    for (let i = 0; i < forms.length; i++) {
      try {
        const formInputs = await forms[i].$$('input, textarea, select');
        results.forms.push({
          index: i,
          fields: formInputs.length
        });

        // Screenshot form if visible
        const isVisible = await forms[i].isVisible();
        if (isVisible) {
          const formScreenshot = `${SCREENSHOTS_DIR}/${pageInfo.category}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-form-${i}-${timestamp}.png`;
          await forms[i].screenshot({ path: formScreenshot });
          results.screenshots.push(formScreenshot);
        }
      } catch (err) {
        console.log(`    ⚠️ Error testing form ${i}: ${err.message}`);
      }
    }

    // Find and test all dropdowns
    const selects = await page.$$('select');
    console.log(`  📋 Found ${selects.length} dropdowns`);

    for (let i = 0; i < selects.length; i++) {
      try {
        const options = await selects[i].$$('option');
        results.dropdowns.push({
          index: i,
          optionCount: options.length
        });
      } catch (err) {
        console.log(`    ⚠️ Error testing dropdown ${i}: ${err.message}`);
      }
    }

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.errors.push(`Console error: ${msg.text()}`);
      }
    });

    // Final status determination
    if (results.violations.length === 0 && results.errors.length === 0) {
      results.status = 'pass';
      console.log('  ✅ Page passed all checks');
    } else {
      results.status = 'fail';
      console.log(`  ❌ Page has ${results.violations.length} violations and ${results.errors.length} errors`);
    }

  } catch (error) {
    results.status = 'error';
    results.errors.push(error.message);
    console.log(`  ❌ Page error: ${error.message}`);
  }

  return results;
}

async function main() {
  console.log('🔍 EXHAUSTIVE SENOVA CRM DEBUGGER - POST-FIX VERIFICATION');
  console.log('='.repeat(70));

  await ensureScreenshotDir();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const testResults = {
    timestamp: new Date().toISOString(),
    totalPages: PAGES_TO_TEST.length,
    passed: 0,
    failed: 0,
    errors: 0,
    results: []
  };

  const page = await context.newPage();

  // Test each page
  for (const pageInfo of PAGES_TO_TEST) {
    const result = await testPage(page, pageInfo);
    testResults.results.push(result);

    if (result.status === 'pass') testResults.passed++;
    else if (result.status === 'fail') testResults.failed++;
    else testResults.errors++;

    // Brief delay between pages
    await page.waitForTimeout(1000);
  }

  // Calculate pass rate
  testResults.passRate = ((testResults.passed / testResults.totalPages) * 100).toFixed(1);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Pages Tested: ${testResults.totalPages}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`🔥 Errors: ${testResults.errors}`);
  console.log(`📈 Pass Rate: ${testResults.passRate}%`);

  // Critical violations summary
  console.log('\n⚠️ CRITICAL VIOLATIONS SUMMARY:');
  let totalViolations = 0;
  for (const result of testResults.results) {
    if (result.violations.length > 0) {
      console.log(`\n${result.name}:`);
      for (const violation of result.violations) {
        console.log(`  - ${violation.type}: ${violation.found ? violation.found.join(', ') : 'found'}`);
        totalViolations++;
      }
    }
  }

  if (totalViolations === 0) {
    console.log('  ✅ No content violations found');
  }

  // Save results to JSON
  const resultsPath = `${SCREENSHOTS_DIR}/test-results.json`;
  await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📁 Results saved to: ${resultsPath}`);

  await browser.close();

  // Production readiness verdict
  console.log('\n' + '='.repeat(70));
  console.log('🚦 PRODUCTION READINESS VERDICT');
  console.log('='.repeat(70));

  if (testResults.passRate === '100.0') {
    console.log('✅ PRODUCTION READY - All pages passed');
  } else {
    console.log('❌ NOT PRODUCTION READY');
    console.log(`   - Pass rate: ${testResults.passRate}% (Required: 100%)`);
    console.log(`   - Failed pages: ${testResults.failed}`);
    console.log(`   - Error pages: ${testResults.errors}`);
    console.log(`   - Total violations: ${totalViolations}`);
  }
}

main().catch(console.error);