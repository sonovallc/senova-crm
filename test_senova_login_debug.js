const { chromium } = require('playwright');

async function debugLogin() {
  console.log('Testing Senova CRM Login...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--start-maximized']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Enable verbose logging
    page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure().errorText);
    });

    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });

    // Check page content
    const title = await page.title();
    console.log('   Page title:', title);

    const content = await page.content();
    const hasSenova = content.includes('Senova');
    const hasEve = content.match(/Eve\s*(Beauty|CRM|Care)/gi);
    console.log('   Branding: Senova =', hasSenova, ', Eve =', hasEve ? hasEve.length : 0);

    // Check login form
    const emailField = await page.locator('input[type="email"]').isVisible();
    const passwordField = await page.locator('input[type="password"]').isVisible();
    const signInButton = await page.locator('button:has-text("Sign In")').isVisible();

    console.log('   Login form elements:');
    console.log('     - Email field:', emailField);
    console.log('     - Password field:', passwordField);
    console.log('     - Sign In button:', signInButton);

    if (!emailField || !passwordField || !signInButton) {
      console.log('\n❌ Login form not properly rendered!');
      return;
    }

    console.log('\n2. Attempting login with master owner credentials...');
    console.log('   Email: jwoodcapital@gmail.com');
    console.log('   Password: D3n1w3n1!');

    // Fill credentials
    await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"]', 'D3n1w3n1!');

    // Take screenshot before clicking
    await page.screenshot({ path: 'login-before-click.png' });

    // Click sign in and wait for response
    console.log('\n3. Clicking Sign In button...');

    // Track network requests
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/') &&
      (response.url().includes('login') || response.url().includes('auth'))
    ).catch(() => null);

    await page.click('button:has-text("Sign In")');

    // Wait for response or navigation
    const response = await responsePromise;
    if (response) {
      console.log('   API Response:', response.status(), response.url());
      if (response.status() !== 200) {
        const body = await response.text().catch(() => 'Unable to read response body');
        console.log('   Response body:', body.substring(0, 200));
      }
    }

    // Wait a moment for any navigation
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // Check for error messages
    const errorMessage = await page.locator('.error, .alert, [role="alert"], .text-red-500').textContent().catch(() => '');
    if (errorMessage) {
      console.log('   Error message:', errorMessage);
    }

    // Take screenshot after click
    await page.screenshot({ path: 'login-after-click.png' });

    if (currentUrl.includes('/dashboard')) {
      console.log('\n✅ Login successful! Redirected to dashboard.');

      // Check dashboard content
      console.log('\n4. Checking dashboard content...');

      const dashboardContent = await page.content();
      const dashSenova = (dashboardContent.match(/Senova/gi) || []).length;
      const dashEve = (dashboardContent.match(/Eve\s*(Beauty|CRM|Care)/gi) || []).length;

      console.log('   Branding on dashboard:');
      console.log('     - Senova mentions:', dashSenova);
      console.log('     - Eve mentions:', dashEve);

      // Check for Objects in navigation
      const objectsVisible = await page.locator('a:has-text("Objects")').isVisible().catch(() => false);
      const objectsText = await page.locator('text=Objects').count();

      console.log('   Objects navigation:');
      console.log('     - Objects link visible:', objectsVisible);
      console.log('     - "Objects" text count:', objectsText);

      // Try to navigate to Objects
      console.log('\n5. Attempting to navigate to Objects page...');
      await page.goto('http://localhost:3004/dashboard/objects', { waitUntil: 'networkidle' });

      const objectsUrl = page.url();
      console.log('   Objects page URL:', objectsUrl);

      if (objectsUrl.includes('/objects')) {
        console.log('   ✅ Successfully accessed Objects page');

        // Look for Senova CRM object
        const senovaObject = await page.locator('text=/Senova.*CRM/i').count();
        console.log('   Senova CRM object found:', senovaObject > 0);
      } else {
        console.log('   ❌ Failed to access Objects page - redirected to:', objectsUrl);
      }

    } else {
      console.log('\n❌ Login failed! Still on:', currentUrl);

      // Try admin credentials as fallback
      console.log('\n6. Trying admin credentials as fallback...');

      await page.fill('input[type="email"]', 'admin@senovallc.com');
      await page.fill('input[type="password"]', 'TestPass123!');

      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);

      const adminUrl = page.url();
      console.log('   Admin login URL:', adminUrl);

      if (adminUrl.includes('/dashboard')) {
        console.log('   ✅ Admin login successful!');
      } else {
        console.log('   ❌ Admin login also failed');
      }
    }

    console.log('\n7. Final checks...');

    // Check for console errors
    console.log('\nTest complete. Screenshots saved as login-before-click.png and login-after-click.png');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    console.log('\nPress Ctrl+C to close browser and exit...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Keep browser open for inspection
    await browser.close();
  }
}

debugLogin().catch(console.error);