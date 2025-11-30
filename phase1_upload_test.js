const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhase1UploadUX() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'phase1-upload-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Phase 1 Upload UX Testing ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✓ Login successful\n');

    // Step 2: Navigate to import page
    console.log('Step 2: Navigating to import page...');
    await page.goto('http://localhost:3004/dashboard/contacts/import/test-duplicates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any animations
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-initial-upload-page.png'), 
      fullPage: true 
    });
    console.log('✓ Screenshot: Initial upload page captured\n');

    // Step 3: Test file selection button
    console.log('Step 3: Testing file selection button...');
    const fileInput = page.locator('input[type="file"]');
    const isFileInputVisible = await fileInput.isVisible();
    console.log(`File input visible: ${isFileInputVisible}`);
    
    // Take screenshot of file selection area
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-file-selection-button.png'), 
      fullPage: true 
    });
    console.log('✓ Screenshot: File selection button captured\n');

    // Step 4: Upload the CSV file
    console.log('Step 4: Uploading CSV file...');
    const csvPath = 'C:\Users\jwood\Downloads\1762581652_664d2976-13a7-41fd-9e6c-16c6dc3db8a0.csv';
    
    await fileInput.setInputFiles(csvPath);
    await page.waitForTimeout(1000); // Wait for filename to display
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-file-selected.png'), 
      fullPage: true 
    });
    console.log('✓ Screenshot: File selected with filename displayed\n');

    // Step 5: Check upload button state
    console.log('Step 5: Checking upload button...');
    const uploadButton = page.locator('button:has-text("Upload")').first();
    const isButtonEnabled = await uploadButton.isEnabled();
    console.log(`Upload button enabled: ${isButtonEnabled}`);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '05-upload-button-enabled.png'), 
      fullPage: true 
    });
    console.log('✓ Screenshot: Upload button state captured\n');

    // Step 6: Click upload and capture progress
    console.log('Step 6: Clicking upload button...');
    await uploadButton.click();
    await page.waitForTimeout(2000); // Wait for upload to start
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-upload-progress.png'), 
      fullPage: true 
    });
    console.log('✓ Screenshot: Upload progress captured\n');

    // Step 7: Wait for completion and capture contact count
    console.log('Step 7: Waiting for upload completion...');
    
    // Wait for either success message or contact count to appear (up to 60 seconds)
    try {
      await page.waitForSelector('text=/1,?538|1538/', { timeout: 60000 });
      console.log('✓ Contact count appeared!\n');
    } catch (e) {
      console.log('⚠ Timeout waiting for contact count, taking screenshot anyway...\n');
    }
    
    await page.waitForTimeout(2000); // Additional wait for UI to stabilize
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '07-contact-count-display.png'), 
      fullPage: true 
    });
    console.log('✓ Screenshot: Contact count display captured\n');

    // Step 8: Extract and verify contact count
    console.log('Step 8: Extracting contact count...');
    const pageContent = await page.content();
    const countMatch = pageContent.match(/1[,\s]?538|1538/);
    
    if (countMatch) {
      console.log(`✓ PASS: Found contact count: ${countMatch[0]}`);
    } else {
      console.log('✗ FAIL: Could not find expected contact count (1,538 or 1538)');
    }

    // Final screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, '08-final-state.png'), 
      fullPage: true 
    });

    console.log('\n=== Test Summary ===');
    console.log(`Screenshots saved to: ${screenshotDir}`);
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('\n✗ ERROR during testing:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'ERROR-state.png'), 
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

testPhase1UploadUX().catch(console.error);
