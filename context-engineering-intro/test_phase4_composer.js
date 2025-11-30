const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function testPhase4() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), "..", "screenshots", "phase4");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log("=== Phase 4 Email Composer Testing ===
");

  try {
    console.log("Step 1: Navigating to inbox...");
    await page.goto("http://localhost:3000/dashboard/inbox");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, "01-inbox.png"), fullPage: true });
    console.log("Screenshot: 01-inbox.png
");

    console.log("Step 2: Click Compose Email button...");
    const composeBtn = page.locator("button:has-text('Compose Email')").first();
    const count = await composeBtn.count();
    console.log("Compose buttons found:", count);
    
    if (count > 0) {
      await composeBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, "02-composer-open.png"), fullPage: true });
      console.log("Screenshot: 02-composer-open.png
");
    } else {
      console.log("ERROR: No Compose button!
");
      await page.screenshot({ path: path.join(screenshotDir, "ERROR-no-btn.png"), fullPage: true });
      return;
    }

    console.log("Step 3: Fill To field...");
    const toInput = page.locator("input[name='to'], input[placeholder*='To']").first();
    if (await toInput.count() > 0) {
      await toInput.fill("test@example.com");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
      console.log("Added test@example.com
");
    }

    console.log("Step 4: Fill Subject...");
    const subjectInput = page.locator("input[name='subject'], input[placeholder*='Subject']").first();
    if (await subjectInput.count() > 0) {
      await subjectInput.fill("Test Email from Phase 4");
      console.log("Subject entered
");
    }

    console.log("Step 5: Fill Body...");
    const bodyEditor = page.locator("[contenteditable='true'], .tiptap").first();
    if (await bodyEditor.count() > 0) {
      await bodyEditor.click();
      await page.keyboard.type("This is test email content.");
      console.log("Body text entered
");
    }
    
    await page.screenshot({ path: path.join(screenshotDir, "03-filled.png"), fullPage: true });
    console.log("Screenshot: 03-filled.png
");

    console.log("Step 6: Click Send...");
    const sendBtn = page.locator("button:has-text('Send')").first();
    if (await sendBtn.count() > 0) {
      await sendBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, "04-after-send.png"), fullPage: true });
      console.log("Screenshot: 04-after-send.png
");
    }

    console.log("
=== Test Complete ===");

  } catch (error) {
    console.error("ERROR:", error.message);
    await page.screenshot({ path: path.join(screenshotDir, "ERROR.png"), fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testPhase4().catch(console.error);
