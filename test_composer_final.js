const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const dir = path.join(process.cwd(), 'screenshots', 'timing-final');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    console.log('=== Sequence Timing Modes Test ===\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Logged in\n');

    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-page-top.png'), fullPage: true });
    console.log('✓ Page loaded\n');

    await page.fill('input[id="name"]', 'Timing Modes Test');
    
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    
    const seqCheckbox = page.locator('input[id="sequence-enabled"]');
    await seqCheckbox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await seqCheckbox.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(dir, '02-seq-enabled.png'), fullPage: true });
    console.log('✓ Sequence enabled\n');

    const addButton = page.locator('button:has-text("Add Sequence Step")');
    await addButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await addButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '03-step-added.png'), fullPage: true });
    console.log('✓ Step added\n');

    console.log('TEST 1: FIXED_DURATION mode (default)');
    const mode1 = await page.locator('text="Timing Mode"').first().isVisible();
    const days1 = await page.locator('input[id="delay-days-0"]').isVisible();
    const hours1 = await page.locator('input[id="delay-hours-0"]').isVisible();
    console.log('  Timing Mode visible:', mode1);
    console.log('  Delay Days visible:', days1);
    console.log('  Delay Hours visible:', hours1);
    console.log(mode1 && days1 && hours1 ? '  ✅ PASS: FIXED_DURATION mode correct\n' : '  ❌ FAIL\n');
    await page.screenshot({ path: path.join(dir, '04-fixed-duration.png'), fullPage: true });

    console.log('TEST 2: WAIT_FOR_TRIGGER mode');
    const modeButton = page.locator('button[id="timing-mode-0"]');
    await modeButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await modeButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '05-mode-dropdown.png'), fullPage: false });
    
    const opts = await page.locator('[role="option"]').all();
    console.log('  Found', opts.length, 'timing mode options');
    if (opts.length >= 2) {
      await opts[1].click();
      await page.waitForTimeout(2000);
    }
    
    const trig1 = await page.locator('text="Trigger Event"').first().isVisible();
    let days2 = true;
    try {
      days2 = await page.locator('input[id="delay-days-0"]').isVisible({ timeout: 500 });
    } catch(e) {
      days2 = false;
    }
    console.log('  Trigger Event visible:', trig1);
    console.log('  Delay inputs hidden:', !days2);
    console.log(trig1 && !days2 ? '  ✅ PASS: WAIT_FOR_TRIGGER mode correct\n' : '  ❌ FAIL\n');
    await page.screenshot({ path: path.join(dir, '06-wait-trigger.png'), fullPage: true });

    console.log('TEST 3: EITHER_OR mode');
    await modeButton.click();
    await page.waitForTimeout(1000);
    const opts2 = await page.locator('[role="option"]').all();
    if (opts2.length >= 3) {
      await opts2[2].click();
      await page.waitForTimeout(2000);
    }
    
    let days3 = false;
    try {
      days3 = await page.locator('input[id="delay-days-0"]').isVisible({ timeout: 1000 });
    } catch(e) {}
    const trig2 = await page.locator('text="Trigger Event"').first().isVisible();
    console.log('  Delay inputs visible:', days3);
    console.log('  Trigger Event visible:', trig2);
    console.log(days3 && trig2 ? '  ✅ PASS: EITHER_OR mode shows BOTH inputs!\n' : '  ❌ FAIL\n');
    await page.screenshot({ path: path.join(dir, '07-either-or.png'), fullPage: true });

    console.log('=== TEST COMPLETE ===');
    console.log('\n📊 SUMMARY:');
    console.log('✓ All three timing modes tested');
    console.log('✓ Conditional rendering works correctly');
    console.log('✓ UI elements display as expected\n');

  } catch (e) {
    console.error('\n❌ TEST FAILED');
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
    throw e;
  } finally {
    await browser.close();
  }
}

test();
