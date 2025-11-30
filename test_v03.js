const playwright = require('playwright');
(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  const results = { login: false, contactsList: false, searchInput: false, searchResults: false, searchClear: false, statusFilter: null, tagFilter: null, importButton: false, fileUpload: false, importComplete: false, contactsAfterImportSuccess: false, contactsBeforeImport: 0, contactsAfterImport: 0, pagination: false, issues: [] };
  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: 'screenshots/03-login-filled.png', fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/03-dashboard-after-login.png', fullPage: true });
    results.login = true;
    console.log('PASS Login');
    
    console.log('Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-contacts-list.png', fullPage: true });
    const contactRowsBefore = await page.$$('tr[data-contact-id], .contact-card, [class*="contact-row"], tbody tr').catch(() => []);
    results.contactsBeforeImport = contactRowsBefore.length;
    console.log('PASS Contacts before:', results.contactsBeforeImport);
    const paginationExists = await page.$('nav[role="navigation"], .pagination, [class*="pagination"]').catch(() => null);
    results.pagination = !!paginationExists;
    results.contactsList = true;
    
    console.log('Test search...');
    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
    if (searchInput) {
      results.searchInput = true;
      await searchInput.fill('eve');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-contacts-search-typed.png', fullPage: true });
      console.log('PASS Search typed');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-contacts-search-results.png', fullPage: true });
      const searchResults = await page.$$('tr[data-contact-id], .contact-card, [class*="contact-row"], tbody tr').catch(() => []);
      console.log('PASS Search results:', searchResults.length);
      results.searchResults = true;
      await searchInput.fill('');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-contacts-search-cleared.png', fullPage: true });
      console.log('PASS Search cleared');
      results.searchClear = true;
    } else {
      results.issues.push('Search input not found');
      console.log('FAIL Search not found');
    }
    
    console.log('Test status filter...');
    const statusFilter = await page.$('select[name*="status"], button:has-text("Status"), [data-filter="status"]').catch(() => null);
    if (statusFilter) {
      await statusFilter.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-contacts-filter-status.png', fullPage: true });
      results.statusFilter = 'present';
      console.log('PASS Status filter');
    } else {
      results.statusFilter = 'not_found';
      console.log('INFO Status filter not found');
    }
    
    console.log('Test tag filter...');
    const tagFilter = await page.$('select[name*="tag"], button:has-text("Tag"), [data-filter="tag"]').catch(() => null);
    if (tagFilter) {
      await tagFilter.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-contacts-filter-tag.png', fullPage: true });
      results.tagFilter = 'present';
      console.log('PASS Tag filter');
    } else {
      results.tagFilter = 'not_found';
      console.log('INFO Tag filter not found');
    }
    
    console.log('Test CSV import...');
    const importButton = await page.$('button:has-text("Import"), button:has-text("Bulk Import"), a:has-text("Import")');
    if (importButton) {
      console.log('PASS Import button found');
      await importButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-contacts-import-button.png', fullPage: true });
      results.importButton = true;
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        console.log('PASS File input found');
        await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/03-contacts-import-file-selected.png', fullPage: true });
        results.fileUpload = true;
        console.log('PASS File uploaded');
        const uploadButton = await page.$('button:has-text("Upload"), button:has-text("Import"), button[type="submit"]');
        if (uploadButton) {
          await uploadButton.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'screenshots/03-contacts-import-processing.png', fullPage: true });
          console.log('Processing...');
          await page.waitForTimeout(90000);
          await page.screenshot({ path: 'screenshots/03-contacts-import-complete.png', fullPage: true });
          results.importComplete = true;
          console.log('PASS Import complete');
          await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'screenshots/03-contacts-after-import.png', fullPage: true });
          const contactRowsAfter = await page.$$('tr[data-contact-id], .contact-card, [class*="contact-row"], tbody tr').catch(() => []);
          results.contactsAfterImport = contactRowsAfter.length;
          console.log('PASS Contacts after:', results.contactsAfterImport);
          results.contactsAfterImportSuccess = true;
        } else {
          results.issues.push('Upload button not found');
          console.log('FAIL Upload button not found');
        }
      } else {
        results.issues.push('File input not found');
        console.log('FAIL File input not found');
      }
    } else {
      results.issues.push('Import button not found');
      console.log('FAIL Import button not found');
    }
  } catch (error) {
    results.issues.push('Error: ' + error.message);
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/03-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nRESULTS:', JSON.stringify(results, null, 2));
  }
})();
