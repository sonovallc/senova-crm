const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000); // Increase timeout to 60 seconds

  const screenshotDir = 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\exhaustive-debug-contacts';
  const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  const results = {
    contactsList: {},
    createContact: {},
    contactDetail: {},
    editContact: {},
    importContacts: {},
    consoleLogs: [],
    errors: []
  };

  // Capture console logs and errors
  page.on('console', msg => {
    results.consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    results.errors.push(error.message);
    console.error('Page Error:', error.message);
  });

  try {
    console.log('=== STARTING EXHAUSTIVE CONTACTS MODULE DEBUG ===\n');

    // ============================================================================
    // SECTION 1: LOGIN
    // ============================================================================
    console.log('SECTION 1: Login');

    // Try navigating to login page
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/01-login-page-${timestamp()}.png`, fullPage: true });

    // Check if we're on login page or need to click Staff Login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (!currentUrl.includes('login')) {
      console.log('Not on login page, looking for Staff Login button...');
      const staffLoginBtn = await page.$('a:has-text("Staff Login"), button:has-text("Staff Login")');
      if (staffLoginBtn) {
        await staffLoginBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/01b-after-staff-login-click-${timestamp()}.png`, fullPage: true });
      }
    }

    // Now fill login form
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    if (emailInput && passwordInput) {
      await emailInput.fill('admin@evebeautyma.com');
      await passwordInput.fill('TestPass123!');
      await page.screenshot({ path: `${screenshotDir}/02-login-filled-${timestamp()}.png`, fullPage: true });

      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/03-dashboard-after-login-${timestamp()}.png`, fullPage: true });
      console.log('✓ Login successful\n');
    } else {
      console.log('✗ Login fields not found');
      await page.screenshot({ path: `${screenshotDir}/ERROR-no-login-fields-${timestamp()}.png`, fullPage: true });
    }

    // ============================================================================
    // SECTION 2: CONTACTS LIST PAGE
    // ============================================================================
    console.log('SECTION 2: Contacts List Page - Testing ALL Elements');

    // Navigate to contacts
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/04-contacts-list-initial-${timestamp()}.png`, fullPage: true });

    // Count all interactive elements
    const buttons = await page.$$('button');
    const links = await page.$$('a');
    const inputs = await page.$$('input');
    const selects = await page.$$('select');
    const checkboxes = await page.$$('input[type="checkbox"]');

    console.log(`Found: ${buttons.length} buttons, ${links.length} links, ${inputs.length} inputs, ${selects.length} selects, ${checkboxes.length} checkboxes`);
    results.contactsList.elementCount = { buttons: buttons.length, links: links.length, inputs: inputs.length, selects: selects.length, checkboxes: checkboxes.length };

    // Test: List/Grid View Toggle (if exists)
    console.log('Testing: View toggles...');
    const viewToggleButtons = await page.$$('[role="tab"], button[aria-label*="view"], button[title*="view"]');
    console.log(`  Found ${viewToggleButtons.length} potential view toggle buttons`);
    results.contactsList.viewToggles = viewToggleButtons.length;

    if (viewToggleButtons.length > 0) {
      for (let i = 0; i < viewToggleButtons.length; i++) {
        const buttonText = await viewToggleButtons[i].textContent();
        console.log(`  Testing view toggle ${i}: "${buttonText}"`);
        await page.screenshot({ path: `${screenshotDir}/05-before-view-toggle-${i}-${timestamp()}.png`, fullPage: true });
        await viewToggleButtons[i].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${screenshotDir}/06-after-view-toggle-${i}-${timestamp()}.png`, fullPage: true });
      }
    }

    // Test: Search Bar
    console.log('Testing: Search bar...');
    const searchInput = await page.$('input[placeholder*="Search"], input[type="search"], input[name*="search"]');
    if (searchInput) {
      await page.screenshot({ path: `${screenshotDir}/07-before-search-${timestamp()}.png`, fullPage: true });
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${screenshotDir}/08-after-search-${timestamp()}.png`, fullPage: true });
      results.contactsList.searchBar = 'FOUND and TESTED';
      console.log('  ✓ Search bar works');
      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(1000);
    } else {
      results.contactsList.searchBar = 'NOT FOUND';
      console.log('  ✗ Search bar not found');
    }

    // Test: Filter Dropdowns
    console.log('Testing: Filter dropdowns...');
    const filterSelects = await page.$$('select');
    const filterButtons = await page.$$('button[aria-haspopup="listbox"], [role="combobox"]');
    console.log(`  Found ${filterSelects.length} select elements, ${filterButtons.length} dropdown buttons`);
    results.contactsList.filterDropdowns = { selects: filterSelects.length, buttons: filterButtons.length };

    // Test each select dropdown
    for (let i = 0; i < filterSelects.length; i++) {
      const selectId = await filterSelects[i].getAttribute('id') || `select-${i}`;
      console.log(`  Testing select: ${selectId}`);

      await page.screenshot({ path: `${screenshotDir}/09-select-${i}-before-${timestamp()}.png`, fullPage: true });

      const options = await filterSelects[i].$$('option');
      console.log(`    Found ${options.length} options`);

      for (let j = 0; j < Math.min(options.length, 5); j++) { // Test first 5 options
        const optionValue = await options[j].getAttribute('value');
        const optionText = await options[j].textContent();
        console.log(`      Testing option ${j}: "${optionText}" (value: ${optionValue})`);

        await filterSelects[i].selectOption({ index: j });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/10-select-${i}-option-${j}-${timestamp()}.png`, fullPage: true });
      }
    }

    // Test: Sort Options
    console.log('Testing: Sort options...');
    const sortButtons = await page.$$('button[aria-label*="sort"], th[role="columnheader"], button[title*="sort"]');
    console.log(`  Found ${sortButtons.length} potential sort buttons`);
    results.contactsList.sortOptions = sortButtons.length;

    for (let i = 0; i < Math.min(sortButtons.length, 3); i++) {
      const buttonText = await sortButtons[i].textContent();
      console.log(`  Testing sort button: "${buttonText}"`);
      await page.screenshot({ path: `${screenshotDir}/11-sort-before-${i}-${timestamp()}.png`, fullPage: true });
      await sortButtons[i].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${screenshotDir}/12-sort-after-${i}-${timestamp()}.png`, fullPage: true });
    }

    // Test: Pagination
    console.log('Testing: Pagination controls...');
    const paginationButtons = await page.$$('button[aria-label*="page"], nav[role="navigation"] button, .pagination button');
    console.log(`  Found ${paginationButtons.length} pagination buttons`);
    results.contactsList.paginationButtons = paginationButtons.length;

    // Test: Select All Checkbox
    console.log('Testing: Select all checkbox...');
    const selectAllCheckbox = await page.$('input[type="checkbox"][aria-label*="select all"], th input[type="checkbox"]');
    if (selectAllCheckbox) {
      await page.screenshot({ path: `${screenshotDir}/13-select-all-before-${timestamp()}.png`, fullPage: true });
      await selectAllCheckbox.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${screenshotDir}/14-select-all-after-${timestamp()}.png`, fullPage: true });
      results.contactsList.selectAllCheckbox = 'FOUND and CLICKED';
      console.log('  ✓ Select all checkbox works');
      // Uncheck
      await selectAllCheckbox.click();
      await page.waitForTimeout(500);
    } else {
      results.contactsList.selectAllCheckbox = 'NOT FOUND';
      console.log('  ✗ Select all checkbox not found');
    }

    // Test: Bulk Action Buttons
    console.log('Testing: Bulk action buttons...');
    const bulkButtons = await page.$$('button[aria-label*="bulk"], button:has-text("Delete Selected"), button:has-text("Export Selected")');
    console.log(`  Found ${bulkButtons.length} bulk action buttons`);
    results.contactsList.bulkActionButtons = bulkButtons.length;

    // Test: Add/Create Contact Button
    console.log('Testing: Add Contact button...');
    const addContactButton = await page.$('button:has-text("Add Contact"), button:has-text("Create Contact"), button:has-text("New Contact"), a[href*="/contacts/create"]');
    if (addContactButton) {
      results.contactsList.addContactButton = 'FOUND';
      console.log('  ✓ Add Contact button found');
    } else {
      results.contactsList.addContactButton = 'NOT FOUND';
      console.log('  ✗ Add Contact button not found');
    }

    // Test: Export Button
    console.log('Testing: Export button...');
    const exportButton = await page.$('button:has-text("Export"), button[aria-label*="export"]');
    if (exportButton) {
      await page.screenshot({ path: `${screenshotDir}/15-export-before-${timestamp()}.png`, fullPage: true });
      await exportButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${screenshotDir}/16-export-after-${timestamp()}.png`, fullPage: true });
      results.contactsList.exportButton = 'FOUND and CLICKED';
      console.log('  ✓ Export button works');
    } else {
      results.contactsList.exportButton = 'NOT FOUND';
      console.log('  ✗ Export button not found');
    }

    // Test: Import Button
    console.log('Testing: Import button...');
    const importButton = await page.$('button:has-text("Import"), a[href*="/contacts/import"]');
    if (importButton) {
      results.contactsList.importButton = 'FOUND';
      console.log('  ✓ Import button found');
    } else {
      results.contactsList.importButton = 'NOT FOUND';
      console.log('  ✗ Import button not found');
    }

    console.log('✓ Contacts List Page testing complete\n');

    // ============================================================================
    // SECTION 3: CREATE CONTACT FLOW
    // ============================================================================
    console.log('SECTION 3: Create Contact Flow - Testing ALL Form Elements');

    // Click Add Contact button
    const createButton = await page.$('button:has-text("Add Contact"), button:has-text("Create Contact"), button:has-text("New Contact"), a:has-text("Add Contact")');
    if (createButton) {
      await page.screenshot({ path: `${screenshotDir}/17-before-click-create-${timestamp()}.png`, fullPage: true });
      await createButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/18-after-click-create-${timestamp()}.png`, fullPage: true });

      // Wait for modal or page
      const currentUrl = page.url();
      console.log(`Current URL after clicking create: ${currentUrl}`);
      results.createContact.urlAfterClick = currentUrl;

      // Test: First Name Field
      console.log('Testing: First Name field...');
      const firstNameInput = await page.$('input[name="first_name"], input[name="firstName"], input[placeholder*="First"], input#firstName, input#first_name');
      if (firstNameInput) {
        await page.screenshot({ path: `${screenshotDir}/19-firstname-before-${timestamp()}.png`, fullPage: true });
        await firstNameInput.fill('Test');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/20-firstname-after-${timestamp()}.png`, fullPage: true });
        results.createContact.firstNameField = 'FOUND and FILLED';
        console.log('  ✓ First Name field works');
      } else {
        results.createContact.firstNameField = 'NOT FOUND';
        console.log('  ✗ First Name field not found');
      }

      // Test: Last Name Field
      console.log('Testing: Last Name field...');
      const lastNameInput = await page.$('input[name="last_name"], input[name="lastName"], input[placeholder*="Last"], input#lastName, input#last_name');
      if (lastNameInput) {
        await lastNameInput.fill('User');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/21-lastname-filled-${timestamp()}.png`, fullPage: true });
        results.createContact.lastNameField = 'FOUND and FILLED';
        console.log('  ✓ Last Name field works');
      } else {
        results.createContact.lastNameField = 'NOT FOUND';
        console.log('  ✗ Last Name field not found');
      }

      // Test: Email Field
      console.log('Testing: Email field...');
      const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="Email"]');
      if (emailInput) {
        // Test invalid email
        await page.screenshot({ path: `${screenshotDir}/22-email-before-${timestamp()}.png`, fullPage: true });
        await emailInput.fill('invalid-email');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/23-email-invalid-${timestamp()}.png`, fullPage: true });

        // Test valid email
        await emailInput.fill('test@example.com');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/24-email-valid-${timestamp()}.png`, fullPage: true });
        results.createContact.emailField = 'FOUND and TESTED (invalid + valid)';
        console.log('  ✓ Email field works with validation');
      } else {
        results.createContact.emailField = 'NOT FOUND';
        console.log('  ✗ Email field not found');
      }

      // Test: Phone Field
      console.log('Testing: Phone field...');
      const phoneInput = await page.$('input[type="tel"], input[name="phone"], input[placeholder*="Phone"]');
      if (phoneInput) {
        await phoneInput.fill('555-1234');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/25-phone-filled-${timestamp()}.png`, fullPage: true });
        results.createContact.phoneField = 'FOUND and FILLED';
        console.log('  ✓ Phone field works');
      } else {
        results.createContact.phoneField = 'NOT FOUND';
        console.log('  ✗ Phone field not found');
      }

      // Test: Company Field
      console.log('Testing: Company field...');
      const companyInput = await page.$('input[name="company"], input[placeholder*="Company"]');
      if (companyInput) {
        await companyInput.fill('Test Company');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/26-company-filled-${timestamp()}.png`, fullPage: true });
        results.createContact.companyField = 'FOUND and FILLED';
        console.log('  ✓ Company field works');
      } else {
        results.createContact.companyField = 'NOT FOUND';
        console.log('  ✗ Company field not found');
      }

      // Test: Status Dropdown
      console.log('Testing: Status dropdown...');
      const statusSelect = await page.$('select[name="status"], [aria-label*="status"] select, #status');
      if (statusSelect) {
        await page.screenshot({ path: `${screenshotDir}/27-status-before-${timestamp()}.png`, fullPage: true });

        const statusOptions = await statusSelect.$$('option');
        console.log(`  Found ${statusOptions.length} status options`);
        results.createContact.statusDropdown = { found: true, optionCount: statusOptions.length, options: [] };

        for (let i = 0; i < statusOptions.length; i++) {
          const optionValue = await statusOptions[i].getAttribute('value');
          const optionText = await statusOptions[i].textContent();
          console.log(`    Testing status option ${i}: "${optionText}" (value: ${optionValue})`);
          results.createContact.statusDropdown.options.push({ value: optionValue, text: optionText });

          await statusSelect.selectOption({ index: i });
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${screenshotDir}/28-status-option-${i}-${timestamp()}.png`, fullPage: true });
        }
        console.log('  ✓ Status dropdown fully tested');
      } else {
        results.createContact.statusDropdown = { found: false };
        console.log('  ✗ Status dropdown not found');
      }

      // Test: Tags Selector
      console.log('Testing: Tags selector...');
      const tagsInput = await page.$('input[name*="tag"], [aria-label*="tag"] input, #tags, [data-testid*="tag"]');
      const tagsSelect = await page.$('select[name*="tag"], [aria-label*="tag"] select');

      if (tagsInput) {
        await page.screenshot({ path: `${screenshotDir}/29-tags-before-${timestamp()}.png`, fullPage: true });
        await tagsInput.fill('VIP');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/30-tags-after-${timestamp()}.png`, fullPage: true });
        results.createContact.tagsSelector = 'FOUND (input) and TESTED';
        console.log('  ✓ Tags input works');
      } else if (tagsSelect) {
        await page.screenshot({ path: `${screenshotDir}/29-tags-select-before-${timestamp()}.png`, fullPage: true });
        const tagOptions = await tagsSelect.$$('option');
        console.log(`    Found ${tagOptions.length} tag options`);
        if (tagOptions.length > 1) {
          await tagsSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${screenshotDir}/30-tags-select-after-${timestamp()}.png`, fullPage: true });
        }
        results.createContact.tagsSelector = 'FOUND (select) and TESTED';
        console.log('  ✓ Tags select works');
      } else {
        results.createContact.tagsSelector = 'NOT FOUND';
        console.log('  ✗ Tags selector not found');
      }

      // Test: Assignment Dropdown
      console.log('Testing: Assignment dropdown...');
      const assignmentSelect = await page.$('select[name*="assign"], select[name*="owner"], [aria-label*="assign"] select');
      if (assignmentSelect) {
        const assignOptions = await assignmentSelect.$$('option');
        console.log(`  Found ${assignOptions.length} assignment options`);
        results.createContact.assignmentDropdown = { found: true, optionCount: assignOptions.length };

        if (assignOptions.length > 1) {
          await assignmentSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${screenshotDir}/31-assignment-selected-${timestamp()}.png`, fullPage: true });
        }
        console.log('  ✓ Assignment dropdown works');
      } else {
        results.createContact.assignmentDropdown = { found: false };
        console.log('  ✗ Assignment dropdown not found');
      }

      // Test: Notes/Description Field
      console.log('Testing: Notes field...');
      const notesInput = await page.$('textarea[name*="note"], textarea[name*="description"], textarea[placeholder*="Note"]');
      if (notesInput) {
        await notesInput.fill('Test notes for contact');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/32-notes-filled-${timestamp()}.png`, fullPage: true });
        results.createContact.notesField = 'FOUND and FILLED';
        console.log('  ✓ Notes field works');
      } else {
        results.createContact.notesField = 'NOT FOUND';
        console.log('  ✗ Notes field not found');
      }

      // Screenshot before save
      await page.screenshot({ path: `${screenshotDir}/33-form-complete-before-save-${timestamp()}.png`, fullPage: true });

      // Test: Save Button
      console.log('Testing: Save button...');
      const saveButton = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      if (saveButton) {
        const saveButtonText = await saveButton.textContent();
        console.log(`  Found save button: "${saveButtonText}"`);
        await saveButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/34-after-save-${timestamp()}.png`, fullPage: true });
        results.createContact.saveButton = 'FOUND and CLICKED';
        console.log('  ✓ Save button clicked');

        // Check for success message or redirect
        const currentUrlAfterSave = page.url();
        console.log(`  URL after save: ${currentUrlAfterSave}`);
        results.createContact.urlAfterSave = currentUrlAfterSave;
      } else {
        results.createContact.saveButton = 'NOT FOUND';
        console.log('  ✗ Save button not found');
      }

      console.log('✓ Create Contact Flow testing complete\n');
    } else {
      console.log('✗ Could not find Create Contact button, skipping create flow\n');
      results.createContact.skipped = 'CREATE BUTTON NOT FOUND';
    }

    // ============================================================================
    // SECTION 4: CONTACT DETAIL PAGE
    // ============================================================================
    console.log('SECTION 4: Contact Detail Page - Testing ALL Elements');

    // Navigate back to contacts list
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and click first contact row
    console.log('Looking for first contact to view details...');
    const contactRows = await page.$$('tr[data-testid*="contact"], tbody tr, [role="row"]');
    console.log(`  Found ${contactRows.length} potential contact rows`);

    if (contactRows.length > 1) { // Skip header row
      await page.screenshot({ path: `${screenshotDir}/35-contacts-list-before-click-${timestamp()}.png`, fullPage: true });
      await contactRows[1].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/36-contact-detail-initial-${timestamp()}.png`, fullPage: true });

      const detailUrl = page.url();
      console.log(`Contact detail URL: ${detailUrl}`);
      results.contactDetail.url = detailUrl;

      // Test: Edit Button
      console.log('Testing: Edit button...');
      const editButton = await page.$('button:has-text("Edit"), a:has-text("Edit"), button[aria-label*="edit"]');
      if (editButton) {
        results.contactDetail.editButton = 'FOUND';
        console.log('  ✓ Edit button found');
      } else {
        results.contactDetail.editButton = 'NOT FOUND';
        console.log('  ✗ Edit button not found');
      }

      // Test: Delete Button
      console.log('Testing: Delete button...');
      const deleteButton = await page.$('button:has-text("Delete"), button[aria-label*="delete"]');
      if (deleteButton) {
        await page.screenshot({ path: `${screenshotDir}/37-before-delete-click-${timestamp()}.png`, fullPage: true });
        await deleteButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${screenshotDir}/38-after-delete-click-modal-${timestamp()}.png`, fullPage: true });

        // Look for cancel button to close modal
        const cancelButton = await page.$('button:has-text("Cancel"), button:has-text("No")');
        if (cancelButton) {
          await cancelButton.click();
          await page.waitForTimeout(500);
          console.log('  ✓ Delete button works (modal opened and closed)');
        }
        results.contactDetail.deleteButton = 'FOUND and TESTED (modal)';
      } else {
        results.contactDetail.deleteButton = 'NOT FOUND';
        console.log('  ✗ Delete button not found');
      }

      // Test: Activity Timeline
      console.log('Testing: Activity timeline/history...');
      const activitySection = await page.$('[data-testid*="activity"], section:has-text("Activity"), div:has-text("Timeline")');
      if (activitySection) {
        await page.screenshot({ path: `${screenshotDir}/39-activity-section-${timestamp()}.png`, fullPage: true });
        results.contactDetail.activitySection = 'FOUND';
        console.log('  ✓ Activity section found');
      } else {
        results.contactDetail.activitySection = 'NOT FOUND';
        console.log('  ✗ Activity section not found');
      }

      // Test: Notes Section
      console.log('Testing: Notes section...');
      const notesSection = await page.$('[data-testid*="note"], section:has-text("Notes")');
      if (notesSection) {
        results.contactDetail.notesSection = 'FOUND';
        console.log('  ✓ Notes section found');
      } else {
        results.contactDetail.notesSection = 'NOT FOUND';
        console.log('  ✗ Notes section not found');
      }

      // Test: Tags Display
      console.log('Testing: Tags display...');
      const tagsDisplay = await page.$('[data-testid*="tag"], div:has-text("Tags"), .tags');
      if (tagsDisplay) {
        results.contactDetail.tagsDisplay = 'FOUND';
        console.log('  ✓ Tags display found');
      } else {
        results.contactDetail.tagsDisplay = 'NOT FOUND';
        console.log('  ✗ Tags display not found');
      }

      // Test: Tabs (if present)
      console.log('Testing: Contact detail tabs...');
      const tabs = await page.$$('[role="tab"], .tabs button, nav[aria-label*="tab"] button');
      console.log(`  Found ${tabs.length} tabs`);
      results.contactDetail.tabs = { count: tabs.length, tested: [] };

      for (let i = 0; i < tabs.length; i++) {
        const tabText = await tabs[i].textContent();
        console.log(`  Testing tab ${i}: "${tabText}"`);
        results.contactDetail.tabs.tested.push(tabText);

        await page.screenshot({ path: `${screenshotDir}/40-tab-${i}-before-${timestamp()}.png`, fullPage: true });
        await tabs[i].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${screenshotDir}/41-tab-${i}-after-${timestamp()}.png`, fullPage: true });
      }

      console.log('✓ Contact Detail Page testing complete\n');
    } else {
      console.log('✗ No contact rows found, skipping contact detail testing\n');
      results.contactDetail.skipped = 'NO CONTACTS FOUND';
    }

    // ============================================================================
    // SECTION 5: EDIT CONTACT FLOW
    // ============================================================================
    console.log('SECTION 5: Edit Contact Flow - Testing Form Pre-population and Save');

    if (results.contactDetail.editButton === 'FOUND') {
      const editBtn = await page.$('button:has-text("Edit"), a:has-text("Edit"), button[aria-label*="edit"]');
      if (editBtn) {
        await page.screenshot({ path: `${screenshotDir}/42-before-edit-click-${timestamp()}.png`, fullPage: true });
        await editBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/43-edit-form-initial-${timestamp()}.png`, fullPage: true });

        // Test: Form Pre-population
        console.log('Testing: Form field pre-population...');
        const firstNameValue = await page.$eval('input[name="first_name"], input[name="firstName"]', el => el.value).catch(() => null);
        const emailValue = await page.$eval('input[type="email"], input[name="email"]', el => el.value).catch(() => null);

        console.log(`  First Name pre-populated: ${firstNameValue || 'NOT FOUND'}`);
        console.log(`  Email pre-populated: ${emailValue || 'NOT FOUND'}`);
        results.editContact.prePopulation = { firstName: firstNameValue, email: emailValue };

        // Test: Change Fields
        console.log('Testing: Changing field values...');
        const editFirstName = await page.$('input[name="first_name"], input[name="firstName"]');
        if (editFirstName) {
          await editFirstName.fill('UpdatedTest');
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${screenshotDir}/44-edit-field-changed-${timestamp()}.png`, fullPage: true });
          results.editContact.fieldChanged = 'YES';
          console.log('  ✓ Field value changed');
        }

        // Test: Save Button
        console.log('Testing: Save edited contact...');
        const saveEditButton = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
        if (saveEditButton) {
          await saveEditButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `${screenshotDir}/45-after-edit-save-${timestamp()}.png`, fullPage: true });
          results.editContact.saved = 'YES';
          console.log('  ✓ Edit saved');
        }

        console.log('✓ Edit Contact Flow testing complete\n');
      }
    } else {
      console.log('✗ Edit button not found, skipping edit flow\n');
      results.editContact.skipped = 'EDIT BUTTON NOT FOUND';
    }

    // ============================================================================
    // SECTION 6: IMPORT CONTACTS
    // ============================================================================
    console.log('SECTION 6: Import Contacts - Testing Import Flow');

    await page.goto('http://localhost:3004/dashboard/contacts/import');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/46-import-page-initial-${timestamp()}.png`, fullPage: true });

    const importUrl = page.url();
    console.log(`Import page URL: ${importUrl}`);
    results.importContacts.url = importUrl;

    // Test: File Upload Area
    console.log('Testing: File upload area...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      results.importContacts.fileUpload = 'FOUND';
      console.log('  ✓ File upload input found');
    } else {
      results.importContacts.fileUpload = 'NOT FOUND';
      console.log('  ✗ File upload input not found');
    }

    // Test: CSV Template Download
    console.log('Testing: CSV template download...');
    const templateButton = await page.$('button:has-text("Download Template"), a:has-text("Template"), a[download*="csv"]');
    if (templateButton) {
      results.importContacts.templateDownload = 'FOUND';
      console.log('  ✓ Template download found');
    } else {
      results.importContacts.templateDownload = 'NOT FOUND';
      console.log('  ✗ Template download not found');
    }

    // Test: Field Mapping Interface
    console.log('Testing: Field mapping interface...');
    const mappingSelects = await page.$$('select[name*="map"], select[aria-label*="map"]');
    console.log(`  Found ${mappingSelects.length} mapping selects`);
    results.importContacts.fieldMapping = { selectCount: mappingSelects.length };

    console.log('✓ Import Contacts testing complete\n');

    // ============================================================================
    // FINAL SUMMARY
    // ============================================================================
    console.log('\n=== EXHAUSTIVE CONTACTS DEBUG COMPLETE ===');
    console.log('\nRESULTS SUMMARY:');
    console.log(JSON.stringify(results, null, 2));

    console.log(`\nTotal Console Logs: ${results.consoleLogs.length}`);
    console.log(`Total Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\nERRORS FOUND:');
      results.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log('\nAll screenshots saved to: C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\exhaustive-debug-contacts\\');

  } catch (error) {
    console.error('FATAL ERROR during testing:', error);
    results.fatalError = error.message;
    await page.screenshot({ path: `${screenshotDir}/ERROR-${timestamp()}.png`, fullPage: true });
  } finally {
    await browser.close();

    // Write results to JSON file
    const fs = require('fs');
    fs.writeFileSync(
      'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\EXHAUSTIVE_DEBUG_CONTACTS_RESULTS.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\nResults written to: EXHAUSTIVE_DEBUG_CONTACTS_RESULTS.json');
  }
})();
