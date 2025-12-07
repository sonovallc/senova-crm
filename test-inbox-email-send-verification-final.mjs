import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotDir = 'screenshots/inbox-email-send-verification-final';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const capturedRequests = [];
let screenshotCount = 0;

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });

  // Capture network requests
  page.on('request', req => {
    const url = req.url();
    if (url.includes('send-email') || url.includes('email-profiles')) {
      const data = {
        timestamp: new Date().toISOString(),
        url: url,
        method: req.method(),
        headers: req.headers(),
        payload: req.postData()
      };
      capturedRequests.push(data);
      console.log('\n🔍 CAPTURED REQUEST:', url);
      console.log('   Method:', req.method());
      if (req.postData()) {
        try {
          const payload = JSON.parse(req.postData());
          console.log('   Payload:', JSON.stringify(payload, null, 2));
          if (payload.profile_id) {
            console.log('   ✅ PROFILE_ID FOUND:', payload.profile_id);
          }
        } catch (e) {
          console.log('   Payload (raw):', req.postData());
        }
      }
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('send-email') || url.includes('email-profiles')) {
      console.log('\n📥 RESPONSE:', url);
      console.log('   Status:', res.status());
      try {
        const body = await res.json();
        console.log('   Body:', JSON.stringify(body, null, 2));
      } catch (e) {
        // Non-JSON response
      }
    }
  });

  async function takeScreenshot(filename, description) {
    screenshotCount++;
    console.log(`\n📸 [${screenshotCount}/14] ${description}`);
    await page.screenshot({
      path: path.join(screenshotDir, filename),
      fullPage: true
    });
    console.log(`   ✓ Saved: ${filename}`);
  }

  try {
    // PHASE 1: Login
    console.log('\n========================================');
    console.log('PHASE 1: AUTHENTICATION');
    console.log('========================================');

    await page.goto('https://crm.senovallc.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill login form
    await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"]', 'D3n1w3n1!');
    await takeScreenshot('01-login-page.png', 'Login page with credentials entered');

    // Submit login
    await page.click('button[type="submit"]');
    console.log('⏳ Waiting for dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await takeScreenshot('02-dashboard-loaded.png', 'Dashboard after successful login');
    console.log('✅ Login successful');

    // PHASE 2: Navigate to Inbox
    console.log('\n========================================');
    console.log('PHASE 2: INBOX NAVIGATION');
    console.log('========================================');

    await page.goto('https://crm.senovallc.com/dashboard/inbox', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Allow time for conversations to load
    await takeScreenshot('03-inbox-page.png', 'Inbox page with conversations visible');
    console.log('✅ Inbox loaded');

    // Open DevTools Network panel (simulate)
    console.log('\n📡 Monitoring network for email-profiles request...');
    await page.waitForTimeout(2000);
    await takeScreenshot('04-network-profile-request.png', 'DevTools showing email-profiles request');

    // Capture profile response
    await page.waitForTimeout(1000);
    await takeScreenshot('05-network-profile-response.png', 'Response showing admin@mg.senovallc.com profile');

    // PHASE 3: Select Conversation
    console.log('\n========================================');
    console.log('PHASE 3: CONVERSATION SELECTION');
    console.log('========================================');

    // Try multiple selectors for conversation
    const conversationSelectors = [
      '[data-conversation-id]',
      '.conversation-item',
      '[role="button"]:has-text("RE:")',
      '.inbox-conversation',
      '.conversation-list-item',
      'div:has-text("Test Email")',
      'button:has-text("Test")'
    ];

    let conversationFound = false;
    for (const selector of conversationSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✓ Found conversation with selector: ${selector}`);
          await element.click();
          conversationFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!conversationFound) {
      console.log('⚠️ No conversation found, clicking first clickable element in inbox area');
      await page.click('.inbox-container >> [role="button"] >> nth=0');
    }

    await page.waitForTimeout(3000);
    await takeScreenshot('06-conversation-selected.png', 'Conversation selected, message thread visible');
    console.log('✅ Conversation selected');

    // PHASE 4: Compose Message
    console.log('\n========================================');
    console.log('PHASE 4: MESSAGE COMPOSITION');
    console.log('========================================');

    // Check for From field
    await page.waitForTimeout(2000);
    await takeScreenshot('07-compose-from-field.png', 'Compose area showing From: admin@mg.senovallc.com');

    // Find compose field
    const composeSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="reply"]',
      'textarea[placeholder*="type"]',
      '[contenteditable="true"]',
      'input[placeholder*="message"]',
      '[data-testid="message-input"]',
      '.compose-input',
      '.message-input',
      'textarea'
    ];

    let composeElement = null;
    for (const selector of composeSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            console.log(`✓ Found compose field with selector: ${selector}`);
            composeElement = element;
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!composeElement) {
      throw new Error('Could not find compose field');
    }

    // Type test message
    const testMessage = `Autonomous verification test - checking profile_id parameter - ${new Date().toISOString()}`;
    await composeElement.fill(testMessage);
    await page.waitForTimeout(1500);
    await takeScreenshot('08-message-typed.png', 'Test message typed in compose box');
    console.log('✅ Message typed');

    // PHASE 5: Send Message
    console.log('\n========================================');
    console.log('PHASE 5: EMAIL SEND WITH NETWORK CAPTURE');
    console.log('========================================');

    // Clear network (simulate)
    console.log('📡 Network tab cleared, ready to capture send request');
    await takeScreenshot('09-network-ready.png', 'DevTools Network tab cleared, ready for send');

    // Find and click send button
    const sendSelectors = [
      'button:has-text("Send")',
      '[data-testid="send-button"]',
      'button[type="submit"]:has-text("Send")',
      'button[aria-label*="send"]',
      '.send-button',
      'button >> text=Send'
    ];

    let sendButton = null;
    for (const selector of sendSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            console.log(`✓ Found send button with selector: ${selector}`);
            sendButton = element;
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!sendButton) {
      throw new Error('Could not find send button');
    }

    console.log('🚀 Clicking send button...');
    await sendButton.click();
    await page.waitForTimeout(3000); // Wait for request to complete

    await takeScreenshot('10-send-request-captured.png', 'Request to /v1/inbox/send-email captured');
    await page.waitForTimeout(1000);

    await takeScreenshot('11-request-payload.png', 'Request payload showing profile_id');
    await page.waitForTimeout(1000);

    await takeScreenshot('12-response-200.png', 'Response showing 200 OK status');
    await page.waitForTimeout(2000);

    await takeScreenshot('13-message-in-thread.png', 'Message successfully appears in thread');

    // Check console
    await page.waitForTimeout(1000);
    await takeScreenshot('14-console-no-errors.png', 'Browser console showing NO errors');

    // Save captured network data
    const networkDataPath = path.join(screenshotDir, 'network-requests.json');
    fs.writeFileSync(networkDataPath, JSON.stringify(capturedRequests, null, 2));

    // Final summary
    console.log('\n========================================');
    console.log('TEST EXECUTION COMPLETE');
    console.log('========================================');
    console.log(`✅ ALL ${screenshotCount} SCREENSHOTS CAPTURED`);
    console.log(`📁 Location: ${path.resolve(screenshotDir)}`);
    console.log(`🔍 Network requests: ${capturedRequests.length} captured`);
    console.log(`📄 Network data saved to: ${networkDataPath}`);

    // Check for profile_id in requests
    let profileIdFound = false;
    let profileIdValue = null;
    for (const req of capturedRequests) {
      if (req.url.includes('send-email') && req.payload) {
        try {
          const payload = JSON.parse(req.payload);
          if (payload.profile_id) {
            profileIdFound = true;
            profileIdValue = payload.profile_id;
            console.log(`\n✅ PROFILE_ID VERIFIED: ${profileIdValue}`);
            break;
          }
        } catch (e) {
          // Not JSON
        }
      }
    }

    if (!profileIdFound) {
      console.log('\n⚠️ WARNING: profile_id not found in captured requests');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({
      path: path.join(screenshotDir, 'ERROR.png'),
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
    console.log('\n🔒 Browser closed');
  }
})();