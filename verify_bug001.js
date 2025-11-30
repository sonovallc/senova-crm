const { chromium } = require('playwright');
const { execSync } = require('child_process');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  try {
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(3000);
    const link = await page.locator('main a[href*="/dashboard/contacts/"], div[class*="card"] a[href*="/dashboard/contacts/"]').first();
    await link.click();
    await page.waitForTimeout(2000);
    const url = page.url();
    await page.click('button:has-text("Edit")');
    await page.waitForTimeout(1000);
    const ts = Math.floor(Date.now() / 1000);
    const newName = 'EDITED_' + ts;
    await page.locator('input[name="first_name"]').fill(newName);
    await page.waitForTimeout(500);
    await page.click('button:has-text("Update")');
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.goto(url);
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    const uiOK = body.includes(newName);
    console.log('UI:', uiOK ? 'PASS' : 'FAIL');
    const dbCmd = 'docker exec eve_crm_postgres psql -U eve_crm_user -d eve_crm_db -t -c "SELECT first_name FROM contacts WHERE first_name LIKE \'EDITED_%\' ORDER BY updated_at DESC LIMIT 1;"';
    const dbRes = execSync(dbCmd, {encoding:'utf-8', cwd:'/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro'});
    const dbOK = dbRes.includes(newName);
    console.log('DB:', dbOK ? 'PASS' : 'FAIL');
    console.log(uiOK && dbOK ? 'OVERALL: PASS' : 'OVERALL: FAIL');
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
