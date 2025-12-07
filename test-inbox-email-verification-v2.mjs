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
    profileFetchUrl: null,
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
  console.log('Starting autonomous Playwright verification (v2)...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Network request listener
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

    // Store request for later matching
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
    if (url.includes('/email-profiles') || url.includes('/my-profiles')) {
      results.phase2.profileFetchDetected = true;
      results.phase2.profileFetchUrl = url;
      console.log('✓ Email profile fetch detected:', url);
    }

    // CRITICAL: Capture send-email request
    if (url.includes('/inbox/send-email') || url.includes('/send-email')) {
      console.log('\n🎯 CRITICAL: Send-email request captured!');
      console.log('Full URL:', url);
      results.phase4.sendRequestCaptured = true;
      results.phase4.requestUrl = url;
      results.phase4.requestMethod = requestData?.method || 'UNKNOWN';

      // Log request headers
      console.log('Request headers:', JSON.stringify(requestData?.headers, null, 2));

      // Try to extract FormData
      if (requestData?.postData) {
        console.log('Request postData (raw):', requestData.postData);
        results.phase4.requestDetails.postData = requestData.postData;

        // Check for profile_id in various formats
        if (requestData.postData.includes('profile_id')) {
          results.phase4.profileIdInPayload = true;

          // Try multiple extraction patterns
          const patterns = [
            /profile_id["\s]*[:=]["\s]*([a-f0-9-]+)/i,
            /"profile_id":\s*"([a-f0-9-]+)"/,
            /profile_id=([a-f0-9-]+)/
          ];

          for (const pattern of patterns) {
            const match = requestData.postData.match(pattern);
            if (match) {
              results.phase4.profileIdValue = match[1];
              console.log('✓ profile_id found:', results.phase4.profileIdValue);
              break;
            }
          }
        } else {
          console.log('⚠ WARNING: profile_id NOT found in request payload');
        }
      }

      // Capture response
      results.phase4.responseStatus = response.status();
      console.log('Response status:', response.status());
      console.log('Response headers:', JSON.stringify(response.headers(), null, 2));

      try {
        const responseBody = await response.json();
        results.phase4.responseBody = responseBody;
        results.phase4.responseDetails = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          body: responseBody
        };
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
        console.log('Response text:', responseText);
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
    await page.waitForTimeout(2000);

    results.phase2.inboxLoaded = true;
    console.log('✓ Inbox loaded');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-inbox-loaded.png'), fullPage: true });
    results.screenshots.push('03-inbox-loaded.png');

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

    // Better selector strategy - look for the conversation item
    // From the screenshot, we can see it's a clickable area with email and subject
    const conversationClicked = await page.evaluate(() => {
      // Find any element containing "jwoodcapital@gmail.com" or "test 4"
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.includes('jwoodcapital@gmail.com') || text.includes('test 4')) {
          // Find the clickable parent
          let clickable = el;
          while (clickable && clickable !== document.body) {
            if (clickable.onclick || clickable.getAttribute('role') === 'button' ||
                clickable.tagName === 'BUTTON' || clickable.tagName === 'A' ||
                clickable.classList.toString().includes('conversation') ||
                clickable.classList.toString().includes('item')) {
              clickable.click();
              return true;
            }
            clickable = clickable.parentElement;
          }
          // If no specific clickable found, just click the element
          el.click();
          return true;
        }
      }
      return false;
    });

    if (conversationClicked) {
      results.phase3.conversationSelected = true;
      console.log('✓ Conversation selected');
    } else {
      console.log('⚠ Could not click conversation');
      results.errors.push('Could not click conversation');
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-conversation-selected.png'), fullPage: true });
    results.screenshots.push('05-conversation-selected.png');

    console.log('Looking for compose area...');

    // More comprehensive search for compose field
    const composeFieldFound = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'));
      for (const input of inputs) {
        if (input.offsetParent !== null) { // visible check
          input.scrollIntoView();
          return true;
        }
      }
      return false;
    });

    let composeField = await page.$('textarea');
    if (!composeField) {
      composeField = await page.$('[contenteditable="true"]');
    }

    if (!composeField) {
      console.log('⚠ WARNING: Could not find compose field');
      results.errors.push('Compose field not found');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-compose-area-not-found.png'), fullPage: true });
      results.screenshots.push('06-compose-area-not-found.png');
    } else {
      results.phase3.composeAreaVisible = true;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-compose-area.png'), fullPage: true });
      results.screenshots.push('06-compose-area.png');

      // Scroll to compose field
      await composeField.scrollIntoViewIfNeeded();

      // Check for "From" field
      const fromField = await page.$('select, input[placeholder*="From"]');
      if (fromField) {
        results.phase3.fromFieldStatus = 'visible';
        console.log('✓ "From" field found');
      } else {
        results.phase3.fromFieldStatus = 'not_visible (using default profile)';
        console.log('✓ No "From" field (using default profile)');
      }

      console.log('Typing test message...');
      await composeField.click();
      await page.waitForTimeout(500);
      await composeField.fill(TEST_MESSAGE);
      results.phase3.messageTyped = true;
      console.log('✓ Message typed');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-message-typed.png'), fullPage: true });
      results.screenshots.push('07-message-typed.png');
    }

    // ========================================
    // PHASE 4: CRITICAL - Send Email
    // ========================================
    console.log('\n=== PHASE 4: CRITICAL - Send Email with Network Monitoring ===\n');

    if (!composeField) {
      console.log('⚠ Skipping Phase 4 - no compose field found');
      results.errors.push('Phase 4 skipped - no compose field');
    } else {
      console.log('Looking for Send button...');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-network-before-send.png'), fullPage: true });
      results.screenshots.push('08-network-before-send.png');

      // Find send button using multiple strategies
      let sendButton = await page.$('button:has-text("Send")');
      if (!sendButton) {
        sendButton = await page.$('button[type="submit"]');
      }
      if (!sendButton) {
        // Try to find any button near the compose area
        sendButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || '';
            if (text.includes('send') || text.includes('reply')) {
              return btn;
            }
          }
          return null;
        });
      }

      if (!sendButton || !(await sendButton.asElement())) {
        console.log('⚠ WARNING: Send button not found');
        results.errors.push('Send button not found');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-send-button-not-found.png'), fullPage: true });
        results.screenshots.push('09-send-button-not-found.png');
      } else {
        console.log('✓ Send button found');
        console.log('Clicking Send button...');

        // Wait for response
        const responsePromise = page.waitForResponse(
          response => response.url().includes('/send-email') || response.url().includes('/inbox'),
          { timeout: 15000 }
        ).catch(() => null);

        await sendButton.click();
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-send-clicked.png'), fullPage: true });
        results.screenshots.push('09-send-clicked.png');

        console.log('Waiting for send-email request...');
        const sendResponse = await responsePromise;

        if (!sendResponse) {
          console.log('⚠ WARNING: send-email response not detected within timeout');
          results.errors.push('Send-email response not detected');
        }

        await page.waitForTimeout(3000);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-after-send.png'), fullPage: true });
        results.screenshots.push('10-after-send.png');

        // Check for error toast
        const errorToast = await page.$('[role="alert"]');
        if (errorToast) {
          const errorText = await errorToast.textContent();
          console.log('⚠ ERROR TOAST DETECTED:', errorText);
          results.phase4.errorToastDetected = true;
          results.errors.push(`Error toast: ${errorText}`);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-error-toast.png'), fullPage: true });
          results.screenshots.push('11-error-toast.png');
        } else {
          console.log('✓ No error toast detected');
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-final-state.png'), fullPage: true });
        results.screenshots.push('12-final-state.png');
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

  // Generate Summary
  results.summary = {
    phase2_success: results.phase2.loginSuccessful && results.phase2.inboxLoaded,
    phase3_success: results.phase3.conversationSelected && results.phase3.composeAreaVisible && results.phase3.messageTyped,
    phase4_success: results.phase4.sendRequestCaptured &&
                   results.phase4.requestUrl?.includes('/send-email') &&
                   results.phase4.profileIdInPayload &&
                   results.phase4.responseStatus === 200 &&
                   !results.phase4.errorToastDetected,
    overall_pass: false
  };

  results.summary.overall_pass =
    results.summary.phase2_success &&
    results.summary.phase3_success &&
    results.summary.phase4_success;

  // Save Results
  const resultsPath = 'inbox-email-verification-v2-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Print Summary Report
  console.log('\n' + '='.repeat(80));
  console.log('AUTONOMOUS PLAYWRIGHT VERIFICATION - FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`\nTimestamp: ${results.timestamp}`);
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Screenshot Directory: ${SCREENSHOT_DIR}/`);

  console.log('\n--- PHASE 2: Frontend Email Profile Fetching ---');
  console.log(`Login Successful: ${results.phase2.loginSuccessful ? '✅' : '❌'}`);
  console.log(`Inbox Loaded: ${results.phase2.inboxLoaded ? '✅' : '❌'}`);
  console.log(`Profile Fetch Detected: ${results.phase2.profileFetchDetected ? '✅' : '❌'}`);
  if (results.phase2.profileFetchUrl) {
    console.log(`Profile Fetch URL: ${results.phase2.profileFetchUrl}`);
  }
  console.log(`Network Requests: ${results.phase2.networkRequests.length}`);

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
  console.log(`Error Toast: ${results.phase4.errorToastDetected ? '❌ DETECTED' : '✅ NONE'}`);

  if (results.phase4.responseBody) {
    console.log('\n--- Response Body ---');
    console.log(JSON.stringify(results.phase4.responseBody, null, 2));
  }

  console.log('\n--- VERIFICATION CHECKPOINTS ---');
  console.log(`✓ Login successful: ${results.phase2.loginSuccessful ? '✅' : '❌'}`);
  console.log(`✓ Inbox loads: ${results.phase2.inboxLoaded ? '✅' : '❌'}`);
  console.log(`✓ Conversation opens: ${results.phase3.conversationSelected ? '✅' : '❌'}`);
  console.log(`✓ Message typed: ${results.phase3.messageTyped ? '✅' : '❌'}`);
  console.log(`✓ Send to /send-email: ${results.phase4.requestUrl?.includes('/send-email') ? '✅' : '❌'}`);
  console.log(`✓ profile_id in payload: ${results.phase4.profileIdInPayload ? '✅' : '❌'}`);
  console.log(`✓ Response 200 OK: ${results.phase4.responseStatus === 200 ? '✅' : '❌'}`);
  console.log(`✓ No error toast: ${!results.phase4.errorToastDetected ? '✅' : '❌'}`);

  console.log('\n--- SCREENSHOTS ---');
  results.screenshots.forEach(s => console.log(`- ${SCREENSHOT_DIR}/${s}`));

  if (results.errors.length > 0) {
    console.log('\n--- ERRORS ---');
    results.errors.forEach(e => console.log(`❌ ${e}`));
  }

  console.log('\n--- FINAL VERDICT ---');
  if (results.summary.overall_pass) {
    console.log('🎉 ALL TESTS PASSED - READY FOR PHASE 5 BACKEND LOG VERIFICATION');
  } else {
    console.log('⚠ SOME TESTS FAILED');
    console.log(`Phase 2: ${results.summary.phase2_success ? '✅' : '❌'}`);
    console.log(`Phase 3: ${results.summary.phase3_success ? '✅' : '❌'}`);
    console.log(`Phase 4: ${results.summary.phase4_success ? '✅' : '❌'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Results: ${resultsPath}`);
  console.log('='.repeat(80) + '\n');
}

runTest().catch(console.error);
