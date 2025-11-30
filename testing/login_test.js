const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== LOGIN FLOW TEST ===');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const dir = '../screenshots/login-test';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  try {
    console.log('Step 1: Navigate');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-initial.png'), fullPage: true });
    console.log('  URL:', page.url());
    
    console.log('Step 2: Fill email');
    await page.fill('input[type=email]', 'admin@evebeautyma.com');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '02-email.png'), fullPage: true });
    
    console.log('Step 3: Fill password');
    await page.fill('input[type=password]', 'TestPass123!');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '03-password.png'), fullPage: true });
    
    console.log('Step 4: Submit');
    await page.screenshot({ path: path.join(dir, '04-before-submit.png'), fullPage: true });
    await page.click('button[type=submit]');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '05-after-submit.png'), fullPage: true });
    
    const finalUrl = page.url();
    console.log('Step 5: Check result');
    console.log('  Final URL:', finalUrl);
    await page.screenshot({ path: path.join(dir, '06-final.png'), fullPage: true });
    
    const errors = await page.locator('.notification.is-danger, [role=alert]').count();
    console.log('  Errors:', errors);
    
    if (errors > 0) {
      for (let i = 0; i < errors; i++) {
        const txt = await page.locator('.notification.is-danger').nth(i).textContent();
        console.log('  ERROR TEXT:', txt);
      }
      console.log('RESULT: FAIL - Errors detected');
    } else if (finalUrl.includes('dashboard')) {
      console.log('RESULT: PASS - Logged in successfully');
    } else {
      console.log('RESULT: UNCLEAR - URL:', finalUrl);
    }
  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, '99-error.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})().catch(console.error);
