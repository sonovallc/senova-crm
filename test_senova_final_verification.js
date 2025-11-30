const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// All 19 pages to test
const PAGES_TO_TEST = [
  // Main Pages (7)
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/platform', name: 'Platform' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/contact', name: 'Contact' },
  { path: '/demo', name: 'Demo' },
  { path: '/hipaa', name: 'HIPAA' },

  // Solutions (5)
  { path: '/solutions/crm', name: 'CRM Solution' },
  { path: '/solutions/audience-intelligence', name: 'Audience Intelligence' },
  { path: '/solutions/patient-identification', name: 'Patient Identification' },
  { path: '/solutions/campaign-activation', name: 'Campaign Activation' },
  { path: '/solutions/analytics', name: 'Analytics' },

  // Industries (4)
  { path: '/industries/medical-spas', name: 'Medical Spas' },
  { path: '/industries/dermatology', name: 'Dermatology' },
  { path: '/industries/plastic-surgery', name: 'Plastic Surgery' },
  { path: '/industries/aesthetic-clinics', name: 'Aesthetic Clinics' },

  // Legal (3)
  { path: '/privacy-policy', name: 'Privacy Policy' },
  { path: '/terms-of-service', name: 'Terms of Service' },
  { path: '/security', name: 'Security' }
];

