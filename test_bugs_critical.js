const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'critical-bugs-test');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const results = { timestamp: new Date().toISOString(), bugs: [] };

  console.log('LOGIN...');
  await page.goto('http://localhost:3004/login');
  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: true });
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(screenshotDir, '02-dashboard.png'), fullPage: true });

  console.log('BUG 6: Template Body Population...');
  try {
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '03-templates.png'), fullPage: true });

    const rows = await page.locator('table tbody tr').count();
    if (rows > 0) {
      await page.locator('table tbody tr').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '04-template-edit.png'), fullPage: true });

      const content = await page.locator('.ql-editor').first().textContent().catch(() => '');
      results.bugs.push({ bug: 'BUG 6 - Edit', status: content.length > 0 ? 'PASS' : 'FAIL', details: content.length + ' chars', screenshot: '04-template-edit.png' });
    }

    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '05-compose.png'), fullPage: true });

    const dropdown = await page.locator('select').first();
    const opts = await dropdown.locator('option').count();
    if (opts > 1) {
      await dropdown.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '06-template-selected.png'), fullPage: true });

      const editorContent = await page.locator('.ql-editor').first().textContent().catch(() => '');
      results.bugs.push({ bug: 'BUG 6 - Compose', status: editorContent.length > 0 ? 'PASS' : 'FAIL', details: editorContent.length + ' chars', screenshot: '06-template-selected.png' });
    }
  } catch (e) {
    results.bugs.push({ bug: 'BUG 6', status: 'ERROR', details: e.message });
  }

  console.log('BUG 23: Sidebar...');
  await page.goto('http://localhost:3004/dashboard');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '07-sidebar.png'), fullPage: true });

  const items = ['Dashboard', 'Calendar', 'Contacts', 'Inbox', 'Automations', 'Email', 'Settings'];
  const visible = [];
  for (const item of items) {
    const vis = await page.locator('text=' + item).first().isVisible().catch(() => false);
    if (vis) visible.push(item);
  }
  results.bugs.push({ bug: 'BUG 23 - Sidebar', status: visible.length === 7 ? 'PASS' : 'FAIL', details: visible.length + '/7 visible', screenshot: '07-sidebar.png' });

  console.log('BUG 15-16: Campaign Wizard...');
  await page.goto('http://localhost:3004/dashboard/email/campaigns');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '08-campaigns.png'), fullPage: true });

  const createBtn = await page.locator('button:has-text("Create"), a:has-text("Create")').first();
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '09-wizard.png'), fullPage: true });
    results.bugs.push({ bug: 'BUG 15-16 - Wizard', status: 'PASS', details: 'Wizard opened', screenshot: '09-wizard.png' });
  } else {
    results.bugs.push({ bug: 'BUG 15-16 - Wizard', status: 'FAIL', details: 'Create button not found', screenshot: '08-campaigns.png' });
  }

  console.log('BUG 17-20: Autoresponders...');
  await page.goto('http://localhost:3004/dashboard/email/autoresponders');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '10-autoresponders.png'), fullPage: true });

  const autoBtn = await page.locator('button:has-text("Create"), a:has-text("Create")').first();
  if (await autoBtn.isVisible().catch(() => false)) {
    await autoBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '11-auto-form.png'), fullPage: true });

    const triggerDrop = await page.locator('select').first();
    const triggerOpts = await triggerDrop.locator('option').allTextContents();
    results.bugs.push({ bug: 'BUG 17-20 - Triggers', status: triggerOpts.length >= 5 ? 'PASS' : 'FAIL', details: triggerOpts.length + ' triggers', screenshot: '11-auto-form.png' });
  }

  fs.writeFileSync(path.join(screenshotDir, 'results.json'), JSON.stringify(results, null, 2));

  console.log('
RESULTS:');
  results.bugs.forEach(b => console.log((b.status === 'PASS' ? 'PASS' : 'FAIL') + ' ' + b.bug + ': ' + b.details));

  await browser.close();
})();
