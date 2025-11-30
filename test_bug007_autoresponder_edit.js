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

  try {
    console.log('=== BUG-7 VERIFICATION: Autoresponder Edit Persistence ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_01_login_page.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('✓ Logged in successfully');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_02_dashboard.png'), fullPage: true });

    // Step 2: Navigate to Autoresponders
    console.log('\nStep 2: Navigating to Email > Autoresponders...');
    
    // Click Email in sidebar
    await page.click('text=Email');
    await page.waitForTimeout(1000);
    
    // Click Autoresponders
    await page.click('text=Autoresponders');
    await page.waitForTimeout(2000);
    
    console.log('✓ Navigated to Autoresponders page');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_03_autoresponders_page.png'), fullPage: true });

    // Step 3: Find and click Edit button
    console.log('\nStep 3: Looking for Edit button on existing autoresponder...');
    
    // Wait for autoresponders to load
    await page.waitForSelector('button[title="Edit"]', { timeout: 10000 });
    
    // Get the first edit button
    const editButtons = await page.$$('button[title="Edit"]');
    if (editButtons.length === 0) {
      throw new Error('No autoresponders found with edit buttons');
    }
    
    console.log(`✓ Found ${editButtons.length} autoresponder(s)`);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_04_before_edit.png'), fullPage: true });
    
    // Click the first edit button
    console.log('\nStep 4: Clicking Edit button...');
    await editButtons[0].click();
    await page.waitForTimeout(2000);
    
    console.log('✓ Edit modal opened');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_05_edit_modal_opened.png'), fullPage: true });

    // Step 5: Make a change
    console.log('\nStep 5: Making a change to description...');
    
    // Find the description field
    const descriptionField = await page.$('textarea[name="description"], input[name="description"]');
    if (!descriptionField) {
      throw new Error('Description field not found');
    }
    
    // Get current value
    const currentValue = await descriptionField.inputValue();
    console.log(`Current description: "${currentValue}"`);
    
    // Modify the description
    const newValue = currentValue + ' [EDITED]';
    await descriptionField.fill(newValue);
    await page.waitForTimeout(500);
    
    console.log(`✓ Changed description to: "${newValue}"`);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_06_description_modified.png'), fullPage: true });

    // Step 6: Click Save Changes
    console.log('\nStep 6: Clicking Save Changes...');
    
    // Set up listeners for network errors and success messages
    let networkError = false;
    let successMessage = false;
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Network Error') || text.includes('error')) {
        console.log(`❌ Console error: ${text}`);
        networkError = true;
      }
    });
    
    // Click Save button
    const saveButton = await page.$('button:has-text("Save Changes"), button:has-text("Save")');
    if (!saveButton) {
      throw new Error('Save button not found');
    }
    
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    console.log('✓ Clicked Save Changes button');
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_07_after_save.png'), fullPage: true });

    // Step 7: Check for error or success messages
    console.log('\nStep 7: Checking for error or success messages...');
    
    // Check for Network Error toast
    const errorToast = await page.$('text=Network Error');
    if (errorToast) {
      console.log('❌ FAIL: Network Error toast appeared!');
      networkError = true;
      await page.screenshot({ path: path.join(screenshotDir, 'bug007_08_network_error.png'), fullPage: true });
    } else {
      console.log('✓ No Network Error toast found');
    }
    
    // Check for success message
    const successToast = await page.$('text=/successfully|updated|saved/i');
    if (successToast) {
      const successText = await successToast.textContent();
      console.log(`✓ SUCCESS: "${successText}"`);
      successMessage = true;
      await page.screenshot({ path: path.join(screenshotDir, 'bug007_09_success_message.png'), fullPage: true });
    } else {
      console.log('⚠ Warning: No success message found');
    }

    // Final Results
    console.log('\n=== VERIFICATION RESULTS ===');
    if (networkError) {
      console.log('❌ FAIL: Network Error occurred - BUG-7 NOT FIXED');
    } else if (successMessage) {
      console.log('✅ PASS: Save succeeded without Network Error - BUG-7 FIXED!');
    } else {
      console.log('⚠ UNCERTAIN: No error but no success message either');
    }
    
    console.log('\nScreenshots saved to: screenshots/bug007_*.png');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'bug007_error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
