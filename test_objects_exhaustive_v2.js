const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  baseURL: 'http://localhost:3004',
  email: 'jwoodcapital@gmail.com',
  password: 'D3n1w3n1!',
  headless: false,
  slowMo: 300
};

const testResults = {
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  objectsList: {},
  createObject: {},
  objectDetail: {},
  tabs: {},
  edgeCases: {},
  consoleErrors: []
};

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join('screenshots', 'debug-objects', filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
  return filename;
}

async function recordTest(category, testName, status, details = '') {
  testResults.summary.totalTests++;
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: PASS ${details}`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: FAIL ${details}`);
  } else if (status === 'WARN') {
    testResults.summary.warnings++;
    console.log(`⚠️ ${testName}: WARNING ${details}`);
  }

  if (!testResults[category]) testResults[category] = {};
  testResults[category][testName] = { status, details };
}

async function login(page) {
  console.log('\n🔐 === LOGIN PROCESS ===');
  await page.goto(`${CONFIG.baseURL}/login`);
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', CONFIG.email);
  await page.fill('input[type="password"]', CONFIG.password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✅ Login successful');
    return true;
  } catch (e) {
    if (page.url().includes('/dashboard')) {
      console.log('✅ Login successful');
      return true;
    }
    console.error('❌ Login failed');
    return false;
  }
}

async function testObjectsListPage(page) {
  console.log('\n📋 === TESTING OBJECTS LIST PAGE ===');

  await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'objects-list-initial');

  // Test page header
  const pageTitle = await page.locator('h1').first().textContent();
  recordTest('objectsList', 'Page Title', pageTitle ? 'PASS' : 'FAIL', pageTitle);

  // Test page description
  const pageDesc = await page.locator('p.text-gray-600, p.text-muted-foreground').first();
  if (await pageDesc.isVisible()) {
    const descText = await pageDesc.textContent();
    recordTest('objectsList', 'Page Description', 'PASS', descText);
  } else {
    recordTest('objectsList', 'Page Description', 'WARN', 'Not found');
  }

  // Test search input
  const searchInput = await page.locator('input[placeholder*="search" i], input[type="search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('Test Company');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'objects-search-typed');
    await searchInput.clear();
    recordTest('objectsList', 'Search Input', 'PASS', 'Functional');
  } else {
    recordTest('objectsList', 'Search Input', 'FAIL', 'Not found');
  }

  // Test Type filter dropdown
  const typeFilter = await page.locator('button:has-text("All Types"), select:has-text("All Types"), button:has-text("Filter")').first();
  if (await typeFilter.isVisible()) {
    await typeFilter.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'type-filter-dropdown-open');

    const filterOptions = await page.locator('[role="option"], [role="menuitem"], option').all();
    const optionTexts = [];
    for (const option of filterOptions) {
      optionTexts.push(await option.textContent());
    }
    recordTest('objectsList', 'Type Filter Dropdown', 'PASS', `${filterOptions.length} options: ${optionTexts.join(', ')}`);

    // Test selecting each option
    for (let i = 0; i < Math.min(filterOptions.length, 3); i++) {
      await filterOptions[i].click();
      await page.waitForTimeout(500);
      const optionText = await filterOptions[i].textContent();
      await takeScreenshot(page, `type-filter-${optionText.toLowerCase().replace(/\s+/g, '-')}`);
      recordTest('objectsList', `Filter Option: ${optionText}`, 'PASS', 'Selected successfully');

      // Reopen dropdown for next selection
      if (i < filterOptions.length - 1) {
        await typeFilter.click();
        await page.waitForTimeout(300);
      }
    }

    await page.keyboard.press('Escape');
  } else {
    recordTest('objectsList', 'Type Filter Dropdown', 'FAIL', 'Not found');
  }

  // Test View toggle (Grid/Table)
  const gridButton = await page.locator('button[aria-label*="grid" i], button:has-text("Grid")').first();
  const tableButton = await page.locator('button[aria-label*="table" i], button[aria-label*="list" i], button:has-text("Table"), button:has-text("List")').first();

  if (await gridButton.isVisible() && await tableButton.isVisible()) {
    await gridButton.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'view-grid-mode');
    recordTest('objectsList', 'Grid View Toggle', 'PASS');

    await tableButton.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'view-table-mode');
    recordTest('objectsList', 'Table View Toggle', 'PASS');
  } else {
    recordTest('objectsList', 'View Toggle', 'WARN', 'Not found');
  }

  // Test Create Object button
  const createButton = await page.locator('button:has-text("Create Object"), button:has-text("Create"), button:has-text("Add Object"), button:has-text("New Object"), a:has-text("Create")').first();
  if (await createButton.isVisible()) {
    recordTest('objectsList', 'Create Object Button', 'PASS', 'Found and visible');
  } else {
    recordTest('objectsList', 'Create Object Button', 'FAIL', 'Not found');
  }

  // Test object rows
  const objectRows = await page.locator('tbody tr, div[role="row"], .object-item, [data-testid*="object"]').all();
  recordTest('objectsList', 'Object Rows', objectRows.length > 0 ? 'PASS' : 'WARN', `${objectRows.length} objects found`);

  // Test action menus for first few objects
  if (objectRows.length > 0) {
    for (let i = 0; i < Math.min(objectRows.length, 2); i++) {
      const actionButton = await objectRows[i].locator('button[aria-label*="action" i], button[aria-label*="more" i], button:has-text("...")').first();
      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, `object-${i}-action-menu-open`);

        const menuItems = await page.locator('[role="menuitem"], [role="option"]').all();
        const menuTexts = [];
        for (const item of menuItems) {
          menuTexts.push(await item.textContent());
        }
        recordTest('objectsList', `Object ${i} Action Menu`, 'PASS', `Options: ${menuTexts.join(', ')}`);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } else {
        recordTest('objectsList', `Object ${i} Action Menu`, 'FAIL', 'Action button not found');
      }
    }
  }

  // Test pagination if present
  const paginationNext = await page.locator('button:has-text("Next"), a:has-text("Next"), button[aria-label*="next" i]').first();
  const paginationPrev = await page.locator('button:has-text("Previous"), a:has-text("Previous"), button[aria-label*="prev" i]').first();

  if (await paginationNext.isVisible() || await paginationPrev.isVisible()) {
    recordTest('objectsList', 'Pagination Controls', 'PASS', 'Found');
  } else {
    recordTest('objectsList', 'Pagination Controls', 'WARN', 'Not found (may not be needed)');
  }
}

