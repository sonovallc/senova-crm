const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    test1: 'NOT_RUN',
    test2: 'NOT_RUN'
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
    
    // TEST 1: Edit Template Modal
    console.log('=== TEST 1: Edit Template Modal ===');
    await page.goto('http://localhost:3004/dashboard/email/templates', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/bug006-templates-page.png', fullPage: true });
    console.log('Screenshot: templates page');
    
    // Look for edit icon (pencil icon) in template cards
    const editIcon = await page.locator('svg.lucide-pencil, button svg[data-lucide="pencil"]').first();
    const editIconExists = await editIcon.count();
    console.log('Edit icons found:', editIconExists);
    
    if (editIconExists > 0) {
      // Click the parent button of the pencil icon
      await editIcon.click();
      console.log('Clicked edit icon');
      
      // CRITICAL: Wait for modal AND async fetch to complete
      console.log('Waiting 5 seconds for modal and async API fetch...');
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'screenshots/bug006-edit-modal.png', fullPage: true });
      console.log('Screenshot: edit modal captured');
      
      // Look for body textarea in modal
      const bodyTextarea = await page.locator('textarea').filter({ has: page.locator(':text("Body")') }).or(
        page.locator('textarea[name="body_html"]')
      ).or(
        page.locator('label:has-text("Body") ~ textarea, label:has-text("Body") + textarea')
      ).first();
      
      const bodyValue = await bodyTextarea.inputValue().catch(async () => {
        // Try finding any visible textarea
        const allTextareas = await page.locator('textarea:visible').all();
        console.log('Found visible textareas:', allTextareas.length);
        for (let i = 0; i < allTextareas.length; i++) {
          const val = await allTextareas[i].inputValue();
          console.log(`Textarea ${i} length:`, val.length);
          if (val.length > 50) return val;
        }
        return '';
      });
      
      console.log('Body field length:', bodyValue.length, 'characters');
      if (bodyValue.length > 50) {
        console.log('Body preview:', bodyValue.slice(0, 150) + '...');
      }
      
      if (bodyValue.length > 0) {
        console.log('✓ TEST 1 PASS: Edit Template body populated!\n');
        results.test1 = 'PASS';
      } else {
        console.log('✗ TEST 1 FAIL: Edit Template body is empty!\n');
        results.test1 = 'FAIL';
      }
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      console.log('✗ TEST 1 FAIL: No edit icons found\n');
      results.test1 = 'FAIL';
    }
    
    // TEST 2: Email Compose with Template
    console.log('=== TEST 2: Email Compose with Template ===');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/bug006-compose-initial.png', fullPage: true });
    console.log('Screenshot: compose page initial');
    
    // Find the template dropdown that says "Select a template to get started..."
    const templateDropdown = await page.locator('text=Select a template to get started').first();
    const dropdownExists = await templateDropdown.count();
    console.log('Template dropdown found:', dropdownExists);
    
    if (dropdownExists > 0) {
      // Click to open dropdown
      await templateDropdown.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'screenshots/bug006-compose-dropdown-open.png', fullPage: true });
      console.log('Screenshot: dropdown opened');
      
      // Select first template option (look for template names in dropdown)
      const firstOption = await page.locator('[role="option"], .option, li').filter({ hasText: /test|welcome|general/i }).first();
      const optionExists = await firstOption.count();
      
      if (optionExists > 0) {
        await firstOption.click();
        console.log('Selected template from dropdown');
        
        // CRITICAL: Wait for async fetch to complete
        console.log('Waiting 4 seconds for async API fetch...');
        await page.waitForTimeout(4000);
        
        await page.screenshot({ path: 'screenshots/bug006-compose-after-select.png', fullPage: true });
        console.log('Screenshot: compose after template select');
        
        // Check Message field for content
        const messageEditor = await page.locator('.ql-editor, [contenteditable="true"]').first();
        const messageContent = await messageEditor.textContent().catch(() => '');
        
        console.log('Message field length:', messageContent.length, 'characters');
        if (messageContent.length > 10) {
          console.log('Message preview:', messageContent.slice(0, 150) + '...');
        }
        
        if (messageContent.length > 0) {
          console.log('✓ TEST 2 PASS: Email Compose body populated!\n');
          results.test2 = 'PASS';
        } else {
          console.log('✗ TEST 2 FAIL: Email Compose body is empty!\n');
          results.test2 = 'FAIL';
        }
      } else {
        console.log('✗ TEST 2 FAIL: No template options in dropdown\n');
        results.test2 = 'FAIL';
      }
    } else {
      console.log('✗ TEST 2 FAIL: Template dropdown not found\n');
      results.test2 = 'FAIL';
    }
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Test 1 (Edit Template Modal):', results.test1);
    console.log('Test 2 (Email Compose):', results.test2);
    
    const allPass = results.test1 === 'PASS' && results.test2 === 'PASS';
    if (allPass) {
      console.log('\n✓✓✓ BUG #6 IS FIXED! ✓✓✓');
    } else {
      console.log('\n✗✗✗ BUG #6 STILL HAS ISSUES! ✗✗✗');
    }
    
  } catch (error) {
    console.error('ERROR during testing:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'screenshots/bug006-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
