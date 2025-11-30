const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    test1: 'NOT_RUN',
    test2: 'NOT_RUN',
    test3: 'NOT_RUN'
  };

  try {
    console.log('=== BUG #6 VERIFICATION TEST ===\n');
    
    console.log('Step 1: Login to EVE CRM');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Login complete\n');
    
    console.log('=== TEST 1: Edit Template Modal ===');
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/bug006-templates-page.png', fullPage: true });
    console.log('Screenshot: templates page');
    
    const editButtons = await page.locator('button').filter({ hasText: /edit/i }).all();
    console.log('Found edit buttons:', editButtons.length);
    
    if (editButtons.length > 0) {
      await editButtons[0].click();
      console.log('Clicked edit button');
      
      console.log('Waiting 4 seconds for modal and async fetch...');
      await page.waitForTimeout(4000);
      
      await page.screenshot({ path: 'screenshots/bug006-edit-modal.png', fullPage: true });
      console.log('Screenshot: edit modal');
      
      const bodyInput = await page.locator('textarea').filter({ hasText: /body/i }).first().or(page.locator('textarea[name="body_html"]').first());
      const bodyValue = await bodyInput.inputValue().catch(() => '');
      
      console.log('Body field length:', bodyValue.length, 'characters');
      if (bodyValue.length > 50) {
        console.log('Body preview:', bodyValue.slice(0, 100));
      }
      
      if (bodyValue.length > 0) {
        console.log('TEST 1 PASS: Edit Template body populated!\n');
        results.test1 = 'PASS';
      } else {
        console.log('TEST 1 FAIL: Edit Template body is empty!\n');
        results.test1 = 'FAIL';
      }
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      console.log('TEST 1 FAIL: No edit buttons found\n');
      results.test1 = 'FAIL';
    }
    
    console.log('=== TEST 2: Email Compose with Template ===');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/bug006-compose-initial.png', fullPage: true });
    console.log('Screenshot: compose page initial');
    
    const selects = await page.locator('select').all();
    console.log('Found selects:', selects.length);
    
    if (selects.length > 0) {
      const templateSelect = selects[0];
      const options = await templateSelect.locator('option').all();
      console.log('Found options:', options.length);
      
      if (options.length > 1) {
        await templateSelect.selectOption({ index: 1 });
        console.log('Selected template from dropdown');
        
        console.log('Waiting 3 seconds for async fetch...');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'screenshots/bug006-compose-after-select.png', fullPage: true });
        console.log('Screenshot: compose after template select');
        
        const allTextareas = await page.locator('textarea').all();
        console.log('Found textareas:', allTextareas.length);
        
        let hasContent = false;
        for (const textarea of allTextareas) {
          const val = await textarea.inputValue().catch(() => '');
          if (val.length > 0) {
            console.log('Found textarea with content, length:', val.length);
            hasContent = true;
            break;
          }
        }
        
        if (hasContent) {
          console.log('TEST 2 PASS: Email Compose body populated!\n');
          results.test2 = 'PASS';
        } else {
          console.log('TEST 2 FAIL: Email Compose body is empty!\n');
          results.test2 = 'FAIL';
        }
      } else {
        console.log('TEST 2 FAIL: No templates in dropdown\n');
        results.test2 = 'FAIL';
      }
    } else {
      console.log('TEST 2 FAIL: No select elements found\n');
      results.test2 = 'FAIL';
    }
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Test 1 (Edit Template):', results.test1);
    console.log('Test 2 (Email Compose):', results.test2);
    
    const allPass = results.test1 === 'PASS' && results.test2 === 'PASS';
    if (allPass) {
      console.log('\nBUG #6 IS FIXED!');
    } else {
      console.log('\nBUG #6 STILL HAS ISSUES!');
    }
    
  } catch (error) {
    console.error('ERROR during testing:', error.message);
    await page.screenshot({ path: 'screenshots/bug006-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
