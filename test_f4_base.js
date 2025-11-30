const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhase1() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature4-campaigns');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Feature 4 Campaign Creation Testing ===\n');

  try {
    // Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('Login successful\n');

    // Navigate to import page
    console.log('Step 2: Navigating to import page...');
    await page.goto('http://localhost:3004/dashboard/contacts/import/test-duplicates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '02-initial-upload-page.png'), fullPage: true });
    console.log('Screenshot: Initial upload page\n');

    // Upload CSV
    console.log('Step 3: Uploading CSV file...');
    const csvPath = '/c/Users/jwood/Downloads/1762581652_664d2976-13a7-41fd-9e6c-16c6dc3db8a0.csv';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '04-file-selected.png'), fullPage: true });
    console.log('Screenshot: File selected\n');

    // Upload button
    console.log('Step 4: Clicking upload button...');
    const uploadButton = page.locator('button:has-text("Upload")').first();
    await page.screenshot({ path: path.join(screenshotDir, '05-upload-button-enabled.png'), fullPage: true });
    await uploadButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '06-upload-progress.png'), fullPage: true });
    console.log('Screenshot: Upload progress\n');

    // Wait for completion
    console.log('Step 5: Waiting for completion (60s timeout)...');
    try {
      await page.waitForTimeout(60000);
    } catch (e) {
      console.log('Timeout waiting\n');
    }
    
    await page.screenshot({ path: path.join(screenshotDir, '07-contact-count-display.png'), fullPage: true });
    console.log('Screenshot: Contact count display\n');

    // Extract count
    const content = await page.content();
    const match = content.match(/1[,\s]?538|1538/);
    console.log(match ? `PASS: Found count ${match[0]}` : 'FAIL: Count not found');

    await page.screenshot({ path: path.join(screenshotDir, '08-final-state.png'), fullPage: true });
    console.log('\nTest completed!');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-state.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testPhase1().catch(console.error);
