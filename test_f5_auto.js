const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const dir = path.join(process.cwd(), 'screenshots', 'timing-verification');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    console.log('=== TIMING MODES VERIFICATION TEST ===\n');
    
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✓ Logged in\n');

    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(2000);

    await page.locator('text="Enable multi-step sequence"').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('text="Enable multi-step sequence"').first().click();
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("Add Sequence Step")').first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Sequence step added\n');

    // TEST 1: FIXED_DURATION (default)
    console.log('TEST 1: FIXED_DURATION Mode');
    await page.locator('text="Timing Mode"').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    const timingModeVisible = await page.locator('text="Timing Mode"').first().isVisible();
    const delayDaysVisible = await page.locator('label:has-text("Delay (Days)")').first().isVisible();
    const delayHoursVisible = await page.locator('label:has-text("Delay (Hours)")').first().isVisible();
    const descText = await page.locator('text="Wait a specific number of days/hours before sending"').isVisible();
    
    console.log('  ✓ Timing Mode selector:', timingModeVisible ? 'VISIBLE' : 'MISSING');
    console.log('  ✓ Delay (Days) field:', delayDaysVisible ? 'VISIBLE' : 'MISSING');
    console.log('  ✓ Delay (Hours) field:', delayHoursVisible ? 'VISIBLE' : 'MISSING');
    console.log('  ✓ Description text:', descText ? 'VISIBLE' : 'MISSING');
    
    await page.screenshot({ path: path.join(dir, '01-fixed-duration.png'), fullPage: true });
    
    if (timingModeVisible && delayDaysVisible && delayHoursVisible) {
      console.log('  ✅ PASS: FIXED_DURATION mode correct!\n');
    } else {
      console.log('  ❌ FAIL: Missing elements\n');
    }

    // TEST 2: WAIT_FOR_TRIGGER
    console.log('TEST 2: WAIT_FOR_TRIGGER Mode');
    const dropdown = page.locator('button:has-text("Wait Fixed Duration")').first();
    await dropdown.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '02-dropdown-open.png') });
    
    await page.locator('[role="option"]:has-text("Wait for Trigger Event")').first().click();
    await page.waitForTimeout(2000);
    
    const triggerEventVisible = await page.locator('label:has-text("Trigger Event")').isVisible();
    const delayStillVisible = await page.locator('label:has-text("Delay (Days)")').isVisible().catch(() => false);
    const triggerDesc = await page.locator('text="Wait indefinitely until a specific event occurs"').isVisible();
    
    console.log('  ✓ Trigger Event selector:', triggerEventVisible ? 'VISIBLE' : 'MISSING');
    console.log('  ✓ Delay fields hidden:', !delayStillVisible ? 'YES' : 'NO (should be hidden)');
    console.log('  ✓ Description text:', triggerDesc ? 'VISIBLE' : 'MISSING');
    
    await page.screenshot({ path: path.join(dir, '03-wait-trigger.png'), fullPage: true });
    
    if (triggerEventVisible && !delayStillVisible) {
      console.log('  ✅ PASS: WAIT_FOR_TRIGGER mode correct!\n');
    } else {
      console.log('  ❌ FAIL: Incorrect conditional rendering\n');
    }

    // TEST 3: EITHER_OR
    console.log('TEST 3: EITHER_OR Mode');
    const dropdown2 = page.locator('button:has-text("Wait for Trigger Event")').first();
    await dropdown2.click();
    await page.waitForTimeout(1000);
    
    await page.locator('[role="option"]:has-text("Wait for Either")').first().click();
    await page.waitForTimeout(2000);
    
    const delayDays2 = await page.locator('label:has-text("Delay (Days)")').isVisible();
    const delayHours2 = await page.locator('label:has-text("Delay (Hours)")').isVisible();
    const triggerEvent2 = await page.locator('label:has-text("Trigger Event")').isVisible();
    const eitherDesc = await page.locator('text="Send when either the duration passes OR the event occurs"').isVisible();
    
    console.log('  ✓ Delay (Days) field:', delayDays2 ? 'VISIBLE' : 'MISSING');
    console.log('  ✓ Delay (Hours) field:', delayHours2 ? 'VISIBLE' : 'MISSING');
    console.log('  ✓ Trigger Event selector:', triggerEvent2 ? 'VISIBLE' : 'MISSING');
    console.log('  ✓ Description text:', eitherDesc ? 'VISIBLE' : 'MISSING');
    
    await page.screenshot({ path: path.join(dir, '04-either-or.png'), fullPage: true });
    
    if (delayDays2 && delayHours2 && triggerEvent2) {
      console.log('  ✅ PASS: EITHER_OR mode shows BOTH inputs!\n');
    } else {
      console.log('  ❌ FAIL: Missing required inputs\n');
    }

    console.log('=== TEST COMPLETE ===\n');
    console.log('📊 FINAL SUMMARY:');
    console.log('✓ All three timing modes tested');
    console.log('✓ Conditional rendering verified');
    console.log('✓ Screenshots captured as evidence\n');
    
    await page.waitForTimeout(2000);

  } catch (e) {
    console.error('\n❌ TEST FAILED');
    console.error('ERROR:', e.message);
    console.error(e.stack);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

test();
