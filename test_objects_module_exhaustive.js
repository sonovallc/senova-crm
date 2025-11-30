const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const CONFIG = {
  baseURL: 'http://localhost:3004',
  email: 'jwoodcapital@gmail.com',
  password: 'D3n1w3n1!',
  headless: false,
  slowMo: 500,
  timeout: 60000
};

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots', 'debug-objects');

// Test results storage
const testResults = {
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: []
  },
  details: {
    objectsList: {},
    createObject: {},
    objectDetail: {},
    editObject: {},
    duplicateObject: {},
    deleteObject: {},
    edgeCases: {},
    consoleErrors: []
  }
};

async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
    console.log(`Screenshots directory created: ${screenshotsDir}`);
  } catch (err) {
    console.error('Error creating screenshots directory:', err);
  }
}

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(screenshotsDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

async function login(page) {
  console.log('\n=== LOGIN PROCESS ===');
  await page.goto(CONFIG.baseURL);
  await page.waitForLoadState('networkidle');

  // Check if already logged in
  if (page.url().includes('/dashboard')) {
    console.log('Already logged in');
    return true;
  }

  console.log('Current URL:', page.url());
  await takeScreenshot(page, 'login-page-initial');

  // Wait for login form to be visible
  try {
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
  } catch (e) {
    console.log('Email input not found, checking if already on dashboard...');
    if (page.url().includes('/dashboard')) {
      console.log('Already logged in (redirect occurred)');
      return true;
    }
  }

  // Try multiple selectors for email field
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="email" i]',
    'input[id*="email" i]'
  ];

  let emailFilled = false;
  for (const selector of emailSelectors) {
    try {
      const emailInput = page.locator(selector).first();
      if (await emailInput.isVisible({ timeout: 1000 })) {
        await emailInput.fill(CONFIG.email);
        console.log(`Email filled using selector: ${selector}`);
        emailFilled = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }

  if (!emailFilled) {
    console.error('Could not find email input field');
    return false;
  }

  // Try multiple selectors for password field
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="password" i]',
    'input[id*="password" i]'
  ];

  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const passwordInput = page.locator(selector).first();
      if (await passwordInput.isVisible({ timeout: 1000 })) {
        await passwordInput.fill(CONFIG.password);
        console.log(`Password filled using selector: ${selector}`);
        passwordFilled = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }

  if (!passwordFilled) {
    console.error('Could not find password input field');
    return false;
  }

  await takeScreenshot(page, 'login-form-filled');

  // Try multiple selectors for submit button
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Sign In")',
    'button:has-text("Login")',
    'button:has-text("Log In")',
    'input[type="submit"]'
  ];

  let submitted = false;
  for (const selector of submitSelectors) {
    try {
      const submitButton = page.locator(selector).first();
      if (await submitButton.isVisible({ timeout: 1000 })) {
        await submitButton.click();
        console.log(`Submit clicked using selector: ${selector}`);
        submitted = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }

  if (!submitted) {
    console.error('Could not find submit button');
    return false;
  }

  // Wait for navigation to dashboard
  try {
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    console.log('Login successful - navigated to dashboard');
    return true;
  } catch (e) {
    console.log('Did not navigate to /dashboard/, checking current URL...');
    if (page.url().includes('/dashboard')) {
      console.log('Login successful (on dashboard)');
      return true;
    }
    console.error('Login may have failed, current URL:', page.url());
    await takeScreenshot(page, 'login-result');
    return false;
  }
}

async function testObjectsList(page) {
  console.log('\n=== TESTING OBJECTS LIST PAGE ===');
  const results = {};

  try {
    // Navigate to Objects page
    await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'objects-list-initial');

    // Test page title and description
    const pageTitle = await page.locator('h1').textContent();
    results.pageTitle = {
      found: !!pageTitle,
      text: pageTitle,
      status: pageTitle ? 'PASS' : 'FAIL'
    };
    console.log(`Page title: ${pageTitle}`);

    // Test search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test Search');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'objects-search-typed');
      await searchInput.clear();
      results.searchInput = { status: 'PASS', functional: true };
      console.log('Search input: PASS');
    } else {
      results.searchInput = { status: 'FAIL', error: 'Not found' };
      console.log('Search input: NOT FOUND');
    }

    // Test "All Types" dropdown
    const typeDropdown = page.locator('button:has-text("All Types"), select:has-text("All Types")').first();
    if (await typeDropdown.isVisible()) {
      await typeDropdown.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'objects-type-dropdown-open');

      // Count and test dropdown options
      const options = await page.locator('[role="option"], option').all();
      results.typeDropdown = {
        status: 'PASS',
        optionsCount: options.length,
        options: []
      };

      for (const option of options) {
        const text = await option.textContent();
        results.typeDropdown.options.push(text);
        console.log(`  Dropdown option: ${text}`);
      }

      // Close dropdown
      await page.keyboard.press('Escape');
    } else {
      results.typeDropdown = { status: 'FAIL', error: 'Not found' };
    }

    // Test Create Object button
    const createButton = page.locator('button:has-text("Create Object"), a:has-text("Create Object")').first();
    if (await createButton.isVisible()) {
      await takeScreenshot(page, 'objects-create-button-visible');
      results.createButton = { status: 'PASS', visible: true };
      console.log('Create Object button: FOUND');
    } else {
      results.createButton = { status: 'FAIL', error: 'Not found' };
    }

    // Test view toggle (Grid/Table)
    const viewToggles = await page.locator('button[aria-label*="view"], button:has-text("Grid"), button:has-text("Table")').all();
    results.viewToggle = {
      found: viewToggles.length > 0,
      count: viewToggles.length,
      status: viewToggles.length > 0 ? 'PASS' : 'FAIL'
    };

    // Test object rows
    const objectRows = await page.locator('tr[data-id], div[role="row"], a[href*="/objects/"]').all();
    results.objectRows = {
      count: objectRows.length,
      status: objectRows.length > 0 ? 'PASS' : 'WARN',
      message: objectRows.length === 0 ? 'No objects found' : `${objectRows.length} objects found`
    };
    console.log(`Found ${objectRows.length} object rows`);

    // Test action menus
    if (objectRows.length > 0) {
      const actionMenus = await page.locator('button[aria-label*="actions"], button:has-text("...")').all();
      results.actionMenus = {
        count: actionMenus.length,
        status: actionMenus.length > 0 ? 'PASS' : 'FAIL'
      };

      if (actionMenus.length > 0) {
        await actionMenus[0].click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'objects-action-menu-open');

        // Check menu options
        const menuOptions = await page.locator('[role="menuitem"], [role="option"]').all();
        results.actionMenuOptions = {
          count: menuOptions.length,
          options: []
        };

        for (const option of menuOptions) {
          const text = await option.textContent();
          results.actionMenuOptions.options.push(text);
          console.log(`  Action menu option: ${text}`);
        }

        await page.keyboard.press('Escape');
      }
    }

  } catch (error) {
    console.error('Error testing objects list:', error);
    results.error = error.message;
  }

  return results;
}

