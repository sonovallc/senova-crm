const { chromium } = require('playwright');
const fs = require('fs');

async function testAllPages() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  const allPages = [
    // Main pages
    { url: 'http://localhost:3004/', name: '01-homepage', checkAccessible: true },
    { url: 'http://localhost:3004/platform', name: '02-platform' },
    { url: 'http://localhost:3004/pricing', name: '03-pricing', checkAccessible: true },
    { url: 'http://localhost:3004/demo', name: '04-demo' },
    { url: 'http://localhost:3004/contact', name: '05-contact', checkAddress: true },
    { url: 'http://localhost:3004/about', name: '06-about', checkAddress: true },

    // Legal pages
    { url: 'http://localhost:3004/hipaa', name: '07-hipaa', checkSOC2: true },
    { url: 'http://localhost:3004/security', name: '08-security', checkSOC2: true },
    { url: 'http://localhost:3004/privacy-policy', name: '09-privacy' },
    { url: 'http://localhost:3004/terms-of-service', name: '10-terms' },

    // Solution pages
    { url: 'http://localhost:3004/solutions/crm', name: '11-crm' },
    { url: 'http://localhost:3004/solutions/audience-intelligence', name: '12-audience' },
    { url: 'http://localhost:3004/solutions/patient-identification', name: '13-patient' },
    { url: 'http://localhost:3004/solutions/campaign-activation', name: '14-campaign' },
    { url: 'http://localhost:3004/solutions/analytics', name: '15-analytics' },

    // Industry pages
    { url: 'http://localhost:3004/industries/medical-spas', name: '16-medical-spas' },
    { url: 'http://localhost:3004/industries/dermatology', name: '17-dermatology' },
    { url: 'http://localhost:3004/industries/plastic-surgery', name: '18-plastic-surgery' },
    { url: 'http://localhost:3004/industries/aesthetic-clinics', name: '19-aesthetic' }
  ];

  const results = [];

  for (const test of allPages) {
    console.log(`Testing ${test.name}...`);
    try {
      const response = await page.goto(test.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 0;

      if (status !== 200) {
        results.push({
          page: test.name,
          url: test.url,
          status: 'FAIL',
          issues: [`HTTP ${status}`]
        });
        console.log(`  ❌ HTTP ${status}`);
        continue;
      }

      await page.waitForTimeout(1000);
      const content = await page.evaluate(() => document.body.innerText);

      let issues = [];

      // Universal checks for all pages
      // 1. Check for SMB
      if (/\bSMB\b/i.test(content)) {
        issues.push('Contains "SMB"');
      }

      // 2. Check for ROI guarantees
      if (/\$100K|\$127K|\$180K|60%.*ROI|67%.*ROI|80%.*ROI|3X.*ROI|3x.*return/i.test(content)) {
        issues.push('ROI guarantees found');
      }

      // 3. Check SOC 2 language (should be Compliant not Certified)
      if (content.includes('SOC 2 Certified')) {
        issues.push('Says "Certified" not "Compliant"');
      }

      // Page-specific checks
      if (test.checkAccessible) {
        if (!content.toLowerCase().includes('accessible pric')) {
          issues.push('Missing "Accessible Pricing"');
        }
      }

      if (test.checkAddress) {
        if (!content.includes('8 The Green #21994')) {
          issues.push('Missing correct address');
        }
        if (!content.includes('Dover, DE 19901')) {
          issues.push('Missing Dover, DE 19901');
        }
      }

      if (test.checkSOC2) {
        if (!content.includes('SOC 2 Compliant')) {
          issues.push('Missing "SOC 2 Compliant"');
        }
      }

      // Take screenshot
      const screenshotPath = `C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\final-verification\\${test.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        page: test.name,
        url: test.url,
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        issues: issues,
        screenshot: `${test.name}.png`
      });

      if (issues.length === 0) {
        console.log(`  ✅ PASS`);
      } else {
        console.log(`  ❌ FAIL: ${issues.join(', ')}`);
      }

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      results.push({
        page: test.name,
        url: test.url,
        status: 'ERROR',
        issues: [error.message]
      });
    }
  }

  await browser.close();

  // Generate summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;
  const passRate = ((passed / results.length) * 100).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('FINAL VERIFICATION RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Pages: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${passRate}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED PAGES:');
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`  ${r.page}: ${r.issues.join(', ')}`);
    });
  }

  // Save results
  fs.writeFileSync(
    'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\FINAL_VERIFICATION_RESULTS.json',
    JSON.stringify(results, null, 2)
  );

  return { passed, failed, passRate, results };
}

testAllPages().catch(console.error);