const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  let testResult = 'UNCERTAIN';
  let errorMessages = [];
  let successMessages = [];

  try {
    console.log('======================================');
    console.log('BUG-7 VERIFICATION TEST');
    console.log('Autoresponder Edit Persistence');
    console.log('======================================\n');

    // Listen for console errors
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Error') || text.includes('error')) {
        console.log('Browser console:', text);
        errorMessages.push(text);
      }
    });

    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_01_login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('  ✓ Logged in\n');

    console.log('Step 2: Navigate to Autoresponders');
    await page.click('text=Email');
    await page.waitForTimeout(1000);
    await page.click('text=Autoresponders');
    await page.waitForTimeout(2000);
    console.log('  ✓ At Autoresponders page\n');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_02_autoresponders_list.png'), fullPage: true });

    console.log('Step 3: Click Edit button');
    await page.waitForSelector('button[title="Edit"]', { timeout: 10000 });
    const editButton = await page.$('button[title="Edit"]');
    await editButton.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Edit form opened\n');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_03_edit_form_top.png'), fullPage: true });

    console.log('Step 4: Modify Description field');
    // Wait for the form to load
    await page.waitForSelector('textarea', { timeout: 5000 });
    
    // Get all textareas and find the Description one
    const textareas = await page.$$('textarea');
    let descriptionField = textareas[0]; // Usually the first textarea is description
    
    const currentDesc = await descriptionField.inputValue();
    console.log('  Current description:', currentDesc);
    
    const newDesc = currentDesc + ' [EDITED AT ' + new Date().toLocaleTimeString() + ']';
    await descriptionField.fill(newDesc);
    await page.waitForTimeout(500);
    console.log('  ✓ Modified description to:', newDesc);
    console.log('');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_04_description_modified.png'), fullPage: true });

    console.log('Step 5: Scroll down to find Save button');
    // Scroll to bottom of page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_05_scrolled_to_bottom.png'), fullPage: true });

    console.log('Step 6: Click Save Changes button');
    // Look for the save button
    const saveButton = await page.$('button:has-text("Save Changes"), button:has-text("Update Autoresponder"), button[type="submit"]');
    if (!saveButton) {
      throw new Error('Save button not found!');
    }
    
    console.log('  ✓ Found Save button, clicking...\n');
    await saveButton.click();
    
    // Wait for network response
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_06_after_save_attempt.png'), fullPage: true });

    console.log('Step 7: Check for errors or success messages');
    
    // Check for error toast
    const errorToast = await page.$('.Toastify__toast--error, [class*="error"], text=Network Error');
    if (errorToast) {
      const errorText = await errorToast.textContent();
      console.log('  ❌ ERROR TOAST FOUND:', errorText);
      errorMessages.push(errorText);
      testResult = 'FAIL';
      await page.screenshot({ path: path.join(screenshotDir, 'bug007_07_ERROR_TOAST.png'), fullPage: true });
    } else {
      console.log('  ✓ No error toast visible');
    }
    
    // Check for success toast
    const successToast = await page.$('.Toastify__toast--success, [class*="success"]');
    if (successToast) {
      const successText = await successToast.textContent();
      console.log('  ✅ SUCCESS TOAST FOUND:', successText);
      successMessages.push(successText);
      if (testResult !== 'FAIL') {
        testResult = 'PASS';
      }
      await page.screenshot({ path: path.join(screenshotDir, 'bug007_08_SUCCESS_TOAST.png'), fullPage: true });
    } else {
      console.log('  ⚠ No success toast visible');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_09_final_state.png'), fullPage: true });

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    testResult = 'ERROR';
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_ERROR.png'), fullPage: true });
  } finally {
    console.log('\n======================================');
    console.log('TEST RESULTS');
    console.log('======================================');
    console.log('Status:', testResult);
    console.log('');
    
    if (errorMessages.length > 0) {
      console.log('Errors detected:');
      errorMessages.forEach(msg => console.log('  -', msg));
      console.log('');
    }
    
    if (successMessages.length > 0) {
      console.log('Success messages:');
      successMessages.forEach(msg => console.log('  -', msg));
      console.log('');
    }
    
    if (testResult === 'PASS') {
      console.log('✅ PASS: BUG-7 FIXED!');
      console.log('   Autoresponder edits now persist without Network Error');
    } else if (testResult === 'FAIL') {
      console.log('❌ FAIL: BUG-7 NOT FIXED');
      console.log('   Network Error still occurs when saving');
    } else if (testResult === 'ERROR') {
      console.log('❌ ERROR: Test encountered an error');
    } else {
      console.log('⚠ UNCERTAIN: Unable to determine if fix worked');
    }
    
    console.log('\nScreenshots: screenshots/bug007_*.png');
    console.log('======================================\n');

    await browser.close();
  }
})();