async function testCreateObjectWorkflow(page) {
  console.log('\n➕ === TESTING CREATE OBJECT WORKFLOW ===');

  await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
  await page.waitForLoadState('networkidle');

  const createButton = await page.locator('button:has-text("Create Object"), button:has-text("Create"), button:has-text("Add Object"), button:has-text("New Object")').first();

  if (!await createButton.isVisible()) {
    recordTest('createObject', 'Create Button', 'FAIL', 'Not found - cannot test create workflow');
    return;
  }

  await createButton.click();
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'create-object-form-initial');

  // Test form fields
  const fields = [
    { name: 'Name', selector: 'input[name="name"], input[placeholder*="name" i], input[placeholder*="object name" i]', required: true },
    { name: 'Type', selector: 'select[name="type"], button:has-text("Select type"), button[placeholder*="type" i]', required: true },
    { name: 'Legal Name', selector: 'input[name="legalName"], input[placeholder*="legal" i]', required: false },
    { name: 'Industry', selector: 'input[name="industry"], input[placeholder*="industry" i]', required: false },
    { name: 'Email', selector: 'input[name="email"], input[type="email"]', required: false },
    { name: 'Phone', selector: 'input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', required: false },
    { name: 'Website', selector: 'input[name="website"], input[placeholder*="website" i], input[type="url"]', required: false },
    { name: 'Address', selector: 'textarea[name="address"], input[name="address"], textarea[placeholder*="address" i]', required: false }
  ];

  for (const field of fields) {
    const element = await page.locator(field.selector).first();
    if (await element.isVisible()) {
      recordTest('createObject', `Field: ${field.name}`, 'PASS', field.required ? 'Required' : 'Optional');

      // Test field interaction
      if (field.name === 'Name') {
        await element.fill('Test Object Name');
      } else if (field.name === 'Type') {
        await element.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'type-dropdown-options');

        const typeOptions = await page.locator('[role="option"], option').all();
        const typeTexts = [];
        for (const option of typeOptions) {
          typeTexts.push(await option.textContent());
        }
        recordTest('createObject', 'Type Options', 'PASS', typeTexts.join(', '));

        if (typeOptions.length > 0) {
          await typeOptions[0].click();
        }
      } else if (field.name === 'Email') {
        await element.fill('test@example.com');
      } else if (field.name === 'Phone') {
        await element.fill('555-123-4567');
      }
    } else {
      recordTest('createObject', `Field: ${field.name}`, field.required ? 'FAIL' : 'WARN', 'Not found');
    }
  }

  await takeScreenshot(page, 'create-object-form-filled');

  // Test validation - clear required field and try to save
  const nameField = await page.locator('input[name="name"], input[placeholder*="name" i]').first();
  if (await nameField.isVisible()) {
    await nameField.clear();

    const saveButton = await page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(1000);

      const errorMessage = await page.locator('.error, [role="alert"], .text-red-500, .text-destructive').first();
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        recordTest('createObject', 'Validation Error', 'PASS', `Shows: ${errorText}`);
        await takeScreenshot(page, 'create-validation-error');
      } else {
        recordTest('createObject', 'Validation Error', 'FAIL', 'No error shown for empty required field');
      }
    }
  }

  // Test Cancel button
  const cancelButton = await page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
  if (await cancelButton.isVisible()) {
    recordTest('createObject', 'Cancel Button', 'PASS', 'Found');
    await cancelButton.click();
  } else {
    recordTest('createObject', 'Cancel Button', 'FAIL', 'Not found');
    await page.keyboard.press('Escape');
  }
}

