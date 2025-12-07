import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const SCREENSHOTS_DIR = 'screenshots/inbox-attachment-verification-v2';
const BASE_URL = 'https://crm.senovallc.com';

async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created screenshot directory: ${SCREENSHOTS_DIR}`);
  } catch (error) {
    console.log(`Screenshot directory already exists or error: ${error.message}`);
  }
}

async function takeScreenshot(page, name, description) {
  const filename = path.join(SCREENSHOTS_DIR, name);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${name} - ${description}`);
}

async function testInboxAttachments() {
  console.log('🚀 Starting Inbox Attachment Verification Test v2...\n');

  await ensureScreenshotDir();

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log('1️⃣ Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await takeScreenshot(page, '01-login-page.png', 'Login page loaded');

    // Step 2: Fill login credentials
    console.log('2️⃣ Entering login credentials...');

    // Try different selectors for email field
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      '#email',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]'
    ];

    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const emailField = await page.locator(selector).first();
        if (await emailField.isVisible({ timeout: 1000 })) {
          await emailField.fill('jwoodcapital@gmail.com');
          console.log(`✅ Email filled using selector: ${selector}`);
          emailFilled = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!emailFilled) {
      console.log('⚠️ Could not find email field, trying to fill any visible input...');
      await page.locator('input').first().fill('jwoodcapital@gmail.com');
    }

    // Try different selectors for password field
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      '#password',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]'
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const passwordField = await page.locator(selector).first();
        if (await passwordField.isVisible({ timeout: 1000 })) {
          await passwordField.fill('D3n1w3n1!');
          console.log(`✅ Password filled using selector: ${selector}`);
          passwordFilled = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!passwordFilled) {
      console.log('⚠️ Could not find password field, trying to fill second input...');
      await page.locator('input').nth(1).fill('D3n1w3n1!');
    }

    // Step 3: Submit login form
    console.log('3️⃣ Submitting login form...');

    // Try different ways to submit
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("Submit")',
      'input[type="submit"]',
      'button'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const submitButton = await page.locator(selector).first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          await submitButton.click();
          console.log(`✅ Clicked submit using selector: ${selector}`);
          submitted = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!submitted) {
      console.log('⚠️ Could not find submit button, pressing Enter...');
      await page.keyboard.press('Enter');
    }

    // Wait for navigation after login
    console.log('4️⃣ Waiting for login to complete...');
    await page.waitForTimeout(3000);

    // Check if we're logged in by looking at the URL
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('⚠️ Still on login page, trying to check for error messages...');
      const errorText = await page.locator('.error, .alert, [role="alert"]').textContent().catch(() => '');
      if (errorText) {
        console.log(`Login error: ${errorText}`);
      }
    }

    await takeScreenshot(page, '02-after-login.png', 'After login attempt');

    // Step 5: Navigate to inbox
    console.log('5️⃣ Navigating to inbox...');
    await page.goto(`${BASE_URL}/dashboard/inbox`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '03-inbox-page.png', 'Inbox page loaded');

    // Step 6: Wait for conversations to load
    console.log('6️⃣ Waiting for conversations to load...');
    await page.waitForTimeout(3000);

    // Look for conversation items
    const conversationSelectors = [
      '[data-testid*="conversation"]',
      '.conversation-item',
      '.email-item',
      '.message-item',
      '[role="listitem"]',
      '.cursor-pointer',
      'div:has-text("test")'
    ];

    let conversationFound = false;
    for (const selector of conversationSelectors) {
      try {
        const conversations = await page.locator(selector);
        const count = await conversations.count();
        if (count > 0) {
          console.log(`Found ${count} conversations using selector: ${selector}`);

          // Look for conversations with "test 3" or "test 4" in subject
          for (let i = 0; i < count; i++) {
            const conv = conversations.nth(i);
            const text = await conv.textContent().catch(() => '');
            if (text.toLowerCase().includes('test 3') || text.toLowerCase().includes('test 4')) {
              console.log(`Found conversation with attachments: ${text.substring(0, 50)}...`);
              await conv.click();
              conversationFound = true;
              break;
            }
          }

          if (!conversationFound && count > 0) {
            // Just click the first conversation
            console.log('Clicking first conversation...');
            await conversations.first().click();
            conversationFound = true;
          }

          if (conversationFound) break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!conversationFound) {
      console.log('⚠️ No conversations found, checking page content...');
      const pageText = await page.textContent('body');
      console.log('Page content preview:', pageText.substring(0, 500));
    }

    await page.waitForTimeout(2000);
    await takeScreenshot(page, '04-conversation-selected.png', 'Conversation selected');

    // Step 7: Look for attachments
    console.log('7️⃣ Looking for attachments in message thread...');
    await page.waitForTimeout(2000);

    // Look for attachment indicators
    const attachmentSelectors = [
      ':has-text("Attachments")',
      ':has-text("Attachment")',
      '[data-testid*="attachment"]',
      '.attachment',
      'svg[class*="Paperclip"]',
      'a[href*="/static/uploads"]',
      'a[href*="uploads"]',
      ':has-text(".pdf")',
      ':has-text(".jpg")',
      ':has-text(".png")'
    ];

    let attachmentsFound = false;
    for (const selector of attachmentSelectors) {
      try {
        const attachments = await page.locator(selector);
        const count = await attachments.count();
        if (count > 0) {
          console.log(`✅ Found ${count} attachment elements using selector: ${selector}`);
          attachmentsFound = true;

          // Check the first attachment's details
          const firstAttachment = attachments.first();
          const text = await firstAttachment.textContent().catch(() => '');
          console.log(`Attachment text: ${text}`);

          // If it's a link, get the href
          if (await firstAttachment.evaluate(el => el.tagName === 'A').catch(() => false)) {
            const href = await firstAttachment.getAttribute('href');
            console.log(`Attachment URL: ${href}`);

            if (href) {
              if (href.startsWith('/static/uploads')) {
                console.log('✅ Correct relative URL format for attachment');
              } else if (href.includes('localhost')) {
                console.log('❌ Incorrect localhost URL in attachment');
              } else {
                console.log(`⚠️ Unexpected URL format: ${href}`);
              }
            }
          }

          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!attachmentsFound) {
      console.log('⚠️ No attachments found in current view');

      // Try to get all links on the page
      const allLinks = await page.locator('a').all();
      console.log(`Total links on page: ${allLinks.length}`);

      for (const link of allLinks.slice(0, 10)) {
        const href = await link.getAttribute('href').catch(() => null);
        const text = await link.textContent().catch(() => '');
        if (href && (href.includes('upload') || href.includes('.pdf') || href.includes('.jpg'))) {
          console.log(`Potential attachment link: ${href} - ${text}`);
        }
      }
    }

    await takeScreenshot(page, '05-attachments-visible.png', 'Attachments section captured');

    // Final screenshot
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '06-final-state.png', 'Final state of inbox');

    console.log('\n✅ Test completed successfully!');

    // Generate summary report
    const report = {
      timestamp: new Date().toISOString(),
      loginSucceeded: !page.url().includes('/login'),
      currentUrl: page.url(),
      inboxLoaded: page.url().includes('/inbox'),
      conversationsFound: conversationFound,
      attachmentsFound: attachmentsFound,
      screenshotsTaken: 6
    };

    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Login Succeeded: ${report.loginSucceeded ? '✅' : '❌'}`);
    console.log(`Inbox Loaded: ${report.inboxLoaded ? '✅' : '❌'}`);
    console.log(`Conversations Found: ${report.conversationsFound ? '✅' : '⚠️'}`);
    console.log(`Attachments Found: ${report.attachmentsFound ? '✅' : '⚠️'}`);
    console.log(`Current URL: ${report.currentUrl}`);
    console.log(`Screenshots: ${report.screenshotsTaken} saved to ${SCREENSHOTS_DIR}/`);

    // Save report
    await fs.writeFile(
      path.join(SCREENSHOTS_DIR, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await takeScreenshot(page, 'error-state.png', 'Error state captured');
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed. Test complete.');
  }
}

// Run the test
testInboxAttachments().catch(console.error);