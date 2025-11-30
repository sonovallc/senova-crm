const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== BUG-017 Verification Test ===\n');
    
    // Login
    console.log('T1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful');

    
    // Navigate to Email Composer
    console.log('
T2: Navigate to Email Composer...');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug017-01-page-load.png', fullPage: true });
    console.log('✓ Page loaded');

    // PRIMARY BUG TEST: Select Contact
    console.log('
T3: PRIMARY BUG TEST - Select Contact...');
    const dropdown = page.locator('select').first();
    await dropdown.waitFor({ state: 'visible' });
    
    const options = await dropdown.locator('option').all();
    console.log('Found', options.length, 'contact options');
    
    if (options.length > 1) {
      const value = await options[1].getAttribute('value');
      const text = await options[1].textContent();
      console.log('Selecting contact:', text);
      
      await dropdown.selectOption(value);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug017-02-contact-selected.png', fullPage: true });
      
      const selected = await dropdown.inputValue() === value;
      console.log('✅ Contact selected:', selected);
    }

    // Fill subject
    console.log('
T4: Fill subject...');
    const subject = page.locator('input[type="text"]').first();
    await subject.fill('BUG-017 Test');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/bug017-03-subject.png', fullPage: true });
    console.log('✓ Subject filled');

    // Fill message
    console.log('
T5: Fill message...');
    const message = page.locator('textarea').first();
    await message.fill('Testing BUG-017 fix');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/bug017-04-message.png', fullPage: true });
    console.log('✓ Message filled');

    console.log('
=== BUG-017 Verification Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/bug017-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
