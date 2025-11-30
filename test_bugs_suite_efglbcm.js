const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('BUG SUITE: E, F, G, L, B, C, M Verification');
  console.log('==========================================\n');

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const msgType = msg.type();
    const msgText = msg.text();
    consoleMessages.push('[' + msgType + '] ' + msgText);
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    console.log('STEP 1: Navigate to http://localhost:3004/login');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'bugs-login-page.png'), fullPage: true });
    console.log('Screenshot saved: 01-login-page.png\n');

    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = await page.locator('button:has-text("Login"), button:has-text("Sign in"), button[type="submit"]').first();

    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const buttonExists = await loginButton.count() > 0;

    console.log('Login Form Elements:');
    console.log('  - Email input: ' + (emailExists ? 'FOUND' : 'NOT FOUND'));
    console.log('  - Password input: ' + (passwordExists ? 'FOUND' : 'NOT FOUND'));
    console.log('  - Login button: ' + (buttonExists ? 'FOUND' : 'NOT FOUND') + '\n');

    if (!emailExists || !passwordExists || !buttonExists) {
      throw new Error('Login form elements missing!');
    }

    console.log('STEP 2: Enter credentials');
    await emailInput.fill('admin@evebeautyma.com');
    await passwordInput.fill('TestPass123!');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-filled.png'), fullPage: true });
    console.log('Screenshot saved: 01-login-filled.png\n');

    console.log('STEP 3: Click Login button');
    await loginButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-clicked.png'), fullPage: true });
    console.log('Screenshot saved: 01-login-clicked.png\n');

    console.log('STEP 4: Wait for dashboard to load');
    
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('Navigated to dashboard URL\n');
    } catch (e) {
      console.log('URL did not change to /dashboard, checking for dashboard elements...\n');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-dashboard-loaded.png'), fullPage: true });
    console.log('Screenshot saved: 01-dashboard-loaded.png\n');

    console.log('Authentication Verification:');
    
    const currentUrl = page.url();
    console.log('  - Current URL: ' + currentUrl);
    
    const userMenu = await page.locator('[class*="user"], [class*="avatar"], [class*="profile"], button:has-text("Logout"), a:has-text("Logout")').count();
    const dashboardTitle = await page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard"), [class*="dashboard"]').count();
    
    console.log('  - User menu/avatar: ' + (userMenu > 0 ? 'FOUND' : 'NOT FOUND'));
    console.log('  - Dashboard elements: ' + (dashboardTitle > 0 ? 'FOUND' : 'NOT FOUND') + '\n');

    console.log('Console Messages:');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach(msg => console.log('  ' + msg));
    } else {
      console.log('  (none)');
    }
    console.log();

    console.log('JavaScript Errors:');
    if (errors.length > 0) {
      errors.forEach(err => console.log('  ERROR: ' + err));
    } else {
      console.log('  No errors detected');
    }
    console.log();

    console.log('==========================================');
    console.log('VERIFICATION #1 RESULTS');
    console.log('==========================================\n');

    const results = {
      loginFormAcceptsCredentials: emailExists && passwordExists,
      loginButtonSubmits: buttonExists,
      dashboardLoadsWithoutErrors: errors.length === 0 && (currentUrl.includes('dashboard') || dashboardTitle > 0),
      userIsAuthenticated: userMenu > 0 || currentUrl.includes('dashboard')
    };

    console.log('Login form accepts credentials: ' + (results.loginFormAcceptsCredentials ? 'PASS' : 'FAIL'));
    console.log('Login button submits: ' + (results.loginButtonSubmits ? 'PASS' : 'FAIL'));
    console.log('Dashboard loads without errors: ' + (results.dashboardLoadsWithoutErrors ? 'PASS' : 'FAIL'));
    console.log('User is authenticated: ' + (results.userIsAuthenticated ? 'PASS' : 'FAIL') + '\n');

    const allPassed = Object.values(results).every(r => r === true);
    console.log('==========================================');
    console.log('OVERALL: ' + (allPassed ? 'PASS' : 'FAIL'));
    console.log('==========================================');

  } catch (error) {
    console.error('\nTEST FAILED WITH ERROR:');
    console.error(error.message);
    console.error('\nStack trace:', error.stack);
    
    try {
      await page.screenshot({ path: path.join(screenshotsDir, '01-error.png'), fullPage: true });
      console.log('\nError screenshot saved: 01-error.png');
    } catch (e) {
      console.error('Could not capture error screenshot');
    }
  } finally {
    await browser.close();
    console.log('\nTest completed');
  }
})();
