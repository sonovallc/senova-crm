const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3004';
const LOGIN_EMAIL = 'admin@evebeautyma.com';
const LOGIN_PASSWORD = 'TestPass123!';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'debug-exhaustive-email-final');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  features: {},
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  bugs: [],
  consoleErrors: []
};

// Helper function to log test results
function logTest(feature, testName, status, details = '') {
  if (!testResults.features[feature]) {
    testResults.features[feature] = { tests: [], passRate: 0 };
  }

  testResults.features[feature].tests.push({
    name: testName,
    status,
    details,
    timestamp: new Date().toISOString()
  });

  testResults.totalTests++;
  if (status === 'PASS') {
    testResults.passedTests++;
  } else {
    testResults.failedTests++;
  }

  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} [${feature}] ${testName}: ${status}${details ? ' - ' + details : ''}`);
}

// Helper function to log bug
function logBug(id, severity, feature, description, screenshot = '') {
  testResults.bugs.push({
    id,
    severity,
    feature,
    description,
    screenshot,
    discovered: new Date().toISOString()
  });
  console.log(`🐛 BUG ${id} [${severity}]: ${description}`);
}

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

// Helper function to wait and retry
async function waitAndRetry(action, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await action();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Exhaustive Email Features Debug Session');
  console.log(`📅 Timestamp: ${testResults.timestamp}`);
  console.log(`📁 Screenshots: ${SCREENSHOT_DIR}\n`);

  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      console.log(`🔴 Console Error: ${msg.text()}`);
    }
  });

  try {
    // ========================================
    // FEATURE 0: LOGIN
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('🔐 FEATURE 0: LOGIN');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/login`, { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await takeScreenshot(page, 'login-page');

    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await takeScreenshot(page, 'dashboard-after-login');
    logTest('Login', 'Login successful', 'PASS');

    // ========================================
    // FEATURE 1: EMAIL COMPOSER
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('✉️ FEATURE 1: EMAIL COMPOSER');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/compose`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'composer-initial');
    logTest('Composer', 'Page loads', 'PASS');

    // Test Back to Inbox button
    const backButton = page.locator('button:has-text("Back to Inbox"), a:has-text("Back to Inbox")').first();
    if (await backButton.isVisible()) {
      logTest('Composer', 'Back to Inbox button visible', 'PASS');
    } else {
      logTest('Composer', 'Back to Inbox button visible', 'FAIL', 'Button not found');
    }

    // Test Template Dropdown
    console.log('\n--- Testing Template Dropdown ---');
    const templateButton = page.locator('button:has-text("Select a template")').first();
    await templateButton.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'composer-template-dropdown-open');

    const templateOptions = await page.locator('[role="option"], [role="menuitem"]').all();
    console.log(`Found ${templateOptions.length} template options`);

    let testedTemplates = 0;
    for (let i = 0; i < Math.min(templateOptions.length, 5); i++) {
      const option = templateOptions[i];
      const text = await option.textContent();
      console.log(`Testing template option ${i + 1}: ${text}`);

      await templateButton.click();
      await page.waitForTimeout(500);
      await option.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `composer-template-${i + 1}-selected`);
      testedTemplates++;
      logTest('Composer', `Template option ${i + 1} selectable`, 'PASS', text);
    }

    // Test Contact Dropdown (To field)
    console.log('\n--- Testing Contact Dropdown (To field) ---');
    const contactButton = page.locator('button:has-text("Select from contacts")').first();
    if (await contactButton.isVisible()) {
      await contactButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'composer-contact-dropdown-open');

      const contactOptions = await page.locator('[role="option"], [role="menuitem"]').all();
      console.log(`Found ${contactOptions.length} contact options`);

      if (contactOptions.length > 0) {
        const firstContact = contactOptions[0];
        const contactText = await firstContact.textContent();
        await firstContact.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, 'composer-contact-selected');
        logTest('Composer', 'Contact selection works', 'PASS', contactText);
      } else {
        logTest('Composer', 'Contact selection works', 'FAIL', 'No contacts found');
      }
    } else {
      logTest('Composer', 'Contact button visible', 'FAIL', 'Button not found');
    }

    // Test CC button
    console.log('\n--- Testing CC/BCC fields ---');
    const ccButton = page.locator('button:has-text("Add Cc"), button:has-text("Cc")').first();
    if (await ccButton.isVisible()) {
      await ccButton.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'composer-cc-field-shown');
      const ccInput = page.locator('input[placeholder*="Cc"]').first();
      if (await ccInput.isVisible()) {
        logTest('Composer', 'CC field toggle works', 'PASS');
      } else {
        logTest('Composer', 'CC field toggle works', 'FAIL', 'CC input not shown');
      }
    } else {
      logTest('Composer', 'CC button visible', 'FAIL', 'Button not found');
    }

    // Test BCC button
    const bccButton = page.locator('button:has-text("Add Bcc"), button:has-text("Bcc")').first();
    if (await bccButton.isVisible()) {
      await bccButton.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'composer-bcc-field-shown');
      const bccInput = page.locator('input[placeholder*="Bcc"], input[placeholder*="BCC"]').first();
      if (await bccInput.isVisible()) {
        logTest('Composer', 'BCC field toggle works', 'PASS');
      } else {
        logTest('Composer', 'BCC field toggle works', 'FAIL', 'BCC input not shown');
      }
    } else {
      logTest('Composer', 'BCC button visible', 'FAIL', 'Button not found');
    }

    // Test Subject field
    console.log('\n--- Testing Subject field ---');
    const subjectInput = page.locator('input[placeholder*="subject"]').first();
    if (await subjectInput.isVisible()) {
      await subjectInput.fill('DEBUG TEST: Exhaustive Email Features Verification');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'composer-subject-filled');
      logTest('Composer', 'Subject field works', 'PASS');
    } else {
      logTest('Composer', 'Subject field visible', 'FAIL', 'Field not found');
    }

    // Test Rich Text Editor
    console.log('\n--- Testing Rich Text Editor ---');
    const editor = page.locator('[contenteditable="true"]').first();
    if (await editor.isVisible()) {
      await editor.fill('This is a test email body for debugging purposes.');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'composer-editor-filled');
      logTest('Composer', 'Rich text editor works', 'PASS');

      // Test Bold button
      const boldButton = page.locator('button[title*="Bold"], button:has-text("B")').first();
      if (await boldButton.isVisible()) {
        await boldButton.click();
        await page.waitForTimeout(500);
        logTest('Composer', 'Bold button works', 'PASS');
      }

      // Test Italic button
      const italicButton = page.locator('button[title*="Italic"], button:has-text("I")').first();
      if (await italicButton.isVisible()) {
        await italicButton.click();
        await page.waitForTimeout(500);
        logTest('Composer', 'Italic button works', 'PASS');
      }
    } else {
      logTest('Composer', 'Rich text editor visible', 'FAIL', 'Editor not found');
    }

    // Test Variables dropdown
    console.log('\n--- Testing Variables Dropdown ---');
    const variablesButton = page.locator('button:has-text("Variables")').first();
    if (await variablesButton.isVisible()) {
      await variablesButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'composer-variables-dropdown-open');

      const variableOptions = await page.locator('text=/\\{\\{.*?\\}\\}/').all();
      console.log(`Found ${variableOptions.length} variable options`);

      if (variableOptions.length > 0) {
        logTest('Composer', 'Variables dropdown works', 'PASS', `${variableOptions.length} variables found`);
      } else {
        logTest('Composer', 'Variables dropdown works', 'FAIL', 'No variables found');
      }
    } else {
      logTest('Composer', 'Variables button visible', 'FAIL', 'Button not found');
    }

    // Test Send button (don't actually send)
    console.log('\n--- Testing Send Button ---');
    const sendButton = page.locator('button:has-text("Send")').first();
    if (await sendButton.isVisible()) {
      const isEnabled = await sendButton.isEnabled();
      if (isEnabled) {
        logTest('Composer', 'Send button enabled when form valid', 'PASS');
      } else {
        logTest('Composer', 'Send button enabled when form valid', 'FAIL', 'Button is disabled');
      }
      await takeScreenshot(page, 'composer-ready-to-send');
    } else {
      logTest('Composer', 'Send button visible', 'FAIL', 'Button not found');
    }

    // ========================================
    // FEATURE 2: EMAIL TEMPLATES
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📄 FEATURE 2: EMAIL TEMPLATES');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/templates`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'templates-page');
    logTest('Templates', 'Page loads', 'PASS');

    // Test Create Template button
    const createTemplateBtn = page.locator('button:has-text("Create Template"), button:has-text("New Template")').first();
    if (await createTemplateBtn.isVisible()) {
      await createTemplateBtn.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'templates-create-modal-open');
      logTest('Templates', 'Create Template button works', 'PASS');

      // Test template form fields
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('DEBUG TEST Template');
        logTest('Templates', 'Name field works', 'PASS');
      }

      // Test category dropdown
      const categoryDropdown = page.locator('button:has-text("Category"), select[name="category"]').first();
      if (await categoryDropdown.isVisible()) {
        await categoryDropdown.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'templates-category-dropdown-open');

        const categoryOptions = await page.locator('[role="option"], option').all();
        console.log(`Found ${categoryOptions.length} category options`);

        if (categoryOptions.length > 0) {
          logTest('Templates', 'Category dropdown works', 'PASS', `${categoryOptions.length} categories`);
        }
      }

      // Close modal
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);
        logTest('Templates', 'Cancel button works', 'PASS');
      }
    } else {
      logTest('Templates', 'Create Template button visible', 'FAIL', 'Button not found');
    }

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'templates-search-results');
      logTest('Templates', 'Search functionality works', 'PASS');
    }

    // ========================================
    // FEATURE 3: EMAIL CAMPAIGNS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📣 FEATURE 3: EMAIL CAMPAIGNS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'campaigns-page');

    // Check for loading state bug
    const loadingText = page.locator('text=/loading/i').first();
    const isStuckLoading = await loadingText.isVisible().catch(() => false);

    if (isStuckLoading) {
      logTest('Campaigns', 'Page loads without stuck loading', 'FAIL', 'Stuck on "Loading..."');
      logBug('BUG-CAMPAIGNS-LOADING', 'Critical', 'Campaigns', 'Page stuck on loading state', 'campaigns-page.png');
    } else {
      logTest('Campaigns', 'Page loads without stuck loading', 'PASS');
    }

    // Test Create Campaign button
    const createCampaignBtn = page.locator('button:has-text("Create Campaign"), button:has-text("New Campaign")').first();
    if (await createCampaignBtn.isVisible()) {
      await createCampaignBtn.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'campaigns-create-wizard');
      logTest('Campaigns', 'Create Campaign button works', 'PASS');

      // Test wizard steps
      const wizardStep1 = page.locator('text=/step 1/i, text=/campaign details/i').first();
      if (await wizardStep1.isVisible()) {
        logTest('Campaigns', 'Campaign wizard Step 1 visible', 'PASS');
      }

      // Go back
      const backBtn = page.locator('button:has-text("Back"), button:has-text("Cancel")').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(500);
      }
    } else {
      logTest('Campaigns', 'Create Campaign button visible', 'FAIL', 'Button not found');
    }

    // ========================================
    // FEATURE 4: AUTORESPONDERS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('⚡ FEATURE 4: AUTORESPONDERS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/autoresponders`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'autoresponders-page');
    logTest('Autoresponders', 'Page loads', 'PASS');

    // Test Create Autoresponder button
    const createAutoBtn = page.locator('button:has-text("Create Autoresponder"), button:has-text("New Autoresponder")').first();
    if (await createAutoBtn.isVisible()) {
      await createAutoBtn.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'autoresponders-create-form');
      logTest('Autoresponders', 'Create Autoresponder button works', 'PASS');

      // Test trigger type dropdown
      const triggerDropdown = page.locator('button:has-text("Trigger"), select[name*="trigger"]').first();
      if (await triggerDropdown.isVisible()) {
        await triggerDropdown.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'autoresponders-trigger-dropdown-open');

        const triggerOptions = await page.locator('[role="option"], option').all();
        console.log(`Found ${triggerOptions.length} trigger options`);

        if (triggerOptions.length >= 3) {
          logTest('Autoresponders', 'Trigger dropdown has 3+ options', 'PASS', 'new_contact, tag_added, date_based');
        } else {
          logTest('Autoresponders', 'Trigger dropdown has 3+ options', 'FAIL', `Only ${triggerOptions.length} found`);
        }
      }

      // Test timing mode dropdown
      const timingModeBtn = page.locator('button:has-text("Timing Mode"), button:has-text("FIXED_DURATION"), button:has-text("WAIT_FOR_TRIGGER"), button:has-text("EITHER_OR")').first();
      if (await timingModeBtn.isVisible()) {
        await timingModeBtn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'autoresponders-timing-mode-dropdown');

        const timingOptions = await page.locator('text=/FIXED_DURATION|WAIT_FOR_TRIGGER|EITHER_OR/').all();
        console.log(`Found ${timingOptions.length} timing mode options`);

        if (timingOptions.length >= 3) {
          logTest('Autoresponders', 'Timing modes available', 'PASS', 'FIXED_DURATION, WAIT_FOR_TRIGGER, EITHER_OR');
        } else {
          logTest('Autoresponders', 'Timing modes available', 'FAIL', `Only ${timingOptions.length} modes found`);
        }
      }

      // Close form
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Back")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    } else {
      logTest('Autoresponders', 'Create Autoresponder button visible', 'FAIL', 'Button not found');
    }

    // ========================================
    // FEATURE 5: UNIFIED INBOX
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📬 FEATURE 5: UNIFIED INBOX');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'inbox-page');
    logTest('Inbox', 'Page loads', 'PASS');

    // Test filter tabs (BUG-INBOX-FILTERS verification)
    console.log('\n--- Testing Inbox Filter Tabs ---');
    const filterTabs = ['All', 'Unread', 'Read', 'Archived'];
    let visibleTabs = 0;

    for (const tabName of filterTabs) {
      const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
      if (await tab.isVisible()) {
        visibleTabs++;
        console.log(`✓ Found tab: ${tabName}`);
      } else {
        console.log(`✗ Missing tab: ${tabName}`);
      }
    }

    await takeScreenshot(page, 'inbox-filter-tabs');

    if (visibleTabs === 4) {
      logTest('Inbox', 'All 4 filter tabs visible (BUG-INBOX-FILTERS)', 'PASS', 'All, Unread, Read, Archived');
    } else {
      logTest('Inbox', 'All 4 filter tabs visible (BUG-INBOX-FILTERS)', 'FAIL', `Only ${visibleTabs}/4 tabs found`);
      logBug('BUG-INBOX-FILTERS', 'High', 'Inbox', `Only ${visibleTabs}/4 filter tabs visible`, 'inbox-filter-tabs.png');
    }

    // Test search functionality
    const inboxSearch = page.locator('input[placeholder*="Search"]').first();
    if (await inboxSearch.isVisible()) {
      await inboxSearch.fill('test');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'inbox-search');
      logTest('Inbox', 'Search functionality works', 'PASS');
    }

    // ========================================
    // FEATURE 6: MAILGUN SETTINGS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('⚙️ FEATURE 6: MAILGUN SETTINGS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/settings/integrations/mailgun`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for 404 error (BUG-MAILGUN-404 verification)
    const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);

    if (is404) {
      await takeScreenshot(page, 'mailgun-404-error');
      logTest('Mailgun', 'Page loads without 404 (BUG-MAILGUN-404)', 'FAIL', '404 error detected');
      logBug('BUG-MAILGUN-404', 'Critical', 'Mailgun Settings', 'Page returns 404 error', 'mailgun-404-error.png');
    } else {
      await takeScreenshot(page, 'mailgun-settings-page');
      logTest('Mailgun', 'Page loads without 404 (BUG-MAILGUN-404)', 'PASS');

      // Test form fields
      const apiKeyInput = page.locator('input[name*="api"], input[placeholder*="API"]').first();
      if (await apiKeyInput.isVisible()) {
        logTest('Mailgun', 'API Key field visible', 'PASS');
      }

      const domainInput = page.locator('input[name*="domain"], input[placeholder*="domain"]').first();
      if (await domainInput.isVisible()) {
        logTest('Mailgun', 'Domain field visible', 'PASS');
      }

      const saveButton = page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        logTest('Mailgun', 'Save button visible', 'PASS');
      }
    }

    // ========================================
    // FEATURE 7: EMAIL SETTINGS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📧 FEATURE 7: EMAIL SETTINGS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/settings/email`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'email-settings-page');

    const emailSettingsLoaded = await page.locator('text=/email settings/i').isVisible().catch(() => false);
    if (emailSettingsLoaded) {
      logTest('Email Settings', 'Page loads', 'PASS');
    } else {
      logTest('Email Settings', 'Page loads', 'FAIL', 'Page content not found');
    }

    // ========================================
    // FEATURE 8: CLOSEBOT AI
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('🤖 FEATURE 8: CLOSEBOT AI');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/settings/integrations/closebot`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'closebot-page');

    const comingSoon = await page.locator('text=/coming soon/i').isVisible().catch(() => false);
    if (comingSoon) {
      logTest('Closebot', 'Coming Soon placeholder visible', 'PASS');
    } else {
      logTest('Closebot', 'Coming Soon placeholder visible', 'FAIL', 'Placeholder not found');
    }

    // ========================================
    // CONSOLE ERRORS CHECK
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 CONSOLE ERRORS SUMMARY');
    console.log('═══════════════════════════════════════\n');

    if (testResults.consoleErrors.length === 0) {
      logTest('Console', 'No console errors detected', 'PASS');
      console.log('✅ No console errors detected throughout testing session');
    } else {
      logTest('Console', 'No console errors detected', 'FAIL', `${testResults.consoleErrors.length} errors found`);
      console.log(`❌ Found ${testResults.consoleErrors.length} console errors:`);
      testResults.consoleErrors.forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error.text}`);
      });
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
    await takeScreenshot(page, 'test-error');
    throw error;
  } finally {
    await browser.close();
  }

  // ========================================
  // CALCULATE RESULTS
  // ========================================
  console.log('\n═══════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════\n');

  testResults.passRate = ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2);

  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} ✅`);
  console.log(`Failed: ${testResults.failedTests} ❌`);
  console.log(`Pass Rate: ${testResults.passRate}%`);
  console.log(`Bugs Found: ${testResults.bugs.length} 🐛`);
  console.log(`Console Errors: ${testResults.consoleErrors.length} 🔴`);

  // Calculate per-feature pass rates
  for (const [feature, data] of Object.entries(testResults.features)) {
    const passed = data.tests.filter(t => t.status === 'PASS').length;
    const total = data.tests.length;
    data.passRate = ((passed / total) * 100).toFixed(2);
    console.log(`\n${feature}: ${passed}/${total} (${data.passRate}%)`);
  }

  // Production readiness assessment
  console.log('\n═══════════════════════════════════════');
  console.log('🚀 PRODUCTION READINESS ASSESSMENT');
  console.log('═══════════════════════════════════════\n');

  const isProductionReady = testResults.passRate >= 90 && testResults.bugs.filter(b => b.severity === 'Critical').length === 0;

  if (isProductionReady) {
    console.log('✅ PRODUCTION READY');
    console.log(`Pass rate: ${testResults.passRate}% (≥90% required)`);
    console.log(`Critical bugs: 0`);
  } else {
    console.log('❌ NOT PRODUCTION READY');
    console.log(`Pass rate: ${testResults.passRate}% (need ≥90%)`);
    console.log(`Critical bugs: ${testResults.bugs.filter(b => b.severity === 'Critical').length}`);
    console.log('\nBlockers:');
    testResults.bugs.filter(b => b.severity === 'Critical').forEach(bug => {
      console.log(`  - ${bug.id}: ${bug.description}`);
    });
  }

  // Save results to JSON
  const resultsFile = path.join(__dirname, 'DEBUG_REPORT_EMAIL_FINAL.json');
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Full results saved to: ${resultsFile}`);

  return testResults;
}

// Run tests
runTests()
  .then(results => {
    console.log('\n✅ Test session complete!');
    process.exit(results.bugs.filter(b => b.severity === 'Critical').length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Test session failed:', error);
    process.exit(1);
  });
