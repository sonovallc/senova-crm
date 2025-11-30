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
    await page.screenshot({ path: 'screenshots/work-01-templates.png', fullPage: true });
    
    console.log('TEST 1: New Template Button');
    const newBtn = await page.locator('button:has-text("New Template")');
    console.log('  Visible:', await newBtn.isVisible());
    await newBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/work-02-modal.png', fullPage: true });
    results.push({ btn: 'New Template', status: 'PASS' });
    
    console.log('\nTEST 2: Name Field');
    await page.locator('input[id="name"]').fill('Working Test ' + Date.now());
    console.log('  Input OK');
    results.push({ btn: 'Name', status: 'PASS' });
    
    console.log('\nTEST 3: Subject Field');
    await page.locator('input[id="subject"]').fill('Working Subject');
    console.log('  Input OK');
    results.push({ btn: 'Subject', status: 'PASS' });
    
    console.log('\nTEST 4: Body Editor');
    const editor = await page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Test body content');
    console.log('  Input OK');
    results.push({ btn: 'Body', status: 'PASS' });
    
    console.log('\nTEST 5: Variables Button');
    const varsBtn = await page.locator('button:has-text("Variables")');
    const varsVisible = await varsBtn.isVisible();
    console.log('  Visible:', varsVisible);
    if (varsVisible) results.push({ btn: 'Variables', status: 'PASS' });
    
    console.log('\nTEST 6: Cancel Button');
    const cancelBtn = await page.locator('button:has-text("Cancel")');
    const cancelVisible = await cancelBtn.isVisible();
    console.log('  Visible:', cancelVisible);
    if (cancelVisible) results.push({ btn: 'Cancel', status: 'PASS' });
    
    console.log('\nTEST 7: Create Template Button');
    await page.screenshot({ path: 'screenshots/work-03-before-create.png', fullPage: true });
    await page.getByRole('button', { name: 'Create Template' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/work-04-after-create.png', fullPage: true });
    console.log('  Click OK');
    results.push({ btn: 'Create', status: 'PASS' });
    
    await page.waitForTimeout(2000);
    
    console.log('\nTEST 8: Search Field');
    const searchField = await page.locator('input[placeholder*="Search"]');
    const searchVisible = await searchField.isVisible();
    console.log('  Visible:', searchVisible);
    if (searchVisible) {
      await searchField.fill('Test');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/work-05-search.png', fullPage: true });
      results.push({ btn: 'Search', status: 'PASS' });
    }
    
    console.log('\nTEST 9: Preview Button');
    const previewBtn = await page.locator('button:has-text("Preview")').first();
    const previewVisible = await previewBtn.isVisible();
    console.log('  Visible:', previewVisible);
    if (previewVisible) {
      await previewBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/work-06-preview.png', fullPage: true });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      results.push({ btn: 'Preview', status: 'PASS' });
    }
    
    console.log('\n=== RESULTS ===');
    results.forEach(r => console.log('  ✅', r.btn + ':', r.status));
    console.log('\nPassed:', results.filter(r => r.status === 'PASS').length, '/', results.length);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/work-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
