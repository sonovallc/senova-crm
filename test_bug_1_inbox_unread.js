const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    nameInput: false,
    descriptionInput: false,
    subjectInput: false,
    bodyEditor: false,
    triggerDropdown: false,
    templateDropdown: false,
    activeToggle: false,
    saveButton: false
  };

  try {
    console.log('Step 1: Navigate to frontend');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    console.log('Step 2: Login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('Step 3: Navigate to autoresponders');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot 1: Autoresponders list');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/BUG003-01-autoresponders-list.png', 
      fullPage: true 
    });
    
    console.log('Step 4: Click Create Autoresponder button');
    const createBtn = page.locator('button:has-text("Create")').first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      console.log('✓ Create button clicked');
    } else {
      console.log('✗ Create button not found');
    }
    
    console.log('Current URL:', page.url());
    
    console.log('Taking screenshot 2: Form empty');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/BUG003-02-form-empty.png', 
      fullPage: true 
    });
    
    console.log('Step 6: Test form fields');
    
    // Test Name input
    console.log('Testing Name input...');
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Autoresponder');
      results.nameInput = true;
      console.log('✓ Name input accepts text');
    } else {
      console.log('✗ Name input not found');
    }
    
    // Test Description
    console.log('Testing Description input...');
    const descInput = page.locator('textarea[name="description"], input[name="description"]').first();
    if (await descInput.count() > 0) {
      await descInput.fill('Test description');
      results.descriptionInput = true;
      console.log('✓ Description input accepts text');
    } else {
      console.log('✗ Description input not found');
    }
    
    // Test Subject
    console.log('Testing Subject input...');
    const subjectInput = page.locator('input[name="subject"]').first();
    if (await subjectInput.count() > 0) {
      await subjectInput.fill('Test Subject');
      results.subjectInput = true;
      console.log('✓ Subject input accepts text');
    } else {
      console.log('✗ Subject input not found');
    }
    
    // Test Body editor
    console.log('Testing Body editor...');
    const bodyEditor = page.locator('textarea[name="body"], [contenteditable="true"]').first();
    if (await bodyEditor.count() > 0) {
      await bodyEditor.fill('This is a test email body');
      results.bodyEditor = true;
      console.log('✓ Body editor accepts text');
    } else {
      console.log('✗ Body editor not found');
    }
    
    await page.waitForTimeout(1000);
    
    console.log('Taking screenshot 3: Form filled');
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/BUG003-03-form-filled.png', 
      fullPage: true 
    });
    
    // Test Trigger dropdown
    console.log('Testing Trigger dropdown...');
    const triggerSelect = page.locator('select[name="trigger"]').first();
    if (await triggerSelect.count() > 0) {
      await triggerSelect.click();
      await page.waitForTimeout(1000);
      results.triggerDropdown = true;
      console.log('✓ Trigger dropdown clicked');
      
      console.log('Taking screenshot 4: Trigger dropdown');
      await page.screenshot({ 
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/BUG003-04-trigger-dropdown.png', 
        fullPage: true 
      });
      
      const options = await page.locator('select[name="trigger"] option').allTextContents();
      console.log('Trigger options:', options);
      
      // Select first option
      if (options.length > 0) {
        await triggerSelect.selectOption({ index: 0 });
      }
    } else {
      console.log('✗ Trigger dropdown not found');
    }
    
    // Test Template dropdown
    console.log('Testing Template dropdown...');
    const templateSelect = page.locator('select[name="template_id"]').first();
    if (await templateSelect.count() > 0) {
      await templateSelect.click();
      await page.waitForTimeout(1000);
      results.templateDropdown = true;
      console.log('✓ Template dropdown clicked');
      
      console.log('Taking screenshot 5: Template dropdown');
      await page.screenshot({ 
        path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/BUG003-05-template-dropdown.png', 
        fullPage: true 
      });
    } else {
      console.log('✗ Template dropdown not found');
    }
    
    // Test Active toggle
    console.log('Testing Active toggle...');
    const activeToggle = page.locator('input[type="checkbox"][name="active"]').first();
    if (await activeToggle.count() > 0) {
      await activeToggle.click();
      await page.waitForTimeout(500);
      results.activeToggle = true;
      console.log('✓ Active toggle clicked');
    } else {
      console.log('✗ Active toggle not found');
    }
    
    // Check Save button
    console.log('Checking Save button...');
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    if (await saveButton.count() > 0) {
      const isVisible = await saveButton.isVisible();
      results.saveButton = isVisible;
      console.log(isVisible ? '✓ Save button is visible' : '✗ Save button not visible');
    } else {
      console.log('✗ Save button not found');
    }
    
    console.log('\n=== TEST RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    
    const allPass = Object.values(results).every(v => v === true);
    console.log('\nOVERALL:', allPass ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('ERROR during testing:', error.message);
    await page.screenshot({ 
      path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/testing/production-fixes/BUG003-ERROR.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
