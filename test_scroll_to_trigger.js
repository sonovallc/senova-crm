const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const dir = path.join(process.cwd(), 'screenshots', 'either-or-trigger');
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
    
    console.log('Scrolling to show Trigger Event...');
    await page.locator('label:has-text("Trigger Event")').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, 'trigger-event-visible.png') });
    
    console.log('Taking cropped screenshot of Step 1 card...');
    const stepCard = page.locator('text="Step 1"').first().locator('..');
    await stepCard.screenshot({ path: path.join(dir, 'step-card.png') });
    
    console.log('\n✅ Screenshots captured showing both delay and trigger inputs!');
    
    await page.waitForTimeout(2000);

  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

test();
