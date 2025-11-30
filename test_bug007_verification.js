const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting BUG-7 Multi-Step Template Selection Persistence Test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Logged in successfully');

    console.log('\nStep 2: Navigate to Autoresponders Create...');
    await page.goto('http://localhost:3004/email/autoresponders/create');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug7-1-create-page.png'), fullPage: true });
    console.log('Screenshot: bug7-1-create-page.png');

    console.log('\nStep 3: Fill basic info...');
    await page.fill('input[name="name"]', 'Test BUG-7 Verification');
    await page.selectOption('select[name="trigger_type"]', 'new_contact_created');
    await page.waitForTimeout(1000);

    console.log('\nStep 4: Enable multi-step sequence...');
    await page.check('input[type="checkbox"][name*="sequence"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug7-2-sequence-enabled.png'), fullPage: true });
    console.log('Screenshot: bug7-2-sequence-enabled.png');

    console.log('\nStep 5: Add first sequence step...');
    await page.click('button:has-text("Add Sequence Step")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug7-3-step-added.png'), fullPage: true });
    console.log('Screenshot: bug7-3-step-added.png');

    console.log('\nStep 6: Get available templates...');
    const templateDropdown = await page.locator('select').filter({ hasText: /template/i }).first();
    const options = await page.locator('select option').allTextContents();
    console.log('Available options:', options);

    let selectedTemplate = null;
    for (const option of options) {
      if (option !== 'Custom Content' && option.trim() !== '') {
        selectedTemplate = option.trim();
        break;
      }
    }

    if (!selectedTemplate) {
      console.log('FAIL: No templates available');
      await browser.close();
      return;
    }

    console.log('Template to select:', selectedTemplate);

    console.log('\nStep 7: Select template in Step 1...');
    await page.selectOption('select[name*="template"]', { label: selectedTemplate });
    await page.waitForTimeout(3000);

    const currentValue = await page.locator('select[name*="template"]').first().inputValue();
    const currentText = await page.locator('select[name*="template"] option:checked').first().textContent();
    console.log('Dropdown value after selection:', currentValue);
    console.log('Dropdown text after selection:', currentText);

    await page.screenshot({ path: path.join(screenshotDir, 'bug7-4-template-selected.png'), fullPage: true });
    console.log('Screenshot: bug7-4-template-selected.png');

    const subject = await page.locator('input[name*="subject"]').first().inputValue();
    const body = await page.locator('textarea[name*="body"]').first().inputValue();
    console.log('Subject value:', subject);
    console.log('Body length:', body.length);

    console.log('\nStep 8: Add second sequence step...');
    await page.click('button:has-text("Add Sequence Step")');
    await page.waitForTimeout(2000);

    console.log('\nStep 9: Select template in Step 2...');
    await page.locator('select[name*="template"]').nth(1).selectOption({ label: selectedTemplate });
    await page.waitForTimeout(3000);

    const step1After = await page.locator('select[name*="template"]').first().inputValue();
    const step1TextAfter = await page.locator('select[name*="template"] option:checked').first().textContent();
    const step2Value = await page.locator('select[name*="template"]').nth(1).inputValue();
    
    console.log('Step 1 value after Step 2:', step1After);
    console.log('Step 1 text after Step 2:', step1TextAfter);
    console.log('Step 2 value:', step2Value);

    await page.screenshot({ path: path.join(screenshotDir, 'bug7-5-step2-added.png'), fullPage: true });
    console.log('Screenshot: bug7-5-step2-added.png');

    console.log('\n=== VERIFICATION RESULTS ===');
    let passed = true;

    if (currentText.includes(selectedTemplate)) {
      console.log('PASS: Template persisted after selection');
    } else {
      console.log('FAIL: Template did not persist');
      passed = false;
    }

    if (subject && subject.length > 0) {
      console.log('PASS: Subject populated');
    } else {
      console.log('FAIL: Subject not populated');
      passed = false;
    }

    if (body && body.length > 0) {
      console.log('PASS: Body populated');
    } else {
      console.log('FAIL: Body not populated');
      passed = false;
    }

    if (step1TextAfter.includes(selectedTemplate)) {
      console.log('PASS: Step 1 persisted after Step 2');
    } else {
      console.log('FAIL: Step 1 lost after Step 2');
      passed = false;
    }

    console.log('\n=== OVERALL: ' + (passed ? 'PASS' : 'FAIL') + ' ===');

  } catch (error) {
    console.error('ERROR:', error);
    await page.screenshot({ path: path.join(screenshotDir, 'bug7-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
