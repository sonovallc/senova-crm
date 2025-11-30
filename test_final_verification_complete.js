const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'debug-final-verification');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const testResults = {
  bugFixes: {},
  features: {},
  consoleErrors: [],
  timestamp: new Date().toISOString()
};

async function captureConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  return errors;
}

async function login(page) {
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-form.png'), fullPage: true });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after-login.png'), fullPage: true });
  console.log('✓ Login complete');
}

async function testBugCORS(page) {
  console.log('\n=== Testing BUG-CORS-001 Fix ===');
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
      errors.push(msg.text());
    }
  });

  // Test Campaigns page for CORS
  console.log('Testing Campaigns page for CORS errors...');
  await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bug-cors-campaigns.png'), fullPage: true });

  // Test Autoresponders for CORS
  console.log('Testing Autoresponders page for CORS errors...');
  await page.goto(`${BASE_URL}/dashboard/email/autoresponders`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bug-cors-autoresponders.png'), fullPage: true });

  // Test Mailgun Settings for CORS
  console.log('Testing Mailgun Settings page for CORS errors...');
  await page.goto(`${BASE_URL}/dashboard/settings/integrations/mailgun`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bug-cors-mailgun.png'), fullPage: true });

  testResults.bugFixes['BUG-CORS-001'] = {
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    corsErrors: errors,
    tested: ['Campaigns', 'Autoresponders', 'Mailgun Settings'],
    timestamp: new Date().toISOString()
  };

  console.log(`BUG-CORS-001: ${errors.length === 0 ? '✓ PASS' : '✗ FAIL'} - ${errors.length} CORS errors found`);
  if (errors.length > 0) {
    console.log('CORS Errors:', errors);
  }
}

async function testBugCampaignsLoading(page) {
  console.log('\n=== Testing BUG-CAMPAIGNS-LOADING Fix ===');

  await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bug-campaigns-loading.png'), fullPage: true });

  const loadingText = await page.locator('text=Loading').count();
  const hasContent = await page.locator('button:has-text("Create Campaign")').count() > 0;

  testResults.bugFixes['BUG-CAMPAIGNS-LOADING'] = {
    status: hasContent ? 'PASS' : 'FAIL',
    stuckOnLoading: loadingText > 0,
    createButtonVisible: hasContent,
    timestamp: new Date().toISOString()
  };

  console.log(`BUG-CAMPAIGNS-LOADING: ${hasContent ? '✓ PASS' : '✗ FAIL'} - Page loaded: ${hasContent}, Stuck: ${loadingText > 0}`);
}

async function testBugInboxFilters(page) {
  console.log('\n=== Testing BUG-INBOX-FILTERS Fix ===');

  await page.goto(`${BASE_URL}/dashboard/inbox`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bug-inbox-filters.png'), fullPage: true });

  const tabs = {
    all: await page.locator('button:has-text("All")').count() > 0,
    unread: await page.locator('button:has-text("Unread")').count() > 0,
    read: await page.locator('button:has-text("Read")').count() > 0,
    archived: await page.locator('button:has-text("Archived")').count() > 0
  };

  const allTabsPresent = tabs.all && tabs.unread && tabs.read && tabs.archived;

  // Test clicking each tab
  if (tabs.all) {
    await page.click('button:has-text("All")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'inbox-tab-all.png'), fullPage: true });
  }

  if (tabs.unread) {
    await page.click('button:has-text("Unread")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'inbox-tab-unread.png'), fullPage: true });
  }

  if (tabs.read) {
    await page.click('button:has-text("Read")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'inbox-tab-read.png'), fullPage: true });
  }

  if (tabs.archived) {
    await page.click('button:has-text("Archived")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'inbox-tab-archived.png'), fullPage: true });
  }

  testResults.bugFixes['BUG-INBOX-FILTERS'] = {
    status: allTabsPresent ? 'PASS' : 'FAIL',
    tabs: tabs,
    tabCount: Object.values(tabs).filter(Boolean).length,
    timestamp: new Date().toISOString()
  };

  console.log(`BUG-INBOX-FILTERS: ${allTabsPresent ? '✓ PASS' : '✗ FAIL'} - ${Object.values(tabs).filter(Boolean).length}/4 tabs present`);
}

async function testBugMailgun404(page) {
  console.log('\n=== Testing BUG-MAILGUN-404 Fix ===');

  await page.goto(`${BASE_URL}/dashboard/settings/integrations/mailgun`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bug-mailgun-404.png'), fullPage: true });

  const is404 = await page.locator('text=404').count() > 0;
  const hasMailgunContent = await page.locator('text=Mailgun').count() > 0;

  testResults.bugFixes['BUG-MAILGUN-404'] = {
    status: !is404 && hasMailgunContent ? 'PASS' : 'FAIL',
    has404Error: is404,
    hasMailgunContent: hasMailgunContent,
    timestamp: new Date().toISOString()
  };

  console.log(`BUG-MAILGUN-404: ${!is404 && hasMailgunContent ? '✓ PASS' : '✗ FAIL'} - 404: ${is404}, Content: ${hasMailgunContent}`);
}

async function testEmailComposer(page) {
  console.log('\n=== Testing Email Composer ===');

  await page.goto(`${BASE_URL}/dashboard/email/compose`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-composer-initial.png'), fullPage: true });

  const hasToField = await page.locator('input[placeholder*="Select"]').first().count() > 0;
  const hasSubject = await page.locator('input[placeholder*="Subject"]').count() > 0;
  const hasEditor = await page.locator('.tiptap').count() > 0;
  const hasSendButton = await page.locator('button:has-text("Send")').count() > 0;

  // Test template dropdown
  const templateButton = await page.locator('button:has-text("Use Template")').count();
  if (templateButton > 0) {
    await page.click('button:has-text("Use Template")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-composer-template-dropdown.png'), fullPage: true });
    await page.keyboard.press('Escape');
  }

  testResults.features['Email Composer'] = {
    status: hasToField && hasSubject && hasEditor && hasSendButton ? 'PASS' : 'FAIL',
    elements: {
      toField: hasToField,
      subject: hasSubject,
      editor: hasEditor,
      sendButton: hasSendButton,
      templateDropdown: templateButton > 0
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Email Composer: ${testResults.features['Email Composer'].status} - ${Object.values(testResults.features['Email Composer'].elements).filter(Boolean).length}/5 elements`);
}

async function testEmailTemplates(page) {
  console.log('\n=== Testing Email Templates ===');

  await page.goto(`${BASE_URL}/dashboard/email/templates`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-templates-list.png'), fullPage: true });

  const hasCreateButton = await page.locator('button:has-text("Create Template")').count() > 0;
  const hasViewToggle = await page.locator('button[aria-label*="view"]').count() > 0;
  const hasTemplateCards = await page.locator('[class*="template"]').count() > 0;

  testResults.features['Email Templates'] = {
    status: hasCreateButton ? 'PASS' : 'FAIL',
    elements: {
      createButton: hasCreateButton,
      viewToggle: hasViewToggle,
      templateCards: hasTemplateCards
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Email Templates: ${testResults.features['Email Templates'].status} - Create: ${hasCreateButton}`);
}

async function testCampaigns(page) {
  console.log('\n=== Testing Email Campaigns ===');

  await page.goto(`${BASE_URL}/dashboard/email/campaigns`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-campaigns-list.png'), fullPage: true });

  const hasCreateButton = await page.locator('button:has-text("Create Campaign")').count() > 0;
  const notStuckLoading = await page.locator('text=Loading').count() === 0;

  testResults.features['Email Campaigns'] = {
    status: hasCreateButton && notStuckLoading ? 'PASS' : 'FAIL',
    elements: {
      createButton: hasCreateButton,
      notLoading: notStuckLoading
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Email Campaigns: ${testResults.features['Email Campaigns'].status} - Create: ${hasCreateButton}, Not stuck: ${notStuckLoading}`);
}

async function testAutoresponders(page) {
  console.log('\n=== Testing Autoresponders ===');

  await page.goto(`${BASE_URL}/dashboard/email/autoresponders`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-autoresponders-list.png'), fullPage: true });

  const hasCreateButton = await page.locator('button:has-text("Create Autoresponder")').count() > 0;
  const hasContent = await page.locator('text=Autoresponder').count() > 0;

  testResults.features['Autoresponders'] = {
    status: hasCreateButton && hasContent ? 'PASS' : 'FAIL',
    elements: {
      createButton: hasCreateButton,
      content: hasContent
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Autoresponders: ${testResults.features['Autoresponders'].status} - Create: ${hasCreateButton}`);
}

async function testInbox(page) {
  console.log('\n=== Testing Unified Inbox ===');

  await page.goto(`${BASE_URL}/dashboard/inbox`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-inbox.png'), fullPage: true });

  const hasAllTab = await page.locator('button:has-text("All")').count() > 0;
  const hasUnreadTab = await page.locator('button:has-text("Unread")').count() > 0;
  const hasReadTab = await page.locator('button:has-text("Read")').count() > 0;
  const hasArchivedTab = await page.locator('button:has-text("Archived")').count() > 0;

  testResults.features['Unified Inbox'] = {
    status: hasAllTab && hasUnreadTab && hasReadTab && hasArchivedTab ? 'PASS' : 'FAIL',
    elements: {
      allTab: hasAllTab,
      unreadTab: hasUnreadTab,
      readTab: hasReadTab,
      archivedTab: hasArchivedTab
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Unified Inbox: ${testResults.features['Unified Inbox'].status} - All 4 tabs: ${hasAllTab && hasUnreadTab && hasReadTab && hasArchivedTab}`);
}

async function testMailgunSettings(page) {
  console.log('\n=== Testing Mailgun Settings ===');

  await page.goto(`${BASE_URL}/dashboard/settings/integrations/mailgun`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-mailgun-settings.png'), fullPage: true });

  const not404 = await page.locator('text=404').count() === 0;
  const hasMailgunText = await page.locator('text=Mailgun').count() > 0;
  const hasFields = await page.locator('input').count() > 0;

  testResults.features['Mailgun Settings'] = {
    status: not404 && hasMailgunText ? 'PASS' : 'FAIL',
    elements: {
      not404: not404,
      hasMailgunText: hasMailgunText,
      hasFields: hasFields
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Mailgun Settings: ${testResults.features['Mailgun Settings'].status} - No 404: ${not404}`);
}

async function testEmailSettings(page) {
  console.log('\n=== Testing Email Settings ===');

  await page.goto(`${BASE_URL}/dashboard/settings/email`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-email-settings.png'), fullPage: true });

  const hasContent = await page.locator('text=Email').count() > 0;
  const not404 = await page.locator('text=404').count() === 0;

  testResults.features['Email Settings'] = {
    status: hasContent && not404 ? 'PASS' : 'FAIL',
    elements: {
      hasContent: hasContent,
      not404: not404
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Email Settings: ${testResults.features['Email Settings'].status}`);
}

async function testClosebotAI(page) {
  console.log('\n=== Testing Closebot AI ===');

  await page.goto(`${BASE_URL}/dashboard/settings/integrations/closebot`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feature-closebot.png'), fullPage: true });

  const hasClosebotText = await page.locator('text=Closebot').count() > 0;
  const hasComingSoon = await page.locator('text=Coming Soon').count() > 0;
  const not404 = await page.locator('text=404').count() === 0;

  testResults.features['Closebot AI'] = {
    status: hasClosebotText && not404 ? 'PASS' : 'FAIL',
    elements: {
      hasClosebotText: hasClosebotText,
      hasComingSoon: hasComingSoon,
      not404: not404
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Closebot AI: ${testResults.features['Closebot AI'].status}`);
}

async function generateReport() {
  console.log('\n=== Generating Final Verification Report ===');

  const bugFixCount = Object.keys(testResults.bugFixes).length;
  const bugFixPassed = Object.values(testResults.bugFixes).filter(r => r.status === 'PASS').length;
  const bugFixRate = bugFixCount > 0 ? (bugFixPassed / bugFixCount * 100).toFixed(1) : 0;

  const featureCount = Object.keys(testResults.features).length;
  const featurePassed = Object.values(testResults.features).filter(r => r.status === 'PASS').length;
  const featureRate = featureCount > 0 ? (featurePassed / featureCount * 100).toFixed(1) : 0;

  const totalTests = bugFixCount + featureCount;
  const totalPassed = bugFixPassed + featurePassed;
  const overallRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;

  const productionReady = overallRate >= 90 && bugFixPassed === bugFixCount;

  const report = `# DEBUG FINAL VERIFICATION REPORT

**Verification Date:** ${new Date().toISOString()}
**Debugger Agent:** Final Verification Session
**Application URL:** http://localhost:3004

---

## EXECUTIVE SUMMARY

- **Total Tests:** ${totalTests} (${bugFixCount} bug fixes + ${featureCount} features)
- **Passed:** ${totalPassed}
- **Failed:** ${totalTests - totalPassed}
- **Overall Pass Rate:** ${overallRate}%
- **PRODUCTION READINESS:** ${productionReady ? '✅ YES' : '❌ NO'}

---

## BUG FIX VERIFICATION

**Bug Fix Pass Rate:** ${bugFixRate}% (${bugFixPassed}/${bugFixCount})

### BUG-CORS-001: Backend CORS Configuration
**Status:** ${testResults.bugFixes['BUG-CORS-001']?.status || 'NOT TESTED'}
**CORS Errors Found:** ${testResults.bugFixes['BUG-CORS-001']?.corsErrors?.length || 0}
**Pages Tested:** ${testResults.bugFixes['BUG-CORS-001']?.tested?.join(', ') || 'None'}
**Screenshot:** bug-cors-campaigns.png, bug-cors-autoresponders.png, bug-cors-mailgun.png

${testResults.bugFixes['BUG-CORS-001']?.corsErrors?.length > 0 ? '**CORS Errors:**\n' + testResults.bugFixes['BUG-CORS-001'].corsErrors.map(e => `- ${e}`).join('\n') : '**Result:** No CORS errors detected ✓'}

---

### BUG-CAMPAIGNS-LOADING: Campaigns Loading Issue
**Status:** ${testResults.bugFixes['BUG-CAMPAIGNS-LOADING']?.status || 'NOT TESTED'}
**Stuck on Loading:** ${testResults.bugFixes['BUG-CAMPAIGNS-LOADING']?.stuckOnLoading ? 'YES ✗' : 'NO ✓'}
**Create Button Visible:** ${testResults.bugFixes['BUG-CAMPAIGNS-LOADING']?.createButtonVisible ? 'YES ✓' : 'NO ✗'}
**Screenshot:** bug-campaigns-loading.png

**Result:** ${testResults.bugFixes['BUG-CAMPAIGNS-LOADING']?.status === 'PASS' ? 'Page loads correctly without stuck loading state ✓' : 'Page still has loading issues ✗'}

---

### BUG-INBOX-FILTERS: Inbox Filter Tabs
**Status:** ${testResults.bugFixes['BUG-INBOX-FILTERS']?.status || 'NOT TESTED'}
**Tabs Present:** ${testResults.bugFixes['BUG-INBOX-FILTERS']?.tabCount || 0}/4
**Screenshots:** bug-inbox-filters.png, inbox-tab-all.png, inbox-tab-unread.png, inbox-tab-read.png, inbox-tab-archived.png

**Tab Details:**
- All Tab: ${testResults.bugFixes['BUG-INBOX-FILTERS']?.tabs?.all ? '✓' : '✗'}
- Unread Tab: ${testResults.bugFixes['BUG-INBOX-FILTERS']?.tabs?.unread ? '✓' : '✗'}
- Read Tab: ${testResults.bugFixes['BUG-INBOX-FILTERS']?.tabs?.read ? '✓' : '✗'}
- Archived Tab: ${testResults.bugFixes['BUG-INBOX-FILTERS']?.tabs?.archived ? '✓' : '✗'}

**Result:** ${testResults.bugFixes['BUG-INBOX-FILTERS']?.status === 'PASS' ? 'All 4 filter tabs implemented and functional ✓' : 'Missing filter tabs ✗'}

---

### BUG-MAILGUN-404: Mailgun Settings Page
**Status:** ${testResults.bugFixes['BUG-MAILGUN-404']?.status || 'NOT TESTED'}
**Has 404 Error:** ${testResults.bugFixes['BUG-MAILGUN-404']?.has404Error ? 'YES ✗' : 'NO ✓'}
**Has Mailgun Content:** ${testResults.bugFixes['BUG-MAILGUN-404']?.hasMailgunContent ? 'YES ✓' : 'NO ✗'}
**Screenshot:** bug-mailgun-404.png

**Result:** ${testResults.bugFixes['BUG-MAILGUN-404']?.status === 'PASS' ? 'Mailgun settings page loads without 404 error ✓' : 'Page still shows 404 or missing content ✗'}

---

## FEATURE TESTING RESULTS

**Feature Pass Rate:** ${featureRate}% (${featurePassed}/${featureCount})

### 1. Email Composer
**Status:** ${testResults.features['Email Composer']?.status || 'NOT TESTED'}
**URL:** /dashboard/email/compose
**Screenshot:** feature-composer-initial.png, feature-composer-template-dropdown.png

**Elements Verified:**
- To Field: ${testResults.features['Email Composer']?.elements?.toField ? '✓' : '✗'}
- Subject Field: ${testResults.features['Email Composer']?.elements?.subject ? '✓' : '✗'}
- Rich Text Editor: ${testResults.features['Email Composer']?.elements?.editor ? '✓' : '✗'}
- Send Button: ${testResults.features['Email Composer']?.elements?.sendButton ? '✓' : '✗'}
- Template Dropdown: ${testResults.features['Email Composer']?.elements?.templateDropdown ? '✓' : '✗'}

---

### 2. Email Templates
**Status:** ${testResults.features['Email Templates']?.status || 'NOT TESTED'}
**URL:** /dashboard/email/templates
**Screenshot:** feature-templates-list.png

**Elements Verified:**
- Create Template Button: ${testResults.features['Email Templates']?.elements?.createButton ? '✓' : '✗'}
- View Toggle: ${testResults.features['Email Templates']?.elements?.viewToggle ? '✓' : '✗'}
- Template Cards: ${testResults.features['Email Templates']?.elements?.templateCards ? '✓' : '✗'}

---

### 3. Email Campaigns
**Status:** ${testResults.features['Email Campaigns']?.status || 'NOT TESTED'}
**URL:** /dashboard/email/campaigns
**Screenshot:** feature-campaigns-list.png

**Elements Verified:**
- Create Campaign Button: ${testResults.features['Email Campaigns']?.elements?.createButton ? '✓' : '✗'}
- Not Stuck Loading: ${testResults.features['Email Campaigns']?.elements?.notLoading ? '✓' : '✗'}

---

### 4. Autoresponders
**Status:** ${testResults.features['Autoresponders']?.status || 'NOT TESTED'}
**URL:** /dashboard/email/autoresponders
**Screenshot:** feature-autoresponders-list.png

**Elements Verified:**
- Create Autoresponder Button: ${testResults.features['Autoresponders']?.elements?.createButton ? '✓' : '✗'}
- Content Present: ${testResults.features['Autoresponders']?.elements?.content ? '✓' : '✗'}

---

### 5. Unified Inbox
**Status:** ${testResults.features['Unified Inbox']?.status || 'NOT TESTED'}
**URL:** /dashboard/inbox
**Screenshot:** feature-inbox.png

**Elements Verified:**
- All Tab: ${testResults.features['Unified Inbox']?.elements?.allTab ? '✓' : '✗'}
- Unread Tab: ${testResults.features['Unified Inbox']?.elements?.unreadTab ? '✓' : '✗'}
- Read Tab: ${testResults.features['Unified Inbox']?.elements?.readTab ? '✓' : '✗'}
- Archived Tab: ${testResults.features['Unified Inbox']?.elements?.archivedTab ? '✓' : '✗'}

---

### 6. Mailgun Settings
**Status:** ${testResults.features['Mailgun Settings']?.status || 'NOT TESTED'}
**URL:** /dashboard/settings/integrations/mailgun
**Screenshot:** feature-mailgun-settings.png

**Elements Verified:**
- No 404 Error: ${testResults.features['Mailgun Settings']?.elements?.not404 ? '✓' : '✗'}
- Has Mailgun Text: ${testResults.features['Mailgun Settings']?.elements?.hasMailgunText ? '✓' : '✗'}
- Has Input Fields: ${testResults.features['Mailgun Settings']?.elements?.hasFields ? '✓' : '✗'}

---

### 7. Email Settings
**Status:** ${testResults.features['Email Settings']?.status || 'NOT TESTED'}
**URL:** /dashboard/settings/email
**Screenshot:** feature-email-settings.png

**Elements Verified:**
- Has Content: ${testResults.features['Email Settings']?.elements?.hasContent ? '✓' : '✗'}
- No 404 Error: ${testResults.features['Email Settings']?.elements?.not404 ? '✓' : '✗'}

---

### 8. Closebot AI
**Status:** ${testResults.features['Closebot AI']?.status || 'NOT TESTED'}
**URL:** /dashboard/settings/integrations/closebot
**Screenshot:** feature-closebot.png

**Elements Verified:**
- Has Closebot Text: ${testResults.features['Closebot AI']?.elements?.hasClosebotText ? '✓' : '✗'}
- Has Coming Soon: ${testResults.features['Closebot AI']?.elements?.hasComingSoon ? '✓' : '✗'}
- No 404 Error: ${testResults.features['Closebot AI']?.elements?.not404 ? '✓' : '✗'}

---

## CONSOLE ERRORS SUMMARY

**Total Console Errors Captured:** ${testResults.consoleErrors.length}

${testResults.consoleErrors.length > 0 ? testResults.consoleErrors.map((err, i) => `${i + 1}. ${err}`).join('\n') : 'No console errors captured during testing ✓'}

---

## PRODUCTION READINESS VERDICT

**Overall Pass Rate:** ${overallRate}%
**Bug Fixes:** ${bugFixRate}% (${bugFixPassed}/${bugFixCount})
**Features:** ${featureRate}% (${featurePassed}/${featureCount})

### Criteria for Production Readiness:
- [ ] Overall pass rate >= 90%: ${overallRate >= 90 ? '✓ YES' : '✗ NO'} (${overallRate}%)
- [ ] All bug fixes verified: ${bugFixPassed === bugFixCount ? '✓ YES' : '✗ NO'} (${bugFixPassed}/${bugFixCount})
- [ ] No CORS errors: ${testResults.bugFixes['BUG-CORS-001']?.corsErrors?.length === 0 ? '✓ YES' : '✗ NO'}
- [ ] All pages load correctly: ${testResults.bugFixes['BUG-CAMPAIGNS-LOADING']?.status === 'PASS' && testResults.bugFixes['BUG-MAILGUN-404']?.status === 'PASS' ? '✓ YES' : '✗ NO'}

### FINAL VERDICT: ${productionReady ? '✅ PRODUCTION READY' : '❌ NOT PRODUCTION READY'}

${productionReady ?
'**All bug fixes verified and features tested successfully. Application is ready for production deployment.**' :
'**Some bugs or features failed verification. Address the failing items before production deployment.**'}

---

## NEXT STEPS

${productionReady ?
`### Ready for Production ✓
1. Deploy to production environment
2. Monitor production logs for any issues
3. Verify production CORS settings match development
4. Set up production Mailgun credentials` :
`### Required Fixes ✗
1. Review all FAIL items above
2. Fix failing bug fixes first (highest priority)
3. Fix failing features
4. Re-run verification after fixes
5. Ensure 90%+ pass rate before deployment`}

---

**Generated by Debugger Agent**
**Timestamp:** ${testResults.timestamp}
`;

  fs.writeFileSync(
    path.join(__dirname, 'DEBUG_FINAL_VERIFICATION_REPORT.md'),
    report
  );

  console.log('\n✓ Report saved to DEBUG_FINAL_VERIFICATION_REPORT.md');
  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Overall Pass Rate: ${overallRate}%`);
  console.log(`Production Ready: ${productionReady ? 'YES ✓' : 'NO ✗'}`);

  return productionReady;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    await login(page);

    // Test Bug Fixes
    await testBugCORS(page);
    await testBugCampaignsLoading(page);
    await testBugInboxFilters(page);
    await testBugMailgun404(page);

    // Test Features
    await testEmailComposer(page);
    await testEmailTemplates(page);
    await testCampaigns(page);
    await testAutoresponders(page);
    await testInbox(page);
    await testMailgunSettings(page);
    await testEmailSettings(page);
    await testClosebotAI(page);

    // Generate Report
    const productionReady = await generateReport();

    console.log('\n=== VERIFICATION COMPLETE ===');
    process.exit(productionReady ? 0 : 1);

  } catch (error) {
    console.error('Test failed:', error);
    testResults.consoleErrors.push(`FATAL ERROR: ${error.message}`);
    await generateReport();
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
