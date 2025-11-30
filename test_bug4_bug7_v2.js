const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const screenshotDir = path.join(__dirname, 'screenshots', 'bug-verification-v2');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  const timestamp = Date.now();
  let bug4Pass = false;
  let bug7Pass = false;
  page.on('dialog', async dialog => { console.log('Dialog: ' + dialog.message()); await dialog.accept(); });
  try {
    console.log('
=== VERIFICATION START ===
');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('
=== BUG-4: CAMPAIGN DELETE ===
');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, timestamp + '_02_campaigns.png'), fullPage: true });
    const beforeCount = await page.locator('.grid > div').count();
    console.log('Campaigns: ' + beforeCount);
    if (beforeCount > 0) {
      const moreBtn = page.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') }).first();
      if (await moreBtn.count() > 0) {
        await moreBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, timestamp + '_03_menu.png'), fullPage: true });
        let deleteBtn = page.getByRole('menuitem', { name: 'Delete' });
        if (await deleteBtn.count() === 0) {
          const cancelBtn = page.getByRole('menuitem', { name: 'Cancel' });
          if (await cancelBtn.count() > 0) {
            await cancelBtn.click();
            await page.waitForTimeout(2000);
            await moreBtn.click();
            await page.waitForTimeout(1000);
            deleteBtn = page.getByRole('menuitem', { name: 'Delete' });
          }
        }
        if (await deleteBtn.count() > 0) {
          await deleteBtn.click();
          await page.waitForTimeout(2500);
          await page.screenshot({ path: path.join(screenshotDir, timestamp + '_04_deleted.png'), fullPage: true });
          const afterCount = await page.locator('.grid > div').count();
          console.log('After: ' + afterCount);
          if (afterCount < beforeCount) { console.log('BUG-4 PASS'); bug4Pass = true; }
          else { console.log('BUG-4 FAIL'); }
        }
      }
    }
    console.log('
=== BUG-7: AUTORESPONDER EDIT ===
');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, timestamp + '_05_auto.png'), fullPage: true });
    await page.locator('table tbody tr').first().locator('td').nth(1).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, timestamp + '_06_edit.png'), fullPage: true });
    const addBtn = page.getByRole('button', { name: /Add Sequence Step/i });
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(screenshotDir, timestamp + '_07_added.png'), fullPage: true });
      const selects = await page.locator('select').all();
      for (let sel of selects) {
        const opts = await sel.locator('option').allTextContents();
        if (opts.some(o => o.includes('Either/Or'))) await sel.selectOption({ label: 'Either/Or' });
        if (opts.some(o => o.includes('Email Opened'))) await sel.selectOption({ label: 'Email Opened' });
      }
      const inputs = await page.locator('input[type="text"]').all();
      for (let inp of inputs) {
        const ph = await inp.getAttribute('placeholder');
        if (ph && ph.toLowerCase().includes('subject')) { await inp.fill('Test Follow-up Email'); break; }
      }
      const editor = page.locator('[contenteditable="true"]').last();
      if (await editor.count() > 0) { await editor.click(); await editor.fill('This is a test follow-up'); }
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, timestamp + '_08_config.png'), fullPage: true });
      const saveBtn = page.getByRole('button', { name: /Save Changes/i });
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2500);
        await page.screenshot({ path: path.join(screenshotDir, timestamp + '_09_saved.png'), fullPage: true });
        await page.goto('http://localhost:3004/dashboard/email/autoresponders');
        await page.waitForTimeout(1500);
        await page.locator('table tbody tr').first().locator('td').nth(1).click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, timestamp + '_10_return.png'), fullPage: true });
        const persisted = await page.locator('input[value="Test Follow-up Email"]').count();
        if (persisted > 0) { console.log('BUG-7 PASS'); bug7Pass = true; }
        else { console.log('BUG-7 FAIL'); }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: path.join(screenshotDir, timestamp + '_ERROR.png'), fullPage: true });
  } finally {
    console.log('
=== RESULTS ===');
    console.log('BUG-4: ' + (bug4Pass ? 'PASS' : 'FAIL'));
    console.log('BUG-7: ' + (bug7Pass ? 'PASS' : 'FAIL'));
    await browser.close();
  }
})();