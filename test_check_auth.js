const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor network
  page.on('response', response => {
    const url = response.url();
    if (url.includes('login') || url.includes('auth') || url.includes('api')) {
      console.log(`Response: ${url} - Status: ${response.status()}`);
    }
  });

  // Monitor console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  await page.goto('http://localhost:3004/login');
  await page.waitForLoadState('networkidle');

  // Try to fill and submit
  await page.fill('input[type="email"]', 'josh@audiencelab.io');
  await page.fill('input[type="password"]', 'password123');

  console.log('Submitting login form...');

  // Click and wait for response
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log('Final URL:', page.url());

  // Check if there's an error message
  const errorMessage = await page.$('.error, [role="alert"], .text-red-500, .text-red-600');
  if (errorMessage) {
    const text = await errorMessage.textContent();
    console.log('Error message:', text);
  }

  // Try direct navigation to dashboard
  console.log('\nTrying direct navigation to dashboard...');
  await page.goto('http://localhost:3004/dashboard');
  await page.waitForTimeout(2000);
  console.log('Dashboard URL:', page.url());

  // If redirected back to login, try with different credentials
  if (page.url().includes('login')) {
    console.log('\nTrying alternative credentials...');
    await page.fill('input[type="email"]', 'admin@senova.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('URL after alternative login:', page.url());
  }

  await browser.close();
})();