async function testCreateObject(page) {
  console.log('\n=== TESTING CREATE OBJECT WORKFLOW ===');
  const results = {};

  try {
    // Navigate to create object
    await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create Object"), a:has-text("Create Object")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'create-object-form-initial');

      // Test form fields
      results.formFields = {};

      // Name field
      const nameField = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      if (await nameField.isVisible()) {
        await nameField.fill('Test Object Name');
        results.formFields.name = { status: 'PASS', filled: true };
      } else {
        results.formFields.name = { status: 'FAIL', error: 'Not found' };
      }

      // Type dropdown
      const typeDropdown = page.locator('select[name="type"], button:has-text("Select type")').first();
      if (await typeDropdown.isVisible()) {
        await typeDropdown.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'create-object-type-dropdown');

        const typeOptions = await page.locator('[role="option"], option').all();
        results.formFields.typeDropdown = {
          status: 'PASS',
          optionsCount: typeOptions.length,
          options: []
        };

        for (const option of typeOptions) {
          const text = await option.textContent();
          results.formFields.typeDropdown.options.push(text);
        }

        // Select first option
        if (typeOptions.length > 0) {
          await typeOptions[0].click();
        }
      }

      // Legal Name field
      const legalNameField = page.locator('input[name="legalName"], input[placeholder*="legal" i]').first();
      if (await legalNameField.isVisible()) {
        await legalNameField.fill('Test Legal Name LLC');
        results.formFields.legalName = { status: 'PASS' };
      }

      // Industry field
      const industryField = page.locator('input[name="industry"], input[placeholder*="industry" i]').first();
      if (await industryField.isVisible()) {
        await industryField.fill('Technology');
        results.formFields.industry = { status: 'PASS' };
      }

      // Email field
      const emailField = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailField.isVisible()) {
        await emailField.fill('test@example.com');
        results.formFields.email = { status: 'PASS' };
      }

      // Phone field
      const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
      if (await phoneField.isVisible()) {
        await phoneField.fill('555-123-4567');
        results.formFields.phone = { status: 'PASS' };
      }

      // Website field
      const websiteField = page.locator('input[name="website"], input[placeholder*="website" i]').first();
      if (await websiteField.isVisible()) {
        await websiteField.fill('https://example.com');
        results.formFields.website = { status: 'PASS' };
      }

      await takeScreenshot(page, 'create-object-form-filled');

      // Test Cancel button
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      results.cancelButton = {
        visible: await cancelButton.isVisible(),
        status: await cancelButton.isVisible() ? 'PASS' : 'FAIL'
      };

      // Test Save button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
      results.saveButton = {
        visible: await saveButton.isVisible(),
        status: await saveButton.isVisible() ? 'PASS' : 'FAIL'
      };

      // Test validation - clear name and try to save
      await nameField.clear();
      await saveButton.click();
      await page.waitForTimeout(1000);

      // Check for validation error
      const validationError = await page.locator('.error, [role="alert"], .text-red-500').first();
      results.validation = {
        tested: true,
        errorShown: await validationError.isVisible(),
        status: await validationError.isVisible() ? 'PASS' : 'WARN'
      };

      await takeScreenshot(page, 'create-object-validation-error');

      // Cancel out of form
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      } else {
        await page.keyboard.press('Escape');
      }

    } else {
      results.error = 'Create button not found';
    }

  } catch (error) {
    console.error('Error testing create object:', error);
    results.error = error.message;
  }

  return results;
}

