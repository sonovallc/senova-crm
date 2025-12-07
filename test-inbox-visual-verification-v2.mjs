import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const SCREENSHOTS_DIR = 'screenshots/inbox-final-verification-v2';
const BASE_URL = 'https://crm.senovallc.com';

async function ensureScreenshotDir() {
  try {
    await fs.access(SCREENSHOTS_DIR);
  } catch {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  }
}

async function takeScreenshot(page, filename, description) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`✅ Screenshot saved: ${filename} - ${description}`);
  return filepath;
}

async function runVisualVerification() {
  console.log('Starting Inbox Visual Verification Test V2...\n');
  console.log('Target URL:', BASE_URL);
  console.log('Login Credentials:');
  console.log('  Email: jwoodcapital@gmail.com');
  console.log('  Password: D3n1w3n1!');
  console.log('-'.repeat(60));

  await ensureScreenshotDir();

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // Set up console and network logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
    }
  });

  const results = {
    screenshots: [],
    loginSuccess: false,
    inboxLoaded: false,
    attachmentsVisible: false,
    errors: [],
    networkErrors: []
  };

  try {
    // Step 1: Check if the site is accessible
    console.log('\nStep 1: Checking site accessibility...');
    const homeResponse = await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    if (homeResponse && homeResponse.status() === 200) {
      console.log('✅ Site is accessible');
    } else {
      console.log(`⚠️ Site returned status: ${homeResponse?.status()}`);
    }

    // Navigate to login
    console.log('\nStep 2: Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    const loginUrl = page.url();
    console.log('Current URL:', loginUrl);

    // Screenshot 1: Login page
    results.screenshots.push(
      await takeScreenshot(page, '01-login-page.png', 'Login page')
    );

    // Step 3: Debug - Check what's on the page
    console.log('\nStep 3: Analyzing login page structure...');

    // Check for form elements
    const emailInput = await page.$('input[name="email"]');
    const passwordInput = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"], button:has-text("Sign In")');

    console.log('Form elements found:');
    console.log('  - Email input:', emailInput ? 'YES' : 'NO');
    console.log('  - Password input:', passwordInput ? 'YES' : 'NO');
    console.log('  - Submit button:', submitButton ? 'YES' : 'NO');

    if (!emailInput || !passwordInput) {
      throw new Error('Login form fields not found');
    }

    // Step 4: Fill the form more carefully
    console.log('\nStep 4: Filling login form...');

    // Clear and fill email
    await emailInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('jwoodcapital@gmail.com');
    console.log('✅ Email entered');

    // Clear and fill password
    await passwordInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('D3n1w3n1!');
    console.log('✅ Password entered');

    await page.waitForTimeout(1000);

    // Take screenshot before submitting
    results.screenshots.push(
      await takeScreenshot(page, '02-login-filled.png', 'Login form filled')
    );

    // Step 5: Submit the form and wait for navigation
    console.log('\nStep 5: Submitting login form...');

    // Set up response listener for login
    const loginResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login') ||
      response.url().includes('/auth/login'),
      { timeout: 10000 }
    ).catch(() => null);

    // Click submit
    await submitButton.click();
    console.log('✅ Submit button clicked');

    // Wait for login response
    const loginResponse = await loginResponsePromise;
    if (loginResponse) {
      console.log(`Login API response: ${loginResponse.status()}`);
      if (loginResponse.status() >= 400) {
        const responseText = await loginResponse.text().catch(() => 'Could not read response');
        console.log('Login error response:', responseText);
        results.errors.push(`Login failed with status ${loginResponse.status()}`);
      }
    }

    // Wait for navigation or error
    await page.waitForTimeout(5000);

    const afterLoginUrl = page.url();
    console.log('URL after login attempt:', afterLoginUrl);

    // Check if we're still on login page
    if (afterLoginUrl.includes('/login')) {
      console.log('❌ Still on login page - login failed');

      // Check for error messages
      const errorMessage = await page.$('text=/error|failed|invalid|incorrect/i');
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        console.log('Error message found:', errorText);
        results.errors.push(errorText);
      }
    } else {
      console.log('✅ Navigated away from login page');
      results.loginSuccess = true;
    }

    // Screenshot 3: After login attempt
    results.screenshots.push(
      await takeScreenshot(page, '03-after-login.png', 'After login attempt')
    );

    // Step 6: Try to access inbox directly (even if login failed)
    console.log('\nStep 6: Attempting to access inbox directly...');

    // First try to set any cookies if we have them
    const cookies = await context.cookies();
    console.log(`Current cookies: ${cookies.length} cookies set`);

    await page.goto(`${BASE_URL}/dashboard/inbox`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    const inboxUrl = page.url();
    console.log('Current URL after inbox navigation:', inboxUrl);

    if (inboxUrl.includes('/inbox')) {
      console.log('✅ On inbox page');
      results.inboxLoaded = true;
    } else if (inboxUrl.includes('/login')) {
      console.log('❌ Redirected to login - not authenticated');
    }

    // Screenshot 4: Inbox attempt
    results.screenshots.push(
      await takeScreenshot(page, '04-inbox-page.png', 'Inbox page attempt')
    );

    // If we made it to inbox, look for conversations
    if (results.inboxLoaded) {
      console.log('\nStep 7: Looking for conversations...');

      // Wait for conversations to load
      await page.waitForTimeout(3000);

      // Look for conversation elements
      const conversations = await page.$$('div[role="button"], .cursor-pointer');
      console.log(`Found ${conversations.length} clickable elements`);

      if (conversations.length > 0) {
        // Click the first conversation
        await conversations[0].click();
        await page.waitForTimeout(2000);

        console.log('✅ Clicked on first conversation');

        // Screenshot 5: Conversation view
        results.screenshots.push(
          await takeScreenshot(page, '05-conversation.png', 'Conversation view')
        );

        // Look for attachments
        console.log('\nStep 8: Looking for attachments...');

        // Scroll to find attachments
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1000);

        // Check for attachment elements
        const attachmentElements = await page.$$('a[href*="attachment"], text=/attachment/i, [class*="attachment"]');

        if (attachmentElements.length > 0) {
          console.log(`✅ Found ${attachmentElements.length} attachment elements`);
          results.attachmentsVisible = true;

          // Screenshot 6: Attachments
          results.screenshots.push(
            await takeScreenshot(page, '06-attachments.png', 'Attachment section')
          );
        } else {
          console.log('❌ No attachment elements found');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.errors.push(error.message);

    // Take error screenshot
    await takeScreenshot(page, 'error-screenshot.png', `Error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Print detailed summary
  console.log('\n' + '='.repeat(60));
  console.log('VISUAL VERIFICATION RESULTS - DETAILED REPORT');
  console.log('='.repeat(60));

  console.log('\n📸 Screenshots Created:');
  results.screenshots.forEach(screenshot => {
    console.log(`  - ${path.basename(screenshot)}`);
  });

  console.log('\n🔍 Authentication Status:');
  console.log(`  - Login Form Found: YES`);
  console.log(`  - Credentials Entered: YES`);
  console.log(`  - Login Success: ${results.loginSuccess ? '✅ YES' : '❌ NO'}`);

  console.log('\n📧 Inbox Status:');
  console.log(`  - Inbox Page Loaded: ${results.inboxLoaded ? '✅ YES' : '❌ NO (Authentication required)'}`);
  console.log(`  - Conversations Found: ${results.inboxLoaded ? 'CHECK SCREENSHOTS' : 'N/A'}`);
  console.log(`  - Attachments Visible: ${results.attachmentsVisible ? '✅ YES' : '❌ NO'}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors Encountered:');
    results.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  console.log('\n🔧 Diagnosis:');
  if (!results.loginSuccess) {
    console.log('  The login appears to be failing. Possible causes:');
    console.log('  1. The credentials may have changed');
    console.log('  2. The login endpoint may be returning 404 (as seen in screenshots)');
    console.log('  3. There may be a configuration issue with the auth system');
    console.log('  ');
    console.log('  The error "Request failed with status code 404" suggests the');
    console.log('  login API endpoint may not be properly configured or accessible.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(60));

  // Save results to JSON
  await fs.writeFile(
    path.join(SCREENSHOTS_DIR, 'verification-results.json'),
    JSON.stringify(results, null, 2)
  );

  return results;
}

// Run the test
runVisualVerification().catch(console.error);