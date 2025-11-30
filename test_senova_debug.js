const { chromium } = require('playwright');

(async () => {
  console.log('🔍 SENOVA CRM FINAL DEBUG VERIFICATION');
  console.log('=====================================');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1080']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const testPages = [
    { path: '/', name: 'Home', cat: 'Main' },
    { path: '/about', name: 'About', cat: 'Main' },
    { path: '/platform', name: 'Platform', cat: 'Main' },
    { path: '/pricing', name: 'Pricing', cat: 'Main' },
    { path: '/contact', name: 'Contact', cat: 'Main' },
    { path: '/demo', name: 'Demo', cat: 'Main' },
    { path: '/hipaa', name: 'HIPAA', cat: 'Main' },
    { path: '/solutions/crm', name: 'CRM', cat: 'Solutions' },
    { path: '/solutions/audience-intelligence', name: 'Audience Intelligence', cat: 'Solutions' },
    { path: '/solutions/patient-identification', name: 'Patient ID', cat: 'Solutions' },
    { path: '/solutions/campaign-activation', name: 'Campaign Activation', cat: 'Solutions' },
    { path: '/solutions/analytics', name: 'Analytics', cat: 'Solutions' },
    { path: '/privacy-policy', name: 'Privacy Policy', cat: 'Legal' },
    { path: '/terms-of-service', name: 'Terms of Service', cat: 'Legal' },
    { path: '/security', name: 'Security', cat: 'Legal' }
  ];

  const results = { passed: [], failed: [] };
  const issues = { jargon: [], content: [], technical: [] };

  console.log('\n📋 Testing ' + testPages.length + ' pages...\n');

  for (const testPage of testPages) {
    const url = 'http://localhost:3004' + testPage.path;
    console.log('Testing: ' + testPage.name + ' [' + testPage.cat + ']');
    console.log('  URL: ' + url);

    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const status = response.status();

      if (status === 404) {
        console.log('  ❌ 404 Not Found');
        results.failed.push(testPage);
        issues.technical.push(testPage.name + ': 404');
        continue;
      }

      if (status === 500) {
        console.log('  ❌ 500 Server Error');
        results.failed.push(testPage);
        issues.technical.push(testPage.name + ': 500');
        continue;
      }

      if (status !== 200) {
        console.log('  ⚠️  HTTP ' + status);
        results.failed.push(testPage);
        issues.technical.push(testPage.name + ': HTTP ' + status);
        continue;
      }

      // Check content
      const text = await page.evaluate(() => document.body ? document.body.innerText : '');

      // Check for forbidden terms
      const forbidden = ['DSP', 'programmatic', 'demand side platform', 'SMB'];
      let hasIssue = false;

      for (const term of forbidden) {
        if (text.toLowerCase().includes(term.toLowerCase())) {
          console.log('  ⚠️  Found forbidden term: ' + term);
          issues.jargon.push(testPage.name + ': ' + term);
          hasIssue = true;
        }
      }

      // Check contact page address
      if (testPage.path === '/contact') {
        if (!text.includes('8 The Green #21994, Dover, DE 19901')) {
          console.log('  ⚠️  Wrong or missing contact address');
          issues.content.push(testPage.name + ': Wrong address');
          hasIssue = true;
        } else {
          console.log('  ✓ Contact address correct');
        }
      }

      // Take screenshot
      const timestamp = Date.now();
      await page.screenshot({
        path: 'screenshots/debug-' + testPage.path.replace(/\//g, '-') + '-' + timestamp + '.png',
        fullPage: true
      });

      if (hasIssue) {
        results.failed.push(testPage);
        console.log('  ❌ FAIL');
      } else {
        results.passed.push(testPage);
        console.log('  ✅ PASS');
      }

    } catch (error) {
      console.log('  ❌ ERROR: ' + error.message);
      results.failed.push(testPage);
      issues.technical.push(testPage.name + ': ' + error.message);
    }

    console.log('');
  }

  // Summary
  const passRate = ((results.passed.length / testPages.length) * 100).toFixed(1);

  console.log('============================================================');
  console.log('📊 FINAL VERIFICATION SUMMARY');
  console.log('============================================================');
  console.log('');
  console.log('📈 Overall Results:');
  console.log('   Total Pages: ' + testPages.length);
  console.log('   Pages Passing: ' + results.passed.length);
  console.log('   Pages Failing: ' + results.failed.length);
  console.log('   Pass Rate: ' + passRate + '%');

  if (issues.jargon.length > 0) {
    console.log('\n⚠️  Jargon Issues: ' + issues.jargon.length);
    issues.jargon.forEach(i => console.log('   - ' + i));
  }

  if (issues.content.length > 0) {
    console.log('\n⚠️  Content Issues: ' + issues.content.length);
    issues.content.forEach(i => console.log('   - ' + i));
  }

  if (issues.technical.length > 0) {
    console.log('\n🔧 Technical Issues: ' + issues.technical.length);
    issues.technical.forEach(i => console.log('   - ' + i));
  }

  console.log('');
  if (passRate === '100.0') {
    console.log('✅ PRODUCTION READY - All tests passed!');
  } else {
    console.log('❌ NOT PRODUCTION READY - ' + results.failed.length + ' pages need fixes');
  }
  console.log('============================================================');

  await browser.close();
})().catch(console.error);