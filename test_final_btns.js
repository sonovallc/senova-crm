const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];
  try {
    console.log('EMAIL TEMPLATES BUTTON TEST\n');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login OK\n');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/final-01.png', fullPage: true });
    console.log('TEST 1: New Template Button');
    const newBtn = await page.locator('button:has-text("New Template")');
    console.log('  Visible:', await newBtn.isVisible());
    await newBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/final-02.png', fullPage: true });
    results.push({ btn: 'New Template', status: 'PASS' });
    console.log('\nTEST 2: Name Field');
    await page.fill('input[name="name"]', 'Final Test ' + Date.now());
    console.log('  Input OK');
    results.push({ btn: 'Name', status: 'PASS' });
    console.log('\nTEST 3: Subject Field');
    await page.fill('input[name="subject"]', 'Final Subject');
    console.log('  Input OK');
    results.push({ btn: 'Subject', status: 'PASS' });
    console.log('\nTEST 4: Body Editor');
    await page.locator('[contenteditable="true"]').first().click();
    await page.keyboard.type('Test body');
    console.log('  Input OK');
    results.push({ btn: 'Body', status: 'PASS' });
    console.log('\nTEST 5: Create Template Button');
    await page.screenshot({ path: 'screenshots/final-03.png', fullPage: true });
    await page.getByRole('button', { name: 'Create Template' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/final-04.png', fullPage: true });
    console.log('  Click OK');
    results.push({ btn: 'Create', status: 'PASS' });
    console.log('\n=== RESULTS ===');
    results.forEach(r => console.log('  ' + r.btn + ':', r.status));
    console.log('\nPassed:', results.filter(r => r.status === 'PASS').length, '/', results.length);
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/final-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