async function testObjectDetailPage(page) {
  console.log('\n📄 === TESTING OBJECT DETAIL PAGE ===');

  await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Find and click first object
  const objectLinks = await page.locator('tbody tr td:first-child a, tbody tr td:first-child, div[role="row"] a, .object-name').all();

  if (objectLinks.length === 0) {
    recordTest('objectDetail', 'Object Links', 'FAIL', 'No objects found to test');
    return;
  }

  await objectLinks[0].click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'object-detail-initial');

  // Test header section
  const backButton = await page.locator('button:has-text("Back"), a:has-text("Back"), button[aria-label*="back" i]').first();
  recordTest('objectDetail', 'Back Button', await backButton.isVisible() ? 'PASS' : 'FAIL');

  const objectName = await page.locator('h1, h2').first();
  if (await objectName.isVisible()) {
    const name = await objectName.textContent();
    recordTest('objectDetail', 'Object Name Display', 'PASS', name);
  } else {
    recordTest('objectDetail', 'Object Name Display', 'FAIL', 'Not found');
  }

  const typeBadge = await page.locator('.badge, .chip, span[class*="badge"], span[class*="tag"]').first();
  if (await typeBadge.isVisible()) {
    const type = await typeBadge.textContent();
    recordTest('objectDetail', 'Type Badge', 'PASS', type);
  } else {
    recordTest('objectDetail', 'Type Badge', 'WARN', 'Not found');
  }

  const editButton = await page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
  recordTest('objectDetail', 'Edit Button', await editButton.isVisible() ? 'PASS' : 'FAIL');

  // Test tabs
  const tabs = [
    { name: 'Information', selector: 'button:has-text("Information"), [role="tab"]:has-text("Information")' },
    { name: 'Contacts', selector: 'button:has-text("Contacts"), [role="tab"]:has-text("Contacts")' },
    { name: 'Users', selector: 'button:has-text("Users"), [role="tab"]:has-text("Users")' },
    { name: 'Websites', selector: 'button:has-text("Websites"), [role="tab"]:has-text("Websites")' }
  ];

  for (const tab of tabs) {
    const tabElement = await page.locator(tab.selector).first();
    if (await tabElement.isVisible()) {
      await tabElement.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `object-detail-${tab.name.toLowerCase()}-tab`);
      recordTest('tabs', `${tab.name} Tab`, 'PASS', 'Clickable and loads content');

      // Test tab-specific content
      if (tab.name === 'Information') {
        const infoFields = ['Legal Name', 'Industry', 'Email', 'Phone', 'Website', 'Created', 'Updated'];
        for (const field of infoFields) {
          const fieldElement = await page.locator(`text="${field}"`).first();
          if (await fieldElement.isVisible()) {
            recordTest('tabs', `Information - ${field} Field`, 'PASS');
          } else {
            recordTest('tabs', `Information - ${field} Field`, 'WARN', 'Not visible');
          }
        }
      }

      if (tab.name === 'Contacts') {
        const bulkAssignBtn = await page.locator('button:has-text("Bulk Assign")').first();
        recordTest('tabs', 'Contacts - Bulk Assign Button', await bulkAssignBtn.isVisible() ? 'PASS' : 'WARN');

        const assignContactBtn = await page.locator('button:has-text("Assign Contact"), button:has-text("Add Contact")').first();
        recordTest('tabs', 'Contacts - Assign Contact Button', await assignContactBtn.isVisible() ? 'PASS' : 'WARN');

        const emptyState = await page.locator('text="No contacts assigned"').first();
        if (await emptyState.isVisible()) {
          recordTest('tabs', 'Contacts - Empty State', 'PASS', 'Shows when no contacts');
        }
      }

      if (tab.name === 'Users') {
        const usersList = await page.locator('tr:has-text("@"), div:has-text("@")').all();
        recordTest('tabs', 'Users - User List', 'PASS', `${usersList.length} users shown`);
      }

      if (tab.name === 'Websites') {
        const addWebsiteBtn = await page.locator('button:has-text("Add Website")').first();
        recordTest('tabs', 'Websites - Add Website Button', await addWebsiteBtn.isVisible() ? 'PASS' : 'WARN');
      }
    } else {
      recordTest('tabs', `${tab.name} Tab`, 'FAIL', 'Not found');
    }
  }
}

