const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];

  try {
    console.log('EMAIL TEMPLATES BUTTON TEST');
    console.log('');
    
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login OK');
    console.log('');

    console.log('Step 2: Go to Templates');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/btn-test-01-templates.png', fullPage: true });
    console.log('Templates page loaded');
    console.log('');

    console.log('TEST 1: Create Template Button');
    const createBtn = await page.locator('button:has-text("New Template")').first();
    const visible1 = await createBtn.isVisible();
    console.log('  Visible:', visible1);
    if (visible1) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/btn-test-02-create-clicked.png', fullPage: true });
      console.log('  Click OK');
      results.push({ btn: 'Create', status: 'PASS' });
    } else {
      results.push({ btn: 'Create', status: 'FAIL' });
    }

    console.log('');
    console.log('TEST 2: Name Field');
    const nameField = await page.locator('input[id="name"]').first();
    const visible2 = await nameField.isVisible();
    console.log('  Visible:', visible2);
    if (visible2) {
      await nameField.fill('Button Test Template');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/btn-test-03-name.png' });
      console.log('  Input OK');
      results.push({ btn: 'Name', status: 'PASS' });
    } else {
      results.push({ btn: 'Name', status: 'FAIL' });
    }

    console.log('');
    console.log('TEST 3: Subject Field');
    const subjectField = await page.locator('input[id="subject"]').first();
    const visible3 = await subjectField.isVisible();
    console.log('  Visible:', visible3);
    if (visible3) {
      await subjectField.fill('Test Subject');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/btn-test-04-subject.png' });
      console.log('  Input OK');
      results.push({ btn: 'Subject', status: 'PASS' });
    } else {
      results.push({ btn: 'Subject', status: 'FAIL' });
    }

    console.log('');
    console.log('TEST 4: Save Button');
    const saveBtn = await page.locator('button:has-text("New Template")').filter({ hasText: "Create Template" });
    const visible4 = await saveBtn.isVisible();
    console.log('  Visible:', visible4);
    if (visible4) {
      await page.screenshot({ path: 'screenshots/btn-test-05-before-save.png', fullPage: true });
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/btn-test-06-after-save.png', fullPage: true });
      console.log('  Click OK');
      results.push({ btn: 'Save', status: 'PASS' });
    } else {
      results.push({ btn: 'Save', status: 'FAIL' });
    }

    console.log('');
    console.log('RESULTS:');
    results.forEach(r => console.log('  ' + r.btn + ':', r.status));
    const passed = results.filter(r => r.status === 'PASS').length;
    console.log('');
    console.log('Passed:', passed, '/', results.length);

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/btn-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
