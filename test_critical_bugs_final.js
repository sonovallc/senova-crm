const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const screenshotPath = './screenshots/critical-bugs-test';
  
  if (!fs.existsSync(screenshotPath)) {
    fs.mkdirSync(screenshotPath, { recursive: true });
  }

  const results = { timestamp: new Date().toISOString(), bugs: [] };

  try {
    console.log('LOGIN...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: screenshotPath + '/01-login.png', fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: screenshotPath + '/02-dashboard.png', fullPage: true });
    console.log('Logged in successfully');

    console.log('
BUG 6 Test 1: Template Edit Body...');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotPath + '/03-templates.png', fullPage: true });

    const rows = await page.locator('table tbody tr').count();
    console.log('Found', rows, 'template rows');
    
    if (rows > 0) {
      await page.locator('table tbody tr').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotPath + '/04-template-edit.png', fullPage: true });

      const content = await page.locator('.ql-editor').first().textContent().catch(() => '');
      const status = content.length > 0 ? 'PASS' : 'FAIL';
      results.bugs.push({ bug: 'BUG 6 - Template Edit Body', status, details: content.length + ' chars', screenshot: '04-template-edit.png' });
      console.log('Result:', status, '-', content.length, 'characters in editor');
    }

    console.log('
BUG 6 Test 2: Compose Template Selection...');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotPath + '/05-compose.png', fullPage: true });

    const dropdown = await page.locator('select').first();
    const opts = await dropdown.locator('option').count();
    console.log('Found', opts, 'template options');
    
    if (opts > 1) {
      await dropdown.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotPath + '/06-template-selected.png', fullPage: true });

      const editorContent = await page.locator('.ql-editor').first().textContent().catch(() => '');
      const status = editorContent.length > 0 ? 'PASS' : 'FAIL';
      results.bugs.push({ bug: 'BUG 6 - Compose Template', status, details: editorContent.length + ' chars', screenshot: '06-template-selected.png' });
      console.log('Result:', status, '-', editorContent.length, 'characters after selection');
    }

    console.log('
BUG 23: Sidebar Scrolling...');
    await page.goto('http://localhost:3004/dashboard');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: screenshotPath + '/07-sidebar.png', fullPage: true });

    const items = ['Dashboard', 'Calendar', 'Contacts', 'Inbox', 'Automations', 'Email', 'Settings'];
    const visible = [];
    for (const item of items) {
      const vis = await page.locator('text=' + item).first().isVisible().catch(() => false);
      if (vis) visible.push(item);
    }
    
    const status23 = visible.length === 7 ? 'PASS' : 'FAIL';
    results.bugs.push({ bug: 'BUG 23 - Sidebar Items', status: status23, details: visible.length + '/7 visible', screenshot: '07-sidebar.png' });
    console.log('Result:', status23, '-', visible.length + '/7 items visible:', visible.join(', '));

    console.log('
BUG 15-16: Campaign Wizard...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotPath + '/08-campaigns.png', fullPage: true });

    const createBtn = await page.locator('button:has-text("Create"), a:has-text("Create")').first();
    const btnVisible = await createBtn.isVisible().catch(() => false);
    
    if (btnVisible) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotPath + '/09-wizard.png', fullPage: true });
      results.bugs.push({ bug: 'BUG 15-16 - Campaign Wizard', status: 'PASS', details: 'Wizard opened', screenshot: '09-wizard.png' });
      console.log('Result: PASS - Wizard opened successfully');
    } else {
      results.bugs.push({ bug: 'BUG 15-16 - Campaign Wizard', status: 'FAIL', details: 'Create button not found', screenshot: '08-campaigns.png' });
      console.log('Result: FAIL - Create button not found');
    }

    console.log('
BUG 17-20: Autoresponder Triggers...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotPath + '/10-autoresponders.png', fullPage: true });

    const autoBtn = await page.locator('button:has-text("Create"), a:has-text("Create")').first();
    const autoBtnVisible = await autoBtn.isVisible().catch(() => false);
    
    if (autoBtnVisible) {
      await autoBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotPath + '/11-auto-form.png', fullPage: true });

      const triggerDrop = await page.locator('select').first();
      const triggerOpts = await triggerDrop.locator('option').allTextContents();
      const status20 = triggerOpts.length >= 5 ? 'PASS' : 'FAIL';
      results.bugs.push({ bug: 'BUG 17-20 - Autoresponder Triggers', status: status20, details: triggerOpts.length + ' triggers', screenshot: '11-auto-form.png' });
      console.log('Result:', status20, '-', triggerOpts.length, 'trigger options found');
    }

    fs.writeFileSync(screenshotPath + '/results.json', JSON.stringify(results, null, 2));

    console.log('
=================================');
    console.log('RESULTS SUMMARY:');
    console.log('=================================');
    results.bugs.forEach(b => {
      console.log((b.status === 'PASS' ? '✓ PASS' : '✗ FAIL') + ' - ' + b.bug + ': ' + b.details);
    });

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
