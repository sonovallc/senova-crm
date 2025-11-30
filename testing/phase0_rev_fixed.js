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
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#email', 'admin@evebeautyma.com');
    await page.fill('#password', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-dashboard.png'), fullPage: true });
    console.log('Logged in, URL:', page.url());

    console.log('\nTEST 1: Inbox Navigation');
    try {
      await page.click('text=Inbox');
      console.log('Clicked Inbox link');
      await page.waitForURL('**/dashboard/inbox**', { timeout: 5000 });
      console.log('URL changed to:', page.url());
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(dir, '02-inbox.png'), fullPage: true });
      const headings = await page.locator('h1, h2').allTextContents();
      const buttons = await page.locator('button').allTextContents();
      results.test1.status = 'WORKS';
      results.test1.url = page.url();
      results.test1.headings = headings.slice(0, 5);
      results.test1.buttons = buttons.slice(0, 10);
      console.log('✓ Inbox WORKS');
      console.log('  URL:', page.url());
      console.log('  Headings:', headings.slice(0, 5));
    } catch (e) {
      results.test1.status = 'BROKEN';
      results.test1.error = e.message;
      results.test1.url = page.url();
      await page.screenshot({ path: path.join(dir, '02-inbox-fail.png'), fullPage: true });
      console.log('✗ Inbox FAILED:', e.message);
      console.log('  URL stayed at:', page.url());
    }

    console.log('\nTEST 2: Settings Navigation');
    try {
      await page.click('text=Settings');
      console.log('Clicked Settings link');
      await page.waitForURL('**/dashboard/settings**', { timeout: 5000 });
      console.log('URL changed to:', page.url());
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(dir, '03-settings.png'), fullPage: true });
      const headings = await page.locator('h1, h2').allTextContents();
      const tabs = await page.locator('[role="tab"]').allTextContents();
      results.test2.status = 'WORKS';
      results.test2.url = page.url();
      results.test2.headings = headings.slice(0, 5);
      results.test2.tabs = tabs;
      console.log('✓ Settings WORKS');
      console.log('  URL:', page.url());
      console.log('  Headings:', headings.slice(0, 5));
      console.log('  Tabs:', tabs);
    } catch (e) {
      results.test2.status = 'BROKEN';
      results.test2.error = e.message;
      results.test2.url = page.url();
      await page.screenshot({ path: path.join(dir, '03-settings-fail.png'), fullPage: true });
      console.log('✗ Settings FAILED:', e.message);
      console.log('  URL stayed at:', page.url());
    }

    console.log('\nTEST 3: Email Composer');
    try {
      await page.click('text=Inbox');
      await page.waitForURL('**/dashboard/inbox**', { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      console.log('Back at Inbox');
      const btn = page.locator('button').filter({ hasText: /compose/i }).first();
      const count = await btn.count();
      if (count === 0) throw new Error('No compose button found');
      console.log('Found Compose button');
      await page.screenshot({ path: path.join(dir, '04-before-compose.png'), fullPage: true });
      await btn.click();
      console.log('Clicked Compose button');
      await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(dir, '05-composer.png'), fullPage: true });
      const toField = await page.locator('input').filter({ hasText: /to/i }).count();
      const subjectField = await page.locator('input').filter({ hasText: /subject/i }).count();
      results.test3.status = 'WORKS';
      results.test3.modalOpened = true;
      console.log('✓ Composer WORKS');
      console.log('  Modal opened successfully');
    } catch (e) {
      results.test3.status = 'BROKEN';
      results.test3.error = e.message;
      await page.screenshot({ path: path.join(dir, '05-composer-fail.png'), fullPage: true });
      console.log('✗ Composer FAILED:', e.message);
    }

    console.log('\n========================================');
    console.log('FINAL RESULTS');
    console.log('========================================');
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
