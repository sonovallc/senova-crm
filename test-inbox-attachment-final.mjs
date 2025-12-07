import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const SCREENSHOTS_DIR = 'screenshots/inbox-attachment-final';
const BASE_URL = 'https://crm.senovallc.com';

async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created screenshot directory: ${SCREENSHOTS_DIR}`);
  } catch (error) {
    console.log(`Screenshot directory ready`);
  }
}

async function takeScreenshot(page, name, description) {
  const filename = path.join(SCREENSHOTS_DIR, name);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 ${name} - ${description}`);
}

async function testInboxAttachments() {
  console.log('🚀 FINAL INBOX ATTACHMENT VERIFICATION\n');
  console.log('=' .repeat(50));

  await ensureScreenshotDir();

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000  // Slower to see what's happening
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

  const report = {
    timestamp: new Date().toISOString(),
    loginSuccess: false,
    inboxLoaded: false,
    conversationOpened: false,
    attachmentsFound: false,
    attachmentUrls: [],
    errors: []
  };

  try {
    // Step 1: Login
    console.log('1️⃣ LOGGING IN...');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.fill('input[name="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[name="password"]', 'D3n1w3n1!');
    await takeScreenshot(page, '01-login-filled.png', 'Login credentials entered');

    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    report.loginSuccess = true;
    console.log('✅ Login successful');
    await takeScreenshot(page, '02-after-login.png', 'Dashboard loaded');

    // Step 2: Navigate to inbox
    console.log('\n2️⃣ NAVIGATING TO INBOX...');
    await page.goto(`${BASE_URL}/dashboard/inbox`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);
    report.inboxLoaded = true;
    console.log('✅ Inbox loaded');
    await takeScreenshot(page, '03-inbox-page.png', 'Inbox page loaded');

    // Step 3: Find and click a conversation with attachments
    console.log('\n3️⃣ FINDING CONVERSATIONS WITH ATTACHMENTS...');

    // Try multiple selectors to find conversations
    const conversationSelectors = [
      'tr[role="row"]',  // Table rows
      'tbody tr',        // Table body rows
      '.cursor-pointer', // Clickable items
      '[data-testid*="conversation"]',
      '.conversation-item'
    ];

    let conversationClicked = false;
    for (const selector of conversationSelectors) {
      const conversations = await page.locator(selector).all();
      if (conversations.length > 0) {
        console.log(`Found ${conversations.length} conversations using selector: ${selector}`);

        // Look for a conversation mentioning attachments or "test"
        for (let i = 0; i < Math.min(conversations.length, 5); i++) {
          const conv = conversations[i];
          const text = await conv.textContent();
          console.log(`  Checking conversation ${i + 1}: "${text.substring(0, 60)}..."`);

          if (text.toLowerCase().includes('test') ||
              text.toLowerCase().includes('attachment') ||
              text.toLowerCase().includes('error diagnosis')) {
            console.log(`  ✅ Found relevant conversation, clicking...`);
            await conv.click();
            conversationClicked = true;
            break;
          }
        }

        if (!conversationClicked && conversations.length > 0) {
          console.log('  Clicking first conversation...');
          await conversations[0].click();
          conversationClicked = true;
        }

        if (conversationClicked) break;
      }
    }

    if (conversationClicked) {
      report.conversationOpened = true;
      console.log('✅ Conversation opened');

      // Wait for message thread to load
      await page.waitForTimeout(5000);
      await takeScreenshot(page, '04-conversation-opened.png', 'Conversation thread opened');

      // Step 4: Look for attachments
      console.log('\n4️⃣ SEARCHING FOR ATTACHMENTS...');

      // Try to find attachment elements
      const attachmentSelectors = [
        'a[href*="/static/uploads"]',
        'a[href*="/api/v1/communications/attachments"]',
        '[data-testid="attachment"]',
        '.attachment-link',
        'a[download]',
        ':has-text("Attachments:")',
        '.lucide-paperclip',
        'a[href$=".pdf"]',
        'a[href$=".jpg"]',
        'a[href$=".png"]',
        'a[href$=".docx"]'
      ];

      for (const selector of attachmentSelectors) {
        const attachments = await page.locator(selector).all();
        if (attachments.length > 0) {
          console.log(`\n✅ Found ${attachments.length} attachments using selector: ${selector}`);
          report.attachmentsFound = true;

          for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            const href = await attachment.getAttribute('href').catch(() => null);
            const text = await attachment.textContent().catch(() => '');

            if (href) {
              const attachmentInfo = {
                index: i + 1,
                url: href,
                text: text || 'No text',
                isCorrectFormat: false,
                issue: null
              };

              // Validate URL format
              if (href.startsWith('/static/uploads') || href.startsWith('/api/v1/communications/attachments')) {
                attachmentInfo.isCorrectFormat = true;
                console.log(`  ✅ Attachment ${i + 1}: ${href}`);
                console.log(`     Text: "${text}"`);
                console.log(`     Format: CORRECT (relative path)`);
              } else if (href.includes('localhost')) {
                attachmentInfo.issue = 'Contains localhost';
                console.log(`  ❌ Attachment ${i + 1}: ${href}`);
                console.log(`     ERROR: URL contains localhost`);
              } else {
                attachmentInfo.issue = 'Unexpected format';
                console.log(`  ⚠️ Attachment ${i + 1}: ${href}`);
                console.log(`     WARNING: Unexpected URL format`);
              }

              report.attachmentUrls.push(attachmentInfo);
            }
          }
          break;
        }
      }

      if (!report.attachmentsFound) {
        console.log('❌ No attachments found in the conversation');

        // Try to get page content to debug
        const pageText = await page.locator('body').textContent();
        if (pageText.includes('Attachments:')) {
          console.log('⚠️ Found "Attachments:" text but no clickable links');
        }
      }

      await takeScreenshot(page, '05-final-state.png', 'Final state with attachment check');
    } else {
      console.log('❌ Could not open any conversation');
      report.errors.push('Failed to open conversation');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    report.errors.push(error.message);
    await takeScreenshot(page, 'error-state.png', 'Error occurred');
  } finally {
    await browser.close();

    // Generate final report
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(50));

    console.log(`Login Success: ${report.loginSuccess ? '✅' : '❌'}`);
    console.log(`Inbox Loaded: ${report.inboxLoaded ? '✅' : '❌'}`);
    console.log(`Conversation Opened: ${report.conversationOpened ? '✅' : '❌'}`);
    console.log(`Attachments Found: ${report.attachmentsFound ? '✅' : '❌'}`);

    if (report.attachmentUrls.length > 0) {
      console.log(`\n📎 ATTACHMENT URLS (${report.attachmentUrls.length} total):`);
      report.attachmentUrls.forEach(att => {
        const status = att.isCorrectFormat ? '✅' : '❌';
        console.log(`  ${status} ${att.url}`);
        if (att.issue) {
          console.log(`     Issue: ${att.issue}`);
        }
      });

      const correctUrls = report.attachmentUrls.filter(a => a.isCorrectFormat);
      const incorrectUrls = report.attachmentUrls.filter(a => !a.isCorrectFormat);

      console.log(`\n  Summary:`);
      console.log(`  - Correct format: ${correctUrls.length}`);
      console.log(`  - Incorrect format: ${incorrectUrls.length}`);

      if (incorrectUrls.length === 0 && correctUrls.length > 0) {
        console.log(`\n✅ ALL ATTACHMENT URLS ARE CORRECTLY FORMATTED!`);
      } else if (incorrectUrls.length > 0) {
        console.log(`\n❌ SOME ATTACHMENT URLS NEED FIXING`);
      }
    }

    if (report.errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      report.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Save report to file
    await fs.writeFile(
      path.join(SCREENSHOTS_DIR, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n' + '='.repeat(50));
    console.log('🏁 TEST COMPLETE');
    console.log('='.repeat(50));
  }
}

// Run the test
testInboxAttachments().catch(console.error);