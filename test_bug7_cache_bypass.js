const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });

  // Create context with cache disabled
  const context = await browser.newContext({
    bypassCSP: true,
  });

  const page = await context.newPage();

  // Disable cache
  await page.route('**/*', route => route.continue());

  // Listen for ALL console logs
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });

  try {
    console.log('=== BUG-7 TEST WITH CACHE BYPASS ===\n');

    // 1. Login
    console.log('1. Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // 2. Navigate with cache-busting
    console.log('2. Navigate to Autoresponders Create...');
    const cacheBuster = Date.now();
    await page.goto(`http://localhost:3004/dashboard/email/autoresponders/create?_=${cacheBuster}`, {
      timeout: 90000,
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);

    // 3. Fill basic info
    console.log('3. Fill basic info...');
    await page.fill('input#name', 'BUG-7 Cache Bypass Test');

    // 4. Scroll and enable sequence
    console.log('4. Enable sequence...');
    await page.evaluate(() => window.scrollTo(0, 800));
    const sequenceLabel = page.locator('label:has-text("Enable multi-step sequence")').first();
    await sequenceLabel.click();
    await page.waitForTimeout(1000);

    // 5. Add sequence step
    console.log('5. Add Sequence Step...');
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.click('button:has-text("Add Sequence Step")');
    await page.waitForTimeout(1000);

    // 6. Scroll to step
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 7. Find and click template dropdown
    console.log('7. Click template dropdown...');
    const stepDropdown = page.locator('#step-template-0');
    await stepDropdown.click();
    await page.waitForTimeout(1000);

    // 8. Select first non-custom template
    console.log('8. Select a template...');
    const options = await page.locator('[role="option"]').all();
    console.log('   Found', options.length, 'options');

    for (const opt of options) {
      const text = await opt.textContent();
      if (text && !text.includes('Custom') && !text.includes('Loading') && text.trim()) {
        console.log('   Selecting:', text.trim());
        await opt.click();
        break;
      }
    }

    // 9. Wait and check
    await page.waitForTimeout(3000);
    const afterText = await stepDropdown.textContent();
    console.log('\n=== RESULT ===');
    console.log('Dropdown text after selection:', afterText);

    if (!afterText.includes('Custom Content')) {
      console.log('*** SUCCESS: BUG-7 FIXED ***');
    } else {
      console.log('*** FAILURE: BUG-7 STILL BROKEN ***');
    }

    await page.screenshot({ path: 'screenshots/bug7-cache-bypass.png', fullPage: true });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
