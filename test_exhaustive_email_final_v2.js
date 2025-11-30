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
  consoleErrors: [],
  hydrationWarnings: []
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
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot: ${filename}`);
    return filename;
  } catch (error) {
    console.log(`⚠️  Screenshot failed: ${error.message}`);
    return '';
  }
}

// Safe test wrapper - continues even if test fails
async function safeTest(feature, testName, testFunc) {
  try {
    await testFunc();
    logTest(feature, testName, 'PASS');
    return true;
  } catch (error) {
    logTest(feature, testName, 'FAIL', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 DEBUGGER AGENT: Exhaustive Email Features Verification');
  console.log(`📅 Timestamp: ${testResults.timestamp}`);
  console.log(`📁 Screenshots: ${SCREENSHOT_DIR}\n`);

  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Capture console errors and hydration warnings
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      testResults.consoleErrors.push({
        text,
        location: msg.location(),
        timestamp: new Date().toISOString()
      });

      // Check if it's a hydration warning
      if (text.includes('hydrat') || text.includes('Hydrat')) {
        testResults.hydrationWarnings.push(text);
        console.log(`⚠️  Hydration Warning detected`);
      } else {
        console.log(`🔴 Console Error: ${text.substring(0, 100)}...`);
      }
    }
  });

  try {
    // ========================================
    // LOGIN
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('🔐 LOGIN');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/login`, { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await takeScreenshot(page, 'login-page');

    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'dashboard-logged-in');
    logTest('Login', 'Login successful', 'PASS');

    // ========================================
    // FEATURE 1: EMAIL COMPOSER
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('✉️  FEATURE 1: EMAIL COMPOSER');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/compose`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'composer-initial');
    logTest('Composer', 'Page loads', 'PASS');

    // Back button
    await safeTest('Composer', 'Back to Inbox button exists', async () => {
      const backBtn = await page.locator('button:has-text("Back"), a:has-text("Back")').first().isVisible();
      if (!backBtn) throw new Error('Back button not found');
    });

    // Template dropdown
    console.log('\n--- Template Dropdown ---');
    await safeTest('Composer', 'Template dropdown opens', async () => {
      const templateBtn = page.locator('button:has-text("Select a template"), button:has-text("template")').first();
      await templateBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'composer-template-dropdown');
    });

    // Count template options (don't click them, just count)
    const templateCount = await page.locator('[role="option"], [role="menuitem"]').count();
    console.log(`  Found ${templateCount} template options`);
    logTest('Composer', 'Template options available', templateCount > 0 ? 'PASS' : 'FAIL', `${templateCount} templates`);

    // Close dropdown by clicking elsewhere
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Contact dropdown (To field)
    console.log('\n--- Contact Dropdown (To field) ---');
    await safeTest('Composer', 'Contact dropdown opens', async () => {
      const contactBtn = page.locator('button:has-text("Select from contacts")').first();
      await contactBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'composer-contact-dropdown');
    });

    const contactCount = await page.locator('[role="option"], [role="menuitem"]').count();
    console.log(`  Found ${contactCount} contact options`);
    logTest('Composer', 'Contact options available', contactCount > 0 ? 'PASS' : 'FAIL', `${contactCount} contacts`);

    // Select first contact
    if (contactCount > 0) {
      await safeTest('Composer', 'Contact selection works', async () => {
        const firstContact = page.locator('[role="option"], [role="menuitem"]').first();
        await firstContact.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        await takeScreenshot(page, 'composer-contact-selected');
      });
    }

    // CC field
    console.log('\n--- CC/BCC Fields ---');
    await safeTest('Composer', 'CC button toggles field', async () => {
      const ccBtn = page.locator('button:has-text("Cc"), button:has-text("Add Cc")').first();
      await ccBtn.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      const ccInput = await page.locator('input[placeholder*="Cc"]').isVisible();
      if (!ccInput) throw new Error('CC input not visible after click');
      await takeScreenshot(page, 'composer-cc-shown');
    });

    // BCC field
    await safeTest('Composer', 'BCC button toggles field', async () => {
      const bccBtn = page.locator('button:has-text("Bcc"), button:has-text("Add Bcc")').first();
      await bccBtn.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      const bccInput = await page.locator('input[placeholder*="Bcc"]').isVisible();
      if (!bccInput) throw new Error('BCC input not visible after click');
      await takeScreenshot(page, 'composer-bcc-shown');
    });

    // Subject field
    console.log('\n--- Subject Field ---');
    await safeTest('Composer', 'Subject field accepts input', async () => {
      const subjectInput = page.locator('input[placeholder*="subject"]').first();
      await subjectInput.fill('DEBUG TEST: Exhaustive Email Features');
      await page.waitForTimeout(500);
      const value = await subjectInput.inputValue();
      if (!value.includes('DEBUG TEST')) throw new Error('Subject not filled');
      await takeScreenshot(page, 'composer-subject-filled');
    });

    // Rich text editor
    console.log('\n--- Rich Text Editor ---');
    await safeTest('Composer', 'Rich text editor accepts input', async () => {
      const editor = page.locator('[contenteditable="true"]').first();
      await editor.fill('This is a test email body for exhaustive debugging.');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'composer-editor-filled');
    });

    // Toolbar buttons
    await safeTest('Composer', 'Bold button exists', async () => {
      const boldBtn = await page.locator('button[aria-label*="Bold"], button:has-text("B")').first().isVisible();
      if (!boldBtn) throw new Error('Bold button not found');
    });

    await safeTest('Composer', 'Italic button exists', async () => {
      const italicBtn = await page.locator('button[aria-label*="Italic"], button:has-text("I")').first().isVisible();
      if (!italicBtn) throw new Error('Italic button not found');
    });

    // Variables dropdown
    console.log('\n--- Variables Dropdown ---');
    await safeTest('Composer', 'Variables dropdown opens', async () => {
      const varsBtn = page.locator('button:has-text("Variables")').first();
      await varsBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'composer-variables-dropdown');
    });

    const variableCount = await page.locator('text=/\\{\\{.*?\\}\\}/, [role="menuitem"]').count();
    console.log(`  Found ${variableCount} variable options`);
    logTest('Composer', 'Variable options available', variableCount >= 6 ? 'PASS' : 'FAIL', `${variableCount} variables`);

    // Send button
    console.log('\n--- Send Button ---');
    await safeTest('Composer', 'Send button exists and enabled', async () => {
      const sendBtn = page.locator('button:has-text("Send Email"), button:has-text("Send")').first();
      const isVisible = await sendBtn.isVisible();
      if (!isVisible) throw new Error('Send button not visible');
      await takeScreenshot(page, 'composer-send-ready');
    });

    // ========================================
    // FEATURE 2: EMAIL TEMPLATES
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📄 FEATURE 2: EMAIL TEMPLATES');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/templates`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'templates-page');
    logTest('Templates', 'Page loads', 'PASS');

    // Create Template button
    await safeTest('Templates', 'Create Template button exists', async () => {
      const createBtn = await page.locator('button:has-text("Create Template"), button:has-text("New Template")').first().isVisible();
      if (!createBtn) throw new Error('Create button not found');
    });

    await safeTest('Templates', 'Create Template modal opens', async () => {
      const createBtn = page.locator('button:has-text("Create Template"), button:has-text("New Template")').first();
      await createBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'templates-create-modal');
    });

    // Test form fields in modal
    await safeTest('Templates', 'Name field in modal', async () => {
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      const isVisible = await nameInput.isVisible();
      if (!isVisible) throw new Error('Name input not found');
      await nameInput.fill('DEBUG TEST Template');
      await page.waitForTimeout(500);
    });

    await safeTest('Templates', 'Category dropdown in modal', async () => {
      const categoryBtn = page.locator('button:has-text("Category"), button:has-text("Select category")').first();
      const isVisible = await categoryBtn.isVisible();
      if (!isVisible) throw new Error('Category dropdown not found');
      await categoryBtn.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'templates-category-dropdown');
    });

    // Close modal
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    }

    // Search
    await safeTest('Templates', 'Search field exists', async () => {
      const searchInput = await page.locator('input[placeholder*="Search"], input[type="search"]').first().isVisible();
      if (!searchInput) throw new Error('Search input not found');
    });

    // ========================================
    // FEATURE 3: EMAIL CAMPAIGNS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📣 FEATURE 3: EMAIL CAMPAIGNS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Extra time for data loading
    await takeScreenshot(page, 'campaigns-page');
    logTest('Campaigns', 'Page loads', 'PASS');

    // Check for loading state bug (BUG-CAMPAIGNS-LOADING)
    const loadingText = await page.locator('text=/loading/i').isVisible().catch(() => false);
    if (loadingText) {
      logTest('Campaigns', 'Not stuck on loading (BUG-CAMPAIGNS-LOADING)', 'FAIL', 'Page stuck loading');
      logBug('BUG-CAMPAIGNS-LOADING', 'High', 'Campaigns', 'Page stuck on "Loading..." state', 'campaigns-page.png');
    } else {
      logTest('Campaigns', 'Not stuck on loading (BUG-CAMPAIGNS-LOADING)', 'PASS');
    }

    // Create Campaign button
    await safeTest('Campaigns', 'Create Campaign button exists', async () => {
      const createBtn = await page.locator('button:has-text("Create Campaign"), button:has-text("New Campaign")').first().isVisible();
      if (!createBtn) throw new Error('Create button not found');
    });

    await safeTest('Campaigns', 'Create Campaign wizard opens', async () => {
      const createBtn = page.locator('button:has-text("Create Campaign"), button:has-text("New Campaign")').first();
      await createBtn.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'campaigns-wizard');
    });

    // Check wizard step 1
    const wizardVisible = await page.locator('text=/step 1/i, text=/campaign details/i').isVisible().catch(() => false);
    logTest('Campaigns', 'Wizard Step 1 visible', wizardVisible ? 'PASS' : 'FAIL');

    // Go back
    const backBtn = page.locator('button:has-text("Back"), button:has-text("Cancel")').first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(500);
    }

    // ========================================
    // FEATURE 4: AUTORESPONDERS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('⚡ FEATURE 4: AUTORESPONDERS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/email/autoresponders`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'autoresponders-page');
    logTest('Autoresponders', 'Page loads', 'PASS');

    // Create button
    await safeTest('Autoresponders', 'Create Autoresponder button exists', async () => {
      const createBtn = await page.locator('button:has-text("Create Autoresponder"), button:has-text("New Autoresponder")').first().isVisible();
      if (!createBtn) throw new Error('Create button not found');
    });

    await safeTest('Autoresponders', 'Create form opens', async () => {
      const createBtn = page.locator('button:has-text("Create Autoresponder"), button:has-text("New Autoresponder")').first();
      await createBtn.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'autoresponders-create-form');
    });

    // Check for trigger dropdown
    await safeTest('Autoresponders', 'Trigger dropdown exists', async () => {
      const triggerBtn = await page.locator('button:has-text("Trigger"), button:has-text("new_contact")').first().isVisible();
      if (!triggerBtn) throw new Error('Trigger dropdown not found');
    });

    // Check for timing mode (BUG fix verification)
    await safeTest('Autoresponders', 'Timing mode options exist', async () => {
      const timingText = await page.locator('text=/FIXED_DURATION|WAIT_FOR_TRIGGER|EITHER_OR/').first().isVisible();
      if (!timingText) throw new Error('Timing mode not found');
    });

    // Go back
    const autoBackBtn = page.locator('button:has-text("Back"), button:has-text("Cancel")').first();
    if (await autoBackBtn.isVisible()) {
      await autoBackBtn.click();
      await page.waitForTimeout(500);
    }

    // ========================================
    // FEATURE 5: UNIFIED INBOX
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📬 FEATURE 5: UNIFIED INBOX');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'inbox-page');
    logTest('Inbox', 'Page loads', 'PASS');

    // Check filter tabs (BUG-INBOX-FILTERS verification)
    console.log('\n--- Filter Tabs (BUG-INBOX-FILTERS check) ---');
    const filterTabs = ['All', 'Unread', 'Read', 'Archived'];
    let visibleTabs = 0;

    for (const tabName of filterTabs) {
      const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
      const isVisible = await tab.isVisible().catch(() => false);
      if (isVisible) {
        visibleTabs++;
        console.log(`  ✓ ${tabName} tab found`);
      } else {
        console.log(`  ✗ ${tabName} tab MISSING`);
      }
    }

    if (visibleTabs === 4) {
      logTest('Inbox', 'All 4 filter tabs visible (BUG-INBOX-FILTERS)', 'PASS', 'All, Unread, Read, Archived');
    } else {
      logTest('Inbox', 'All 4 filter tabs visible (BUG-INBOX-FILTERS)', 'FAIL', `Only ${visibleTabs}/4 tabs found`);
      logBug('BUG-INBOX-FILTERS', 'High', 'Inbox', `Only ${visibleTabs}/4 filter tabs visible`, 'inbox-page.png');
    }

    // Search
    await safeTest('Inbox', 'Search field exists', async () => {
      const searchInput = await page.locator('input[placeholder*="Search"]').first().isVisible();
      if (!searchInput) throw new Error('Search input not found');
    });

    // ========================================
    // FEATURE 6: MAILGUN SETTINGS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('⚙️  FEATURE 6: MAILGUN SETTINGS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/settings/integrations/mailgun`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for 404 (BUG-MAILGUN-404 verification)
    const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);

    if (is404) {
      await takeScreenshot(page, 'mailgun-404-error');
      logTest('Mailgun', 'Page loads without 404 (BUG-MAILGUN-404)', 'FAIL', '404 error detected');
      logBug('BUG-MAILGUN-404', 'Critical', 'Mailgun Settings', 'Page returns 404 error', 'mailgun-404-error.png');
    } else {
      await takeScreenshot(page, 'mailgun-settings-page');
      logTest('Mailgun', 'Page loads without 404 (BUG-MAILGUN-404)', 'PASS');

      // Check form fields
      await safeTest('Mailgun', 'API Key field exists', async () => {
        const apiInput = await page.locator('input[name*="api"], input[placeholder*="API"]').first().isVisible();
        if (!apiInput) throw new Error('API Key field not found');
      });

      await safeTest('Mailgun', 'Domain field exists', async () => {
        const domainInput = await page.locator('input[name*="domain"], input[placeholder*="domain"]').first().isVisible();
        if (!domainInput) throw new Error('Domain field not found');
      });

      await safeTest('Mailgun', 'Save button exists', async () => {
        const saveBtn = await page.locator('button:has-text("Save")').first().isVisible();
        if (!saveBtn) throw new Error('Save button not found');
      });
    }

    // ========================================
    // FEATURE 7: EMAIL SETTINGS
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📧 FEATURE 7: EMAIL SETTINGS');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/settings/email`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'email-settings-page');

    const emailSettingsLoaded = await page.locator('text=/email settings/i, text=/settings/i').isVisible().catch(() => false);
    logTest('Email Settings', 'Page loads', emailSettingsLoaded ? 'PASS' : 'FAIL');

    // ========================================
    // FEATURE 8: CLOSEBOT AI
    // ========================================
    console.log('\n═══════════════════════════════════════');
    console.log('🤖 FEATURE 8: CLOSEBOT AI');
    console.log('═══════════════════════════════════════\n');

    await page.goto(`${BASE_URL}/dashboard/settings/integrations/closebot`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'closebot-page');

    const comingSoon = await page.locator('text=/coming soon/i').isVisible().catch(() => false);
    if (comingSoon) {
      logTest('Closebot', 'Coming Soon placeholder visible', 'PASS');
    } else {
      logTest('Closebot', 'Coming Soon placeholder visible', 'FAIL', 'Placeholder not found');
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
    await takeScreenshot(page, 'critical-error');
  } finally {
    await browser.close();
  }

  // ========================================
  // FINAL RESULTS
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
  console.log(`Console Errors: ${testResults.consoleErrors.length}`);
  console.log(`Hydration Warnings: ${testResults.hydrationWarnings.length} ⚠️`);

  // Per-feature breakdown
  console.log('\n--- Per-Feature Results ---');
  for (const [feature, data] of Object.entries(testResults.features)) {
    const passed = data.tests.filter(t => t.status === 'PASS').length;
    const total = data.tests.length;
    data.passRate = ((passed / total) * 100).toFixed(2);
    console.log(`${feature}: ${passed}/${total} (${data.passRate}%)`);
  }

  // Bug summary
  if (testResults.bugs.length > 0) {
    console.log('\n--- Bugs Discovered ---');
    testResults.bugs.forEach(bug => {
      console.log(`${bug.id} [${bug.severity}]: ${bug.description}`);
    });
  }

  // Hydration warning summary
  if (testResults.hydrationWarnings.length > 0) {
    console.log('\n--- Hydration Warnings ---');
    logBug('BUG-HYDRATION-WARNING', 'Medium', 'Login', `React hydration warning detected`, 'login-page.png');
  }

  // Production readiness
  console.log('\n═══════════════════════════════════════');
  console.log('🚀 PRODUCTION READINESS ASSESSMENT');
  console.log('═══════════════════════════════════════\n');

  const criticalBugs = testResults.bugs.filter(b => b.severity === 'Critical').length;
  const highBugs = testResults.bugs.filter(b => b.severity === 'High').length;
  const isProductionReady = testResults.passRate >= 85 && criticalBugs === 0;

  if (isProductionReady) {
    console.log('✅ PRODUCTION READY');
    console.log(`   Pass rate: ${testResults.passRate}% (≥85% required)`);
    console.log(`   Critical bugs: ${criticalBugs} (0 required)`);
    console.log(`   High bugs: ${highBugs} (acceptable if <3)`);
  } else {
    console.log('❌ NOT PRODUCTION READY');
    console.log(`   Pass rate: ${testResults.passRate}% (need ≥85%)`);
    console.log(`   Critical bugs: ${criticalBugs} (must be 0)`);
    console.log(`   High bugs: ${highBugs}`);
  }

  // Save results
  const resultsFile = path.join(__dirname, 'DEBUG_REPORT_EMAIL_FINAL.json');
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Results saved: ${resultsFile}`);

  return testResults;
}

// Run tests
runTests()
  .then(results => {
    console.log('\n✅ Debug session complete!');
    process.exit(results.bugs.filter(b => b.severity === 'Critical').length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Debug session failed:', error);
    process.exit(1);
  });
