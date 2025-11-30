const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const dir = path.join(process.cwd(), 'screenshots', 'either-or-full');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(2000);

    await page.locator('text="Enable multi-step sequence"').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('text="Enable multi-step sequence"').first().click();
    await page.waitForTimeout(2000);
    
    await page.locator('button:has-text("Add Sequence Step")').first().click();
    await page.waitForTimeout(2000);

    const dropdown = page.locator('button:has-text("Wait Fixed Duration")').first();
    await dropdown.scrollIntoViewIfNeeded();
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    await page.locator('[role="option"]:has-text("Wait for Either")').first().click();
    await page.waitForTimeout(2000);
    
    console.log('EITHER_OR mode selected, taking full screenshot...');
    await page.screenshot({ path: path.join(dir, 'either-or-full.png'), fullPage: true });
    
    console.log('Scrolling to Step 1 section...');
    await page.locator('text="Step 1"').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, 'either-or-viewport.png') });
    
    console.log('Checking visible elements...');
    const delayDays = await page.locator('label:has-text("Delay (Days)")').isVisible();
    const delayHours = await page.locator('label:has-text("Delay (Hours)")').isVisible();
    const triggerEvent = await page.locator('label:has-text("Trigger Event")').isVisible();
    
    console.log('\nEITHER_OR Mode Elements:');
    console.log('  Delay (Days):', delayDays ? 'VISIBLE' : 'MISSING');
    console.log('  Delay (Hours):', delayHours ? 'VISIBLE' : 'MISSING');
    console.log('  Trigger Event:', triggerEvent ? 'VISIBLE' : 'MISSING');
    
    if (delayDays && delayHours && triggerEvent) {
      console.log('\n✅ SUCCESS: EITHER_OR mode shows BOTH delay AND trigger inputs!');
    } else {
      console.log('\n❌ FAIL: Missing required elements');
    }
    
    await page.waitForTimeout(2000);

  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

test();
