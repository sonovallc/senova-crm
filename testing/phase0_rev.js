const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const dir = 'testing/email-channel-screenshots/phase-0-reverification';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const results = { test1: {}, test2: {}, test3: {} };

  try {
    console.log('Login...');
    await page.goto('http://localhost:3004');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(dir, '01-dashboard.png'), fullPage: true });
    console.log('Logged in');

    console.log('TEST 1: Inbox');
    try {
      await page.click('text=Inbox');
      await page.waitForURL('**/dashboard/inbox**', { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(dir, '02-inbox.png'), fullPage: true });
      results.test1.status = 'WORKS';
      results.test1.url = page.url();
      console.log('Inbox WORKS:', page.url());
    } catch (e) {
      results.test1.status = 'BROKEN';
      results.test1.error = e.message;
      await page.screenshot({ path: path.join(dir, '02-inbox-fail.png'), fullPage: true });
      console.log('Inbox FAILED:', e.message);
    }

    console.log('TEST 2: Settings');
    try {
      await page.click('text=Settings');
      await page.waitForURL('**/dashboard/settings**', { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(dir, '03-settings.png'), fullPage: true });
      results.test2.status = 'WORKS';
      results.test2.url = page.url();
      console.log('Settings WORKS:', page.url());
    } catch (e) {
      results.test2.status = 'BROKEN';
      results.test2.error = e.message;
      await page.screenshot({ path: path.join(dir, '03-settings-fail.png'), fullPage: true });
      console.log('Settings FAILED:', e.message);
    }

    console.log('TEST 3: Composer');
    try {
      await page.click('text=Inbox');
      await page.waitForURL('**/dashboard/inbox**', { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      const btn = page.locator('button').filter({ hasText: /compose/i }).first();
      if (await btn.count() === 0) throw new Error('No compose button');
      await page.screenshot({ path: path.join(dir, '04-before-compose.png'), fullPage: true });
      await btn.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(dir, '05-composer.png'), fullPage: true });
      results.test3.status = 'WORKS';
      console.log('Composer WORKS');
    } catch (e) {
      results.test3.status = 'BROKEN';
      results.test3.error = e.message;
      await page.screenshot({ path: path.join(dir, '05-composer-fail.png'), fullPage: true });
      console.log('Composer FAILED:', e.message);
    }

    console.log('RESULTS:', JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