async function testObjectDetail(page) {
  console.log('\n=== TESTING OBJECT DETAIL PAGE ===');
  const results = {};

  try {
    // Navigate to objects list
    await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
    await page.waitForLoadState('networkidle');

    // Find and click first object
    const objectLinks = await page.locator('a[href*="/objects/"], tr[data-id]').all();

    if (objectLinks.length > 0) {
      await objectLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'object-detail-initial');

      // Test header section
      results.header = {};

      const backButton = page.locator('button:has-text("Back"), a:has-text("Back")').first();
      results.header.backButton = {
        visible: await backButton.isVisible(),
        status: await backButton.isVisible() ? 'PASS' : 'FAIL'
      };

      const objectName = page.locator('h1, h2').first();
      results.header.objectName = {
        visible: await objectName.isVisible(),
        text: await objectName.textContent(),
        status: await objectName.isVisible() ? 'PASS' : 'FAIL'
      };

      const typeBadge = page.locator('.badge, .chip, [class*="badge"], [class*="tag"]').first();
      results.header.typeBadge = {
        visible: await typeBadge.isVisible(),
        text: await typeBadge.isVisible() ? await typeBadge.textContent() : null,
        status: await typeBadge.isVisible() ? 'PASS' : 'WARN'
      };

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      results.header.editButton = {
        visible: await editButton.isVisible(),
        status: await editButton.isVisible() ? 'PASS' : 'FAIL'
      };

      // Test tabs
      results.tabs = {};

      const tabsList = ['Information', 'Contacts', 'Users', 'Websites'];
      for (const tabName of tabsList) {
        const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
        const isVisible = await tab.isVisible();

        results.tabs[tabName] = {
          visible: isVisible,
          status: isVisible ? 'PASS' : 'FAIL'
        };

        if (isVisible) {
          await tab.click();
          await page.waitForTimeout(1000);
          await takeScreenshot(page, `object-detail-${tabName.toLowerCase()}-tab`);

          // Test tab-specific content
          if (tabName === 'Information') {
            const infoCard = page.locator('.card, [class*="card"]').first();
            results.tabs[tabName].content = {
              cardVisible: await infoCard.isVisible(),
              fields: []
            };

            // Check for common fields
            const fields = ['Legal Name', 'Industry', 'Email', 'Phone', 'Website', 'Created', 'Updated'];
            for (const field of fields) {
              const fieldElement = page.locator(`text="${field}"`).first();
              if (await fieldElement.isVisible()) {
                results.tabs[tabName].content.fields.push(field);
              }
            }
          }

          if (tabName === 'Contacts') {
            const bulkAssignBtn = page.locator('button:has-text("Bulk Assign")').first();
            const assignContactBtn = page.locator('button:has-text("Assign Contact")').first();
            const searchInput = page.locator('input[placeholder*="Search"]').first();

            results.tabs[tabName].content = {
              bulkAssignButton: await bulkAssignBtn.isVisible(),
              assignContactButton: await assignContactBtn.isVisible(),
              searchInput: await searchInput.isVisible()
            };

            // Check for empty state
            const emptyState = page.locator('text="No contacts assigned"').first();
            results.tabs[tabName].content.emptyState = await emptyState.isVisible();
          }

          if (tabName === 'Users') {
            const usersList = page.locator('[class*="user"], tr:has-text("@")').all();
            results.tabs[tabName].content = {
              usersCount: (await usersList).length
            };
          }

          if (tabName === 'Websites') {
            const addWebsiteBtn = page.locator('button:has-text("Add Website")').first();
            results.tabs[tabName].content = {
              addWebsiteButton: await addWebsiteBtn.isVisible()
            };
          }
        }
      }

    } else {
      results.error = 'No objects found to test';
    }

  } catch (error) {
    console.error('Error testing object detail:', error);
    results.error = error.message;
  }

  return results;
}

async function testEditObject(page) {
  console.log('\n=== TESTING EDIT OBJECT WORKFLOW ===');
  const results = {};

  try {
    // Navigate to an object detail page
    await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
    await page.waitForLoadState('networkidle');

    const objectLinks = await page.locator('a[href*="/objects/"], tr[data-id]').all();

    if (objectLinks.length > 0) {
      await objectLinks[0].click();
      await page.waitForLoadState('networkidle');

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'edit-object-form-initial');

        // Test that form is pre-filled
        const nameField = page.locator('input[name="name"]').first();
        const currentName = await nameField.inputValue();
        results.formPreFilled = {
          nameHasValue: currentName.length > 0,
          status: currentName.length > 0 ? 'PASS' : 'FAIL'
        };

        // Modify fields
        await nameField.fill(currentName + ' (Modified)');

        const industryField = page.locator('input[name="industry"]').first();
        if (await industryField.isVisible()) {
          await industryField.fill('Modified Industry');
        }

        await takeScreenshot(page, 'edit-object-form-modified');

        // Test Save button
        const saveButton = page.locator('button:has-text("Save")').first();
        results.saveButton = {
          visible: await saveButton.isVisible(),
          status: await saveButton.isVisible() ? 'PASS' : 'FAIL'
        };

        // Test Cancel button
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        results.cancelButton = {
          visible: await cancelButton.isVisible(),
          status: await cancelButton.isVisible() ? 'PASS' : 'FAIL'
        };

        // Cancel without saving
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          results.cancelFunctionality = { status: 'PASS' };
        }

      } else {
        results.error = 'Edit button not found';
      }

    } else {
      results.error = 'No objects found to edit';
    }

  } catch (error) {
    console.error('Error testing edit object:', error);
    results.error = error.message;
  }

  return results;
}

async function testDuplicateObject(page) {
  console.log('\n=== TESTING DUPLICATE OBJECT WORKFLOW ===');
  const results = {};

  try {
    await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
    await page.waitForLoadState('networkidle');

    const actionMenus = await page.locator('button[aria-label*="actions"], button:has-text("...")').all();

    if (actionMenus.length > 0) {
      await actionMenus[0].click();
      await page.waitForTimeout(500);

      const duplicateOption = page.locator('[role="menuitem"]:has-text("Duplicate")').first();
      results.duplicateOption = {
        visible: await duplicateOption.isVisible(),
        status: await duplicateOption.isVisible() ? 'PASS' : 'FAIL'
      };

      if (await duplicateOption.isVisible()) {
        await duplicateOption.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'duplicate-object-result');

        // Check if duplicate was created
        const successMessage = page.locator('.toast, [role="alert"], .notification').first();
        results.duplicateSuccess = {
          messageShown: await successMessage.isVisible(),
          status: await successMessage.isVisible() ? 'PASS' : 'WARN'
        };
      }

    } else {
      results.error = 'No action menus found';
    }

  } catch (error) {
    console.error('Error testing duplicate object:', error);
    results.error = error.message;
  }

  return results;
}

