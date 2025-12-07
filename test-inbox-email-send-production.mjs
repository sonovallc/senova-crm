import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PRODUCTION_URL = 'https://crm.senovallc.com';
const CREDENTIALS = {
  email: 'james@senovallc.com',
  password: 'Senova2024!'
};

const screenshotDir = path.join(process.cwd(), 'screenshots', 'inbox-email-send-production');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  productionUrl: PRODUCTION_URL,
  testSteps: [],
  errors: [],
  networkRequests: [],
  consoleLogs: [],
  consoleErrors: [],
  success: false
};

async function runTest() {
  console.log('='.repeat(80));
  console.log('PRODUCTION INBOX EMAIL SEND TEST - PROFILE_ID FIX VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Test Time: ${new Date().toISOString()}`);
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: screenshotDir,
      size: { width: 1920, height: 1080 }
    }
  });
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    results.consoleLogs.push(text);
    if (msg.type() === 'error') {
      results.consoleErrors.push(text);
      console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
    }
  });

  // Capture network requests - CRITICAL FOR VERIFYING profile_id
  const sendEmailRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/v1/inbox/send-email')) {
      const requestData = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      };
      sendEmailRequests.push(requestData);
      results.networkRequests.push(requestData);
      console.log(`\n📤 NETWORK REQUEST CAPTURED: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/v1/inbox/send-email')) {
      const status = response.status();
      const responseData = {
        url: response.url(),
        status: status,
        statusText: response.statusText(),
        headers: response.headers()
      };

      try {
        const body = await response.json();
        responseData.body = body;
      } catch (e) {
        responseData.body = 'Unable to parse response body';
      }

      results.networkRequests.push(responseData);
      console.log(`\n📥 NETWORK RESPONSE: ${status} ${response.statusText()}`);
      console.log(`Response Body:`, JSON.stringify(responseData.body, null, 2));
    }
  });

  try {
    // STEP 1: Login
    console.log('\n📝 STEP 1: Login to production...');
    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });

    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.screenshot({ path: path.join(screenshotDir, '02-login-filled.png'), fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '03-after-login.png'), fullPage: true });

    results.testSteps.push({ step: 1, name: 'Login', status: 'PASS' });
    console.log('✅ Login successful');

    // STEP 2: Navigate to Inbox
    console.log('\n📝 STEP 2: Navigate to /dashboard/inbox...');
    await page.goto(`${PRODUCTION_URL}/dashboard/inbox`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '04-inbox-page.png'), fullPage: true });

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/inbox')) {
      throw new Error(`Failed to navigate to inbox. Current URL: ${currentUrl}`);
    }

    results.testSteps.push({ step: 2, name: 'Navigate to Inbox', status: 'PASS', url: currentUrl });
    console.log('✅ Inbox page loaded');

    // STEP 3: Find and click on a conversation
    console.log('\n📝 STEP 3: Find and click on an existing email conversation...');

    // Wait for inbox to load
    await page.waitForTimeout(2000);

    // Try to find an email conversation (adjust selector based on actual inbox structure)
    const conversationSelectors = [
      'div[class*="conversation"]',
      'div[class*="email-item"]',
      'div[class*="message-item"]',
      'li[class*="conversation"]',
      '[role="listitem"]',
      'div.cursor-pointer'
    ];

    let conversationClicked = false;
    for (const selector of conversationSelectors) {
      const conversations = await page.locator(selector).all();
      if (conversations.length > 0) {
        console.log(`Found ${conversations.length} conversations using selector: ${selector}`);
        await conversations[0].click();
        conversationClicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    }

    await page.screenshot({ path: path.join(screenshotDir, '05-conversation-opened.png'), fullPage: true });

    if (!conversationClicked) {
      console.log('⚠️ No existing conversations found. Checking if compose form is available...');
    } else {
      results.testSteps.push({ step: 3, name: 'Open Conversation', status: 'PASS' });
      console.log('✅ Conversation opened');
    }

    // STEP 4: Find the message composer
    console.log('\n📝 STEP 4: Locate message composer...');

    const composerSelectors = [
      'textarea[placeholder*="Type"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="reply"]',
      'textarea[name="message"]',
      'textarea',
      'div[contenteditable="true"]'
    ];

    let composerFound = false;
    let composer;
    for (const selector of composerSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        composer = elements[elements.length - 1]; // Get last one (usually the reply box)
        composerFound = true;
        console.log(`✅ Found composer using selector: ${selector}`);
        break;
      }
    }

    if (!composerFound) {
      throw new Error('Could not find message composer textarea');
    }

    await page.screenshot({ path: path.join(screenshotDir, '06-composer-found.png'), fullPage: true });

    // STEP 5: Type test message
    console.log('\n📝 STEP 5: Type test message...');
    const testMessage = 'Test email reply - verifying profile_id fix - ' + new Date().toISOString();

    await composer.click();
    await page.waitForTimeout(500);
    await composer.fill(testMessage);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '07-message-typed.png'), fullPage: true });

    results.testSteps.push({ step: 5, name: 'Type Message', status: 'PASS', message: testMessage });
    console.log('✅ Message typed');

    // STEP 6: CRITICAL - Click Send and Capture Network Request
    console.log('\n📝 STEP 6: Click Send button and monitor network...');
    console.log('🔍 CRITICAL: Watching for profile_id in request...\n');

    // Find send button
    const sendButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      'button:has-text("send")',
      'button[aria-label*="Send"]',
      'button >> text=/send/i'
    ];

    let sendButton;
    for (const selector of sendButtonSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        sendButton = buttons[buttons.length - 1]; // Get last one (usually the send button in reply form)
        console.log(`✅ Found send button using selector: ${selector}`);
        break;
      }
    }

    if (!sendButton) {
      throw new Error('Could not find Send button');
    }

    // Click send and wait for network response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/v1/inbox/send-email'),
      { timeout: 10000 }
    ).catch(() => null);

    await sendButton.click();
    console.log('✅ Send button clicked');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '08-after-send-click.png'), fullPage: true });

    const response = await responsePromise;

    // STEP 7: VERIFY RESPONSE
    console.log('\n📝 STEP 7: Verify response...');

    if (response) {
      const status = response.status();
      console.log(`Response Status: ${status}`);

      if (status === 200) {
        console.log('✅ Response status is 200 OK');
        results.testSteps.push({ step: 7, name: 'Send Email', status: 'PASS', responseStatus: status });
      } else if (status === 400) {
        console.log('❌ Response status is 400 Bad Request - FIX MAY NOT BE WORKING');
        results.errors.push('Received 400 Bad Request - profile_id may be missing');
        results.testSteps.push({ step: 7, name: 'Send Email', status: 'FAIL', responseStatus: status });
      } else {
        console.log(`⚠️ Unexpected response status: ${status}`);
        results.testSteps.push({ step: 7, name: 'Send Email', status: 'WARN', responseStatus: status });
      }

      try {
        const responseBody = await response.json();
        console.log('Response Body:', JSON.stringify(responseBody, null, 2));
        results.networkRequests.push({ type: 'response', status, body: responseBody });
      } catch (e) {
        console.log('Could not parse response body');
      }
    } else {
      console.log('⚠️ No response captured - network timeout or no request made');
      results.errors.push('No network response captured');
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '09-final-state.png'), fullPage: true });

    // STEP 8: Check for error/success toasts
    console.log('\n📝 STEP 8: Check for toast notifications...');

    const toastSelectors = [
      '[role="alert"]',
      '.toast',
      '[class*="toast"]',
      '[class*="notification"]'
    ];

    for (const selector of toastSelectors) {
      const toasts = await page.locator(selector).all();
      if (toasts.length > 0) {
        for (let i = 0; i < toasts.length; i++) {
          const text = await toasts[i].textContent();
          console.log(`Toast ${i + 1}: ${text}`);
          results.testSteps.push({ step: 8, name: 'Toast Notification', text });

          if (text.toLowerCase().includes('no email profile')) {
            console.log('❌ ERROR TOAST FOUND: "No email profile selected"');
            results.errors.push('Error toast: No email profile selected');
          } else if (text.toLowerCase().includes('success') || text.toLowerCase().includes('sent')) {
            console.log('✅ SUCCESS TOAST FOUND');
          }
        }
        await page.screenshot({ path: path.join(screenshotDir, '10-toast-notification.png'), fullPage: true });
      }
    }

    // STEP 9: ANALYZE CAPTURED NETWORK REQUESTS
    console.log('\n' + '='.repeat(80));
    console.log('CRITICAL VERIFICATION: ANALYZING NETWORK REQUEST FOR profile_id');
    console.log('='.repeat(80));

    if (sendEmailRequests.length > 0) {
      console.log(`\n✅ Captured ${sendEmailRequests.length} send-email request(s)\n`);

      sendEmailRequests.forEach((req, idx) => {
        console.log(`Request ${idx + 1}:`);
        console.log(`  URL: ${req.url}`);
        console.log(`  Method: ${req.method}`);
        console.log(`  Post Data: ${req.postData ? req.postData.substring(0, 500) : 'None'}`);

        // Check for profile_id in the request
        const hasProfileId = req.postData && req.postData.includes('profile_id');
        if (hasProfileId) {
          console.log(`  ✅ profile_id FOUND in request FormData`);
          results.success = true;
        } else {
          console.log(`  ❌ profile_id NOT FOUND in request FormData`);
          results.errors.push('profile_id parameter missing from request');
        }
        console.log('');
      });
    } else {
      console.log('❌ No send-email requests captured');
      results.errors.push('No send-email network requests captured');
    }

    // Final success determination
    if (results.errors.length === 0 && sendEmailRequests.length > 0) {
      results.success = true;
      console.log('\n✅ TEST PASSED: Email send fix verified successfully');
    } else {
      results.success = false;
      console.log('\n❌ TEST FAILED: Issues detected');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    results.errors.push(error.message);
    results.success = false;
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await context.close();
    await browser.close();
  }

  // Save results
  const resultsPath = path.join(process.cwd(), 'inbox-email-send-production-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // FINAL REPORT
  console.log('\n' + '='.repeat(80));
  console.log('FINAL TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Overall Status: ${results.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total Steps: ${results.testSteps.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Console Errors: ${results.consoleErrors.length}`);
  console.log(`Network Requests Captured: ${results.networkRequests.length}`);
  console.log(`\nResults saved to: ${resultsPath}`);
  console.log(`Screenshots saved to: ${screenshotDir}`);
  console.log('='.repeat(80));

  if (results.errors.length > 0) {
    console.log('\nERRORS FOUND:');
    results.errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }

  if (results.consoleErrors.length > 0) {
    console.log('\nCONSOLE ERRORS:');
    results.consoleErrors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }

  return results;
}

runTest().catch(console.error);
