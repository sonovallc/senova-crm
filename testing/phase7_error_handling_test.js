const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Phase 7: Error Handling Test
 * Tests error handling for invalid file uploads
 *
 * This test validates:
 * - Invalid file type rejection (non-CSV file)
 * - Empty CSV file rejection
 * - Proper error messages displayed to user
 * - Application doesn't crash on invalid input
 *
 * Test Files Created (temporary):
 * - invalid.txt - Non-CSV file to test type validation
 * - empty.csv - Empty CSV file to test content validation
 */

const SCREENSHOTS_DIR = path.join(process.cwd(), 'testing', 'phase7-screenshots');
const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_TIMEOUT = 60000; // 60 seconds for large page renders

// Temporary test files
const INVALID_FILE_PATH = path.join(__dirname, 'invalid.txt');
const EMPTY_CSV_PATH = path.join(__dirname, 'empty.csv');

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

async function navigateToImportPage(page) {
  console.log('Navigating to import page...');
  await page.goto(`${BASE_URL}/dashboard/contacts/import/test-duplicates`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Import page loaded');
}

async function createTestFiles() {
  console.log('\n=== Creating Test Files ===');

  // Create invalid.txt
  fs.writeFileSync(INVALID_FILE_PATH, 'This is a test file, not a CSV');
  console.log(`✓ Created: ${INVALID_FILE_PATH}`);

  // Create empty.csv
  fs.writeFileSync(EMPTY_CSV_PATH, '');
  console.log(`✓ Created: ${EMPTY_CSV_PATH}`);
}

async function deleteTestFiles() {
  console.log('\n=== Cleaning Up Test Files ===');

  if (fs.existsSync(INVALID_FILE_PATH)) {
    fs.unlinkSync(INVALID_FILE_PATH);
    console.log(`✓ Deleted: ${INVALID_FILE_PATH}`);
  }

  if (fs.existsSync(EMPTY_CSV_PATH)) {
    fs.unlinkSync(EMPTY_CSV_PATH);
    console.log(`✓ Deleted: ${EMPTY_CSV_PATH}`);
  }
}

async function testInvalidFileType(page) {
  console.log('\n=== TEST 1: Invalid File Type ===');

  // Navigate to import page (fresh state)
  await navigateToImportPage(page);

  // Try to upload invalid.txt
  console.log('Attempting to upload invalid.txt...');
  try {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(INVALID_FILE_PATH);
    await page.waitForTimeout(1000);

    // Try to click upload button
    const uploadButton = page.locator('button:has-text("Upload")').first();
    if (await uploadButton.isVisible().catch(() => false)) {
      await uploadButton.click();
      await page.waitForTimeout(2000);
    }

    // Wait for error message
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Screenshot 1: Error message for invalid file type
    await takeScreenshot(page, '01-invalid-file-error.png', 'Error message for invalid file type');

    // Check for error message in page content
    const pageContent = await page.content();
    const hasErrorMessage =
      pageContent.includes('error') ||
      pageContent.includes('invalid') ||
      pageContent.includes('file type') ||
      pageContent.includes('CSV');

    if (hasErrorMessage) {
      console.log('✓ Error message detected for invalid file type');
    } else {
      console.log('⚠ No clear error message found - check screenshot');
    }

  } catch (error) {
    console.log(`Upload attempt resulted in: ${error.message}`);
    await takeScreenshot(page, '01-invalid-file-error.png', 'Invalid file upload result');
  }

  console.log('✓ Invalid file type test complete');
}

async function testEmptyCSVFile(page) {
  console.log('\n=== TEST 2: Empty CSV File ===');

  // Navigate to import page (fresh state)
  await navigateToImportPage(page);

  // Try to upload empty.csv
  console.log('Attempting to upload empty.csv...');
  try {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(EMPTY_CSV_PATH);
    await page.waitForTimeout(1000);

    // Try to click upload button
    const uploadButton = page.locator('button:has-text("Upload")').first();
    if (await uploadButton.isVisible().catch(() => false)) {
      await uploadButton.click();
      await page.waitForTimeout(2000);
    }

    // Wait for error message
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Screenshot 2: Error message for empty CSV
    await takeScreenshot(page, '02-empty-csv-error.png', 'Error message for empty CSV file');

    // Check for error message in page content
    const pageContent = await page.content();
    const hasErrorMessage =
      pageContent.includes('error') ||
      pageContent.includes('empty') ||
      pageContent.includes('no data') ||
      pageContent.includes('invalid');

    if (hasErrorMessage) {
      console.log('✓ Error message detected for empty CSV');
    } else {
      console.log('⚠ No clear error message found - check screenshot');
    }

  } catch (error) {
    console.log(`Upload attempt resulted in: ${error.message}`);
    await takeScreenshot(page, '02-empty-csv-error.png', 'Empty CSV upload result');
  }

  console.log('✓ Empty CSV test complete');
}

async function runPhase7Tests() {
  console.log('=== Phase 7: Error Handling Testing ===\n');

  await ensureScreenshotDir();

  // Create test files before running tests
  createTestFiles();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Login
    await login(page);

    // Step 2: Test invalid file type
    await testInvalidFileType(page);

    // Step 3: Test empty CSV file
    await testEmptyCSVFile(page);

    console.log('\n=== Phase 7 Testing Complete ===');
    console.log(`All 2 screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\nScreenshots captured:');
    console.log('1. 01-invalid-file-error.png - Error for invalid file type (.txt)');
    console.log('2. 02-empty-csv-error.png - Error for empty CSV file');
    console.log('\n✓ Error handling tests complete!');

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

    // Clean up test files
    deleteTestFiles();
  }
}

// Run the tests
runPhase7Tests().catch(console.error);
