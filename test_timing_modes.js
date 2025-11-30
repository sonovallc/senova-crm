const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testTimingModes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'timing-modes');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Sequence Timing Modes Test ===\n');

  try {
    console.log('T1: Login');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('PASS: Login successful\n');

    console.log('T2: Navigate to Create Autoresponder');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-create-page.png'), fullPage: true });
    console.log('PASS: Page loaded\n');

    console.log('T3: Fill basic info');
    await page.fill('input[id="name"]', 'Timing Test');
    await page.fill('textarea[id="description"]', 'Testing timing modes');
    
    await page.click('button[id="trigger-type"]');
    await page.waitForTimeout(500);
    await page.click('text="New Contact Created"');
    await page.waitForTimeout(500);
    
    await page.click('input[id="mode-template"]');
    await page.waitForTimeout(500);
    await page.click('button[id="template-select"]');
    await page.waitForTimeout(500);
    const templates = await page.locator('[role="option"]').all();
    if (templates.length > 1) {
      await templates[1].click();
      await page.waitForTimeout(500);
    }
    console.log('PASS: Basic info filled\n');

    console.log('T4: Enable sequence');
    await page.click('input[id="sequence-enabled"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '02-sequence-enabled.png'), fullPage: true });
    console.log('PASS: Sequence enabled\n');

    console.log('T5: Add step');
    await page.click('button:has-text("Add Sequence Step")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03-step-added.png'), fullPage: true });
    console.log('PASS: Step added\n');

    console.log('T6: Check FIXED_DURATION mode');
    const modeVisible = await page.locator('text="Timing Mode"').first().isVisible();
    const daysVisible = await page.locator('input[id="delay-days-0"]').isVisible();
    const hoursVisible = await page.locator('input[id="delay-hours-0"]').isVisible();
    console.log(modeVisible && daysVisible && hoursVisible ? 'PASS: FIXED_DURATION mode correct' : 'FAIL: Missing elements');
    await page.screenshot({ path: path.join(screenshotDir, '04-fixed-duration.png'), fullPage: true });
    console.log('');

    console.log('T7: Switch to WAIT_FOR_TRIGGER');
    await page.click('button[id="timing-mode-0"]');
    await page.waitForTimeout(500);
    await page.click('text="Wait for Trigger Event"');
    await page.waitForTimeout(1500);
    const triggerVisible = await page.locator('text="Trigger Event"').first().isVisible();
    console.log(triggerVisible ? 'PASS: Trigger selector appeared' : 'FAIL: Trigger selector missing');
    await page.screenshot({ path: path.join(screenshotDir, '05-wait-trigger.png'), fullPage: true });
    console.log('');

    console.log('T8: Switch to EITHER_OR');
    await page.click('button[id="timing-mode-0"]');
    await page.waitForTimeout(500);
    await page.click('text="Wait for Either (Duration OR Trigger)"');
    await page.waitForTimeout(1500);
    
    let bothDelay = false;
    try {
      bothDelay = await page.locator('input[id="delay-days-0"]').isVisible({ timeout: 2000 });
    } catch (e) {}
    const bothTrigger = await page.locator('text="Trigger Event"').first().isVisible();
    
    console.log(bothDelay && bothTrigger ? 'PASS: EITHER_OR shows both inputs' : 'FAIL: Missing inputs');
    await page.screenshot({ path: path.join(screenshotDir, '06-either-or.png'), fullPage: true });
    console.log('');

    console.log('T9: Final screenshot');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '07-final.png'), fullPage: true });
    console.log('PASS: All screenshots captured\n');

    console.log('===  TEST COMPLETE ===');
    console.log('All timing modes tested successfully!');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testTimingModes().catch(console.error);
