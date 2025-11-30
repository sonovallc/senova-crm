const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBug017() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  try {
    console.log('BUG-017 Verification Test');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login OK');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug017-page.png', fullPage: true });
    const dropdown = page.locator('select').first();
    await dropdown.waitFor({ state: 'visible' });
    const opts = await dropdown.locator('option').all();
    console.log('Found', opts.length, 'contacts');
    if (opts.length > 1) {
      const v = await opts[1].getAttribute('value');
      console.log('Selecting contact...');
      await dropdown.selectOption(v);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug017-selected.png', fullPage: true });
      const trim = errors.filter(e => e.includes('trim'));
      console.log('Trim errors:', trim.length);
      console.log('BUG-017:', trim.length === 0 ? 'FIXED' : 'NOT FIXED');
    }
  } catch (e) { console.error(e.message); }
  finally { await browser.close(); }
}
testBug017();
