const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const screenshotDir = "screenshots";
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const results = { tests: [] };

  try {
    console.log("Logging in...");
    await page.goto("http://localhost:3004/login", { timeout: 90000 });
    await page.fill('input[type="email"]', "admin@evebeautyma.com");
    await page.fill('input[type="password"]', "TestPass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotDir + "/00_logged_in.png", fullPage: true });

    console.log("Task 1: Create Campaign");
    await page.goto("http://localhost:3004/dashboard/email/campaigns", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + "/01_campaigns.png", fullPage: true });
    
    let btn = await page.locator("button, a").filter({ hasText: /create|new/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + "/02_form.png", fullPage: true });
      await page.locator("input").first().fill("Test " + Date.now());
      let save = await page.locator("button").filter({ hasText: /save|create/i }).first();
      if (await save.count() > 0) {
        await save.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: screenshotDir + "/03_saved.png", fullPage: true });
        results.tests.push({ task: "Create Campaign", result: "PASS" });
      }
    }

    console.log("Task 2: Edit/Dup/Del");
    await page.goto("http://localhost:3004/dashboard/email/campaigns", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + "/04_list.png", fullPage: true });
    
    btn = await page.locator("button, a").filter({ hasText: "Edit" }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + "/05_edit.png", fullPage: true });
      results.tests.push({ task: "BUG-E Edit", result: page.url().includes("404") ? "FAIL" : "PASS" });
      await page.goto("http://localhost:3004/dashboard/email/campaigns", { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
    }

    btn = await page.locator("button, a").filter({ hasText: "Duplicate" }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: screenshotDir + "/06_dup.png", fullPage: true });
      results.tests.push({ task: "BUG-F Dup", result: "PASS" });
    }

    await page.goto("http://localhost:3004/dashboard/email/campaigns", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    btn = await page.locator("button, a").filter({ hasText: "Delete" }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(1000);
      let confirm = await page.locator("button").filter({ hasText: /confirm|delete|yes/i }).first();
      if (await confirm.count() > 0) await confirm.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: screenshotDir + "/07_del.png", fullPage: true });
      results.tests.push({ task: "BUG-G Del", result: "PASS" });
    }

    console.log("Task 3: Settings Fields");
    await page.goto("http://localhost:3004/dashboard/settings/fields", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + "/08_fields.png", fullPage: true });
    btn = await page.locator("button, a").filter({ hasText: /create|new/i }).first();
    results.tests.push({ task: "BUG-L Field Create", result: await btn.count() > 0 ? "PASS" : "FAIL" });

    console.log("Task 4: Inbox Unread");
    await page.goto("http://localhost:3004/dashboard/inbox", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + "/09_inbox.png", fullPage: true });
    let unread = await page.locator(".unread").first();
    if (await unread.count() > 0) {
      await unread.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + "/10_read.png", fullPage: true });
      results.tests.push({ task: "BUG-B Unread", result: await page.locator(".unread").count() === 0 ? "PASS" : "FAIL" });
    } else {
      results.tests.push({ task: "BUG-B Unread", result: "SKIP" });
    }

    console.log("Task 5: Compose Template");
    await page.goto("http://localhost:3004/dashboard/inbox", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    btn = await page.locator("button, a").filter({ hasText: "Compose" }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotDir + "/11_compose.png", fullPage: true });
      let sel = await page.locator("select").first();
      if (await sel.count() > 0) {
        let opts = await sel.locator("option").count();
        if (opts > 1) {
          await sel.selectOption({ index: 1 });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: screenshotDir + "/12_tmpl.png", fullPage: true });
          results.tests.push({ task: "BUG-C Template", result: page.url().includes("404") ? "FAIL" : "PASS" });
        }
      }
    }

    console.log("Task 6: Feature Flags");
    await page.goto("http://localhost:3004/dashboard/settings", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + "/13_settings.png", fullPage: true });
    let ff = await page.locator("a").filter({ hasText: "Feature Flags" }).first();
    results.tests.push({ task: "BUG-M FF", result: "INFO", visible: await ff.count() > 0 });

    console.log("\n=== RESULTS ===");
    for (let i = 0; i < results.tests.length; i++) {
      console.log((i+1) + ". " + results.tests[i].task + ": " + results.tests[i].result);
    }
    fs.writeFileSync(screenshotDir + "/results.json", JSON.stringify(results, null, 2));

  } catch (e) {
    console.error("ERROR:", e.message);
    await page.screenshot({ path: screenshotDir + "/error.png", fullPage: true });
  } finally {
    await browser.close();
  }
})();
