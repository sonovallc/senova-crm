const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  let originalValue = '';
  let newValue = '';
  let contactId = '';

  try {
    console.log('=== VERIFICATION #5: Edit Contact ===\n');

    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('Logged in');

    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/v5-edit-01-contacts.png', fullPage: true });
    console.log('Screenshot 1: contacts page');

    console.log('Looking for contact cards...');
    const firstCard = await page.$('.contact-card, [data-contact-id], div:has(text("Kathleen Clifford"))').catch(() => null);
    
    if (!firstCard) {
      console.log('Looking for Show more button...');
      const showMore = await page.$('text=Show more').catch(() => null);
      if (showMore) {
        console.log('Clicking Show more...');
        await showMore.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'screenshots/v5-edit-02-showmore.png', fullPage: true });
        console.log('Screenshot 2: after show more');
      }
    }

    console.log('Looking for clickable contact element...');
    const contactCards = await page.$$('[class*="card"], [class*="contact"]');
    console.log('Found ' + contactCards.length + ' potential contact elements');

    if (contactCards.length === 0) {
      console.log('FAIL: No contact elements found');
      await browser.close();
      return;
    }

    console.log('Clicking on first contact card area...');
    await contactCards[0].click({ position: { x: 100, y: 50 } });
    await page.waitForTimeout(2000);
    
    const url1 = page.url();
    console.log('URL after click: ' + url1);
    await page.screenshot({ path: 'screenshots/v5-edit-03-clicked.png', fullPage: true });
    console.log('Screenshot 3: after card click');

    if (!url1.includes('/contacts/')) {
      console.log('Did not navigate to contact detail. Looking for edit icons or links...');
      
      const editIcons = await page.$$('button[aria-label*="edit"], button[title*="edit"], a[href*="/edit"], svg[class*="edit"]');
      console.log('Found ' + editIcons.length + ' edit elements');
      
      if (editIcons.length > 0) {
        console.log('Clicking first edit element...');
        await editIcons[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/v5-edit-04-edit-clicked.png', fullPage: true });
        console.log('Screenshot 4: after edit click');
      }
    }

    const currentUrl = page.url();
    console.log('Current URL: ' + currentUrl);
    const match = currentUrl.match(/\/contacts\/(\d+)/);
    if (match) {
      contactId = match[1];
      console.log('Contact ID: ' + contactId);
    }

    console.log('Looking for last name field...');
    await page.waitForTimeout(1000);
    
    const lastName = await page.$('input[name="last_name"]').catch(() => null) || 
                     await page.$('input[name="lastName"]').catch(() => null) ||
                     await page.$('input[id="last_name"]').catch(() => null) ||
                     await page.$('input[id="lastName"]').catch(() => null);
    
    if (!lastName) {
      console.log('FAIL: Last name field not found');
      console.log('Page HTML structure:');
      const inputs = await page.$$eval('input', els => els.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder
      })));
      console.log('All inputs found:', JSON.stringify(inputs, null, 2));
      await page.screenshot({ path: 'screenshots/v5-edit-05-inputs-debug.png', fullPage: true });
      await browser.close();
      return;
    }

    originalValue = await lastName.inputValue();
    console.log('Found last name field with value: "' + originalValue + '"');
    
    newValue = originalValue + ' UPDATED';
    console.log('Changing to: "' + newValue + '"');

    await lastName.fill(newValue);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/v5-edit-06-changed.png', fullPage: true });
    console.log('Screenshot: field changed');

    const saveBtn = await page.$('button:has-text("Save")').catch(() => null) || 
                    await page.$('button:has-text("Update")').catch(() => null) ||
                    await page.$('button[type="submit"]').catch(() => null);
    
    if (!saveBtn) {
      console.log('FAIL: Save button not found');
      await browser.close();
      return;
    }

    console.log('Clicking Save...');
    await saveBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/v5-edit-07-saved.png', fullPage: true });
    console.log('Screenshot: saved');

    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    const content = await page.content();
    const persisted = content.includes(newValue);
    await page.screenshot({ path: 'screenshots/v5-edit-08-persisted.png', fullPage: true });
    console.log('Screenshot: persistence check');

    console.log('\n=== RESULTS ===');
    console.log('Contact ID: ' + contactId);
    console.log('Original: "' + originalValue + '"');
    console.log('New: "' + newValue + '"');
    console.log('\nChecklist:');
    console.log('[x] Can open contact for editing');
    console.log('[x] Fields are editable');
    console.log('[x] Save button found and clicked');
    console.log('[' + (persisted ? 'x' : ' ') + '] Changes visible after refresh');
    console.log('[ ] Database shows updated data');

    if (persisted) {
      console.log('\nOverall Status: PASS (pending DB verification)');
      console.log('\nDB verification command:');
      console.log('docker exec eve_crm_postgres psql -U evecrm -d eve_crm -c "SELECT id, first_name, last_name, updated_at FROM contacts WHERE id=' + contactId + ' ORDER BY updated_at DESC LIMIT 1;"');
    } else {
      console.log('\nOverall Status: FAIL - change did not persist');
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ path: 'screenshots/v5-edit-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
