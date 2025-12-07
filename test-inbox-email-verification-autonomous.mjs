import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PRODUCTION_URL = 'https://crm.senovallc.com';
const CREDENTIALS = {
  email: 'jwoodcapital@gmail.com',
  password: 'D3n1w3n1!'
};
const SCREENSHOT_DIR = 'screenshots/inbox-email-verification-autonomous';
const TEST_MESSAGE = `Autonomous test - verifying profile_id fix - ${new Date().toISOString()}`;

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  phase2: {
    loginSuccessful: false,
    inboxLoaded: false,
    profileFetchDetected: false,
    networkRequests: []
  },
  phase3: {
    conversationSelected: false,
    composeAreaVisible: false,
    messageTyped: false,
    fromFieldStatus: 'not_checked'
  },
  phase4: {
    sendRequestCaptured: false,
    requestUrl: null,
    requestMethod: null,
    profileIdInPayload: false,
    profileIdValue: null,
    responseStatus: null,
    responseBody: null,
    errorToastDetected: false,
    messageSentUIUpdated: false,
    requestDetails: {},
    responseDetails: {}
  },
  screenshots: [],
  errors: [],
  summary: {}
};

async function runTest() {
  console.log('Starting autonomous Playwright verification...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: SCREENSHOT_DIR,
      size: { width: 1920, height: 1080 }
    }
  });
  const page = await context.newPage();

  // Network request listener for Phase 2 and Phase 4
  const requestMap = new Map();

  page.on('request', request => {
    const url = request.url();

    // Track all API requests
    if (url.includes('/api/')) {
      results.phase2.networkRequests.push({
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }

    // Store request for later matching with response
    requestMap.set(request, {
      url,
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
  });

  page.on('response', async response => {
    const url = response.url();
    const request = response.request();
    const requestData = requestMap.get(request);

    // Check for email profile fetch
    if (url.includes('/email-profiles') || url.includes('/profiles')) {
      results.phase2.profileFetchDetected = true;
      console.log('✓ Email profile fetch detected:', url);
    }

    // CRITICAL: Capture send-email request
    if (url.includes('/inbox/send-email')) {
      console.log('\n🎯 CRITICAL: Send-email request captured!');
      results.phase4.sendRequestCaptured = true;
      results.phase4.requestUrl = url;
      results.phase4.requestMethod = requestData?.method || 'UNKNOWN';

      // Try to extract FormData from request
      if (requestData?.postData) {
        console.log('Request postData:', requestData.postData);
        results.phase4.requestDetails.postData = requestData.postData;

        // Check for profile_id in FormData
        if (requestData.postData.includes('profile_id')) {
          results.phase4.profileIdInPayload = true;

          // Try to extract profile_id value
          const match = requestData.postData.match(/profile_id["\s]*[:=]["\s]*([a-f0-9-]+)/i);
          if (match) {
            results.phase4.profileIdValue = match[1];
            console.log('✓ profile_id found:', results.phase4.profileIdValue);
          }
        } else {
          console.log('⚠ WARNING: profile_id NOT found in request payload');
        }
      }

      // Capture response
      results.phase4.responseStatus = response.status();
      try {
        const responseBody = await response.json();
        results.phase4.responseBody = responseBody;
        results.phase4.responseDetails = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          body: responseBody
        };
        console.log('Response status:', response.status());
        console.log('Response body:', JSON.stringify(responseBody, null, 2));
      } catch (e) {
        console.log('Could not parse response as JSON:', e.message);
        const responseText = await response.text();
        results.phase4.responseBody = responseText;
        results.phase4.responseDetails = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          bodyText: responseText
        };
      }
    }
  });

  try {
    // ========================================
    // PHASE 2: Frontend Email Profile Fetching
    // ========================================
    console.log('\n=== PHASE 2: Frontend Email Profile Fetching ===\n');

    console.log('Navigating to production login page...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-page.png'), fullPage: true });
    results.screenshots.push('02-login-page.png');

    console.log('Logging in...');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02b-login-filled.png'), fullPage: true });
    results.screenshots.push('02b-login-filled.png');

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    results.phase2.loginSuccessful = true;
    console.log('✓ Login successful');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02c-after-login.png'), fullPage: true });
    results.screenshots.push('02c-after-login.png');

    console.log('Navigating to inbox...');
    await page.goto(`${PRODUCTION_URL}/dashboard/inbox`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for any async profile fetching

    results.phase2.inboxLoaded = true;
    console.log('✓ Inbox loaded');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-inbox-loaded.png'), fullPage: true });
    results.screenshots.push('03-inbox-loaded.png');

    // Check if profile fetch happened
    if (results.phase2.profileFetchDetected) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-network-profile-fetch.png'), fullPage: true });
      results.screenshots.push('04-network-profile-fetch.png');
    }

    console.log(`Network requests captured: ${results.phase2.networkRequests.length}`);

    // ========================================
    // PHASE 3: Inbox Composition UI
    // ========================================
    console.log('\n=== PHASE 3: Inbox Composition UI ===\n');

    console.log('Looking for email conversations...');
    await page.waitForTimeout(2000);

    // Try to find and click first conversation
    const conversationSelectors = [
      '[data-testid="conversation-item"]',
      '.conversation-item',
      '[class*="conversation"]',
      'div[role="button"]'
    ];

    let conversationClicked = false;
    for (const selector of conversationSelectors) {
      const conversations = await page.$$(selector);
      if (conversations.length > 0) {
        console.log(`Found ${conversations.length} conversations with selector: ${selector}`);
        await conversations[0].click();
        conversationClicked = true;
        results.phase3.conversationSelected = true;
        console.log('✓ Conversation selected');
        break;
      }
    }

    if (!conversationClicked) {
      console.log('⚠ No conversations found to click');
      results.errors.push('No conversations found to select');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-conversation-selected.png'), fullPage: true });
    results.screenshots.push('05-conversation-selected.png');

    console.log('Looking for compose area...');
    const composeSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="reply"]',
      'textarea[placeholder*="Type"]',
      'textarea',
      '[contenteditable="true"]'
    ];

    let composeField = null;
    for (const selector of composeSelectors) {
      composeField = await page.$(selector);
      if (composeField) {
        console.log(`Found compose field with selector: ${selector}`);
        results.phase3.composeAreaVisible = true;
        break;
      }
    }

    if (!composeField) {
      console.log('⚠ WARNING: Could not find compose field');
      results.errors.push('Compose field not found');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-compose-area-not-found.png'), fullPage: true });
      results.screenshots.push('06-compose-area-not-found.png');
    } else {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-compose-area.png'), fullPage: true });
      results.screenshots.push('06-compose-area.png');

      // Check for "From" field
      const fromField = await page.$('select[name*="from"], select[name*="profile"], input[name*="from"]');
      if (fromField) {
        results.phase3.fromFieldStatus = 'visible';
        console.log('✓ "From" field found');
      } else {
        results.phase3.fromFieldStatus = 'not_visible (using default profile)';
        console.log('✓ No "From" field (using default profile)');
      }

      console.log('Typing test message...');
      await composeField.click();
      await composeField.fill(TEST_MESSAGE);
      results.phase3.messageTyped = true;
      console.log('✓ Message typed');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-message-typed.png'), fullPage: true });
      results.screenshots.push('07-message-typed.png');
    }

    // ========================================
    // PHASE 4: CRITICAL - Send Email with Network Monitoring
    // ========================================
    console.log('\n=== PHASE 4: CRITICAL - Send Email with Network Monitoring ===\n');

    if (!composeField) {
      console.log('⚠ Skipping Phase 4 - no compose field found');
      results.errors.push('Phase 4 skipped - no compose field');
    } else {
      console.log('Looking for Send button...');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-network-before-send.png'), fullPage: true });
      results.screenshots.push('08-network-before-send.png');

      const sendButtonSelectors = [
        'button:has-text("Send")',
        'button[type="submit"]',
        '[data-testid="send-button"]',
        'button:has-text("Reply")'
      ];

      let sendButton = null;
      for (const selector of sendButtonSelectors) {
        sendButton = await page.$(selector);
        if (sendButton) {
          console.log(`Found send button with selector: ${selector}`);
          break;
        }
      }

      if (!sendButton) {
        console.log('⚠ WARNING: Send button not found');
        results.errors.push('Send button not found');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-send-button-not-found.png'), fullPage: true });
        results.screenshots.push('09-send-button-not-found.png');
      } else {
        console.log('Clicking Send button...');

        // Set up promise to wait for network request
        const sendRequestPromise = page.waitForResponse(
          response => response.url().includes('/inbox/send-email'),
          { timeout: 10000 }
        ).catch(() => null);

        await sendButton.click();
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-send-clicked.png'), fullPage: true });
        results.screenshots.push('09-send-clicked.png');

        console.log('Waiting for send-email request...');
        const sendResponse = await sendRequestPromise;

        if (!sendResponse) {
          console.log('⚠ WARNING: send-email request not detected within timeout');
          results.errors.push('Send-email request not detected');
        }

        await page.waitForTimeout(3000); // Wait for UI updates

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-request-payload.png'), fullPage: true });
        results.screenshots.push('10-request-payload.png');

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-response-success.png'), fullPage: true });
        results.screenshots.push('11-response-success.png');

        // Check for error toast
        const errorToast = await page.$('[role="alert"], .toast-error, [class*="error"]');
        if (errorToast) {
          const errorText = await errorToast.textContent();
          console.log('⚠ ERROR TOAST DETECTED:', errorText);
          results.phase4.errorToastDetected = true;
          results.errors.push(`Error toast: ${errorText}`);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11b-error-toast.png'), fullPage: true });
          results.screenshots.push('11b-error-toast.png');
        } else {
          console.log('✓ No error toast detected');
        }

        // Check if message appears sent in UI
        const messageSent = await page.$('.message-sent, [class*="sent"]');
        if (messageSent) {
          results.phase4.messageSentUIUpdated = true;
          console.log('✓ Message sent UI updated');
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-message-sent-ui.png'), fullPage: true });
        results.screenshots.push('12-message-sent-ui.png');
      }
    }

  } catch (error) {
    console.error('Test error:', error);
    results.errors.push(`Test exception: ${error.message}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'), fullPage: true });
    results.screenshots.push('error-screenshot.png');
  } finally {
    await context.close();
    await browser.close();
  }

  // ========================================
  // Generate Summary
  // ========================================
  results.summary = {
    phase2_success: results.phase2.loginSuccessful && results.phase2.inboxLoaded,
    phase3_success: results.phase3.conversationSelected && results.phase3.composeAreaVisible && results.phase3.messageTyped,
    phase4_success: results.phase4.sendRequestCaptured &&
                   results.phase4.requestUrl?.includes('/inbox/send-email') &&
                   results.phase4.profileIdInPayload &&
                   results.phase4.responseStatus === 200 &&
                   !results.phase4.errorToastDetected,
    overall_pass: false
  };

  results.summary.overall_pass =
    results.summary.phase2_success &&
    results.summary.phase3_success &&
    results.summary.phase4_success;

  // ========================================
  // Save Results
  // ========================================
  const resultsPath = 'inbox-email-verification-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Results saved to ${resultsPath}`);

  // ========================================
  // Print Summary Report
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('AUTONOMOUS PLAYWRIGHT VERIFICATION - FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`\nTimestamp: ${results.timestamp}`);
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Screenshot Directory: ${SCREENSHOT_DIR}/`);

  console.log('\n--- PHASE 2: Frontend Email Profile Fetching ---');
  console.log(`Login Successful: ${results.phase2.loginSuccessful ? '✅' : '❌'}`);
  console.log(`Inbox Loaded: ${results.phase2.inboxLoaded ? '✅' : '❌'}`);
  console.log(`Profile Fetch Detected: ${results.phase2.profileFetchDetected ? '✅' : '⚠ (may not be visible in network)'}`);
  console.log(`Network Requests Captured: ${results.phase2.networkRequests.length}`);

  console.log('\n--- PHASE 3: Inbox Composition UI ---');
  console.log(`Conversation Selected: ${results.phase3.conversationSelected ? '✅' : '❌'}`);
  console.log(`Compose Area Visible: ${results.phase3.composeAreaVisible ? '✅' : '❌'}`);
  console.log(`Message Typed: ${results.phase3.messageTyped ? '✅' : '❌'}`);
  console.log(`From Field Status: ${results.phase3.fromFieldStatus}`);

  console.log('\n--- PHASE 4: CRITICAL - Send Email Network Monitoring ---');
  console.log(`Send Request Captured: ${results.phase4.sendRequestCaptured ? '✅' : '❌'}`);
  console.log(`Request URL: ${results.phase4.requestUrl || 'NOT CAPTURED'}`);
  console.log(`Request Method: ${results.phase4.requestMethod || 'NOT CAPTURED'}`);
  console.log(`profile_id in Payload: ${results.phase4.profileIdInPayload ? '✅' : '❌'}`);
  console.log(`profile_id Value: ${results.phase4.profileIdValue || 'NOT FOUND'}`);
  console.log(`Response Status: ${results.phase4.responseStatus || 'NOT CAPTURED'}`);
  console.log(`Error Toast Detected: ${results.phase4.errorToastDetected ? '❌ YES' : '✅ NO'}`);
  console.log(`Message Sent UI Updated: ${results.phase4.messageSentUIUpdated ? '✅' : '⚠'}`);

  if (results.phase4.responseBody) {
    console.log('\nResponse Body:');
    console.log(JSON.stringify(results.phase4.responseBody, null, 2));
  }

  console.log('\n--- VERIFICATION CHECKPOINTS ---');
  console.log(`✅ Login successful: ${results.phase2.loginSuccessful}`);
  console.log(`✅ Inbox loads: ${results.phase2.inboxLoaded}`);
  console.log(`✅ Conversation opens: ${results.phase3.conversationSelected}`);
  console.log(`✅ Message can be typed: ${results.phase3.messageTyped}`);
  console.log(`✅ Send request to /api/v1/inbox/send-email: ${results.phase4.requestUrl?.includes('/inbox/send-email') || false}`);
  console.log(`✅ Request includes profile_id: ${results.phase4.profileIdInPayload}`);
  console.log(`✅ Response is 200 OK: ${results.phase4.responseStatus === 200}`);
  console.log(`✅ No error toast: ${!results.phase4.errorToastDetected}`);

  console.log('\n--- SCREENSHOTS CAPTURED ---');
  results.screenshots.forEach(screenshot => {
    console.log(`- ${SCREENSHOT_DIR}/${screenshot}`);
  });

  if (results.errors.length > 0) {
    console.log('\n--- ERRORS ENCOUNTERED ---');
    results.errors.forEach(error => {
      console.log(`❌ ${error}`);
    });
  }

  console.log('\n--- FINAL VERDICT ---');
  if (results.summary.overall_pass) {
    console.log('🎉 ALL TESTS PASSED - READY FOR PHASE 5 BACKEND LOG VERIFICATION');
  } else {
    console.log('⚠ SOME TESTS FAILED - REVIEW RESULTS AND SCREENSHOTS');
    console.log(`Phase 2: ${results.summary.phase2_success ? '✅' : '❌'}`);
    console.log(`Phase 3: ${results.summary.phase3_success ? '✅' : '❌'}`);
    console.log(`Phase 4: ${results.summary.phase4_success ? '✅' : '❌'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Full results saved to: ${resultsPath}`);
  console.log('='.repeat(80) + '\n');
}

runTest().catch(console.error);
