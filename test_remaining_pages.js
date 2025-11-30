const { chromium } = require('playwright');

async function testRemaining() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const remainingPages = [
    'http://localhost:3004/platform',
    'http://localhost:3004/demo',
    'http://localhost:3004/hipaa',
    'http://localhost:3004/privacy-policy',
    'http://localhost:3004/terms-of-service',
    'http://localhost:3004/solutions/audience-intelligence',
    'http://localhost:3004/solutions/patient-identification',
    'http://localhost:3004/solutions/campaign-activation',
    'http://localhost:3004/solutions/analytics',
    'http://localhost:3004/industries/dermatology',
    'http://localhost:3004/industries/plastic-surgery',
    'http://localhost:3004/industries/aesthetic-clinics'
  ];

  console.log('Testing remaining pages...\n');
  const results = [];

  for (const url of remainingPages) {
    const name = url.split('/').pop() || 'page';
    console.log(`Testing: ${name}`);

    try {
      const response = await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' });
      const status = response ? response.status() : 0;

      if (status === 200) {
        await page.waitForTimeout(500);
        const content = await page.evaluate(() => document.body.innerText || '');

        // Quick content checks
        const hasSMB = /\bSMB\b/i.test(content);
        const hasROI = /\$100K|\$127K|\$180K|60%.*ROI|3X/i.test(content);
        const hasCertified = content.includes('SOC 2 Certified');

        if (hasSMB || hasROI || hasCertified) {
          console.log(`  ❌ Issues: ${hasSMB ? 'SMB ' : ''}${hasROI ? 'ROI ' : ''}${hasCertified ? 'Certified' : ''}`);
          results.push({ url, status: 'FAIL', issues: `${hasSMB ? 'SMB ' : ''}${hasROI ? 'ROI ' : ''}${hasCertified ? 'Certified' : ''}` });
        } else {
          console.log(`  ✅ PASS`);
          results.push({ url, status: 'PASS' });
        }
      } else {
        console.log(`  ❌ HTTP ${status}`);
        results.push({ url, status: 'ERROR', code: status });
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      results.push({ url, status: 'ERROR', error: e.message });
    }
  }

  await browser.close();

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;

  console.log('\n' + '='.repeat(40));
  console.log(`Tested: ${results.length} pages`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(40));

  return results;
}

testRemaining().catch(console.error);