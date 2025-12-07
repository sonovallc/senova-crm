import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = './screenshots/inbox-attachment-verification';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  let results = {
    testName: "Inbox Email Send with Attachment Verification",
    url: "https://crm.senovallc.com",
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Navigate and login
    console.log("Step 1: Navigating to login...");
    await page.goto('https://crm.senovallc.com/login');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/01-login-page.png`, fullPage: true });

    await page.fill('input[type="email"]', 'jeff@senovallc.com');
    await page.fill('input[type="password"]', 'Sk8t3Punks!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    results.steps.push({ step: 1, action: "Login", status: "✓" });

    // Step 2: Navigate to inbox
    console.log("Step 2: Navigating to inbox...");
    await page.goto('https://crm.senovallc.com/dashboard/inbox');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotDir}/02-inbox-loaded.png`, fullPage: true });
    results.steps.push({ step: 2, action: "Navigate to inbox", status: "✓" });

    // Step 3: Select first conversation
    console.log("Step 3: Selecting conversation...");
    const firstConversation = await page.locator('[role="button"]:has-text("Autonomous Test")').first();
    if (await firstConversation.isVisible()) {
      await firstConversation.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/03-conversation-selected.png`, fullPage: true });
      results.steps.push({ step: 3, action: "Select conversation", status: "✓" });
    } else {
      throw new Error("No conversation found to select");
    }

    // Step 4: Create a test attachment file
    console.log("Step 4: Creating test attachment...");
    const testFilePath = path.join(process.cwd(), 'test-attachment.txt');
    fs.writeFileSync(testFilePath, 'This is a test attachment for inbox email send verification.\nTimestamp: ' + new Date().toISOString());
    results.steps.push({ step: 4, action: "Create test file", status: "✓", file: "test-attachment.txt" });

    // Step 5: Type message
    console.log("Step 5: Typing test message...");
    const messageInput = await page.locator('textarea[placeholder*="Type"], textarea[placeholder*="message"]').first();
    await messageInput.fill('Testing attachment send - verification test');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/04-message-typed.png`, fullPage: true });
    results.steps.push({ step: 5, action: "Type message", status: "✓" });

    // Step 6: Attach file
    console.log("Step 6: Attaching file...");
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testFilePath);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/05-file-attached.png`, fullPage: true });

    // Check if file appears in UI
    const attachmentVisible = await page.locator('text=test-attachment.txt').isVisible();
    if (attachmentVisible) {
      results.steps.push({ step: 6, action: "Attach file", status: "✓", note: "File visible in UI" });
    } else {
      results.steps.push({ step: 6, action: "Attach file", status: "⚠", note: "File attached but not visible in UI preview" });
    }

    // Step 7: Click Send
    console.log("Step 7: Sending email with attachment...");

    // Listen for network responses
    let sendSuccess = false;
    let errorMessage = null;

    page.on('response', async (response) => {
      if (response.url().includes('/api/v1/inbox/send-email')) {
        console.log(`Send email response: ${response.status()}`);
        if (response.status() === 200) {
          sendSuccess = true;
        } else {
          errorMessage = await response.text();
        }
      }
    });

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    const sendButton = await page.locator('button:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotDir}/06-after-send-click.png`, fullPage: true });

    // Step 8: Check for success or error
    console.log("Step 8: Checking result...");

    // Look for success toast
    const successToast = await page.locator('text=/sent successfully|message sent/i').isVisible({ timeout: 5000 }).catch(() => false);

    // Look for error toast
    const errorToast = await page.locator('text=/failed|error/i').isVisible({ timeout: 2000 }).catch(() => false);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/07-final-result.png`, fullPage: true });

    if (sendSuccess || successToast) {
      results.steps.push({
        step: 7,
        action: "Send email with attachment",
        status: "✅ SUCCESS",
        note: "Email sent successfully with attachment"
      });
      results.overall = "✅ PASS - Email with attachment sent successfully";
    } else if (errorToast || errorMessage) {
      results.steps.push({
        step: 7,
        action: "Send email with attachment",
        status: "❌ FAILED",
        error: errorMessage || "Error toast appeared"
      });
      results.overall = "❌ FAIL - Email send failed";
    } else {
      results.steps.push({
        step: 7,
        action: "Send email with attachment",
        status: "⚠ UNCLEAR",
        note: "No clear success or error indication"
      });
      results.overall = "⚠ UNCLEAR - No confirmation visible";
    }

    // Cleanup test file
    fs.unlinkSync(testFilePath);

  } catch (error) {
    console.error("Test error:", error.message);
    results.error = error.message;
    results.overall = "❌ FAIL - Test error: " + error.message;
    await page.screenshot({ path: `${screenshotDir}/error.png`, fullPage: true });
  }

  // Save results
  fs.writeFileSync(
    `${screenshotDir}/test-results.json`,
    JSON.stringify(results, null, 2)
  );

  console.log("\n=== TEST RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
  console.log(`\nScreenshots saved to: ${screenshotDir}`);

  await browser.close();

  // Exit with appropriate code
  process.exit(results.overall?.includes('✅') ? 0 : 1);
})();
