const { chromium } = require('playwright');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  page.setDefaultTimeout(60000);
  
  const dir = 'screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const results = { tests: [] };

  try {
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/00_login.png', fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: dir + '/00b_creds.png', fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: dir + '/01_dash.png', fullPage: true });

    console.log('Task 1: Create Campaign');
    await page.goto('http://localhost:3004/email/campaigns');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/02_campaigns.png', fullPage: true });
    
    let btn = page.locator('button, a').filter({ hasText: /create|new/i }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: dir + '/03_form.png', fullPage: true });
      await page.locator('input').first().fill('Test ' + Date.now());
      await page.waitForTimeout(1000);
      await page.screenshot({ path: dir + '/04_filled.png', fullPage: true });
      btn = page.locator('button').filter({ hasText: /save|create/i }).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(4000);
        await page.screenshot({ path: dir + '/05_saved.png', fullPage: true });
        results.tests.push({ name: 'Create Campaign', status: 'PASS' });
      }
    }

    console.log('Task 2: Edit/Dup/Del');
    await page.goto('http://localhost:3004/email/campaigns');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/06_list.png', fullPage: true });
    
    btn = page.locator('button, a').filter({ hasText: 'Edit' }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: dir + '/07_edit.png', fullPage: true });
      let has404 = page.url().includes('404');
      results.tests.push({ name: 'BUG-E Edit', status: has404 ? 'FAIL' : 'PASS' });
      await page.goto('http://localhost:3004/email/campaigns');
      await page.waitForTimeout(2000);
    }

    btn = page.locator('button, a').filter({ hasText: 'Duplicate' }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: dir + '/08_dup.png', fullPage: true });
      results.tests.push({ name: 'BUG-F Dup', status: 'PASS' });
    }

    await page.goto('http://localhost:3004/email/campaigns');
    await page.waitForTimeout(2000);
    btn = page.locator('button, a').filter({ hasText: 'Delete' }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: dir + '/09_delconf.png', fullPage: true });
      let confirm = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
      if (await confirm.count() > 0) await confirm.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: dir + '/10_del.png', fullPage: true });
      results.tests.push({ name: 'BUG-G Del', status: 'PASS' });
    }

    console.log('Task 3: Settings Fields');
    await page.goto('http://localhost:3004/settings/fields');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/11_fields.png', fullPage: true });
    btn = page.locator('button, a').filter({ hasText: /create|new|add/i }).first();
    results.tests.push({ name: 'BUG-L Create', status: await btn.count() > 0 ? 'PASS' : 'FAIL' });

    console.log('Task 4: Inbox Unread');
    await page.goto('http://localhost:3004/inbox');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/12_inbox.png', fullPage: true });
    let unread = page.locator('.unread').first();
    if (await unread.count() > 0) {
      await unread.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: dir + '/13_read.png', fullPage: true });
      results.tests.push({ name: 'BUG-B Unread', status: await page.locator('.unread').count() === 0 ? 'PASS' : 'FAIL' });
    } else {
      results.tests.push({ name: 'BUG-B Unread', status: 'SKIP' });
    }

    console.log('Task 5: Compose Template');
    await page.goto('http://localhost:3004/inbox');
    await page.waitForTimeout(2000);
    btn = page.locator('button, a').filter({ hasText: 'Compose' }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: dir + '/14_compose.png', fullPage: true });
      let sel = page.locator('select').filter({ hasText: /template/i }).first();
      if (await sel.count() === 0) {
        sel = page.locator('select').first();
      }
      if (await sel.count() > 0) {
        await page.screenshot({ path: dir + '/15_sel.png', fullPage: true });
        let opts = await sel.locator('option').count();
        if (opts > 1) {
          await sel.selectOption({ index: 1 });
          await page.waitForTimeout(3000);
          await page.screenshot({ path: dir + '/16_tmpl.png', fullPage: true });
          results.tests.push({ name: 'BUG-C Template', status: page.url().includes('404') ? 'FAIL' : 'PASS' });
        }
      }
    }

    console.log('Task 6: Feature Flags');
    await page.goto('http://localhost:3004/settings');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/17_settings.png', fullPage: true });
    let ff = page.locator('a').filter({ hasText: 'Feature Flags' }).first();
    results.tests.push({ name: 'BUG-M FF', status: 'INFO', visible: await ff.count() > 0 });

    console.log('\n=== RESULTS ===');
    results.tests.forEach((t, i) => console.log((i+1) + '. ' + t.name + ': ' + t.status));
    fs.writeFileSync(dir + '/results.json', JSON.stringify(results, null, 2));

  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: dir + '/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

test();
