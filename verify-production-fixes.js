const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Track console errors and network failures
  const page = await context.newPage();
  const errors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('Console error:', msg.text());
    }
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()
    });
    console.log('Request failed:', request.url(), request.failure());
  });

  console.log('Testing Fix 1: Homepage redirect...');

  // Test 1: Homepage should redirect to /home
  await page.goto('https://crm.senovallc.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const currentURL = page.url();
  console.log('Current URL after navigation:', currentURL);

  if (currentURL.includes('/home')) {
    console.log('✅ Fix 1 VERIFIED: Homepage redirects to /home correctly');
  } else if (currentURL.includes('api.evebeautyma.com')) {
    console.log('❌ Fix 1 FAILED: Still redirecting to api.evebeautyma.com');
  } else {
    console.log(`⚠️ Fix 1 UNCLEAR: Redirected to ${currentURL}`);
  }

  await page.screenshot({ path: 'screenshots/fix-verification/01-homepage-redirect.png' });

  console.log('\nTesting Fix 2: API URL configuration...');

  // Test 2: Login page should not prompt for local network access
  await page.goto('https://crm.senovallc.com/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check for localhost or 192.168 in network requests
  const requests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('localhost') || url.includes('192.168') || url.includes('127.0.0.1')) {
      requests.push(url);
      console.log('❌ Found localhost request:', url);
    }
  });

  // Try to login to trigger API calls
  await page.fill('input[name="email"]', 'jwoodcapital@gmail.com');
  await page.fill('input[name="password"]', 'D3n1w3n1!');
  await page.screenshot({ path: 'screenshots/fix-verification/02-login-filled.png' });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Check results
  console.log('\nResults:');
  console.log('=======');

  if (requests.length === 0) {
    console.log('✅ Fix 2 VERIFIED: No localhost API requests detected');
  } else {
    console.log(`❌ Fix 2 FAILED: Found ${requests.length} localhost requests`);
    requests.forEach(req => console.log('  -', req));
  }

  if (errors.length > 0) {
    console.log(`\n⚠️ Console errors found: ${errors.length}`);
    errors.forEach(err => console.log('  -', err));
  }

  if (networkErrors.length > 0) {
    console.log(`\n⚠️ Network errors found: ${networkErrors.length}`);
    networkErrors.forEach(err => console.log('  -', err.url, err.failure));
  }

  // Check if login was successful
  if (page.url().includes('/dashboard')) {
    console.log('\n✅ Login successful - redirected to dashboard');
    await page.screenshot({ path: 'screenshots/fix-verification/03-dashboard.png' });
  } else {
    console.log('\n⚠️ Login may have failed - current URL:', page.url());
    await page.screenshot({ path: 'screenshots/fix-verification/03-login-result.png' });
  }

  console.log('\n=== FINAL REPORT ===');
  console.log('Fix 1 (Homepage redirect):', currentURL.includes('/home') ? '✅ PASSED' : '❌ FAILED');
  console.log('Fix 2 (No localhost API):', requests.length === 0 ? '✅ PASSED' : '❌ FAILED');
  console.log('Overall Status:', (currentURL.includes('/home') && requests.length === 0) ? '✅ ALL FIXES VERIFIED' : '❌ ISSUES REMAIN');

  await browser.close();
})();