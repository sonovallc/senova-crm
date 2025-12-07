import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const SCREENSHOTS_DIR = 'screenshots/inbox-final-verification';
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
  console.log('Starting Inbox Visual Verification Test...\n');

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

  const results = {
    screenshots: [],
    loginSuccess: false,
    inboxLoaded: false,
    attachmentsVisible: false,
    errors: []
  };

  try {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Screenshot 1: Login page
    results.screenshots.push(
      await takeScreenshot(page, '01-login-page.png', 'Login page')
    );

    // Step 2: Fill login form
    console.log('\nStep 2: Filling login credentials...');

    // Try multiple selectors for email field
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="Email"]',
      '#email'
    ];

    let emailField = null;
    for (const selector of emailSelectors) {
      try {
        emailField = await page.locator(selector).first();
        if (await emailField.isVisible()) {
          console.log(`Found email field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (emailField) {
      await emailField.fill('jwoodcapital@gmail.com');
      console.log('✅ Email filled');
    } else {
      throw new Error('Could not find email input field');
    }

    // Try multiple selectors for password field
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="Password"]',
      '#password'
    ];

    let passwordField = null;
    for (const selector of passwordSelectors) {
      try {
        passwordField = await page.locator(selector).first();
        if (await passwordField.isVisible()) {
          console.log(`Found password field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (passwordField) {
      await passwordField.fill('D3n1w3n1!');
      console.log('✅ Password filled');
    } else {
      throw new Error('Could not find password input field');
    }

    await page.waitForTimeout(1000);

    // Step 3: Click sign in button
    console.log('\nStep 3: Clicking Sign In button...');

    const signInSelectors = [
      'button:has-text("Sign In")',
      'button:has-text("Log In")',
      'button:has-text("Login")',
      'button[type="submit"]',
      'input[type="submit"]'
    ];

    let signInButton = null;
    for (const selector of signInSelectors) {
      try {
        signInButton = await page.locator(selector).first();
        if (await signInButton.isVisible()) {
          console.log(`Found sign in button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (signInButton) {
      await signInButton.click();
      console.log('✅ Sign In button clicked');
    } else {
      throw new Error('Could not find Sign In button');
    }

    // Wait for navigation after login
    console.log('Waiting for navigation after login...');
    await page.waitForTimeout(5000); // Give time for redirect

    // Check if login was successful
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      results.loginSuccess = true;
      console.log('✅ Login successful, redirected to:', currentUrl);
    } else {
      console.log('⚠️ Still on login page, may have failed');
    }

    // Screenshot 2: After login
    results.screenshots.push(
      await takeScreenshot(page, '02-after-login.png', 'Page after login')
    );

    // Step 4: Navigate to inbox
    console.log('\nStep 4: Navigating to inbox...');
    await page.goto(`${BASE_URL}/dashboard/inbox`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Check if inbox loaded
    const inboxUrl = page.url();
    if (inboxUrl.includes('/inbox')) {
      results.inboxLoaded = true;
      console.log('✅ Inbox page loaded');
    }

    // Screenshot 3: Inbox page
    results.screenshots.push(
      await takeScreenshot(page, '03-inbox-page.png', 'Inbox page')
    );

    // Step 5: Look for and click on a conversation
    console.log('\nStep 5: Looking for conversations with attachments...');

    // Look for conversation items
    const conversationSelectors = [
      'div[role="button"]',
      '.conversation-item',
      '.email-item',
      'div:has-text("test")',
      'div:has-text("Test from mobile")'
    ];

    let conversationFound = false;
    for (const selector of conversationSelectors) {
      try {
        const conversations = await page.locator(selector).all();
        if (conversations.length > 0) {
          console.log(`Found ${conversations.length} conversations with selector: ${selector}`);

          // Try to find one with test email subjects
          for (const conv of conversations) {
            const text = await conv.textContent();
            if (text && (text.includes('test') || text.includes('Test'))) {
              console.log('Clicking on conversation with text:', text.substring(0, 100));
              await conv.click();
              conversationFound = true;
              await page.waitForTimeout(3000);
              break;
            }
          }

          if (conversationFound) break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!conversationFound) {
      console.log('⚠️ No conversation found, clicking first available item');
      const firstItem = await page.locator('div[role="button"]').first();
      if (await firstItem.isVisible()) {
        await firstItem.click();
        await page.waitForTimeout(3000);
      }
    }

    // Screenshot 4: Conversation with attachment
    results.screenshots.push(
      await takeScreenshot(page, '04-conversation-with-attachment.png', 'Conversation thread view')
    );

    // Step 6: Look for attachments
    console.log('\nStep 6: Looking for attachment sections...');

    // Scroll down to find attachments
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);

    // Look for attachment indicators
    const attachmentSelectors = [
      'text="Attachments:"',
      'text="Attachment"',
      'a[href*="/api/email-accounts/"][href*="/attachments/"]',
      'a[download]',
      '.attachment',
      'svg[class*="paperclip"]',
      'div:has-text("Attachments")'
    ];

    let attachmentFound = false;
    for (const selector of attachmentSelectors) {
      try {
        const attachment = await page.locator(selector).first();
        if (await attachment.isVisible()) {
          console.log(`Found attachment with selector: ${selector}`);
          attachmentFound = true;
          results.attachmentsVisible = true;

          // Scroll to attachment
          await attachment.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);

          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!attachmentFound) {
      console.log('⚠️ No attachments found in current view, scrolling more...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }

    // Screenshot 5: Attachment section
    results.screenshots.push(
      await takeScreenshot(page, '05-attachment-section.png', 'Attachment section (if visible)')
    );

    // Step 7: Try to click on an attachment link
    console.log('\nStep 7: Attempting to click attachment link...');

    try {
      // Look for actual attachment download links
      const attachmentLink = await page.locator('a[href*="/api/email-accounts/"][href*="/attachments/"]').first();

      if (await attachmentLink.isVisible()) {
        console.log('Found attachment link, clicking...');

        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await attachmentLink.click();
        await page.waitForTimeout(2000);

        const download = await downloadPromise;
        if (download) {
          console.log('✅ Download initiated for:', await download.suggestedFilename());
        } else {
          console.log('⚠️ No download event captured, may have opened in new tab');
        }
      } else {
        console.log('⚠️ No visible attachment link found');
      }
    } catch (e) {
      console.log('⚠️ Could not click attachment link:', e.message);
      results.errors.push(`Attachment click error: ${e.message}`);
    }

    // Screenshot 6: After attachment click
    results.screenshots.push(
      await takeScreenshot(page, '06-attachment-link-check.png', 'After attachment link click')
    );

    // Capture any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.errors.push(`Console error: ${msg.text()}`);
      }
    });

  } catch (error) {
    console.error('Test error:', error.message);
    results.errors.push(error.message);

    // Take error screenshot
    await takeScreenshot(page, 'error-screenshot.png', 'Error state');
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('VISUAL VERIFICATION RESULTS');
  console.log('='.repeat(60));

  console.log('\n📸 Screenshots Created:');
  results.screenshots.forEach(screenshot => {
    console.log(`  - ${path.basename(screenshot)}`);
  });

  console.log('\n✅ Status Checks:');
  console.log(`  - Login Success: ${results.loginSuccess ? '✅ YES' : '❌ NO'}`);
  console.log(`  - Inbox Loaded: ${results.inboxLoaded ? '✅ YES' : '❌ NO'}`);
  console.log(`  - Attachments Visible: ${results.attachmentsVisible ? '✅ YES' : '❌ NO (may need to check different conversation)'}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors Encountered:');
    results.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  } else {
    console.log('\n✅ No errors encountered');
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