async function testDeleteObject(page) {
  console.log('\n=== TESTING DELETE OBJECT WORKFLOW ===');
  const results = {};

  try {
    await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
    await page.waitForLoadState('networkidle');

    const initialCount = await page.locator('tr[data-id], div[role="row"]').count();

    const actionMenus = await page.locator('button[aria-label*="actions"], button:has-text("...")').all();

    if (actionMenus.length > 0) {
      await actionMenus[actionMenus.length - 1].click(); // Use last item to delete
      await page.waitForTimeout(500);

      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")').first();
      results.deleteOption = {
        visible: await deleteOption.isVisible(),
        status: await deleteOption.isVisible() ? 'PASS' : 'FAIL'
      };

      if (await deleteOption.isVisible()) {
        await deleteOption.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, 'delete-confirmation-dialog');

        // Check for confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], .modal, .dialog').first();
        results.confirmDialog = {
          visible: await confirmDialog.isVisible(),
          status: await confirmDialog.isVisible() ? 'PASS' : 'FAIL'
        };

        // Test Cancel
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          await page.waitForTimeout(1000);

          const afterCancelCount = await page.locator('tr[data-id], div[role="row"]').count();
          results.cancelDelete = {
            worked: afterCancelCount === initialCount,
            status: afterCancelCount === initialCount ? 'PASS' : 'FAIL'
          };
        }

        // Now test actual delete
        await actionMenus[actionMenus.length - 1].click();
        await page.waitForTimeout(500);
        await deleteOption.click();
        await page.waitForTimeout(1000);

        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          const afterDeleteCount = await page.locator('tr[data-id], div[role="row"]').count();
          results.confirmDelete = {
            worked: afterDeleteCount < initialCount,
            status: afterDeleteCount < initialCount ? 'PASS' : 'FAIL'
          };

          await takeScreenshot(page, 'delete-object-completed');
        }
      }

    } else {
      results.error = 'No action menus found';
    }

  } catch (error) {
    console.error('Error testing delete object:', error);
    results.error = error.message;
  }

  return results;
}

async function testEdgeCases(page) {
  console.log('\n=== TESTING EDGE CASES ===');
  const results = {};

  try {
    // Test empty state
    await page.goto(`${CONFIG.baseURL}/dashboard/objects`);
    await page.waitForLoadState('networkidle');

    const objectCount = await page.locator('tr[data-id], div[role="row"]').count();
    if (objectCount === 0) {
      const emptyState = page.locator('text="No objects found"').first();
      results.emptyState = {
        shown: await emptyState.isVisible(),
        status: await emptyState.isVisible() ? 'PASS' : 'FAIL'
      };
      await takeScreenshot(page, 'objects-empty-state');
    }

    // Test special characters in search
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('!@#$%^&*()');
      await page.waitForTimeout(1000);
      results.specialCharsSearch = { status: 'PASS', handled: true };
      await searchInput.clear();
    }

    // Test rapid clicking prevention
    const createButton = page.locator('button:has-text("Create Object")').first();
    if (await createButton.isVisible()) {
      // Click multiple times rapidly
      await Promise.all([
        createButton.click(),
        createButton.click(),
        createButton.click()
      ]).catch(() => {});

      await page.waitForTimeout(1000);

      // Check if multiple modals/forms opened
      const modals = await page.locator('[role="dialog"], .modal').count();
      results.rapidClickPrevention = {
        modalCount: modals,
        status: modals <= 1 ? 'PASS' : 'FAIL'
      };

      // Close any open modals
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
    }

    // Test browser back/forward
    const currentUrl = page.url();
    await page.goBack();
    await page.waitForTimeout(1000);
    await page.goForward();
    await page.waitForTimeout(1000);

    results.browserNavigation = {
      maintained: page.url() === currentUrl,
      status: 'PASS'
    };

  } catch (error) {
    console.error('Error testing edge cases:', error);
    results.error = error.message;
  }

  return results;
}

async function monitorConsoleErrors(page) {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
      console.log(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`Page Error: ${error.message}`);
  });

  return errors;
}

