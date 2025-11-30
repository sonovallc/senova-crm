const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture detailed request/response info
  page.on('request', request => {
    if (request.url().includes('/campaigns')) {
      console.log('\n[REQUEST]', request.url());
      console.log('[METHOD]', request.method());
      const headers = request.headers();
      console.log('[ORIGIN]', headers['origin'] || 'NONE');
      console.log('[AUTH]', headers['authorization'] ? 'Present' : 'NONE');
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/campaigns')) {
      console.log('\n[RESPONSE]', response.url());
      console.log('[STATUS]', response.status(), response.statusText());
      const headers = await response.allHeaders();
      console.log('[CORS HEADER]', headers['access-control-allow-origin'] || 'MISSING');
      console.log('[ALL HEADERS]', JSON.stringify(headers, null, 2));
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
    await page.waitForTimeout(8000);

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
})();
