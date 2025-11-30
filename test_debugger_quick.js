const { chromium } = require('playwright');
const fs = require('fs');

async function testPages() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  const results = [];
  const criticalPages = [
    { url: 'http://localhost:3004/', name: 'homepage', checkAccessible: true, checkAddress: false },
    { url: 'http://localhost:3004/pricing', name: 'pricing', checkAccessible: true, checkAddress: false },
    { url: 'http://localhost:3004/contact', name: 'contact', checkAccessible: false, checkAddress: true },
    { url: 'http://localhost:3004/about', name: 'about', checkAccessible: false, checkAddress: true },
    { url: 'http://localhost:3004/security', name: 'security', checkAccessible: false, checkAddress: false },
    { url: 'http://localhost:3004/solutions/crm', name: 'solutions-crm', checkAccessible: false, checkAddress: false },
    { url: 'http://localhost:3004/industries/medical-spas', name: 'industries-medical', checkAccessible: false, checkAddress: false }
  ];

  for (const test of criticalPages) {
    console.log(`\nTesting ${test.name}: ${test.url}`);
    try {
      const response = await page.goto(test.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 0;
      const content = await page.evaluate(() => document.body.innerText);

      let issues = [];

      // Check for SMB
      if (/\bSMB\b/i.test(content)) {
        issues.push('Contains "SMB"');
      }

      // Check for Accessible Pricing on specific pages
      if (test.checkAccessible && !content.includes('Accessible Pricing')) {
        issues.push('Missing "Accessible Pricing"');
      }

      // Check address on contact/about pages
      if (test.checkAddress) {
        if (!content.includes('8 The Green #21994') || !content.includes('Dover, DE 19901')) {
          issues.push('Incorrect address');
        }
      }

      // Check for ROI numbers
      if (/\$100K|\$127K|\$180K|60%.*ROI|67%.*ROI|80%.*ROI|3X.*ROI/i.test(content)) {
        issues.push('Contains ROI guarantees');
      }

      // Check SOC 2 language
      if (content.includes('SOC 2 Certified')) {
        issues.push('Says "Certified" instead of "Compliant"');
      }

      const screenshotPath = `C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\final-verification\\${test.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        page: test.name,
        url: test.url,
        status: status === 200 ? (issues.length === 0 ? 'PASS' : 'FAIL') : 'ERROR',
        httpStatus: status,
        issues: issues,
        screenshot: `${test.name}.png`
      });

      console.log(`  Status: ${status}`);
      if (issues.length > 0) {
        console.log(`  ❌ Issues: ${issues.join(', ')}`);
      } else {
        console.log(`  ✅ All checks passed`);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        page: test.name,
        url: test.url,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  await browser.close();

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Tested: ${results.length} pages`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed/results.length)*100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFailed pages:');
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`- ${r.page}: ${r.issues ? r.issues.join(', ') : r.error}`);
    });
  }

  // Save results
  fs.writeFileSync('C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\debug_quick_results.json', JSON.stringify(results, null, 2));

  return results;
}

testPages().catch(console.error);