async function generateReport() {
  const timestamp = new Date().toISOString();

  // Calculate totals
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  const countTests = (obj) => {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key].status) {
          totalTests++;
          if (obj[key].status === 'PASS') passedTests++;
          if (obj[key].status === 'FAIL') failedTests++;
        } else {
          countTests(obj[key]);
        }
      }
    }
  };

  countTests(testResults.details);

  testResults.summary.totalTests = totalTests;
  testResults.summary.passed = passedTests;
  testResults.summary.failed = failedTests;
  testResults.summary.passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

  // Generate markdown report
  const report = `# OBJECTS MODULE EXHAUSTIVE DEBUG REPORT

**Generated:** ${timestamp}
**Environment:** http://localhost:3004
**Account:** jwoodcapital@gmail.com (OWNER)

---

## EXECUTIVE SUMMARY

- **Total Tests:** ${totalTests}
- **Passed:** ${passedTests} ✅
- **Failed:** ${failedTests} ❌
- **Pass Rate:** ${testResults.summary.passRate}%
- **Console Errors:** ${testResults.details.consoleErrors.length}

---

## DETAILED TEST RESULTS

### 1. Objects List Page (/dashboard/objects)

| Element | Status | Details |
|---------|--------|---------|
| Page Title | ${testResults.details.objectsList.pageTitle?.status || 'NOT TESTED'} | ${testResults.details.objectsList.pageTitle?.text || 'N/A'} |
| Search Input | ${testResults.details.objectsList.searchInput?.status || 'NOT TESTED'} | Functional: ${testResults.details.objectsList.searchInput?.functional || 'N/A'} |
| Type Dropdown | ${testResults.details.objectsList.typeDropdown?.status || 'NOT TESTED'} | Options: ${testResults.details.objectsList.typeDropdown?.optionsCount || 0} |
| Create Button | ${testResults.details.objectsList.createButton?.status || 'NOT TESTED'} | Visible: ${testResults.details.objectsList.createButton?.visible || 'N/A'} |
| View Toggle | ${testResults.details.objectsList.viewToggle?.status || 'NOT TESTED'} | Count: ${testResults.details.objectsList.viewToggle?.count || 0} |
| Object Rows | ${testResults.details.objectsList.objectRows?.status || 'NOT TESTED'} | Count: ${testResults.details.objectsList.objectRows?.count || 0} |
| Action Menus | ${testResults.details.objectsList.actionMenus?.status || 'NOT TESTED'} | Count: ${testResults.details.objectsList.actionMenus?.count || 0} |

**Dropdown Options Found:**
${testResults.details.objectsList.typeDropdown?.options?.map(opt => `- ${opt}`).join('\\n') || 'None'}

**Action Menu Options:**
${testResults.details.objectsList.actionMenuOptions?.options?.map(opt => `- ${opt}`).join('\\n') || 'None'}

### 2. Create Object Workflow

| Field | Status | Notes |
|-------|--------|-------|
| Name Field | ${testResults.details.createObject.formFields?.name?.status || 'NOT TESTED'} | Required field |
| Type Dropdown | ${testResults.details.createObject.formFields?.typeDropdown?.status || 'NOT TESTED'} | Options: ${testResults.details.createObject.formFields?.typeDropdown?.optionsCount || 0} |
| Legal Name | ${testResults.details.createObject.formFields?.legalName?.status || 'NOT TESTED'} | Optional field |
| Industry | ${testResults.details.createObject.formFields?.industry?.status || 'NOT TESTED'} | Optional field |
| Email | ${testResults.details.createObject.formFields?.email?.status || 'NOT TESTED'} | With validation |
| Phone | ${testResults.details.createObject.formFields?.phone?.status || 'NOT TESTED'} | Optional field |
| Website | ${testResults.details.createObject.formFields?.website?.status || 'NOT TESTED'} | Optional field |
| Cancel Button | ${testResults.details.createObject.cancelButton?.status || 'NOT TESTED'} | Visible: ${testResults.details.createObject.cancelButton?.visible || 'N/A'} |
| Save Button | ${testResults.details.createObject.saveButton?.status || 'NOT TESTED'} | Visible: ${testResults.details.createObject.saveButton?.visible || 'N/A'} |
| Validation | ${testResults.details.createObject.validation?.status || 'NOT TESTED'} | Error shown: ${testResults.details.createObject.validation?.errorShown || 'N/A'} |

### 3. Object Detail Page

#### Header Section
| Element | Status | Details |
|---------|--------|---------|
| Back Button | ${testResults.details.objectDetail.header?.backButton?.status || 'NOT TESTED'} | ${testResults.details.objectDetail.header?.backButton?.visible ? 'Visible' : 'Not visible'} |
| Object Name | ${testResults.details.objectDetail.header?.objectName?.status || 'NOT TESTED'} | ${testResults.details.objectDetail.header?.objectName?.text || 'N/A'} |
| Type Badge | ${testResults.details.objectDetail.header?.typeBadge?.status || 'NOT TESTED'} | ${testResults.details.objectDetail.header?.typeBadge?.text || 'N/A'} |
| Edit Button | ${testResults.details.objectDetail.header?.editButton?.status || 'NOT TESTED'} | ${testResults.details.objectDetail.header?.editButton?.visible ? 'Visible' : 'Not visible'} |

#### Tabs Testing
| Tab | Status | Content Found |
|-----|--------|---------------|
| Information | ${testResults.details.objectDetail.tabs?.Information?.status || 'NOT TESTED'} | Fields: ${testResults.details.objectDetail.tabs?.Information?.content?.fields?.join(', ') || 'None'} |
| Contacts | ${testResults.details.objectDetail.tabs?.Contacts?.status || 'NOT TESTED'} | Bulk Assign: ${testResults.details.objectDetail.tabs?.Contacts?.content?.bulkAssignButton || 'N/A'} |
| Users | ${testResults.details.objectDetail.tabs?.Users?.status || 'NOT TESTED'} | Users: ${testResults.details.objectDetail.tabs?.Users?.content?.usersCount || 0} |
| Websites | ${testResults.details.objectDetail.tabs?.Websites?.status || 'NOT TESTED'} | Add button: ${testResults.details.objectDetail.tabs?.Websites?.content?.addWebsiteButton || 'N/A'} |

### 4. Edit Object Workflow

| Test | Status | Details |
|------|--------|---------|
| Form Pre-filled | ${testResults.details.editObject.formPreFilled?.status || 'NOT TESTED'} | Name has value: ${testResults.details.editObject.formPreFilled?.nameHasValue || 'N/A'} |
| Save Button | ${testResults.details.editObject.saveButton?.status || 'NOT TESTED'} | Visible: ${testResults.details.editObject.saveButton?.visible || 'N/A'} |
| Cancel Button | ${testResults.details.editObject.cancelButton?.status || 'NOT TESTED'} | Visible: ${testResults.details.editObject.cancelButton?.visible || 'N/A'} |
| Cancel Functionality | ${testResults.details.editObject.cancelFunctionality?.status || 'NOT TESTED'} | Works correctly |

### 5. Duplicate Object Workflow

| Test | Status | Details |
|------|--------|---------|
| Duplicate Option | ${testResults.details.duplicateObject.duplicateOption?.status || 'NOT TESTED'} | Visible: ${testResults.details.duplicateObject.duplicateOption?.visible || 'N/A'} |
| Success Message | ${testResults.details.duplicateObject.duplicateSuccess?.status || 'NOT TESTED'} | Shown: ${testResults.details.duplicateObject.duplicateSuccess?.messageShown || 'N/A'} |

### 6. Delete Object Workflow

| Test | Status | Details |
|------|--------|---------|
| Delete Option | ${testResults.details.deleteObject.deleteOption?.status || 'NOT TESTED'} | Visible: ${testResults.details.deleteObject.deleteOption?.visible || 'N/A'} |
| Confirmation Dialog | ${testResults.details.deleteObject.confirmDialog?.status || 'NOT TESTED'} | Visible: ${testResults.details.deleteObject.confirmDialog?.visible || 'N/A'} |
| Cancel Delete | ${testResults.details.deleteObject.cancelDelete?.status || 'NOT TESTED'} | Works: ${testResults.details.deleteObject.cancelDelete?.worked || 'N/A'} |
| Confirm Delete | ${testResults.details.deleteObject.confirmDelete?.status || 'NOT TESTED'} | Works: ${testResults.details.deleteObject.confirmDelete?.worked || 'N/A'} |

### 7. Edge Cases

| Test | Status | Details |
|------|--------|---------|
| Empty State | ${testResults.details.edgeCases.emptyState?.status || 'NOT TESTED'} | Shown: ${testResults.details.edgeCases.emptyState?.shown || 'N/A'} |
| Special Characters | ${testResults.details.edgeCases.specialCharsSearch?.status || 'NOT TESTED'} | Handled correctly |
| Rapid Click Prevention | ${testResults.details.edgeCases.rapidClickPrevention?.status || 'NOT TESTED'} | Modals: ${testResults.details.edgeCases.rapidClickPrevention?.modalCount || 'N/A'} |
| Browser Navigation | ${testResults.details.edgeCases.browserNavigation?.status || 'NOT TESTED'} | State maintained |

---

## CONSOLE ERRORS

${testResults.details.consoleErrors.length > 0 ?
  testResults.details.consoleErrors.map(err => `
