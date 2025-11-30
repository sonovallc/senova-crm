const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ONLY API requests
  page.on('request', request => {
    if (request.url().includes('8000/api/v1/campaigns')) {
      console.log('\n[API REQUEST]', request.url());
      console.log('[METHOD]', request.method());
      const headers = request.headers();
      console.log('[ORIGIN]', headers['origin'] || 'NONE');
      console.log('[AUTH]', headers['authorization'] || 'NONE');
      console.log('[ALL REQ HEADERS]:', JSON.stringify(headers, null, 2));
    }
  });

  page.on('response', async response => {
    if (response.url().includes('8000/api/v1/campaigns')) {
      console.log('\n[API RESPONSE]', response.url());
      console.log('[STATUS]', response.status(), response.statusText());
      const headers = await response.allHeaders();
      console.log('[CORS HEADER]', headers['access-control-allow-origin'] || 'MISSING!!!');
      console.log('[ALL RESP HEADERS]:', JSON.stringify(headers, null, 2));
    }
  });

  try {
    console.log('=== Login ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('\n=== Navigate to Campaigns ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    console.log('Waiting for API calls...');
    await page.waitForTimeout(10000);
    console.log('Done waiting.');

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
})();
