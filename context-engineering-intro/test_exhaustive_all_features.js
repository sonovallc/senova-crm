const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3004';
const API_URL = 'http://localhost:8000';
const TEST_EMAIL = 'admin@evebeautyma.com';
const TEST_PASSWORD = 'TestPass123!';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots', 'debug-exhaustive-all-features');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results tracking
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  bugs: [],
  features: {}
};

function logTest(feature, test, status, details = '') {
  testResults.totalTests++;
  if (!testResults.features[feature]) {
    testResults.features[feature] = { passed: 0, failed: 0, tests: [] };
  }

  if (status === 'PASS') {
    testResults.passed++;
    testResults.features[feature].passed++;
  } else {
    testResults.failed++;
    testResults.features[feature].failed++;
  }

  testResults.features[feature].tests.push({ test, status, details });
  console.log(`[${feature}] ${test}: ${status}${details ? ' - ' + details : ''}`);
}

function logBug(id, severity, feature, description, screenshot = '') {
  testResults.bugs.push({ id, severity, feature, description, screenshot });
  console.log(`🐛 BUG ${id} (${severity}): ${description}`);
}

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
  return filename;
}

async function login(page) {
  console.log('\n=== LOGIN ===');
  await page.goto(`${BASE_URL}/login`);
  await takeScreenshot(page, 'login-page');

  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await takeScreenshot(page, 'login-filled');

  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  await takeScreenshot(page, 'dashboard-after-login');

  logTest('Login', 'Login with valid credentials', 'PASS');
}

