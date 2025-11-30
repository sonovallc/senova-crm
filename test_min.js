const { chromium } = require("playwright");
async function test() {
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
try {
await page.goto("http://localhost:3004/login");
await page.fill("input[type=email]", "admin@evebeautyma.com");
await page.fill("input[type=password]", "TestPass123!");
await page.click("button[type=submit]");
await page.waitForTimeout(3000);
await page.goto("http://localhost:3004/dashboard/email/compose");
await page.waitForTimeout(2000);
await page.screenshot({ path: "composer-test.png", fullPage: true });
console.log("Screenshot saved");
} finally { await browser.close(); }
}
test();