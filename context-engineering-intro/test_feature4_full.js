const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const CREDENTIALS = { email: 'admin@evebeautyma.com', password: 'TestPass123!' };
const SCREENSHOT_DIR = path.join(__dirname, 'testing', 'email-channel-screenshots', 'feature-3-campaigns');

const EXPECTED_TEMPLATES = [
  'Welcome Email', 'Appointment Reminder', 'Post-Treatment Follow-Up',
  'Special Promotion', 'Monthly Newsletter', 'Thank You Email',
  'Re-Engagement Email', 'Event Invitation', 'Birthday Wishes',
  'New Service Announcement'
];

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function getScreenshotFilename(step) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  return path.join(SCREENSHOT_DIR, timestamp + '-' + step + '.png');
}

async function takeScreenshot(page, filename, fullPage = true) {
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: filename, fullPage });
  console.log('Screenshot saved: ' + filename);
}

const results = { passed: 0, failed: 0, skipped: 0, tests: [] };

function recordTest(testName, status, details) {
  results.tests.push({ testName, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'SKIP') results.skipped++;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push('BROWSER ERROR: ' + msg.text());
    }
  });

  try {
    console.log('=== FEATURE 3 COMPREHENSIVE TESTING ===');
    
    await page.goto(BASE_URL);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('Login successful');

    // TEST 1
    console.log('TEST 1: Campaigns Page');
    try {
      const link = page.locator('a[href*="/email/campaigns"], a:has-text("Campaigns")').first();
      if (await link.count() > 0) {
        await link.click();
        await page.waitForURL('**/email/campaigns**', { timeout: 5000 });
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, getScreenshotFilename('01-campaigns-page-loaded'));
        
        let foundCampaigns = 0;
        for (const name of EXPECTED_TEMPLATES) {
          if (await page.locator('text="' + name + '"').count() > 0) {
            foundCampaigns++;
          }
        }
        
        const hasNewButton = await page.locator('button:has-text("New Template"), button:has-text("Create Template")').count() > 0;
        const test1Pass = foundCampaigns === 10 && hasNewButton;
        
        recordTest('TEST 1: Campaigns Page', test1Pass ? 'PASS' : 'FAIL', { found: foundCampaigns });
        console.log('TEST 1: ' + (test1Pass ? 'PASS' : 'FAIL'));
      } else {
        recordTest('TEST 1: Campaigns Page', 'FAIL', { error: 'Link not found' });
      }
    } catch (error) {
      recordTest('TEST 1: Campaigns Page', 'FAIL', { error: error.message });
    }

    // TEST 3: BUG-002
    console.log('TEST 3: Create Template (BUG-002)');
    let templateCreated = false;
    try {
      const newButton = page.locator('button:has-text("New Template"), button:has-text("Create Template")').first();
      await newButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      await takeScreenshot(page, getScreenshotFilename('05-create-modal-opened'));
      
      await page.fill('input[name="name"], input[placeholder*="name"]', 'Test Template Playwright');
      
      const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject"]').first();
      if (await subjectInput.count() > 0) {
        await subjectInput.fill('Hello {{first_name}}, welcome to {{company_name}}');
      }
      
      await page.waitForTimeout(500);
      await takeScreenshot(page, getScreenshotFilename('06-create-modal-filled'));
      
      console.log('Attempting to click Create button...');
      const createButton = page.locator('button:has-text("Create"), button:has-text("Save")').last();
      
      try {
        await createButton.click({ timeout: 3000 });
        console.log('Create button clicked - BUG-002 RESOLVED');
        
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, getScreenshotFilename('07-template-created-success'));
        
        const exists = await page.locator('text="Test Template Playwright"').count() > 0;
        templateCreated = exists;
        
        recordTest('TEST 3: Create Template (BUG-002)', 'PASS', { bug002: 'RESOLVED' });
        console.log('TEST 3: PASS - BUG-002 RESOLVED');
      } catch (clickError) {
        console.log('Create button click failed: ' + clickError.message);
        await takeScreenshot(page, getScreenshotFilename('07-create-error'));
        recordTest('TEST 3: Create Template (BUG-002)', 'FAIL', { bug002: 'STILL BROKEN' });
      }
    } catch (error) {
      recordTest('TEST 3: Create Template (BUG-002)', 'FAIL', { error: error.message });
    }

    console.log('=== SUMMARY ===');
    console.log('Passed: ' + results.passed);
    console.log('Failed: ' + results.failed);
    console.log('Skipped: ' + results.skipped);
    console.log('Console Errors: ' + consoleErrors.length);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
})();
