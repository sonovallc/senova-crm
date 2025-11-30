const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log(`[NETWORK ERROR]: ${request.url()} - ${request.failure().errorText}`);
  });

  // Capture API responses
  page.on('response', async response => {
    if (response.url().includes('/api/v1/')) {
      console.log(`[API RESPONSE]: ${response.url()}`);
      console.log(`[STATUS]: ${response.status()} ${response.statusText()}`);

      // Log request headers for auth
      if (response.url().includes('/campaigns')) {
        const request = response.request();
        const headers = request.headers();
        console.log('[REQUEST AUTH HEADER]:', headers['authorization'] || 'NONE');
      }

      if (response.url().includes('/campaigns')) {
        try {
          const body = await response.json();
          console.log('[RESPONSE BODY]:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('[RESPONSE BODY]: Not JSON or error reading');
        }
      }
    }
  });

  try {
    console.log('\n=== Navigating to login page ===');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Logging in ===');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // Wait for login to complete and tokens to be stored
    await page.waitForTimeout(3000);

    // Check if tokens are in sessionStorage
    const hasTokens = await page.evaluate(() => {
      const accessToken = sessionStorage.getItem('access_token');
      const refreshToken = sessionStorage.getItem('refresh_token');
      console.log('Access token exists:', !!accessToken);
      console.log('Refresh token exists:', !!refreshToken);
      return !!accessToken && !!refreshToken;
    });

    console.log('\n=== Tokens in sessionStorage:', hasTokens, '===');

    console.log('\n=== Navigating to campaigns page ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');

    // Wait for API call to complete
    await page.waitForTimeout(5000);

    console.log('\n=== Taking screenshot ===');
    await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\context-engineering-intro\\campaigns_fixed.png', fullPage: true });

    console.log('\n=== Checking page content ===');
    const loadingText = await page.locator('text=Loading').count();
    console.log('Number of "Loading" elements:', loadingText);

    const hasContent = await page.locator('h1:has-text("Email Campaigns")').count();
    console.log('Has "Email Campaigns" heading:', hasContent > 0);

    const hasError = await page.locator('text=Failed to load campaigns').count();
    console.log('Has error message:', hasError > 0);

    const hasCampaigns = await page.locator('text=No campaigns yet').count();
    console.log('Has "No campaigns yet" message:', hasCampaigns > 0);

  } catch (error) {
    console.error('Error during test:', error);
  }

  await browser.close();
})();