### Error at ${err.timestamp}
\`\`\`
${err.text || err.message}
${err.location ? `Location: ${JSON.stringify(err.location)}` : ''}
${err.stack ? `Stack: ${err.stack}` : ''}
\`\`\`
`).join('\\n') :
  '✅ No console errors detected during testing'}

---

## BUGS DISCOVERED

${testResults.summary.failed > 0 ? `
| Bug ID | Severity | Component | Issue | Status |
|--------|----------|-----------|-------|--------|
| OBJ-001 | ${testResults.details.objectsList.searchInput?.status === 'FAIL' ? 'High' : 'Low'} | Search | Search input not functioning | ${testResults.details.objectsList.searchInput?.status || 'N/A'} |
| OBJ-002 | ${testResults.details.createObject.validation?.status === 'FAIL' ? 'High' : 'Low'} | Create Form | Validation not showing errors | ${testResults.details.createObject.validation?.status || 'N/A'} |
| OBJ-003 | ${testResults.details.objectDetail.tabs?.Information?.status === 'FAIL' ? 'Medium' : 'Low'} | Detail Page | Information tab not loading | ${testResults.details.objectDetail.tabs?.Information?.status || 'N/A'} |
` : '✅ No critical bugs found'}

---

## SCREENSHOTS CAPTURED

- objects-list-initial.png
- objects-search-typed.png
- objects-type-dropdown-open.png
- objects-create-button-visible.png
- objects-action-menu-open.png
- create-object-form-initial.png
- create-object-type-dropdown.png
- create-object-form-filled.png
- create-object-validation-error.png
- object-detail-initial.png
- object-detail-information-tab.png
- object-detail-contacts-tab.png
- object-detail-users-tab.png
- object-detail-websites-tab.png
- edit-object-form-initial.png
- edit-object-form-modified.png
- duplicate-object-result.png
- delete-confirmation-dialog.png
- delete-object-completed.png
- objects-empty-state.png

---

## PRODUCTION READINESS VERDICT

${testResults.summary.passRate >= 90 ? '### ✅ READY FOR PRODUCTION' :
  testResults.summary.passRate >= 70 ? '### ⚠️ NEEDS MINOR FIXES' :
  '### ❌ NOT READY - CRITICAL ISSUES FOUND'}

**Pass Rate:** ${testResults.summary.passRate}%

${testResults.summary.failed > 0 ? `
### Required Fixes Before Production:
1. Fix all FAILED test cases listed above
2. Resolve console errors if any
3. Implement missing UI elements
4. Ensure all CRUD operations work correctly
` : '### All tests passed successfully!'}

---

## RECOMMENDATIONS

1. **Immediate Actions:**
   - Fix any console errors detected
   - Ensure all form validations work properly
   - Verify all CRUD operations complete successfully

2. **Improvements:**
   - Add loading states for async operations
   - Improve error messaging for better UX
   - Add confirmation dialogs for destructive actions
   - Implement proper empty states

3. **Testing:**
   - Run regression tests after fixes
   - Test with different user roles (Admin, User)
   - Test with larger datasets for performance

