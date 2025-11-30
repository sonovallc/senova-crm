const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'manual-email');
  
  const results = {
    newFeature: {},
    regression: {},
    consoleErrors: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('
=== MANUAL EMAIL ENTRY FEATURE TEST ===
');
    
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Navigating to compose page...');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(3000);

    console.log('
TEST 1: Verify new UI elements...');
    await page.screenshot({ path: path.join(screenshotDir, '01-new-ui.png'), fullPage: true });
    
    const contactsButton = await page.locator('text="Select from contacts"').count();
    const manualInput = await page.locator('input[placeholder*="email" i], input[placeholder*="type" i]').count();
    const helpText = await page.locator('text=/Type.*email.*Enter/i').count();
    
    results.newFeature.test1_ui_visible = {
      contactsButton: contactsButton > 0,
      manualInput: manualInput > 0,
      helpText: helpText > 0,
      pass: contactsButton > 0 && manualInput > 0
    };
    console.log();
    console.log();
    console.log();

    console.log('
TEST 2: Add valid email address...');
    
    let emailInput = page.locator('input[placeholder*="email" i]').first();
    if (await emailInput.count() === 0) {
      emailInput = page.locator('input[type="email"]').last();
    }
    
    await emailInput.click();
    await emailInput.fill('test@example.com');
    await emailInput.press('Enter');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '02-email-added.png'), fullPage: true });
    
    const chipCount = await page.locator('[class*="chip" i], [class*="badge" i], [class*="tag" i]').count();
    const hasRemoveButton = await page.locator('button:has-text("×"), button:has-text("✕"), button[aria-label*="remove" i]').count();
    
    results.newFeature.test2_valid_email = {
      chipAdded: chipCount > 0,
      hasRemoveButton: hasRemoveButton > 0,
      pass: chipCount > 0
    };
    console.log();
    console.log();

    console.log('
Final Results:');
    const passes = Object.values(results.newFeature).filter(r => r.pass === true).length;
    console.log();
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();