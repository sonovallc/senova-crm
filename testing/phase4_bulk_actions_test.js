const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Phase 4: Bulk Actions Test
 * Tests all bulk action functionality with proper timeout handling for screenshots
 *
 * This test validates:
 * - Skip All functionality
 * - Keep All functionality
 * - Merge All functionality
 * - Individual override actions
 *
 * Handles 312 duplicate groups with extended timeouts (60s) for screenshot capture
 */

const SCREENSHOTS_DIR = path.join(process.cwd(), 'testing', 'phase4-screenshots');
const BASE_URL = 'http://localhost:3004';
const TEST_CSV_PATH = '/c/Users/jwood/Downloads/1762581652_664d2976-13a7-41fd-9e6c-16c6dc3db8a0.csv';
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
  await page.fill('input[type="email"]', 'testuser@example.com');
  await page.fill('input[type="password"]', 'Test123!');
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

  // Wait for upload button to show "Uploading..."
  console.log('Waiting for upload to start...');
  await page.waitForTimeout(2000);

  // Wait for detection to complete (button changes from "Uploading..." to normal state)
  console.log('Waiting for duplicate detection to complete (up to 120s)...');
  await page.waitForSelector('button:has-text("Upload & Detect"):not(:disabled)', { timeout: 120000 });

  // Extra wait for duplicate groups to render
  console.log('Waiting for duplicate groups to render...');
  await page.waitForTimeout(5000);
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

async function testSkipAll(page) {
  console.log('\n=== TEST 1: Skip All Functionality ===');

  // Screenshot before action
  await takeScreenshot(page, '01-skip-all-before.png', 'Before Skip All');

  // Click Skip All button
  console.log('Clicking Skip All button...');
  const skipAllButton = page.locator('button:has-text("Skip All")');
  await skipAllButton.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Screenshot after action
  await takeScreenshot(page, '02-skip-all-after.png', 'After Skip All');

  // Scroll to verify state across page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '03-skip-all-scrolled.png', 'Skip All - Scrolled View');

  console.log('✓ Skip All test complete');
}

async function testKeepAll(page) {
  console.log('\n=== TEST 2: Keep All Functionality ===');

  // Refresh page to reset state
  console.log('Refreshing page to reset state...');
  await page.reload();

  // Wait for detection to complete after reload
  console.log('Waiting for duplicate detection after reload (up to 120s)...');
  await page.waitForSelector('button:has-text("Skip All")', { timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Screenshot before action
  await takeScreenshot(page, '04-keep-all-before.png', 'Before Keep All');

  // Click Keep All button
  console.log('Clicking Keep All button...');
  const keepAllButton = page.locator('button:has-text("Keep All")');
  await keepAllButton.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Screenshot after action
  await takeScreenshot(page, '05-keep-all-after.png', 'After Keep All');

  // Scroll to verify state across page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '06-keep-all-scrolled.png', 'Keep All - Scrolled View');

  console.log('✓ Keep All test complete');
}

async function testMergeAll(page) {
  console.log('\n=== TEST 3: Merge All Functionality ===');

  // Refresh page to reset state
  console.log('Refreshing page to reset state...');
  await page.reload();

  // Wait for detection to complete after reload
  console.log('Waiting for duplicate detection after reload (up to 120s)...');
  await page.waitForSelector('button:has-text("Skip All")', { timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Screenshot before action
  await takeScreenshot(page, '07-merge-all-before.png', 'Before Merge All');

  // Click Merge All button
  console.log('Clicking Merge All button...');
  const mergeAllButton = page.locator('button:has-text("Merge All")');
  await mergeAllButton.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Screenshot after action
  await takeScreenshot(page, '08-merge-all-after.png', 'After Merge All');

  // Scroll to verify state across page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '09-merge-all-scrolled.png', 'Merge All - Scrolled View');

  console.log('✓ Merge All test complete');
}

async function testIndividualOverride(page) {
  console.log('\n=== TEST 4: Individual Override Functionality ===');

  // Refresh page to reset state
  console.log('Refreshing page to reset state...');
  await page.reload();

  // Wait for detection to complete after reload
  console.log('Waiting for duplicate detection after reload (up to 120s)...');
  await page.waitForSelector('button:has-text("Skip All")', { timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Apply bulk action first (Merge All)
  console.log('Applying Merge All as base state...');
  const mergeAllButton = page.locator('button:has-text("Merge All")');
  await mergeAllButton.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Override first group with Skip
  console.log('Overriding first group with Skip action...');
  const firstSkipButton = page.locator('button:has-text("Skip")').first();
  await firstSkipButton.click();
  await page.waitForTimeout(1000);

  // Scroll to middle and override a group with Keep
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await page.waitForTimeout(1000);
  const middleKeepButton = page.locator('button:has-text("Keep")').nth(5);
  await middleKeepButton.click();
  await page.waitForTimeout(1000);

  // Scroll to top to show overrides
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Screenshot showing individual overrides
  await takeScreenshot(page, '10-individual-override.png', 'Individual Override Actions');

  console.log('✓ Individual override test complete');
}

async function runPhase4Tests() {
  console.log('=== Phase 4: Bulk Actions Testing ===\n');

  await ensureScreenshotDir();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await login(page);
    await uploadCSV(page);

    // Run all bulk action tests
    await testSkipAll(page);
    await testKeepAll(page);
    await testMergeAll(page);
    await testIndividualOverride(page);

    console.log('\n=== Phase 4 Testing Complete ===');
    console.log(`All 10 screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\nScreenshots captured:');
    console.log('1. 01-skip-all-before.png');
    console.log('2. 02-skip-all-after.png');
    console.log('3. 03-skip-all-scrolled.png');
    console.log('4. 04-keep-all-before.png');
    console.log('5. 05-keep-all-after.png');
    console.log('6. 06-keep-all-scrolled.png');
    console.log('7. 07-merge-all-before.png');
    console.log('8. 08-merge-all-after.png');
    console.log('9. 09-merge-all-scrolled.png');
    console.log('10. 10-individual-override.png');

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
runPhase4Tests().catch(console.error);
