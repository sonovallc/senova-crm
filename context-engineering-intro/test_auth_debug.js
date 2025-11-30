const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let requestCount = 0;

  // Capture ALL requests with auth headers
  page.on('request', request => {
    if (request.url().includes('/api/v1/')) {
      requestCount++;
      console.log(`\n[REQUEST #${requestCount}]: ${request.method()} ${request.url()}`);
      const headers = request.headers();
      console.log('[AUTH HEADER]:', headers['authorization'] || 'NONE');
    }
  });

  // Capture ALL responses
  page.on('response', async response => {
    if (response.url().includes('/api/v1/')) {
      console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('\n=== Step 1: Navigate to login page ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Step 2: Fill in login form ===');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');

    console.log('\n=== Step 3: Submit login ===');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check sessionStorage
    const tokens = await page.evaluate(() => {
      return {
        accessToken: sessionStorage.getItem('access_token'),
        refreshToken: sessionStorage.getItem('refresh_token')
      };
    });

    console.log('\n=== Step 4: Check stored tokens ===');
    console.log('Access token length:', tokens.accessToken ? tokens.accessToken.length : 0);
    console.log('Refresh token length:', tokens.refreshToken ? tokens.refreshToken.length : 0);

    console.log('\n=== Step 5: Navigate to campaigns page ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(5000);

    console.log('\n=== Step 6: Check page state ===');
    const pageState = await page.evaluate(() => {
      return {
        hasError: document.body.textContent.includes('Failed to load campaigns'),
        hasLoading: document.body.textContent.includes('Loading'),
        hasNoCampaigns: document.body.textContent.includes('No campaigns yet'),
        token: sessionStorage.getItem('access_token') ? 'exists' : 'missing'
      };
    });
    console.log('Page state:', pageState);

    console.log('\n=== Total API requests captured:', requestCount, '===');

  } catch (error) {
    console.error('Error during test:', error);
  }

  await browser.close();
})();
