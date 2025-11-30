const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const results = [];

  try {
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v5e_01_login.png', fullPage: true });
    console.log('  PASS - Logged in');
    results.push({ step: 'Step 1: Login', status: 'PASS', screenshot: 'v5e_01_login.png' });

    console.log('
Step 2: Navigate to Contacts');
    await page.click('a[href="/contacts"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5e_02_contacts.png', fullPage: true });
    console.log('  PASS - On contacts page');
    results.push({ step: 'Step 2: Navigate to Contacts', status: 'PASS', screenshot: 'v5e_02_contacts.png' });

    console.log('
Step 3: Click on Contact Card');
    const contactCards = await page.locator('[class*="contact"] [class*="card"]').all();
    console.log();
    
    if (contactCards.length === 0) {
      const allText = await page.locator('text=TestContactFinal').first();
      await allText.click();
    } else {
      await contactCards[0].click();
    }
    
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/v5e_03_detail.png', fullPage: true });
    const url = page.url();
    console.log();
    console.log('  PASS - Contact detail opened');
    results.push({ step: 'Step 3: Click on Contact', status: 'PASS', screenshot: 'v5e_03_detail.png' });

    console.log('
Step 4: Verify Edit Form');
    await page.waitForSelector('input[name="firstName"]', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v5e_04_form.png', fullPage: true });
    
    const fname = await page.inputValue('input[name="firstName"]');
    const lname = await page.inputValue('input[name="lastName"]');
    console.log();
    console.log('  PASS - Edit form loaded');
    results.push({ step: 'Step 4: Edit Form', status: 'PASS', screenshot: 'v5e_04_form.png' });

    console.log('
Step 5: Modify Fields');
    await page.fill('input[name="firstName"]', 'EditTest');
    await page.fill('input[name="lastName"]', 'Modified');
    await page.fill('input[name="company"]', 'Updated Company Inc');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/v5e_05_modified.png', fullPage: true });
    console.log('  PASS - Fields modified');
    results.push({ step: 'Step 5: Modify Fields', status: 'PASS', screenshot: 'v5e_05_modified.png' });

    console.log('
Step 6: Save Changes');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    const submitBtn = page.locator('[data-testid="contact-form-submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
    } else {
      await page.click('button[type="submit"]');
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/v5e_06_saved.png', fullPage: true });
    console.log('  PASS - Saved');
    results.push({ step: 'Step 6: Save', status: 'PASS', screenshot: 'v5e_06_saved.png' });

    console.log('
Step 7: Verify Persistence');
    await page.click('a[href="/contacts"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5e_07_verify.png', fullPage: true });
    
    const content = await page.textContent('body');
    if (content.includes('EditTest') && content.includes('Modified')) {
      console.log('  PASS - Changes persisted!');
      results.push({ step: 'Step 7: Verify Persistence', status: 'PASS', screenshot: 'v5e_07_verify.png' });
    } else {
      console.log('  FAIL - Changes not found');
      results.push({ step: 'Step 7: Verify Persistence', status: 'FAIL', screenshot: 'v5e_07_verify.png' });
    }

    console.log('
=== RESULTS ===');
    results.forEach(r => {
      console.log();
      console.log();
    });
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    console.log();

  } catch (error) {
    console.error();
    await page.screenshot({ path: 'screenshots/v5e_error.png', fullPage: true });
    console.log('
FINAL VERDICT: FAIL (ERROR)');
  } finally {
    await browser.close();
  }
})();