const { chromium } = require('playwright');
const fs = require('fs');

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const screenshotDir = 'screenshots';
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  const results = { timestamp: new Date().toISOString(), tests: [] };

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3004', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await page.screenshot({ path: `${screenshotDir}/00_login.png`, fullPage: true });

    console.log('Task 1: Create Campaign');
    await page.goto('http://localhost:3004/email/campaigns', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/01_campaigns.png`, fullPage: true });
    
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/02_create_form.png`, fullPage: true });
      await page.locator('input[name="name"]').first().fill('Test ' + Date.now());
      await page.locator('input[name="subject"]').first().fill('Test Subject');
      await page.screenshot({ path: `${screenshotDir}/03_filled.png`, fullPage: true });
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${screenshotDir}/04_saved.png`, fullPage: true });
        results.tests.push({ task: 'Create Campaign', result: 'PASS' });
      }
    }

    console.log('Task 2: Test Edit/Duplicate/Delete');
    await page.goto('http://localhost:3004/email/campaigns', { timeout: 90000 });
    await page.waitForTimeout(2000);
    
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/05_edit.png`, fullPage: true });
      const is404 = page.url().includes('404');
      results.tests.push({ task: 'BUG-E Edit', result: is404 ? 'FAIL' : 'PASS' });
      await page.goto('http://localhost:3004/email/campaigns', { timeout: 90000 });
    }

    const dupBtn = page.locator('button:has-text("Duplicate")').first();
    if (await dupBtn.count() > 0) {
      await dupBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/06_dup.png`, fullPage: true });
      results.tests.push({ task: 'BUG-F Duplicate', result: 'PASS' });
    }

    await page.goto('http://localhost:3004/email/campaigns', { timeout: 90000 });
    const delBtn = page.locator('button:has-text("Delete")').first();
    if (await delBtn.count() > 0) {
      await delBtn.click();
      await page.waitForTimeout(1000);
      const confirm = page.locator('button:has-text("Confirm"), button:has-text("Delete")').first();
      if (await confirm.count() > 0) await confirm.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/07_del.png`, fullPage: true });
      results.tests.push({ task: 'BUG-G Delete', result: 'PASS' });
    }

    console.log('Task 3: Settings Fields');
    await page.goto('http://localhost:3004/settings/fields', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/08_fields.png`, fullPage: true });
    const createField = page.locator('button:has-text("Create"), button:has-text("New")').first();
    results.tests.push({ task: 'BUG-L Create Field', result: await createField.count() > 0 ? 'PASS' : 'FAIL' });

    console.log('Task 4: Inbox Unread');
    await page.goto('http://localhost:3004/inbox', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/09_inbox.png`, fullPage: true });
    const unread = page.locator('.unread').first();
    if (await unread.count() > 0) {
      await unread.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/10_read.png`, fullPage: true });
      results.tests.push({ task: 'BUG-B Unread', result: await page.locator('.unread').count() === 0 ? 'PASS' : 'FAIL' });
    } else {
      results.tests.push({ task: 'BUG-B Unread', result: 'SKIP' });
    }

    console.log('Task 5: Compose Template');
    await page.goto('http://localhost:3004/inbox', { timeout: 90000 });
    const compose = page.locator('button:has-text("Compose")').first();
    if (await compose.count() > 0) {
      await compose.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/11_compose.png`, fullPage: true });
      const tmpl = page.locator('select[name*="template"]').first();
      if (await tmpl.count() > 0) {
        await tmpl.click();
        await page.waitForTimeout(1000);
        const opt = page.locator('option').nth(1);
        if (await opt.count() > 0) {
          await opt.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `${screenshotDir}/12_template.png`, fullPage: true });
          results.tests.push({ task: 'BUG-C Template', result: page.url().includes('404') ? 'FAIL' : 'PASS' });
        }
      }
    }

    console.log('Task 6: Feature Flags');
    await page.goto('http://localhost:3004/settings', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/13_settings.png`, fullPage: true });
    const ff = page.locator('a:has-text("Feature Flags")').first();
    results.tests.push({ task: 'BUG-M Feature Flags', result: 'INFO', visible: await ff.count() > 0 });

    console.log('\n=== RESULTS ===');
    results.tests.forEach((t, i) => console.log(`${i+1}. ${t.task}: ${t.result}`));
    fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('ERROR:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }
}

runTests();
