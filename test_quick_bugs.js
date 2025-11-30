const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  const dir = 'screenshots';
  const results = [];

  try {
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('Logged in');

    console.log('
Testing Campaigns page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(dir, 'test-campaigns.png'), fullPage: true });
    const createBtn = await page.locator('button:has-text("Create"), button:has-text("New")').count();
    const editBtn = await page.locator('button:has-text("Edit"), a:has-text("Edit")').count();
    const dupBtn = await page.locator('button:has-text("Duplicate")').count();
    const delBtn = await page.locator('button:has-text("Delete")').count();
    console.log('Create button:', createBtn > 0 ? 'FOUND' : 'NOT FOUND');
    console.log('Edit button:', editBtn > 0 ? 'FOUND' : 'NOT FOUND');
    console.log('Duplicate button:', dupBtn > 0 ? 'FOUND' : 'NOT FOUND');
    console.log('Delete button:', delBtn > 0 ? 'FOUND' : 'NOT FOUND');
    results.push({ page: 'Campaigns', createBtn, editBtn, dupBtn, delBtn });

    console.log('
Testing Settings/Fields page...');
    await page.goto('http://localhost:3004/dashboard/settings/fields', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(dir, 'test-settings-fields.png'), fullPage: true });
    const fieldCreateBtn = await page.locator('button:has-text("Create"), button:has-text("New")').count();
    console.log('Create Field button:', fieldCreateBtn > 0 ? 'FOUND' : 'NOT FOUND');
    results.push({ page: 'Settings/Fields', fieldCreateBtn });

    console.log('
Testing Inbox page...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(dir, 'test-inbox.png'), fullPage: true });
    const composeBtn = await page.locator('button:has-text("Compose")').count();
    const unreadThreads = await page.locator('.unread').count();
    console.log('Compose button:', composeBtn > 0 ? 'FOUND' : 'NOT FOUND');
    console.log('Unread threads:', unreadThreads);
    results.push({ page: 'Inbox', composeBtn, unreadThreads });

    console.log('
Testing Settings page...');
    await page.goto('http://localhost:3004/dashboard/settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(dir, 'test-settings.png'), fullPage: true });
    const ffLink = await page.locator('a:has-text("Feature Flags")').count();
    console.log('Feature Flags link:', ffLink > 0 ? 'FOUND' : 'NOT FOUND');
    results.push({ page: 'Settings', featureFlagsLink: ffLink });

    fs.writeFileSync(path.join(dir, 'quick-test-results.json'), JSON.stringify(results, null, 2));
    console.log('
Results saved');

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();