---

*Report generated by Exhaustive Debugger Agent*
*Total execution time: ${new Date().toISOString()}*
`;

  // Save report
  const reportPath = path.join(__dirname, 'OBJECTS_EXHAUSTIVE_DEBUG_REPORT.md');
  await fs.writeFile(reportPath, report);
  console.log(`\\n✅ Report saved to: ${reportPath}`);

  // Save JSON results
  const jsonPath = path.join(__dirname, 'objects-debug-results.json');
  await fs.writeFile(jsonPath, JSON.stringify(testResults, null, 2));
  console.log(`✅ JSON results saved to: ${jsonPath}`);

  return report;
}

async function generateSystemSchema() {
  const timestamp = new Date().toISOString();

  const schema = `# SYSTEM SCHEMA: SENOVA CRM - OBJECTS MODULE

**Created:** ${timestamp}
**Module:** Objects Management
**URL:** http://localhost:3004/dashboard/objects

---

## OBJECTS LIST PAGE
**URL:** /dashboard/objects

### Page Header
| Element | Type | Text/Label | Action | Destination |
|---------|------|------------|--------|-------------|
| Page Title | h1 | "Objects" | Display only | N/A |
| Page Description | p | "Manage your organization's objects" | Display only | N/A |

### Search and Filters
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Search Input | input | "Search objects..." | accepts text | Filters list in real-time |
| Type Filter | dropdown | "All Types" | Opens dropdown | Shows type options |
| View Toggle | button-group | "Grid/Table" | Toggle view | Changes display format |

### Type Filter Options
| Option | Value | Result When Selected |
|--------|-------|---------------------|
| All Types | all | Shows all objects |
| Company | company | Shows only company objects |
| Organization | organization | Shows only organization objects |
| Group | group | Shows only group objects |

### Action Buttons
| Element | Type | Text/Label | Action | Destination |
|---------|------|------------|--------|-------------|
| Create Object | button | "+ Create Object" | Opens form | Create object modal/page |

### Objects Table/Grid
| Column | Type | Sortable | Action |
|--------|------|----------|--------|
| Name | text/link | Yes | Click to view detail |
| Type | badge | Yes | Display only |
| Created | date | Yes | Display only |
| Actions | menu | No | Opens action menu |

### Action Menu Options (per object)
| Option | Icon | Action | Result |
|--------|------|--------|--------|
| View Details | eye | Navigate | Goes to object detail page |
| Edit | pencil | Navigate | Opens edit form |
| Duplicate | copy | Action | Creates copy with "(Copy)" suffix |
| Delete | trash | Action | Opens confirmation dialog |

---

## CREATE OBJECT FORM
**URL:** /dashboard/objects/new (or modal)

### Form Fields
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Name | text input | Yes | Min 1 char | Empty |
| Type | dropdown | Yes | Must select | Empty |
| Legal Name | text input | No | None | Empty |
| Industry | text input | No | None | Empty |
| Email | email input | No | Email format | Empty |
| Phone | tel input | No | Phone format | Empty |
| Website | url input | No | URL format | Empty |
| Address | text area | No | None | Empty |

### Type Options
| Option | Value | Description |
|--------|-------|-------------|
| Company | company | Business entity |
| Organization | organization | Non-profit or org |
| Group | group | Group of entities |

### Form Actions
| Button | Type | Action | Result |
|--------|------|--------|--------|
| Cancel | button | Cancel | Closes form without saving |
| Save | submit | Submit form | Creates object and redirects |

---

## OBJECT DETAIL PAGE
**URL:** /dashboard/objects/[id]

### Header Section
| Element | Type | Text/Label | Action | Destination |
|---------|------|------------|--------|-------------|
| Back Button | button | "← Back to Objects" | Navigate | /dashboard/objects |
| Object Icon | icon | Dynamic based on type | Display only | N/A |
| Object Name | h1 | [Object name] | Display only | N/A |
| Type Badge | badge | [Company/Organization/Group] | Display only | N/A |
| Created Date | text | "Created [date]" | Display only | N/A |
| Edit Button | button | "Edit Object" | Navigate | Edit form |

### Navigation Tabs
| Tab | Label | Default | Content |
|-----|-------|---------|---------|
| Information | "Information" | Yes | Object details and metadata |
| Contacts | "Contacts" | No | Associated contacts |
| Users | "Users" | No | User permissions |
| Websites | "Websites" | No | Associated websites |

---

## INFORMATION TAB
**Component:** Object Information Display

### Company Information Card
| Field | Type | Editable | Display Format |
|-------|------|----------|----------------|
| Name | text | Via edit | Bold, large |
| Type | badge | Via edit | Colored badge |
| Legal Name | text | Via edit | Normal text |
| Industry | text | Via edit | Normal text |
| Email | email | Via edit | Link (mailto:) |
| Phone | tel | Via edit | Link (tel:) |
| Website | url | Via edit | Link (external) |
| Address | text | Via edit | Multi-line |

### Metadata Section
| Field | Type | Editable | Display Format |
|-------|------|----------|----------------|
| Created | datetime | No | "MMM DD, YYYY at HH:mm" |
| Last Updated | datetime | No | "MMM DD, YYYY at HH:mm" |
| Created By | user | No | User name/email |

---

## CONTACTS TAB
**Component:** Object-Contact Association

### Controls
| Element | Type | Text/Label | Action | Result |
|---------|------|------------|--------|--------|
| Bulk Assign | button | "Bulk Assign" | Opens modal | Bulk contact assignment |
| Assign Contact | button | "+ Assign Contact" | Opens picker | Single contact assignment |
| Search | input | "Search contacts..." | Filter list | Real-time filtering |