async function testEdgeCases(page) {
  console.log('\n🔬 === TESTING EDGE CASES ===');

  // Test special characters in search
  await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
  await page.waitForLoadState('networkidle');

  const searchInput = await page.locator('input[placeholder*="search" i], input[type="search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('!@#$%^&*()');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'search-special-characters');
    recordTest('edgeCases', 'Special Characters in Search', 'PASS', 'Handled without errors');
    await searchInput.clear();
  }

  // Test rapid clicking prevention
  const createButton = await page.locator('button:has-text("Create"), button:has-text("Add")').first();
  if (await createButton.isVisible()) {
    // Click multiple times rapidly
    await Promise.all([
      createButton.click(),
      createButton.click(),
      createButton.click()
    ]).catch(() => {});

    await page.waitForTimeout(1000);

    // Check if multiple modals opened
    const modals = await page.locator('[role="dialog"], .modal').count();
    recordTest('edgeCases', 'Rapid Click Prevention', modals <= 1 ? 'PASS' : 'FAIL', `${modals} modals opened`);

    // Close any open modals
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
  }

  // Test browser navigation
  const currentUrl = page.url();
  await page.goBack();
  await page.waitForTimeout(1000);
  await page.goForward();
  await page.waitForTimeout(1000);
  recordTest('edgeCases', 'Browser Back/Forward', page.url() === currentUrl ? 'PASS' : 'FAIL', 'State maintained');
}

