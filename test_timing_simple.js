const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const dir = path.join(process.cwd(), 'screenshots', 'timing');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    console.log('=== Timing Modes Test ===\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Logged in\n');

    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-page.png'), fullPage: true });
    console.log('✓ Page loaded\n');

    await page.fill('input[id="name"]', 'Test');
    await page.click('input[id="sequence-enabled"]');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(dir, '02-seq-enabled.png'), fullPage: true });
    console.log('✓ Sequence enabled\n');

    await page.click('button:has-text("Add Sequence Step")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '03-step-added.png'), fullPage: true });
    console.log('✓ Step added\n');

    console.log('TEST: FIXED_DURATION mode');
    const mode1 = await page.locator('text="Timing Mode"').first().isVisible();
    const days1 = await page.locator('input[id="delay-days-0"]').isVisible();
    const hours1 = await page.locator('input[id="delay-hours-0"]').isVisible();
    console.log(mode1 && days1 && hours1 ? '✅ PASS' : '❌ FAIL');
    await page.screenshot({ path: path.join(dir, '04-fixed.png'), fullPage: true });

    console.log('\nTEST: WAIT_FOR_TRIGGER mode');
    await page.click('button[id="timing-mode-0"]');
    await page.waitForTimeout(1000);
    const opts = await page.locator('[role="option"]').all();
    if (opts.length >= 2) await opts[1].click();
    await page.waitForTimeout(2000);
    
    const trig1 = await page.locator('text="Trigger Event"').first().isVisible();
    let days2 = true;
    try { days2 = await page.locator('input[id="delay-days-0"]').isVisible({ timeout: 500 }); } catch(e) { days2 = false; }
    console.log(trig1 && !days2 ? '✅ PASS' : '❌ FAIL');
    await page.screenshot({ path: path.join(dir, '05-trigger.png'), fullPage: true });

    console.log('\nTEST: EITHER_OR mode');
    await page.click('button[id="timing-mode-0"]');
    await page.waitForTimeout(1000);
    const opts2 = await page.locator('[role="option"]').all();
    if (opts2.length >= 3) await opts2[2].click();
    await page.waitForTimeout(2000);
    
    let days3 = false;
    try { days3 = await page.locator('input[id="delay-days-0"]').isVisible({ timeout: 1000 }); } catch(e) {}
    const trig2 = await page.locator('text="Trigger Event"').first().isVisible();
    console.log(days3 && trig2 ? '✅ PASS: Both visible!' : '❌ FAIL');
    await page.screenshot({ path: path.join(dir, '06-either-or.png'), fullPage: true });

    console.log('\n=== DONE ===');
  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

test();
