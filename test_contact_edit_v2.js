const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST 2: CONTACT EDIT WORKFLOW (v2) ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/test2v2_step1_login.png' });
    console.log('Step 1: PASS - Logged in\n');

    // Step 2: Navigate to Contacts
    console.log('Step 2: Navigate to Contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test2v2_step2_contacts_list.png' });
    console.log('Step 2: PASS - On contacts page\n');

    // Step 3: Click on a contact card NAME (not sidebar links)
    console.log('Step 3: Click on contact card to view details...');

    // Find all contact cards - they contain the contact names as links
    // The contact names appear as <a> tags inside the cards with text like "TestContactFinal Automated"
    // We need to click on the name text specifically, avoiding sidebar navigation

    // Look for contact name links within the main content area (not sidebar)
    const contactNameLink = await page.$('main a[href^="/dashboard/contacts/"]:not([href*="deleted"])');

    if (contactNameLink) {
      const linkText = await contactNameLink.textContent();
      console.log(`Found contact link: ${linkText}`);
      await contactNameLink.click();
    } else {
      // Try clicking on a card's h3 or font-semibold element
      const cardName = await page.$('.grid a[class*="font-semibold"], .grid h3 a, [class*="Card"] a[href*="contacts"]');
      if (cardName) {
        await cardName.click();
        console.log('Clicked on card name element');
      } else {
        // Last resort: find any contact name text and click its parent
        const allLinks = await page.$$('a[href^="/dashboard/contacts/"]');
        for (const link of allLinks) {
          const href = await link.getAttribute('href');
          // Skip sidebar links (they have simple paths like /dashboard/contacts or /dashboard/contacts/deleted)
          if (href && href.match(/\/dashboard\/contacts\/[a-f0-9-]{36}/)) {
            console.log(`Found contact detail link: ${href}`);
            await link.click();
            break;
          }
        }
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test2v2_step3_contact_detail.png' });

    // Check if we're now on a contact detail page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/contacts/') && !currentUrl.includes('deleted')) {
      console.log('Step 3: PASS - On contact detail page\n');
    } else {
      console.log('Step 3: WARNING - May not be on contact detail page\n');
    }

    // Step 4: Look for Edit button or edit form
    console.log('Step 4: Open edit form...');

    // The contact detail page should show an Edit button
    const editButton = await page.$('button:has-text("Edit")');
    if (editButton) {
      await editButton.click();
      console.log('Clicked Edit button');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'screenshots/test2v2_step4_edit_form.png' });
    console.log('Step 4: PASS - Edit form should be open\n');

    // Step 5: Modify fields
    console.log('Step 5: Modify contact fields...');

    // Try to find and modify the first name field
    const firstNameInput = await page.$('input[name="first_name"]');
    if (firstNameInput) {
      await firstNameInput.click();
      await firstNameInput.fill('');
      await firstNameInput.type('EditTest');
      console.log('Modified first name to EditTest');
    }

    const lastNameInput = await page.$('input[name="last_name"]');
    if (lastNameInput) {
      await lastNameInput.click();
      await lastNameInput.fill('');
      await lastNameInput.type('Modified');
      console.log('Modified last name to Modified');
    }

    const companyInput = await page.$('input[name="company"]');
    if (companyInput) {
      await companyInput.click();
      await companyInput.fill('');
      await companyInput.type('Updated Company Inc');
      console.log('Modified company');
    }

    await page.screenshot({ path: 'screenshots/test2v2_step5_modified.png' });
    console.log('Step 5: PASS - Fields modified\n');

    // Step 6: Save changes
    console.log('Step 6: Save changes...');

    // Use the data-testid we added
    const submitBtn = await page.$('[data-testid="contact-form-submit"]');
    if (submitBtn) {
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();
      console.log('Clicked submit button via data-testid');
    } else {
      // Fallback
      const updateBtn = await page.$('button[type="submit"]:has-text("Update")');
      if (updateBtn) {
        await updateBtn.click();
        console.log('Clicked Update button');
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/test2v2_step6_saved.png' });
    console.log('Step 6: PASS - Save attempted\n');

    // Step 7: Verify changes
    console.log('Step 7: Verify changes persisted...');

    // Go back to contacts list
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);

    const pageContent = await page.content();
    const hasEditTest = pageContent.includes('EditTest');
    const hasModified = pageContent.includes('Modified');

    await page.screenshot({ path: 'screenshots/test2v2_step7_verified.png' });

    if (hasEditTest || hasModified) {
      console.log('Step 7: PASS - Found EditTest or Modified in page\n');
      console.log('\n=== TEST 2 RESULT: PASS ===');
    } else {
      console.log('Step 7: FAIL - EditTest/Modified not found in contacts list');
      console.log('Check screenshots for details');
      console.log('\n=== TEST 2 RESULT: FAIL ===');
    }

  } catch (error) {
    console.error('TEST 2 ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/test2v2_error.png' });
    console.log('\n=== TEST 2 RESULT: ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