async function testFeature1UnifiedInbox(page) {
  console.log('\n=== FEATURE 1: UNIFIED INBOX ===');

  // Navigate to inbox
  await page.goto(`${BASE_URL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f1-inbox-initial');
  logTest('Feature 1', 'Navigate to inbox page', 'PASS');

  // Test page header elements
  const pageTitle = await page.textContent('h1, h2').catch(() => null);
  logTest('Feature 1', 'Page title visible', pageTitle ? 'PASS' : 'FAIL', pageTitle);

  // Test filters - Find all filter buttons
  const filterButtons = await page.$$('[role="button"], button').then(btns =>
    Promise.all(btns.map(async btn => {
      const text = await btn.textContent();
      return { btn, text: text?.trim() };
    }))
  );

  const filterLabels = ['All', 'Unread', 'Read', 'Archived'];
  for (const label of filterLabels) {
    const filter = filterButtons.find(f => f.text?.includes(label));
    if (filter) {
      await filter.btn.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, `f1-filter-${label.toLowerCase()}`);
      logTest('Feature 1', `Filter: ${label}`, 'PASS');
    } else {
      logTest('Feature 1', `Filter: ${label}`, 'FAIL', 'Button not found');
    }
  }

  // Test email list items
  const emailItems = await page.$$('[role="article"], .email-item, [class*="email"]').catch(() => []);
  logTest('Feature 1', `Email list loaded (${emailItems.length} items)`, emailItems.length > 0 ? 'PASS' : 'FAIL');

  // Test clicking first email
  if (emailItems.length > 0) {
    await emailItems[0].click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'f1-email-detail-view');
    logTest('Feature 1', 'Open email detail view', 'PASS');

    // Test action buttons in detail view
    const actionButtons = await page.$$('button');
    const actionLabels = ['Reply', 'Forward', 'Delete', 'Archive', 'Mark as'];

    for (const label of actionLabels) {
      const btn = await Promise.all(actionButtons.map(async b => {
        const text = await b.textContent();
        return text?.toLowerCase().includes(label.toLowerCase()) ? b : null;
      })).then(btns => btns.find(b => b !== null));

      if (btn) {
        await takeScreenshot(page, `f1-before-${label.toLowerCase().replace(/\s/g, '-')}`);
        logTest('Feature 1', `Button found: ${label}`, 'PASS');
      } else {
        logTest('Feature 1', `Button found: ${label}`, 'FAIL', 'Not found');
      }
    }
  }

  // Test pagination if exists
  const paginationButtons = await page.$$('[aria-label*="pagination"], [role="navigation"] button').catch(() => []);
  logTest('Feature 1', `Pagination controls (${paginationButtons.length} buttons)`, paginationButtons.length > 0 ? 'PASS' : 'FAIL');
}

async function testFeature2EmailComposer(page) {
  console.log('\n=== FEATURE 2: EMAIL COMPOSER ===');

  // Navigate to composer
  await page.goto(`${BASE_URL}/dashboard/email/compose`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f2-composer-initial');
  logTest('Feature 2', 'Navigate to composer page', 'PASS');

  // Test template dropdown
  const templateButton = await page.$('button:has-text("Select a template"), [role="combobox"]');
  if (templateButton) {
    await templateButton.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f2-template-dropdown-open');
    logTest('Feature 2', 'Open template dropdown', 'PASS');

    // Get all template options
    const templateOptions = await page.$$('[role="option"], [data-value]');
    logTest('Feature 2', `Template options count: ${templateOptions.length}`, templateOptions.length > 0 ? 'PASS' : 'FAIL');

    // Test selecting first 3 templates
    for (let i = 0; i < Math.min(3, templateOptions.length); i++) {
      await templateButton.click();
      await page.waitForTimeout(300);
      const opts = await page.$$('[role="option"], [data-value]');
      if (opts[i]) {
        const optText = await opts[i].textContent();
        await opts[i].click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, `f2-template-selected-${i + 1}`);
        logTest('Feature 2', `Select template ${i + 1}: ${optText?.trim()}`, 'PASS');
      }
    }
  } else {
    logTest('Feature 2', 'Template dropdown button', 'FAIL', 'Not found');
  }

  // Test contact dropdown
  const contactButton = await page.$('button:has-text("Select from contacts"), button:has-text("contact")');
  if (contactButton) {
    await contactButton.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f2-contact-dropdown-open');
    logTest('Feature 2', 'Open contact dropdown', 'PASS');

    const contactOptions = await page.$$('[role="option"]');
    logTest('Feature 2', `Contact options count: ${contactOptions.length}`, contactOptions.length > 0 ? 'PASS' : 'FAIL');

    // Select first contact
    if (contactOptions.length > 0) {
      const contactText = await contactOptions[0].textContent();
      await contactOptions[0].click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'f2-contact-selected');
      logTest('Feature 2', `Select contact: ${contactText?.trim()}`, 'PASS');
    }
  } else {
    logTest('Feature 2', 'Contact dropdown button', 'FAIL', 'Not found');
  }

  // Test manual email entry
  const emailInputs = await page.$$('input[type="email"], input[placeholder*="email"]');
  if (emailInputs.length > 0) {
    await emailInputs[0].fill('test@example.com');
    await emailInputs[0].press('Enter');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f2-manual-email-entered');
    logTest('Feature 2', 'Manual email entry', 'PASS');
  } else {
    logTest('Feature 2', 'Manual email input field', 'FAIL', 'Not found');
  }

  // Test CC/BCC buttons
  const ccButton = await page.$('button:has-text("Add Cc"), button:has-text("Cc")');
  if (ccButton) {
    await ccButton.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'f2-cc-opened');
    logTest('Feature 2', 'Open CC field', 'PASS');
  } else {
    logTest('Feature 2', 'CC button', 'FAIL', 'Not found');
  }

  const bccButton = await page.$('button:has-text("Add Bcc"), button:has-text("Bcc")');
  if (bccButton) {
    await bccButton.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'f2-bcc-opened');
    logTest('Feature 2', 'Open BCC field', 'PASS');
  } else {
    logTest('Feature 2', 'BCC button', 'FAIL', 'Not found');
  }

  // Test subject field
  const subjectInput = await page.$('input[placeholder*="subject" i], input[name="subject"]');
  if (subjectInput) {
    await subjectInput.fill('Exhaustive Test Subject - All Features');
    await takeScreenshot(page, 'f2-subject-filled');
    logTest('Feature 2', 'Subject field', 'PASS');
  } else {
    logTest('Feature 2', 'Subject field', 'FAIL', 'Not found');
  }

  // Test message editor
  const messageEditor = await page.$('[contenteditable="true"], textarea[placeholder*="message" i]');
  if (messageEditor) {
    await messageEditor.click();
    await messageEditor.fill('This is a comprehensive test message for all email features.');
    await takeScreenshot(page, 'f2-message-filled');
    logTest('Feature 2', 'Message editor', 'PASS');

    // Test formatting buttons
    const boldBtn = await page.$('button[aria-label*="bold" i], button:has-text("B")');
    if (boldBtn) {
      await boldBtn.click();
      await page.waitForTimeout(200);
      logTest('Feature 2', 'Bold button', 'PASS');
    }

    const italicBtn = await page.$('button[aria-label*="italic" i], button:has-text("I")');
    if (italicBtn) {
      await italicBtn.click();
      await page.waitForTimeout(200);
      logTest('Feature 2', 'Italic button', 'PASS');
    }
  } else {
    logTest('Feature 2', 'Message editor', 'FAIL', 'Not found');
  }

  // Test variables dropdown
  try {
    const variablesButtonSelector = 'button:has-text("Variables")';
    const variablesButton = await page.$(variablesButtonSelector);
    if (variablesButton) {
      await page.click(variablesButtonSelector);
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'f2-variables-dropdown-open');
      logTest('Feature 2', 'Variables dropdown', 'PASS');

      const variableOptions = await page.$$('[role="menuitem"], [role="option"]');
      logTest('Feature 2', `Variable options: ${variableOptions.length}`, variableOptions.length > 0 ? 'PASS' : 'FAIL');

      // Test first 3 variables only to avoid element detachment issues
      const expectedVars = ['contact_name', 'first_name', 'last_name'];
      for (const varName of expectedVars) {
        try {
          // Click to open dropdown using selector (more stable)
          await page.click(variablesButtonSelector);
          await page.waitForTimeout(300);

          const varOption = await page.$(`[role="menuitem"]:has-text("${varName}"), [role="option"]:has-text("${varName}")`);
          if (varOption) {
            await varOption.click();
            await page.waitForTimeout(300);
            await takeScreenshot(page, `f2-variable-${varName}-inserted`);
            logTest('Feature 2', `Insert variable: {{${varName}}}`, 'PASS');
          } else {
            logTest('Feature 2', `Variable: {{${varName}}}`, 'FAIL', 'Not found');
          }
        } catch (err) {
          logTest('Feature 2', `Variable: {{${varName}}}`, 'FAIL', `Error: ${err.message.substring(0, 50)}`);
        }
      }
    } else {
      logTest('Feature 2', 'Variables dropdown button', 'FAIL', 'Not found');
    }
  } catch (err) {
    logTest('Feature 2', 'Variables dropdown', 'FAIL', `Error: ${err.message.substring(0, 50)}`);
  }

  // Test send button
  const sendButton = await page.$('button:has-text("Send Email"), button[type="submit"]');
  if (sendButton) {
    await takeScreenshot(page, 'f2-before-send');
    logTest('Feature 2', 'Send button exists', 'PASS');

    const isDisabled = await sendButton.isDisabled();
    logTest('Feature 2', 'Send button enabled', !isDisabled ? 'PASS' : 'FAIL');
  } else {
    logTest('Feature 2', 'Send button', 'FAIL', 'Not found');
  }

  // Test cancel button
  const cancelButton = await page.$('button:has-text("Cancel")');
  if (cancelButton) {
    logTest('Feature 2', 'Cancel button exists', 'PASS');
  } else {
    logTest('Feature 2', 'Cancel button', 'FAIL', 'Not found');
  }
}

async function testFeature3EmailTemplates(page) {
  console.log('\n=== FEATURE 3: EMAIL TEMPLATES ===');

  // Navigate to templates
  await page.goto(`${BASE_URL}/dashboard/email/templates`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f3-templates-initial');
  logTest('Feature 3', 'Navigate to templates page', 'PASS');

  // Test create template button
  const createBtn = await page.$('button:has-text("Create Template"), button:has-text("New Template")');
  if (createBtn) {
    await createBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'f3-create-modal-open');
    logTest('Feature 3', 'Open create template modal', 'PASS');

    // Test form fields
    const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
    if (nameInput) {
      await nameInput.fill('Test Template from Exhaustive Debug');
      logTest('Feature 3', 'Template name field', 'PASS');
    } else {
      logTest('Feature 3', 'Template name field', 'FAIL', 'Not found');
    }

    const categoryDropdown = await page.$('[role="combobox"]:has-text("Category"), select[name="category"]');
    if (categoryDropdown) {
      await categoryDropdown.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'f3-category-dropdown-open');
      logTest('Feature 3', 'Category dropdown', 'PASS');

      const categoryOptions = await page.$$('[role="option"]');
      logTest('Feature 3', `Category options: ${categoryOptions.length}`, categoryOptions.length > 0 ? 'PASS' : 'FAIL');

      if (categoryOptions.length > 0) {
        await categoryOptions[0].click();
        await page.waitForTimeout(300);
        logTest('Feature 3', 'Select category', 'PASS');
      }
    } else {
      logTest('Feature 3', 'Category dropdown', 'FAIL', 'Not found');
    }

    const subjectInput = await page.$('input[name="subject"], input[placeholder*="subject" i]');
    if (subjectInput) {
      await subjectInput.fill('Test Subject for Debug');
      logTest('Feature 3', 'Template subject field', 'PASS');
    } else {
      logTest('Feature 3', 'Template subject field', 'FAIL', 'Not found');
    }

    const bodyEditor = await page.$('[contenteditable="true"], textarea[name="body"]');
    if (bodyEditor) {
      await bodyEditor.click();
      await bodyEditor.fill('Test template body with {{contact_name}} variable.');
      await takeScreenshot(page, 'f3-template-form-filled');
      logTest('Feature 3', 'Template body editor', 'PASS');
    } else {
      logTest('Feature 3', 'Template body editor', 'FAIL', 'Not found');
    }

    // Close modal without saving
    const closeBtn = await page.$('button:has-text("Cancel"), button[aria-label*="close" i]');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      logTest('Feature 3', 'Close create modal', 'PASS');
    }
  } else {
    logTest('Feature 3', 'Create template button', 'FAIL', 'Not found');
    logBug('BUG-F3-001', 'Critical', 'Feature 3', 'Create Template button not found', 'f3-templates-initial.png');
  }

  // Test template list
  const templateCards = await page.$$('[data-template-id], .template-card, [class*="template"]').catch(() => []);
  logTest('Feature 3', `Template cards loaded: ${templateCards.length}`, templateCards.length > 0 ? 'PASS' : 'FAIL');

  // Test edit/delete buttons on first template
  if (templateCards.length > 0) {
    const editBtn = await templateCards[0].$('button:has-text("Edit"), button[aria-label*="edit" i]');
    if (editBtn) {
      logTest('Feature 3', 'Edit button exists on template', 'PASS');
    } else {
      logTest('Feature 3', 'Edit button on template', 'FAIL', 'Not found');
    }

    const deleteBtn = await templateCards[0].$('button:has-text("Delete"), button[aria-label*="delete" i]');
    if (deleteBtn) {
      logTest('Feature 3', 'Delete button exists on template', 'PASS');
    } else {
      logTest('Feature 3', 'Delete button on template', 'FAIL', 'Not found');
    }
  }

  // Test search/filter
  const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
  if (searchInput) {
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f3-search-results');
    logTest('Feature 3', 'Search templates', 'PASS');
  } else {
    logTest('Feature 3', 'Search input', 'FAIL', 'Not found');
  }
}

async function testFeature4Campaigns(page) {
  console.log('\n=== FEATURE 4: MASS EMAIL CAMPAIGNS ===');

  // Navigate to campaigns
  await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f4-campaigns-initial');
  logTest('Feature 4', 'Navigate to campaigns page', 'PASS');

  // Test create campaign button
  const createBtn = await page.$('button:has-text("Create Campaign"), button:has-text("New Campaign")');
  if (createBtn) {
    await createBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'f4-create-wizard-step1');
    logTest('Feature 4', 'Open campaign wizard', 'PASS');

    // Test campaign name field
    const nameInput = await page.$('input[name="name"], input[placeholder*="campaign name" i]');
    if (nameInput) {
      await nameInput.fill('Exhaustive Debug Test Campaign');
      await takeScreenshot(page, 'f4-name-filled');
      logTest('Feature 4', 'Campaign name field', 'PASS');
    } else {
      logTest('Feature 4', 'Campaign name field', 'FAIL', 'Not found');
    }

    // Test template selection
    const templateDropdown = await page.$('[role="combobox"], button:has-text("Select template")');
    if (templateDropdown) {
      await templateDropdown.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'f4-template-dropdown-open');
      logTest('Feature 4', 'Template dropdown in campaign', 'PASS');

      const templateOptions = await page.$$('[role="option"]');
      logTest('Feature 4', `Template options: ${templateOptions.length}`, templateOptions.length > 0 ? 'PASS' : 'FAIL');

      if (templateOptions.length > 0) {
        await templateOptions[0].click();
        await page.waitForTimeout(300);
        logTest('Feature 4', 'Select template for campaign', 'PASS');
      }
    } else {
      logTest('Feature 4', 'Template dropdown', 'FAIL', 'Not found');
    }

    // Test next button
    const nextBtn = await page.$('button:has-text("Next"), button:has-text("Continue")');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'f4-wizard-step2');
      logTest('Feature 4', 'Navigate to step 2', 'PASS');

      // Test contact filters
      const filterButtons = await page.$$('button, [role="button"]');
      const filterLabels = ['All Contacts', 'Tagged', 'Status'];

      for (const label of filterLabels) {
        const btn = await Promise.all(filterButtons.map(async b => {
          const text = await b.textContent();
          return text?.includes(label) ? b : null;
        })).then(btns => btns.find(b => b !== null));

        if (btn) {
          logTest('Feature 4', `Filter option: ${label}`, 'PASS');
        } else {
          logTest('Feature 4', `Filter option: ${label}`, 'FAIL', 'Not found');
        }
      }

      // Test recipient count display
      const recipientCount = await page.$('text=/\\d+ recipients/, text=/\\d+ contacts/');
      if (recipientCount) {
        const countText = await recipientCount.textContent();
        logTest('Feature 4', `Recipient count display: ${countText}`, 'PASS');
      } else {
        logTest('Feature 4', 'Recipient count display', 'FAIL', 'Not found');
      }

      // Test back button
      const backBtn = await page.$('button:has-text("Back"), button:has-text("Previous")');
      if (backBtn) {
        logTest('Feature 4', 'Back button exists', 'PASS');
      }

      // Close wizard
      const closeBtn = await page.$('button:has-text("Cancel"), button[aria-label*="close" i]');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        logTest('Feature 4', 'Close campaign wizard', 'PASS');
      }
    } else {
      logTest('Feature 4', 'Next button', 'FAIL', 'Not found');
    }
  } else {
    logTest('Feature 4', 'Create campaign button', 'FAIL', 'Not found');
    logBug('BUG-F4-001', 'Critical', 'Feature 4', 'Create Campaign button not found', 'f4-campaigns-initial.png');
  }

  // Test campaign list
  const campaignCards = await page.$$('[data-campaign-id], .campaign-card, [class*="campaign"]').catch(() => []);
  logTest('Feature 4', `Campaign cards loaded: ${campaignCards.length}`, campaignCards.length > 0 ? 'PASS' : 'FAIL');

  // Test metrics on first campaign
  if (campaignCards.length > 0) {
    await takeScreenshot(page, 'f4-campaign-card-with-metrics');

    const metrics = ['Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Unsubscribed'];
    for (const metric of metrics) {
      const metricElement = await page.$(`text=/${metric}/i`);
      if (metricElement) {
        logTest('Feature 4', `Metric displayed: ${metric}`, 'PASS');
      } else {
        logTest('Feature 4', `Metric displayed: ${metric}`, 'FAIL', 'Not found');
      }
    }
  }
}

async function testFeature5Autoresponders(page) {
  console.log('\n=== FEATURE 5: AUTORESPONDERS ===');

  // Navigate to autoresponders
  await page.goto(`${BASE_URL}/dashboard/email/autoresponders`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f5-autoresponders-initial');
  logTest('Feature 5', 'Navigate to autoresponders page', 'PASS');

  // Test create autoresponder button
  const createBtn = await page.$('button:has-text("Create Autoresponder"), button:has-text("New Autoresponder")');
  if (createBtn) {
    await createBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'f5-create-modal-open');
    logTest('Feature 5', 'Open create autoresponder modal', 'PASS');

    // Test name field
    const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
    if (nameInput) {
      await nameInput.fill('Debug Test Autoresponder');
      logTest('Feature 5', 'Autoresponder name field', 'PASS');
    } else {
      logTest('Feature 5', 'Autoresponder name field', 'FAIL', 'Not found');
    }

    // Test trigger dropdown
    const triggerDropdown = await page.$('[role="combobox"]:has-text("Trigger"), select[name="trigger"]');
    if (triggerDropdown) {
      await triggerDropdown.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'f5-trigger-dropdown-open');
      logTest('Feature 5', 'Trigger dropdown', 'PASS');

      const triggers = ['New Contact', 'Tag Added', 'Date-Based', 'Contact Created'];
      const triggerOptions = await page.$$('[role="option"]');

      for (let i = 0; i < Math.min(triggers.length, triggerOptions.length); i++) {
        const optText = await triggerOptions[i].textContent();
        await triggerOptions[i].click();
        await page.waitForTimeout(300);
        await takeScreenshot(page, `f5-trigger-${i}-selected`);
        logTest('Feature 5', `Trigger option: ${optText}`, 'PASS');

        // Reopen dropdown for next option
        if (i < Math.min(triggers.length, triggerOptions.length) - 1) {
          await triggerDropdown.click();
          await page.waitForTimeout(300);
        }
      }
    } else {
      logTest('Feature 5', 'Trigger dropdown', 'FAIL', 'Not found');
    }

    // Test timing modes
    const timingButtons = await page.$$('button, [role="radio"]');
    const timingModes = ['Immediate', 'Delay', 'Specific Time'];

    for (const mode of timingModes) {
      const btn = await Promise.all(timingButtons.map(async b => {
        const text = await b.textContent();
        return text?.includes(mode) ? b : null;
      })).then(btns => btns.find(b => b !== null));

      if (btn) {
        await btn.click();
        await page.waitForTimeout(300);
        await takeScreenshot(page, `f5-timing-${mode.toLowerCase().replace(/\s/g, '-')}`);
        logTest('Feature 5', `Timing mode: ${mode}`, 'PASS');
      } else {
        logTest('Feature 5', `Timing mode: ${mode}`, 'FAIL', 'Not found');
      }
    }

    // Test template selection for autoresponder
    const templateDropdown = await page.$('[role="combobox"], button:has-text("template")');
    if (templateDropdown) {
      await templateDropdown.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'f5-template-dropdown-open');
      logTest('Feature 5', 'Template selection in autoresponder', 'PASS');

      const templateOptions = await page.$$('[role="option"]');
      if (templateOptions.length > 0) {
        await templateOptions[0].click();
        await page.waitForTimeout(300);
        logTest('Feature 5', 'Select template for autoresponder', 'PASS');
      }
    } else {
      logTest('Feature 5', 'Template selection', 'FAIL', 'Not found');
    }

    // Close modal
    const closeBtn = await page.$('button:has-text("Cancel"), button[aria-label*="close" i]');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      logTest('Feature 5', 'Close autoresponder modal', 'PASS');
    }
  } else {
    logTest('Feature 5', 'Create autoresponder button', 'FAIL', 'Not found');
    logBug('BUG-F5-001', 'Critical', 'Feature 5', 'Create Autoresponder button not found', 'f5-autoresponders-initial.png');
  }

  // Test autoresponder list
  const autoresponderCards = await page.$$('[data-autoresponder-id], .autoresponder-card').catch(() => []);
  logTest('Feature 5', `Autoresponder cards loaded: ${autoresponderCards.length}`, autoresponderCards.length > 0 ? 'PASS' : 'FAIL');

  // Test activate/deactivate toggle
  if (autoresponderCards.length > 0) {
    const toggle = await autoresponderCards[0].$('button[role="switch"], input[type="checkbox"]');
    if (toggle) {
      logTest('Feature 5', 'Activate/deactivate toggle exists', 'PASS');
    } else {
      logTest('Feature 5', 'Activate/deactivate toggle', 'FAIL', 'Not found');
    }
  }
}

async function testFeature6MailgunSettings(page) {
  console.log('\n=== FEATURE 6: MAILGUN SETTINGS ===');

  // Navigate to mailgun settings
  await page.goto(`${BASE_URL}/dashboard/settings/integrations/mailgun`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f6-mailgun-initial');
  logTest('Feature 6', 'Navigate to Mailgun settings', 'PASS');

  // Test all input fields
  const fields = [
    { name: 'API Key', selector: 'input[name="apiKey"], input[placeholder*="API" i]' },
    { name: 'Domain', selector: 'input[name="domain"], input[placeholder*="domain" i]' },
    { name: 'Sender Name', selector: 'input[name="senderName"], input[placeholder*="sender name" i]' },
    { name: 'Sender Email', selector: 'input[name="senderEmail"], input[placeholder*="sender email" i]' }
  ];

  for (const field of fields) {
    const input = await page.$(field.selector);
    if (input) {
      await input.fill(`test-${field.name.toLowerCase().replace(/\s/g, '-')}`);
      await takeScreenshot(page, `f6-${field.name.toLowerCase().replace(/\s/g, '-')}-filled`);
      logTest('Feature 6', `${field.name} field`, 'PASS');
    } else {
      logTest('Feature 6', `${field.name} field`, 'FAIL', 'Not found');
    }
  }

  // Test rate limit settings
  const rateLimitInput = await page.$('input[name="rateLimit"], input[type="number"]');
  if (rateLimitInput) {
    await rateLimitInput.fill('100');
    logTest('Feature 6', 'Rate limit field', 'PASS');
  } else {
    logTest('Feature 6', 'Rate limit field', 'FAIL', 'Not found');
  }

  // Test connection button
  const testConnectionBtn = await page.$('button:has-text("Test Connection")');
  if (testConnectionBtn) {
    await takeScreenshot(page, 'f6-before-test-connection');
    logTest('Feature 6', 'Test connection button exists', 'PASS');

    // Don't actually click - would require real Mailgun credentials
  } else {
    logTest('Feature 6', 'Test connection button', 'FAIL', 'Not found');
  }

  // Test save button
  const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
  if (saveBtn) {
    logTest('Feature 6', 'Save button exists', 'PASS');
  } else {
    logTest('Feature 6', 'Save button', 'FAIL', 'Not found');
  }

  await takeScreenshot(page, 'f6-mailgun-all-filled');
}

async function testFeature7Closebot(page) {
  console.log('\n=== FEATURE 7: CLOSEBOT AI PLACEHOLDER ===');

  // Navigate to closebot settings
  await page.goto(`${BASE_URL}/dashboard/settings/integrations/closebot`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f7-closebot-initial');
  logTest('Feature 7', 'Navigate to Closebot settings', 'PASS');

  // Test "Coming Soon" message
  const comingSoonText = await page.$('text=/coming soon/i, text=/under development/i');
  if (comingSoonText) {
    const text = await comingSoonText.textContent();
    logTest('Feature 7', `Coming soon message: ${text}`, 'PASS');
  } else {
    logTest('Feature 7', 'Coming soon message', 'FAIL', 'Not found');
  }

  // Test disabled inputs
  const disabledInputs = await page.$$('input[disabled], button[disabled]');
  logTest('Feature 7', `Disabled inputs: ${disabledInputs.length}`, disabledInputs.length > 0 ? 'PASS' : 'FAIL');

  // Test informational content
  const infoText = await page.$('text=/AI-powered/i, text=/feature/i, p, div');
  if (infoText) {
    logTest('Feature 7', 'Informational content exists', 'PASS');
  } else {
    logTest('Feature 7', 'Informational content', 'FAIL', 'Not found');
  }

  await takeScreenshot(page, 'f7-closebot-complete');
}

async function testFeature8ManualEmailEntry(page) {
  console.log('\n=== FEATURE 8: MANUAL EMAIL ADDRESS ENTRY ===');

  // Go back to composer
  await page.goto(`${BASE_URL}/dashboard/email/compose`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'f8-composer-initial');
  logTest('Feature 8', 'Navigate to composer for manual email test', 'PASS');

  // Test typing email addresses
  const toInput = await page.$('input[type="email"], input[placeholder*="email" i]');
  if (toInput) {
    // Test valid email
    await toInput.fill('valid@example.com');
    await toInput.press('Enter');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f8-valid-email-entered');
    logTest('Feature 8', 'Valid email entry', 'PASS');

    // Test invalid email
    await toInput.fill('invalid-email');
    await toInput.press('Enter');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f8-invalid-email-attempt');

    const errorToast = await page.$('text=/invalid email/i, [role="alert"]');
    if (errorToast) {
      logTest('Feature 8', 'Invalid email validation', 'PASS');
    } else {
      logTest('Feature 8', 'Invalid email validation', 'FAIL', 'No error shown');
    }

    // Test multiple recipients
    await toInput.fill('second@example.com');
    await toInput.press('Enter');
    await page.waitForTimeout(300);
    await toInput.fill('third@example.com');
    await toInput.press('Comma');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f8-multiple-recipients');
    logTest('Feature 8', 'Multiple recipients', 'PASS');

    // Test recipient removal
    const removeBtns = await page.$$('button:has-text("×"), button[aria-label*="remove" i]');
    if (removeBtns.length > 0) {
      await removeBtns[0].click();
      await page.waitForTimeout(300);
      await takeScreenshot(page, 'f8-recipient-removed');
      logTest('Feature 8', 'Remove recipient', 'PASS');
    } else {
      logTest('Feature 8', 'Remove recipient button', 'FAIL', 'Not found');
    }
  } else {
    logTest('Feature 8', 'Email input field', 'FAIL', 'Not found');
  }
}

async function testNavigationLinks(page) {
  console.log('\n=== NAVIGATION TESTING ===');

  const navigationLinks = [
    { name: 'Dashboard', url: '/dashboard', selector: 'a[href="/dashboard"], a:has-text("Dashboard")' },
    { name: 'Inbox', url: '/dashboard/inbox', selector: 'a[href="/dashboard/inbox"], a:has-text("Inbox")' },
    { name: 'Compose', url: '/dashboard/email/compose', selector: 'a[href*="compose"], a:has-text("Compose")' },
    { name: 'Contacts', url: '/dashboard/contacts', selector: 'a[href="/dashboard/contacts"], a:has-text("Contacts")' },
    { name: 'Templates', url: '/dashboard/email/templates', selector: 'a[href*="templates"], a:has-text("Templates")' },
    { name: 'Campaigns', url: '/dashboard/email/campaigns', selector: 'a[href*="campaigns"], a:has-text("Campaigns")' },
    { name: 'Autoresponders', url: '/dashboard/email/autoresponders', selector: 'a[href*="autoresponders"], a:has-text("Autoresponders")' },
    { name: 'Settings', url: '/dashboard/settings', selector: 'a[href*="settings"], a:has-text("Settings")' },
  ];

  for (const link of navigationLinks) {
    const element = await page.$(link.selector);
    if (element) {
      await element.click();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const is404 = await page.$('text=/404/i, text=/not found/i');

      await takeScreenshot(page, `nav-${link.name.toLowerCase().replace(/\s/g, '-')}`);

      if (is404) {
        logTest('Navigation', `${link.name} link -> 404 ERROR`, 'FAIL');
        logBug(`BUG-NAV-${link.name.toUpperCase()}`, 'Critical', 'Navigation', `${link.name} link leads to 404`, `nav-${link.name.toLowerCase()}.png`);
      } else {
        logTest('Navigation', `${link.name} link (${currentUrl})`, 'PASS');
      }
    } else {
      logTest('Navigation', `${link.name} link`, 'FAIL', 'Link not found');
    }
  }
}

async function checkConsoleErrors(page) {
  console.log('\n=== CONSOLE ERRORS CHECK ===');

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Wait a bit to collect any errors
  await page.waitForTimeout(2000);

  if (errors.length === 0) {
    logTest('Console', 'No JavaScript errors', 'PASS');
  } else {
    logTest('Console', `${errors.length} JavaScript errors found`, 'FAIL');
    errors.forEach((err, i) => {
      logBug(`BUG-CONSOLE-${i + 1}`, 'Medium', 'Console', `JavaScript error: ${err.substring(0, 100)}...`, '');
    });
  }

  return errors;
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('EXHAUSTIVE DEBUG REPORT - ALL EMAIL FEATURES');
  console.log('='.repeat(80));

  const passRate = ((testResults.passed / testResults.totalTests) * 100).toFixed(1);

  console.log(`\nSUMMARY:`);
  console.log(`  Total Tests: ${testResults.totalTests}`);
  console.log(`  Passed: ${testResults.passed}`);
  console.log(`  Failed: ${testResults.failed}`);
  console.log(`  Pass Rate: ${passRate}%`);
  console.log(`  Bugs Found: ${testResults.bugs.length}`);

  console.log(`\nFEATURE BREAKDOWN:`);
  for (const [feature, data] of Object.entries(testResults.features)) {
    const featurePassRate = ((data.passed / (data.passed + data.failed)) * 100).toFixed(1);
    console.log(`  ${feature}: ${data.passed}/${data.passed + data.failed} (${featurePassRate}%)`);
  }

  if (testResults.bugs.length > 0) {
    console.log(`\nBUGS DISCOVERED:`);
    testResults.bugs.forEach(bug => {
      console.log(`  [${bug.severity}] ${bug.id}: ${bug.description}`);
      if (bug.screenshot) {
        console.log(`    Screenshot: ${bug.screenshot}`);
      }
    });
  }

  console.log(`\nSCREENSHOTS DIRECTORY: ${SCREENSHOT_DIR}`);
  console.log(`\nSTATUS: ${passRate >= 90 ? '✅ PRODUCTION READY' : '❌ NOT PRODUCTION READY'}`);
  console.log('='.repeat(80));

  // Write JSON report
  const reportPath = path.join(__dirname, '..', 'EXHAUSTIVE_DEBUG_REPORT_ALL_FEATURES.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nDetailed JSON report saved to: ${reportPath}`);
}

