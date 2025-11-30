const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let passed = 0;
  let failed = 0;
  
  // Public pages
  const publicUrls = [
    '/', '/platform', '/pricing', '/about', '/contact',
    '/solutions/crm', '/solutions/audience-intelligence', 
    '/solutions/patient-identification', '/solutions/campaign-activation',
    '/solutions/analytics', '/industries/medical-spas',
    '/industries/dermatology', '/industries/plastic-surgery',
    '/industries/aesthetic-clinics', '/privacy-policy',
    '/terms-of-service', '/hipaa', '/security', '/compliance',
    '/blog', '/case-studies', '/roi-calculator', '/docs'
  ];
  
  console.log('Testing public pages...');
  for (const url of publicUrls) {
    try {
      const response = await page.goto('http://localhost:3000' + url, { timeout: 30000 });
      if (response.status() === 200) {
        console.log('✓ ' + url);
        passed++;
      } else {
        console.log('✗ ' + url + ' - Status: ' + response.status());
        failed++;
      }
    } catch (e) {
      console.log('✗ ' + url + ' - Error: ' + e.message);
      failed++;
    }
  }
  
  // Test login
  console.log('\nTesting login and dashboard...');
  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"]', 'D3n1w3n1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Login successful');
    passed++;
    
    // Dashboard pages
    const dashUrls = [
      '/dashboard', '/dashboard/contacts', '/dashboard/inbox',
      '/dashboard/objects', '/dashboard/settings', 
      '/dashboard/closebot', '/dashboard/calendar'
    ];
    
    for (const url of dashUrls) {
      try {
        await page.goto('http://localhost:3000' + url, { timeout: 30000 });
        console.log('✓ ' + url);
        passed++;
      } catch (e) {
        console.log('✗ ' + url + ' - Error: ' + e.message);
        failed++;
      }
    }
  } catch (e) {
    console.log('✗ Login failed: ' + e.message);
    failed++;
  }
  
  // Mobile test
  console.log('\nTesting mobile viewport...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000');
  const hamburger = await page.locator('button').filter({ hasText: /menu/i }).first();
  if (await hamburger.isVisible()) {
    console.log('✓ Mobile menu visible');
    passed++;
  } else {
    console.log('✗ Mobile menu not found');
    failed++;
  }
  
  await browser.close();
  
  console.log('\n=== RESULTS ===');
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  console.log('Total: ' + (passed + failed));
  console.log('Pass Rate: ' + ((passed / (passed + failed)) * 100).toFixed(1) + '%');
  
  if (failed === 0) {
    console.log('\n✅ PRODUCTION READY - All tests passed!');
  } else {
    console.log('\n❌ NOT PRODUCTION READY - ' + failed + ' tests failed');
  }
}

runTests().catch(console.error);