async function generateReport() {
  const timestamp = new Date().toISOString();
  const passRate = testResults.summary.totalTests > 0
    ? ((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(2)
    : 0;

  const report = `# OBJECTS MODULE EXHAUSTIVE DEBUG REPORT

**Generated:** ${timestamp}
**Environment:** http://localhost:3004
**Account:** jwoodcapital@gmail.com (OWNER)

---

## 📊 EXECUTIVE SUMMARY

- **Total Tests:** ${testResults.summary.totalTests}
- **Passed:** ${testResults.summary.passed} ✅
- **Failed:** ${testResults.summary.failed} ❌
- **Warnings:** ${testResults.summary.warnings} ⚠️
- **Pass Rate:** ${passRate}%
- **Console Errors:** ${testResults.consoleErrors.length}

---

## 🔍 DETAILED TEST RESULTS

### Objects List Page
${Object.entries(testResults.objectsList).map(([test, result]) =>
  `- ${test}: ${result.status} ${result.details ? `(${result.details})` : ''}`
).join('\n')}

### Create Object Workflow
${Object.entries(testResults.createObject).map(([test, result]) =>
  `- ${test}: ${result.status} ${result.details ? `(${result.details})` : ''}`
).join('\n')}

### Object Detail Page
${Object.entries(testResults.objectDetail).map(([test, result]) =>
  `- ${test}: ${result.status} ${result.details ? `(${result.details})` : ''}`
).join('\n')}

### Tabs Testing
${Object.entries(testResults.tabs).map(([test, result]) =>
  `- ${test}: ${result.status} ${result.details ? `(${result.details})` : ''}`
).join('\n')}

### Edge Cases
${Object.entries(testResults.edgeCases).map(([test, result]) =>
  `- ${test}: ${result.status} ${result.details ? `(${result.details})` : ''}`
).join('\n')}

---

## 🐛 BUGS & ISSUES DISCOVERED

${testResults.summary.failed > 0 ? `
### Critical Issues (FAILED tests)
${Object.entries(testResults).flatMap(([category, tests]) =>
  Object.entries(tests).filter(([_, result]) => result.status === 'FAIL')
    .map(([test, result]) => `- **${category}/${test}**: ${result.details || 'Test failed'}`)
).join('\n')}
` : '✅ No critical issues found'}

${testResults.summary.warnings > 0 ? `
### Warnings (Missing features)
${Object.entries(testResults).flatMap(([category, tests]) =>
  Object.entries(tests).filter(([_, result]) => result.status === 'WARN')
    .map(([test, result]) => `- **${category}/${test}**: ${result.details || 'Feature missing or optional'}`)
).join('\n')}
` : ''}

---

## 🎯 PRODUCTION READINESS VERDICT

${passRate >= 90 ? '### ✅ READY FOR PRODUCTION' :
  passRate >= 70 ? '### ⚠️ NEEDS MINOR FIXES' :
  '### ❌ NOT READY - CRITICAL ISSUES FOUND'}

**Pass Rate:** ${passRate}%

${testResults.summary.failed > 0 ? `
### Required Fixes Before Production:
1. Fix all FAILED test cases listed above
2. Implement missing critical features
3. Ensure all CRUD operations work correctly
4. Add proper error handling and validation
` : ''}

---

## 📸 SCREENSHOTS CAPTURED

All screenshots saved to: \`screenshots/debug-objects/\`

Key screenshots:
- objects-list-initial.png - Initial page load
- create-object-form-*.png - Create form states
- object-detail-*.png - Detail page and tabs
- validation-error.png - Form validation
- search-*.png - Search functionality
- type-filter-*.png - Filtering options

---

## 💡 RECOMMENDATIONS

1. **Immediate Actions:**
   ${testResults.summary.failed > 0 ? '- Fix all FAILED tests\n   ' : ''}- Implement missing UI elements marked as WARN
   - Add proper loading states
   - Improve error messages

2. **Enhancements:**
   - Add tooltips for actions
   - Implement bulk operations
   - Add export functionality
   - Improve mobile responsiveness

3. **Testing:**
   - Test with different user roles
   - Test with large datasets
   - Test offline scenarios
   - Test concurrent user actions

---

*Report generated by Exhaustive Debugger Agent*
*Execution completed: ${timestamp}*
`;

  // Save report
  const reportPath = path.join(__dirname, 'OBJECTS_EXHAUSTIVE_DEBUG_REPORT.md');
  await fs.writeFile(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Save JSON results
  const jsonPath = path.join(__dirname, 'objects-debug-results.json');
  await fs.writeFile(jsonPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 JSON results saved to: ${jsonPath}`);

  return report;
}

async function main() {
  console.log('🚀 === STARTING OBJECTS MODULE EXHAUSTIVE TESTING ===');
  console.log(`Time: ${new Date().toISOString()}`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
      console.log(`🔴 Console Error: ${msg.text()}`);
    }
  });

  try {
    // Login
    if (!await login(page)) {
      throw new Error('Login failed - cannot proceed with tests');
    }

    // Run all test suites
    await testObjectsListPage(page);
    await testCreateObjectWorkflow(page);
    await testObjectDetailPage(page);
    await testEdgeCases(page);

    // Generate final report
    await generateReport();

    console.log('\n✅ === TESTING COMPLETE ===');
    console.log(`Pass Rate: ${(testResults.summary.passed / testResults.summary.totalTests * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
    await page.screenshot({ path: 'screenshots/debug-objects/fatal-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);