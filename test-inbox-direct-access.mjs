import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const SCREENSHOTS_DIR = 'screenshots/inbox-attachment-verification-v3';
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

async function loginViaAPI() {
  console.log('Logging in via API...');

  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'jwoodcapital@gmail.com',
      password: 'D3n1w3n1!'
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ API login successful');

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user
  };
}

async function testInboxWithAttachments() {
  console.log('🚀 Starting Direct Inbox Access Test...\n');

  await ensureScreenshotDir();

  // First, login via API
  let auth;
  try {
    auth = await loginViaAPI();
  } catch (error) {
    console.error('❌ API login failed:', error);
    return;
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  // Set up event listeners
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon')) {
      console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    // Step 1: Go to login page first to establish session
    console.log('1️⃣ Navigating to site...');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Step 2: Set authentication tokens in sessionStorage
    console.log('2️⃣ Setting authentication tokens...');
    await page.evaluate((tokens) => {
      sessionStorage.setItem('access_token', tokens.accessToken);
      sessionStorage.setItem('refresh_token', tokens.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(tokens.user));
    }, auth);

    // Step 3: Navigate directly to inbox
    console.log('3️⃣ Navigating to inbox...');
    await page.goto(`${BASE_URL}/dashboard/inbox`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);
    await takeScreenshot(page, '01-inbox-page.png', 'Inbox page loaded');

    // Check if we're actually in the inbox
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/dashboard/inbox')) {
      console.log('⚠️ Not on inbox page, might have been redirected to login');
      await takeScreenshot(page, '02-redirect-page.png', 'Redirected page');
    }

    // Step 4: Wait for conversations to load
    console.log('4️⃣ Waiting for conversations to load...');
    await page.waitForTimeout(5000);

    // Try to find conversation elements
    const conversationSelectors = [
      '[data-testid="conversation-item"]',
      '.conversation-row',
      'tr[role="row"]',  // Table rows
      'tbody tr',        // Table body rows
      '.cursor-pointer'  // Clickable items
    ];

    let conversationFound = false;
    for (const selector of conversationSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} conversations using selector: ${selector}`);

        // Look for conversations with attachments (usually have "test" in subject)
        for (let i = 0; i < Math.min(elements.length, 5); i++) {
          const element = elements[i];
          const text = await element.textContent();
          console.log(`  Conversation ${i + 1}: ${text.substring(0, 100)}...`);

          if (text.toLowerCase().includes('test') || text.includes('📎')) {
            console.log(`  ✅ Found conversation with potential attachments`);
            await element.click();
            conversationFound = true;
            break;
          }
        }

        if (!conversationFound && elements.length > 0) {
          // Click the first conversation
          console.log('  Clicking first conversation...');
          await elements[0].click();
          conversationFound = true;
        }
        break;
      }
    }

    if (!conversationFound) {
      console.log('⚠️ No conversations found');
      const pageContent = await page.content();
      console.log('Page HTML snippet:', pageContent.substring(0, 500));
    }

    await page.waitForTimeout(3000);
    await takeScreenshot(page, '03-conversation-selected.png', 'Conversation selected');

    // Step 5: Look for attachments in the message thread
    console.log('5️⃣ Looking for attachments...');

    // Look for attachment elements
    const attachmentSelectors = [
      'a[href*="/static/uploads"]',
      'a[href*="uploads/chat"]',
      '[data-testid="attachment"]',
      '.attachment-link',
      'a[download]',
      'svg.lucide-paperclip',
      ':has-text("Attachments:")',
      'a[href$=".pdf"]',
      'a[href$=".jpg"]',
      'a[href$=".png"]'
    ];

    let attachmentsFound = [];
    for (const selector of attachmentSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} attachment elements using: ${selector}`);

        for (const element of elements) {
          const href = await element.getAttribute('href').catch(() => null);
          const text = await element.textContent().catch(() => '');

          if (href) {
            attachmentsFound.push({ href, text });
            console.log(`  Attachment URL: ${href}`);
            console.log(`  Attachment text: ${text}`);

            // Check if URL is correct format
            if (href.startsWith('/static/uploads')) {
              console.log('  ✅ Correct relative URL format');
            } else if (href.includes('localhost')) {
              console.log('  ❌ INCORRECT: Contains localhost');
            } else if (href.startsWith('http') && !href.includes('crm.senovallc.com')) {
              console.log('  ❌ INCORRECT: External URL');
            }
          }
        }
        break;
      }
    }

    if (attachmentsFound.length === 0) {
      console.log('⚠️ No attachments found');

      // Get all links on the page
      const allLinks = await page.locator('a').all();
      console.log(`\nTotal links on page: ${allLinks.length}`);

      for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
        const href = await allLinks[i].getAttribute('href');
        const text = await allLinks[i].textContent();
        if (href && (href.includes('upload') || href.includes('.pdf') || href.includes('.jpg'))) {
          console.log(`  Potential attachment: ${href} - ${text}`);
        }
      }
    }

    await takeScreenshot(page, '04-final-state.png', 'Final state with attachments check');

    // Generate summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`URL reached: ${currentUrl}`);
    console.log(`Logged in: ${currentUrl.includes('/dashboard')}`);
    console.log(`Conversations found: ${conversationFound}`);
    console.log(`Attachments found: ${attachmentsFound.length}`);

    if (attachmentsFound.length > 0) {
      console.log('\n✅ ATTACHMENT URLS:');
      attachmentsFound.forEach((att, i) => {
        console.log(`  ${i + 1}. ${att.href}`);
        if (att.href.startsWith('/static/uploads')) {
          console.log(`     ✅ CORRECT FORMAT`);
        } else if (att.href.includes('localhost')) {
          console.log(`     ❌ CONTAINS LOCALHOST - NEEDS FIX`);
        }
      });
    }

    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      loginMethod: 'API + sessionStorage',
      urlReached: currentUrl,
      loggedIn: currentUrl.includes('/dashboard'),
      conversationsFound: conversationFound,
      attachmentsFound: attachmentsFound.length,
      attachmentUrls: attachmentsFound
    };

    await fs.writeFile(
      path.join(SCREENSHOTS_DIR, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

  } catch (error) {
    console.error('❌ Test failed:', error);
    await takeScreenshot(page, 'error-state.png', 'Error state');
  } finally {
    await browser.close();
    console.log('\n🏁 Test complete.');
  }
}

// Run the test
testInboxWithAttachments().catch(console.error);