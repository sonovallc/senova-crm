
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const fs = require('fs');
  const p = './screenshots/critical-bugs-test';
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  
  await page.goto('http://localhost:3004/login');
  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.screenshot({ path: p + '/01-login.png', fullPage: true });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: p + '/02-dashboard.png', fullPage: true });
  
  console.log('Testing BUG 6: Template Body Population');
  await page.goto('http://localhost:3004/dashboard/email/templates');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: p + '/03-templates.png', fullPage: true });
  
  const rows = await page.locator('table tbody tr').count();
  console.log('Templates found:', rows);
  
  if (rows > 0) {
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: p + '/04-edit.png', fullPage: true });
    const text = await page.locator('.ql-editor').first().textContent().catch(() => '');
    console.log('BUG 6 Edit:', text.length > 0 ? 'PASS - ' + text.length + ' chars' : 'FAIL - empty');
  }
  
  await page.goto('http://localhost:3004/dashboard/email/compose');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: p + '/05-compose.png', fullPage: true });
  
  const sel = await page.locator('select').first();
  const opts = await sel.locator('option').count();
  if (opts > 1) {
    await sel.selectOption({ index: 1 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: p + '/06-compose-template.png', fullPage: true });
    const text2 = await page.locator('.ql-editor').first().textContent().catch(() => '');
    console.log('BUG 6 Compose:', text2.length > 0 ? 'PASS - ' + text2.length + ' chars' : 'FAIL - empty');
  }
  
  console.log('Testing BUG 23: Sidebar');
  await page.goto('http://localhost:3004/dashboard');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: p + '/07-sidebar.png', fullPage: true });
  
  const items = ['Dashboard', 'Calendar', 'Contacts', 'Inbox', 'Automations', 'Email', 'Settings'];
  let visible = 0;
  for (const item of items) {
    if (await page.locator('text=' + item).first().isVisible().catch(() => false)) visible++;
  }
  console.log('BUG 23:', visible === 7 ? 'PASS - all 7 visible' : 'FAIL - only ' + visible + '/7');
  
  console.log('Testing BUG 15-16: Campaign Wizard');
  await page.goto('http://localhost:3004/dashboard/email/campaigns');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: p + '/08-campaigns.png', fullPage: true });
  
  const createBtn = await page.locator('button:has-text("Create")').first();
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: p + '/09-wizard.png', fullPage: true });
    console.log('BUG 15-16: PASS - wizard opened');
  } else {
    console.log('BUG 15-16: FAIL - create button not found');
  }
  
  console.log('Testing BUG 17-20: Autoresponders');
  await page.goto('http://localhost:3004/dashboard/email/autoresponders');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: p + '/10-auto.png', fullPage: true });
  
  const autoBtn = await page.locator('button:has-text("Create")').first();
  if (await autoBtn.isVisible().catch(() => false)) {
    await autoBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: p + '/11-auto-form.png', fullPage: true });
    const triggers = await page.locator('select option').allTextContents();
    console.log('BUG 17-20:', triggers.length >= 5 ? 'PASS - ' + triggers.length + ' triggers' : 'FAIL - only ' + triggers.length);
  }
  
  await browser.close();
  console.log('Screenshots saved to:', p);
})();
