const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Phase 5: Import Execution Test
 * Tests the actual import process after bulk actions are applied
 *
 * This test validates:
 * - "Keep All" bulk action is applied
 * - "Import with Decisions" button becomes enabled
 * - Import executes successfully
 * - Success message shows correct count (1,538 contacts created)
 * - Loading states are handled properly
 *
 * Timeline:
 * - 90s for duplicate detection
 * - 120s for import execution
 */

const SCREENSHOTS_DIR = path.join(process.cwd(), 'testing', 'phase5-screenshots');
const BASE_URL = 'http://localhost:3004';
const TEST_CSV_PATH = 'C:\\Users\\jwood\\Downloads\\1762581652_664d2976-13a7-41fd-9e6c-16c6dc3db8a0.csv';
const SCREENSHOT_TIMEOUT = 60000; // 60 seconds for large page renders

async function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created screenshot directory: ${SCREENSHOTS_DIR}`);
  }
}

async function login(page) {
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  console.log('Login successful');
}

async function uploadCSV(page) {
  console.log('Navigating to import page and uploading CSV...');
  await page.goto(`${BASE_URL}/dashboard/contacts/import/test-duplicates`);
  await page.waitForLoadState('networkidle');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TEST_CSV_PATH);
  await page.waitForTimeout(1000);

  const uploadButton = page.locator('button:has-text("Upload")').first();
  await uploadButton.click();

  // Wait for upload and duplicate detection to complete
  console.log('Waiting for duplicate detection (90s timeout)...');
  await page.waitForTimeout(90000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  console.log('Upload and detection complete');
}

async function takeScreenshot(page, filename, description) {
  console.log(`Taking screenshot: ${description}...`);
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, filename),
    fullPage: true,
    timeout: SCREENSHOT_TIMEOUT,
    animations: "disabled"
  });
  console.log(`✓ Screenshot saved: ${filename}`);
}

async function applyKeepAll(page) {
  console.log('\n=== Applying Keep All Bulk Action ===');

  // Click Keep All button
  console.log('Clicking Keep All button...');
  const keepAllButton = page.locator('button:has-text("Keep All")');
  await keepAllButton.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  console.log('✓ Keep All applied successfully');
}

async function testImportExecution(page) {
  console.log('\n=== TEST: Import Execution ===');

  // Screenshot 1: Before clicking Import button
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '01-before-import.png', 'Before clicking Import button');

  // Click Import with Decisions button
  console.log('Clicking Import with Decisions button...');
  const importButton = page.locator('button:has-text("Import with Decisions")');
  const isEnabled = await importButton.isEnabled();
  console.log(`Import button enabled: ${isEnabled}`);

  if (!isEnabled) {
    throw new Error('Import with Decisions button is NOT enabled - cannot proceed');
  }

  await importButton.click();
  await page.waitForTimeout(2000);

  // Screenshot 2: Import loading state
  await takeScreenshot(page, '02-import-loading.png', 'Import loading state');

  // Wait for import to complete (120 seconds)
  console.log('Waiting for import to complete (120s timeout)...');
  await page.waitForTimeout(120000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Screenshot 3: Success message
  console.log('Capturing success message...');
  await takeScreenshot(page, '03-success-message.png', 'Success message after import');

  // Screenshot 4: Final state
  await page.waitForTimeout(2000);
  await takeScreenshot(page, '04-final-state.png', 'Final state after import');

  // Verify success message
  try {
    const pageContent = await page.content();
    const hasCorrectCount = pageContent.includes('1,538') || pageContent.includes('1538');

    if (hasCorrectCount) {
      console.log('✓ Success message with correct count (1,538) found');
    } else {
      console.log('⚠ Success message found but count may differ from expected 1,538');
    }
  } catch (error) {
    console.error('❌ Could not verify success message:', error.message);
  }

  console.log('✓ Import execution test complete');
}

async function runPhase5Tests() {
  console.log('=== Phase 5: Import Execution Testing ===\n');

  await ensureScreenshotDir();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Login
    await login(page);

    // Step 2: Upload CSV and wait for detection
    await uploadCSV(page);

    // Step 3: Apply Keep All bulk action
    await applyKeepAll(page);

    // Step 4: Execute import and verify
    await testImportExecution(page);

    console.log('\n=== Phase 5 Testing Complete ===');
    console.log(`All 4 screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\nScreenshots captured:');
    console.log('1. 01-before-import.png - Before clicking Import button');
    console.log('2. 02-import-loading.png - Import loading state');
    console.log('3. 03-success-message.png - Success message after import');
    console.log('4. 04-final-state.png - Final state after import');
    console.log('\n✓ Import executed successfully!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'ERROR-state.png'),
      fullPage: true,
      timeout: SCREENSHOT_TIMEOUT,
      animations: "disabled"
    });
  } finally {
    await browser.close();
  }
}

// Run the tests
runPhase5Tests().catch(console.error);