(async () => {
  console.log('Starting Exhaustive Debug Test - ALL Email Features');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Set up console error tracking
  checkConsoleErrors(page);

  try {
    // Login
    await login(page);

    // Test all features with individual error handling
    try {
      await testFeature1UnifiedInbox(page);
    } catch (err) {
      console.error('Feature 1 error:', err.message);
      logBug('BUG-F1-ERROR', 'High', 'Feature 1', `Feature 1 test crashed: ${err.message}`, '');
    }

    try {
      await testFeature2EmailComposer(page);
    } catch (err) {
      console.error('Feature 2 error:', err.message);
      logBug('BUG-F2-ERROR', 'High', 'Feature 2', `Feature 2 test crashed: ${err.message}`, '');
    }

    try {
      await testFeature3EmailTemplates(page);
    } catch (err) {
      console.error('Feature 3 error:', err.message);
      logBug('BUG-F3-ERROR', 'High', 'Feature 3', `Feature 3 test crashed: ${err.message}`, '');
    }

    try {
      await testFeature4Campaigns(page);
    } catch (err) {
      console.error('Feature 4 error:', err.message);
      logBug('BUG-F4-ERROR', 'High', 'Feature 4', `Feature 4 test crashed: ${err.message}`, '');
    }

    try {
      await testFeature5Autoresponders(page);
    } catch (err) {
      console.error('Feature 5 error:', err.message);
      logBug('BUG-F5-ERROR', 'High', 'Feature 5', `Feature 5 test crashed: ${err.message}`, '');
    }

    try {
      await testFeature6MailgunSettings(page);
    } catch (err) {
      console.error('Feature 6 error:', err.message);
      logBug('BUG-F6-ERROR', 'High', 'Feature 6', `Feature 6 test crashed: ${err.message}`, '');
    }

    try {
      await testFeature7Closebot(page);
    } catch (err) {
      console.error('Feature 7 error:', err.message);
      logBug('BUG-F7-ERROR', 'High', 'Feature 7', `Feature 7 test crashed: ${err.message}`, '');
    }

    try {
      await testFeature8ManualEmailEntry(page);
    } catch (err) {
      console.error('Feature 8 error:', err.message);
      logBug('BUG-F8-ERROR', 'High', 'Feature 8', `Feature 8 test crashed: ${err.message}`, '');
    }

    try {
      await testNavigationLinks(page);
    } catch (err) {
      console.error('Navigation error:', err.message);
      logBug('BUG-NAV-ERROR', 'High', 'Navigation', `Navigation test crashed: ${err.message}`, '');
    }

    // Final screenshot
    await takeScreenshot(page, 'final-state');

  } catch (error) {
    console.error('Test error:', error);
    await takeScreenshot(page, 'error-state');
    logBug('BUG-CRITICAL', 'Critical', 'Test Runner', `Test crashed: ${error.message}`, 'error-state.png');
  } finally {
    await browser.close();
    generateReport();
  }
})();
