const { chromium } = require('playwright');

async function verifyLoginSystem() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('=' .repeat(60));
  console.log('LOGIN SYSTEM VERIFICATION');
  console.log('=' .repeat(60));

  try {
    // First check backend health
    console.log('\n1. Checking Backend API...');
    const apiHealth = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        const data = await response.json();
        return { status: response.status, data };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('Backend health:', JSON.stringify(apiHealth, null, 2));

    // Check auth endpoint
    console.log('\n2. Testing Auth Endpoint...');
    const authTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'Password123!'
          })
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('Auth test:', JSON.stringify(authTest, null, 2));

    // Try login through UI
    console.log('\n3. Testing Login UI...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/final-verify/login-page-initial.png' });

    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');

    await page.screenshot({ path: 'screenshots/final-verify/login-filled-form.png' });

    // Click submit with detailed monitoring
    console.log('Submitting login form...');

    // Monitor network requests
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/auth/login') || resp.url().includes('/api/login')
    ).catch(() => null);

    await page.click('button[type="submit"]');

    // Wait for response or timeout
    const response = await Promise.race([
      responsePromise,
      page.waitForTimeout(5000).then(() => null)
    ]);

    if (response) {
      console.log(`Login response: ${response.status()}`);
      const responseData = await response.json().catch(() => null);
      console.log('Response data:', responseData);
    }

    // Wait for navigation
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);

    await page.screenshot({ path: 'screenshots/final-verify/after-login-attempt.png' });

    // Check if we're logged in
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ LOGIN SUCCESSFUL - Redirected to dashboard');

      // Take screenshot of dashboard
      await page.screenshot({ path: 'screenshots/final-verify/dashboard-logged-in.png', fullPage: true });

      // Check for user info
      const userInfo = await page.evaluate(() => {
        return {
          hasNavbar: !!document.querySelector('nav'),
          hasLogout: !!document.querySelector('button:has-text("Logout"), a:has-text("Logout")'),
          pageTitle: document.title
        };
      });
      console.log('Dashboard info:', userInfo);

      return { success: true, loggedIn: true, url: currentUrl };
    } else {
      console.log('❌ LOGIN FAILED - Still on login page');

      // Check for error messages
      const errorMessage = await page.textContent('.error, .alert-danger, [role="alert"]').catch(() => null);
      if (errorMessage) {
        console.log('Error message:', errorMessage);
      }

      return { success: false, loggedIn: false, url: currentUrl, error: errorMessage };
    }

  } catch (error) {
    console.error('Test error:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
verifyLoginSystem().then(result => {
  console.log('\n' + '=' .repeat(60));
  console.log('FINAL RESULT:', result);
  console.log('=' .repeat(60));
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});