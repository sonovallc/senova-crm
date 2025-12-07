import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PRODUCTION_URL = 'https://crm.senovallc.com';

const screenshotDir = path.join(process.cwd(), 'screenshots', 'inbox-email-send-production-v2');
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
  console.log('⚠️  MANUAL LOGIN REQUIRED - Browser will open for you to login manually');
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
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
      console.log(`Post Data Length: ${requestData.postData ? requestData.postData.length : 0} bytes`);
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
        try {
          const text = await response.text();
          responseData.body = text;
        } catch (e2) {
          responseData.body = 'Unable to parse response';
        }
      }

      results.networkRequests.push(responseData);
      console.log(`\n📥 NETWORK RESPONSE: ${status} ${response.statusText()}`);
      console.log(`Response Body:`, JSON.stringify(responseData.body, null, 2));
    }
  });

  try {
    // STEP 1: Navigate to login
    console.log('\n📝 STEP 1: Navigate to production login...');
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });

    console.log('\n⏸️  PAUSED - Please login manually in the browser window');
    console.log('   After logging in successfully, press Enter here to continue...');

    // Wait for user to press Enter
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    await page.screenshot({ path: path.join(screenshotDir, '02-after-manual-login.png'), fullPage: true });

    if (currentUrl.includes('/login')) {
      throw new Error('Still on login page - login may have failed');
    }

    results.testSteps.push({ step: 1, name: 'Manual Login', status: 'PASS', url: currentUrl });
    console.log('✅ Login confirmed');

    // STEP 2: Navigate to Inbox
    console.log('\n📝 STEP 2: Navigate to /dashboard/inbox...');
    await page.goto(`${PRODUCTION_URL}/dashboard/inbox`);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotDir, '03-inbox-page.png'), fullPage: true });

    const inboxUrl = page.url();
    console.log(`Current URL: ${inboxUrl}`);

    if (!inboxUrl.includes('/inbox')) {
      throw new Error(`Failed to navigate to inbox. Current URL: ${inboxUrl}`);
    }

    results.testSteps.push({ step: 2, name: 'Navigate to Inbox', status: 'PASS', url: inboxUrl });
    console.log('✅ Inbox page loaded');

    // STEP 3: Find and click on a conversation
    console.log('\n📝 STEP 3: Looking for email conversations...');

    await page.waitForTimeout(3000);

    // Try multiple selectors to find conversations
    const conversationSelectors = [
      'div.cursor-pointer',
      '[role="listitem"]',
      'div[class*="conversation"]',
      'div[class*="email"]',
      'li'
    ];

    let conversationClicked = false;
    for (const selector of conversationSelectors) {
      const conversations = await page.locator(selector).all();
      if (conversations.length > 0) {
        console.log(`Found ${conversations.length} elements using selector: ${selector}`);

        // Try to find one that looks like a conversation
        for (let i = 0; i < Math.min(5, conversations.length); i++) {
          const text = await conversations[i].textContent();
          if (text && text.length > 10) { // Has substantial content
            console.log(`Clicking on conversation ${i + 1}: "${text.substring(0, 50)}..."`);
            await conversations[i].click();
            conversationClicked = true;
            await page.waitForTimeout(3000);
            break;
          }
        }
        if (conversationClicked) break;
      }
    }

    await page.screenshot({ path: path.join(screenshotDir, '04-after-conversation-click.png'), fullPage: true });

    if (!conversationClicked) {
      console.log('⚠️ No existing conversations found. Will attempt to use compose form anyway...');
      results.testSteps.push({ step: 3, name: 'Open Conversation', status: 'SKIP', reason: 'No conversations found' });
    } else {
      results.testSteps.push({ step: 3, name: 'Open Conversation', status: 'PASS' });
      console.log('✅ Conversation opened');
    }

    // STEP 4: Find the message composer
    console.log('\n📝 STEP 4: Locating message composer...');

    await page.waitForTimeout(2000);

    const composerSelectors = [
      'textarea[placeholder*="Type"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="reply"]',
      'textarea[placeholder*="Message"]',
      'textarea',
      'div[contenteditable="true"]'
    ];

    let composerFound = false;
    let composer;
    for (const selector of composerSelectors) {
      const elements = await page.locator(selector).all();
      console.log(`Checking selector "${selector}": found ${elements.length} elements`);

      if (elements.length > 0) {
        // Get the last visible one (usually the reply box at bottom)
        for (let i = elements.length - 1; i >= 0; i--) {
          const isVisible = await elements[i].isVisible();
          if (isVisible) {
            composer = elements[i];
            composerFound = true;
            console.log(`✅ Found visible composer using selector: ${selector} (index ${i})`);
            break;
          }
        }
        if (composerFound) break;
      }
    }

    if (!composerFound) {
      throw new Error('Could not find message composer textarea');
    }

    await page.screenshot({ path: path.join(screenshotDir, '05-composer-found.png'), fullPage: true });
    results.testSteps.push({ step: 4, name: 'Find Composer', status: 'PASS' });

    // STEP 5: Type test message
    console.log('\n📝 STEP 5: Typing test message...');
    const testMessage = 'Test email reply - verifying profile_id fix - ' + new Date().toISOString();

    await composer.click();
    await page.waitForTimeout(500);
    await composer.fill(testMessage);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '06-message-typed.png'), fullPage: true });

    results.testSteps.push({ step: 5, name: 'Type Message', status: 'PASS', message: testMessage });
    console.log('✅ Message typed');

    // STEP 6: CRITICAL - Click Send and Capture Network Request
    console.log('\n📝 STEP 6: Clicking Send button and monitoring network...');
    console.log('🔍 CRITICAL: Watching for profile_id in FormData...\n');

    // Find send button
    const sendButtonSelectors = [
      'button:has-text("Send")',
      'button:has-text("send")',
      'button[type="submit"]',
      'button[aria-label*="Send"]'
    ];

    let sendButton;
    for (const selector of sendButtonSelectors) {
      const buttons = await page.locator(selector).all();
      console.log(`Checking for send button with selector "${selector}": found ${buttons.length}`);

      if (buttons.length > 0) {
        // Get the last visible one
        for (let i = buttons.length - 1; i >= 0; i--) {
          const isVisible = await buttons[i].isVisible();
          if (isVisible) {
            sendButton = buttons[i];
            const text = await buttons[i].textContent();
            console.log(`✅ Found send button: "${text}" (index ${i})`);
            break;
          }
        }
        if (sendButton) break;
      }
    }

    if (!sendButton) {
      throw new Error('Could not find Send button');
    }

    await page.screenshot({ path: path.join(screenshotDir, '07-before-send.png'), fullPage: true });

    // Click send and wait for network response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/v1/inbox/send-email'),
      { timeout: 15000 }
    ).catch(() => null);

    await sendButton.click();
    console.log('✅ Send button clicked');

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '08-after-send-click.png'), fullPage: true });

    const response = await responsePromise;
    await page.waitForTimeout(2000);

    // STEP 7: VERIFY RESPONSE
    console.log('\n📝 STEP 7: Verifying response...');

    if (response) {
      const status = response.status();
      console.log(`Response Status: ${status}`);

      if (status === 200) {
        console.log('✅ Response status is 200 OK - EMAIL SENT SUCCESSFULLY');
        results.testSteps.push({ step: 7, name: 'Send Email', status: 'PASS', responseStatus: status });
      } else if (status === 400) {
        console.log('❌ Response status is 400 Bad Request - FIX MAY NOT BE WORKING');
        results.errors.push('Received 400 Bad Request - profile_id may be missing');
        results.testSteps.push({ step: 7, name: 'Send Email', status: 'FAIL', responseStatus: status });
      } else {
        console.log(`⚠️ Unexpected response status: ${status}`);
        results.testSteps.push({ step: 7, name: 'Send Email', status: 'WARN', responseStatus: status });
      }
    } else {
      console.log('⚠️ No response captured - request may not have been made');
      results.errors.push('No network response captured');
    }

    await page.screenshot({ path: path.join(screenshotDir, '09-final-state.png'), fullPage: true });

    // STEP 8: Check for error/success toasts
    console.log('\n📝 STEP 8: Checking for toast notifications...');

    const toastSelectors = [
      '[role="alert"]',
      '.toast',
      '[class*="toast"]',
      '[class*="Toast"]',
      '[class*="notification"]',
      'div[class*="bg-red"]',
      'div[class*="bg-green"]'
    ];

    let toastFound = false;
    for (const selector of toastSelectors) {
      const toasts = await page.locator(selector).all();
      if (toasts.length > 0) {
        for (let i = 0; i < toasts.length; i++) {
          const isVisible = await toasts[i].isVisible();
          if (isVisible) {
            const text = await toasts[i].textContent();
            console.log(`Toast notification: ${text}`);
            results.testSteps.push({ step: 8, name: 'Toast Notification', text });
            toastFound = true;

            if (text.toLowerCase().includes('no email profile')) {
              console.log('❌ ERROR TOAST: "No email profile selected"');
              results.errors.push('Error toast: No email profile selected');
            } else if (text.toLowerCase().includes('success') || text.toLowerCase().includes('sent')) {
              console.log('✅ SUCCESS TOAST FOUND');
            }
          }
        }
        if (toastFound) {
          await page.screenshot({ path: path.join(screenshotDir, '10-toast-notification.png'), fullPage: true });
          break;
        }
      }
    }

    if (!toastFound) {
      console.log('No toast notifications visible');
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

        if (req.postData) {
          console.log(`  Post Data (first 500 chars): ${req.postData.substring(0, 500)}`);

          // Check for profile_id in the FormData
          const hasProfileId = req.postData.includes('profile_id');
          if (hasProfileId) {
            console.log(`  ✅ ✅ ✅ profile_id FOUND in request FormData`);

            // Try to extract the profile_id value
            const match = req.postData.match(/name="profile_id"[^]*?(\d+)/);
            if (match) {
              console.log(`  Profile ID value: ${match[1]}`);
            }

            results.success = true;
          } else {
            console.log(`  ❌ ❌ ❌ profile_id NOT FOUND in request FormData`);
            results.errors.push('profile_id parameter missing from request');
          }
        } else {
          console.log(`  ⚠️ No post data captured`);
          results.errors.push('No post data in send-email request');
        }
        console.log('');
      });
    } else {
      console.log('❌ No send-email requests captured');
      results.errors.push('No send-email network requests captured');
    }

    // Check responses too
    const responses = results.networkRequests.filter(r => r.status);
    if (responses.length > 0) {
      console.log('\nNetwork Responses:');
      responses.forEach((resp, idx) => {
        console.log(`Response ${idx + 1}:`);
        console.log(`  Status: ${resp.status} ${resp.statusText}`);
        console.log(`  Body:`, JSON.stringify(resp.body, null, 2));
      });
    }

    // Final success determination
    if (results.errors.length === 0 && sendEmailRequests.length > 0) {
      results.success = true;
      console.log('\n✅ ✅ ✅ TEST PASSED: Email send with profile_id verified successfully');
    } else {
      results.success = false;
      console.log('\n❌ ❌ ❌ TEST FAILED: Issues detected');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    results.errors.push(error.message);
    results.success = false;
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    console.log('\nTest complete. Press Enter to close browser and finish...');
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    await context.close();
    await browser.close();
  }

  // Save results
  const resultsPath = path.join(process.cwd(), 'inbox-email-send-production-v2-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // FINAL REPORT
  console.log('\n' + '='.repeat(80));
  console.log('FINAL TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Overall Status: ${results.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total Steps: ${results.testSteps.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Console Errors: ${results.consoleErrors.length}`);
  console.log(`Send Email Requests Captured: ${sendEmailRequests.length}`);
  console.log(`\nResults saved to: ${resultsPath}`);
  console.log(`Screenshots saved to: ${screenshotDir}`);
  console.log('='.repeat(80));

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    results.errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }

  if (results.consoleErrors.length > 0) {
    console.log('\n❌ CONSOLE ERRORS:');
    results.consoleErrors.slice(0, 10).forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }

  return results;
}

console.log('\nStarting test with manual login...');
console.log('You will need to:');
console.log('1. Login manually when browser opens');
console.log('2. Press Enter to continue after successful login');
console.log('3. Watch the test execute');
console.log('4. Press Enter again to close browser when done\n');

runTest().catch(console.error);