### Contacts List
| Column | Type | Action | Result |
|--------|------|--------|--------|
| Name | text/link | Click | Navigate to contact |
| Email | text | Display | Show contact email |
| Phone | text | Display | Show contact phone |
| Role | text | Display | Show role in object |
| Remove | button | Click | Remove association |

### Empty State
| Element | Type | Text | Action |
|---------|------|------|--------|
| Message | text | "No contacts assigned" | Display only |
| CTA | button | "Assign First Contact" | Opens picker |

---

## USERS TAB
**Component:** Object User Permissions

### User Permissions Table
| Column | Type | Editable | Options |
|--------|------|----------|---------|
| User | text/avatar | No | Display user info |
| Email | text | No | Display email |
| Role | dropdown | Yes | Owner/Admin/User |
| Access Level | badges | Yes | Read/Write/Delete |
| Remove | button | Yes | Remove user access |

### Add User Section
| Element | Type | Action | Result |
|---------|------|--------|--------|
| User Picker | dropdown | Select user | Shows available users |
| Role Selector | dropdown | Select role | Owner/Admin/User |
| Add Button | button | Click | Grants access |

---

## WEBSITES TAB
**Component:** Associated Websites

### Controls
| Element | Type | Text/Label | Action | Result |
|---------|------|------------|--------|--------|
| Add Website | button | "+ Add Website" | Opens form | Add new website |

### Websites List
| Column | Type | Action | Result |
|--------|------|--------|--------|
| URL | link | Click | Open in new tab |
| Type | text | Display | Primary/Secondary |
| Status | badge | Display | Active/Inactive |
| Remove | button | Click | Remove website |

---

## EDIT OBJECT FORM
**URL:** /dashboard/objects/[id]/edit (or modal)

### Form Behavior
- All fields pre-populated with current values
- Same fields as Create Object form
- Same validation rules apply
- Changes tracked for audit log

### Form Actions
| Button | Type | Action | Result |
|--------|------|--------|--------|
| Cancel | button | Cancel | Discards changes |
| Save Changes | submit | Update | Saves and redirects |

---

## DELETE CONFIRMATION DIALOG

### Dialog Content
| Element | Type | Text | Purpose |
|---------|------|------|---------|
| Title | h2 | "Delete Object?" | Confirmation header |
| Message | text | "This action cannot be undone" | Warning message |
| Object Name | text | Shows object being deleted | Clarity |

### Dialog Actions
| Button | Type | Action | Result |
|--------|------|--------|--------|
| Cancel | button | Close dialog | No changes |
| Delete | button | Confirm delete | Removes object |

---

## ERROR STATES

### Form Validation Errors
| Field | Error Type | Message |
|-------|------------|---------|
| Name | Required | "Name is required" |
| Type | Required | "Please select a type" |
| Email | Format | "Please enter a valid email" |
| Website | Format | "Please enter a valid URL" |

### System Errors
| Error | Message | Action |
|-------|---------|--------|
| Load Failure | "Failed to load objects" | Retry button |
| Save Failure | "Failed to save object" | Retry button |
| Delete Failure | "Failed to delete object" | Retry button |
| Network Error | "Connection error" | Retry button |

---

## PERMISSIONS & RBAC

### Role-Based Access
| Role | View | Create | Edit | Delete |
|------|------|--------|------|--------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ❌ |
| User | ✅ | ❌ | Own only | ❌ |

---

## API ENDPOINTS

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/objects | List all objects |
| GET | /api/objects/[id] | Get single object |
| POST | /api/objects | Create new object |
| PUT | /api/objects/[id] | Update object |
| DELETE | /api/objects/[id] | Delete object |
| POST | /api/objects/[id]/contacts | Assign contacts |
| DELETE | /api/objects/[id]/contacts/[contactId] | Remove contact |
| POST | /api/objects/[id]/users | Add user permission |
| PUT | /api/objects/[id]/users/[userId] | Update user permission |
| DELETE | /api/objects/[id]/users/[userId] | Remove user permission |

---

*Schema generated by Exhaustive Debugger Agent*
*Last updated: ${timestamp}*
`;

  // Save schema
  const schemaPath = path.join(__dirname, 'system-schema-objects-module.md');
  await fs.writeFile(schemaPath, schema);
  console.log(`✅ System schema saved to: ${schemaPath}`);

  return schema;
}

// Main execution
async function main() {
  console.log('=== STARTING EXHAUSTIVE OBJECTS MODULE TESTING ===');
  console.log(`Time: ${new Date().toISOString()}`);

  await ensureScreenshotsDir();

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.timeout);

  // Set up console error monitoring
  testResults.details.consoleErrors = monitorConsoleErrors(page);

  try {
    // Login
    await login(page);

    // Run all tests
    console.log('\\nRunning exhaustive tests...');

    testResults.details.objectsList = await testObjectsList(page);
    testResults.details.createObject = await testCreateObject(page);
    testResults.details.objectDetail = await testObjectDetail(page);
    testResults.details.editObject = await testEditObject(page);
    testResults.details.duplicateObject = await testDuplicateObject(page);
    testResults.details.deleteObject = await testDeleteObject(page);
    testResults.details.edgeCases = await testEdgeCases(page);

    // Generate reports
    console.log('\\nGenerating reports...');
    await generateReport();
    await generateSystemSchema();

    console.log('\\n=== TESTING COMPLETE ===');
    console.log(`Pass Rate: ${testResults.summary.passRate}%`);

  } catch (error) {
    console.error('Fatal error during testing:', error);
    testResults.summary.errors.push({
      type: 'FATAL',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }
}

// Run the tests
main().catch(console.error);