async function runTests() {
  console.log('EXHAUSTIVE SENOVA CRM VERIFICATION');
  console.log('===================================\n');
  console.log('Testing ALL ' + PAGES_TO_TEST.length + ' pages for production readiness\n');

  const screenshotDir = path.join(__dirname, 'screenshots', 'debug-senova-final');

  try {
    await fs.mkdir(screenshotDir, { recursive: true });
  } catch (e) {
    console.log('Screenshots directory ready');
  }

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  async function screenshot(name) {
    const filepath = path.join(screenshotDir, name + '-' + Date.now() + '.png');
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  const results = {
    timestamp: new Date().toISOString(),
    totalPages: PAGES_TO_TEST.length,
    passed: 0,
    failed: 0,
    pageResults: []
  };

  try {
    for (let idx = 0; idx < PAGES_TO_TEST.length; idx++) {
      const pageInfo = PAGES_TO_TEST[idx];
      console.log('\n' + '='.repeat(60));
      console.log('PAGE ' + (idx + 1) + '/' + PAGES_TO_TEST.length + ': ' + pageInfo.name + ' (' + pageInfo.path + ')');
      console.log('-'.repeat(60));

      const pageResult = {
        name: pageInfo.name,
        path: pageInfo.path,
        status: 'PASS',
        issues: [],
        consoleErrors: [],
        checks: {}
      };

      // Clear console errors for this page
      consoleErrors.length = 0;

      try {
        // Navigate to page
        const response = await page.goto('http://localhost:3004' + pageInfo.path, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Check for 404
        if (!response || response.status() === 404) {
          pageResult.status = 'FAIL';
          pageResult.issues.push('404 NOT FOUND');
          console.log('FAIL: 404 NOT FOUND');
        } else {
          console.log('PASS: Page loaded (Status ' + response.status() + ')');

          // Wait for content to render
          await page.waitForTimeout(1500);

          // Get page text content
          const pageText = await page.evaluate(() => document.body.innerText);

          // Check for forbidden content
          console.log('\nContent Checks:');

          // SMB check
          const smbMatches = pageText.match(/SMB/g);
          if (smbMatches) {
            pageResult.status = 'FAIL';
            pageResult.issues.push('Found SMB text: ' + smbMatches.length + ' times');
            console.log('  FAIL: Found "SMB" ' + smbMatches.length + ' times');
          } else {
            console.log('  PASS: No SMB text found');
          }

          // ROI numbers check
          const roiPattern = /3X ROI|847%|124K|60% reduction|52% improvement|45% faster|3\.2X/g;
          const roiMatches = pageText.match(roiPattern);
          if (roiMatches) {
            pageResult.status = 'FAIL';
            pageResult.issues.push('Found forbidden ROI numbers');
            console.log('  FAIL: Found ROI numbers');
          } else {
            console.log('  PASS: No forbidden ROI numbers');
          }

          // SOC 2 Certified check
          if (pageText.includes('SOC 2 Certified')) {
            pageResult.status = 'FAIL';
            pageResult.issues.push('SOC 2 says Certified (should be Compliant)');
            console.log('  FAIL: SOC 2 says "Certified"');
          } else {
            console.log('  PASS: SOC 2 terminology correct');
          }

          // Coming Soon check
          if (pageText.match(/Coming Soon/i)) {
            pageResult.status = 'FAIL';
            pageResult.issues.push('Found Coming Soon text');
            console.log('  FAIL: Found "Coming Soon"');
          } else {
            console.log('  PASS: No Coming Soon text');
          }

          // Curly apostrophes check
          const curlyQuotes = pageText.match(/['']/g);
          if (curlyQuotes) {
            pageResult.status = 'FAIL';
            pageResult.issues.push('Found curly apostrophes: ' + curlyQuotes.length);
            console.log('  FAIL: Found ' + curlyQuotes.length + ' curly apostrophes');
          } else {
            console.log('  PASS: No curly apostrophes');
          }

          // Page-specific checks
          if (pageInfo.path === '/contact') {
            console.log('\nSpecial Check - Contact Address:');
            if (!pageText.includes('8 The Green #21994, Dover, DE 19901')) {
              pageResult.status = 'FAIL';
              pageResult.issues.push('Incorrect address on contact page');
              console.log('  FAIL: Incorrect address');
            } else {
              console.log('  PASS: Correct address found');
            }
          }

          // DSP messaging checks
          const dspChecks = {
            '/': ['280M+', 'wholesale', 'DSP'],
            '/platform': ['DSP Capabilities', 'wholesale pricing'],
            '/solutions/campaign-activation': ['precision targeting'],
            '/solutions/audience-intelligence': ['280M+ profiles'],
            '/pricing': ['wholesale']
          };

          if (dspChecks[pageInfo.path]) {
            console.log('\nDSP Messaging Checks:');
            for (const term of dspChecks[pageInfo.path]) {
              if (!pageText.includes(term)) {
                pageResult.status = 'FAIL';
                pageResult.issues.push('Missing DSP content: "' + term + '"');
                console.log('  FAIL: Missing "' + term + '"');
              } else {
                console.log('  PASS: Found "' + term + '"');
              }
            }
          }

          // Console errors check
          if (consoleErrors.length > 0) {
            pageResult.consoleErrors = consoleErrors.slice();
            pageResult.status = 'FAIL';
            pageResult.issues.push(consoleErrors.length + ' console error(s)');
            console.log('\nFAIL: ' + consoleErrors.length + ' console errors');
          }

          // Take screenshot
          const screenshotPath = await screenshot(pageInfo.path.replace(/\//g, '-') || 'home');
          pageResult.screenshot = screenshotPath;
          console.log('\nScreenshot saved: ' + path.basename(screenshotPath));
        }

      } catch (error) {
        pageResult.status = 'FAIL';
        pageResult.issues.push('Error: ' + error.message);
        console.log('FAIL: ' + error.message);
      }

      // Update counts
      if (pageResult.status === 'PASS') {
        results.passed++;
        console.log('\nRESULT: PAGE PASSED');
      } else {
        results.failed++;
        console.log('\nRESULT: PAGE FAILED (' + pageResult.issues.length + ' issues)');
      }

      results.pageResults.push(pageResult);
    }

    // FINAL SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('FINAL VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log('Total Pages Tested: ' + results.totalPages);
    console.log('Pages Passing: ' + results.passed);
    console.log('Pages Failing: ' + results.failed);
    const passRate = ((results.passed / results.totalPages) * 100).toFixed(1);
    console.log('Pass Rate: ' + passRate + '%');

    console.log('\nPage Results:');
    for (const page of results.pageResults) {
      const icon = page.status === 'PASS' ? 'PASS' : 'FAIL';
      console.log('  ' + icon + ' - ' + page.name);
      if (page.issues.length > 0) {
        for (const issue of page.issues) {
          console.log('       ' + issue);
        }
      }
    }

    // Save results
    const resultsFile = path.join(__dirname, 'debug-senova-final-results.json');
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
    console.log('\nResults saved to: ' + resultsFile);

    // Production readiness
    if (results.passed === results.totalPages) {
      console.log('\n' + '*'.repeat(60));
      console.log('*** PRODUCTION READY: 100% PASS RATE! ***');
      console.log('*'.repeat(60));
    } else {
      console.log('\n' + '!'.repeat(60));
      console.log('!!! NOT PRODUCTION READY: ' + results.failed + ' PAGES FAILING !!!');
      console.log('!'.repeat(60));
    }

  } catch (error) {
    console.error('Test failed:', error);
    await screenshot('error');
  } finally {
    await browser.close();
    console.log('\nBrowser closed');
  }

  return results;
}

runTests().catch(console.error);
