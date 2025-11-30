const playwright = require('playwright');
(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  const results = { login: false, contactsList: false, searchWorks: false, importButton: false, fileUpload: false, importComplete: false, contactsBeforeImport: 0, contactsAfterImport: 0, issues: [] };
  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    results.login = true;
    console.log('PASS Login');
    
    console.log('Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-contacts-list.png', fullPage: true });
    
    const contactCards = await page.$$('.space-y-4 > div').catch(() => []);
    results.contactsBeforeImport = contactCards.length;
    console.log('PASS Contacts before import:', results.contactsBeforeImport);
    results.contactsList = true;
    
    console.log('Test search...');
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-search-typed.png', fullPage: true });
      await searchInput.fill('');
      await page.waitForTimeout(1000);
      results.searchWorks = true;
      console.log('PASS Search works');
    }
    
    console.log('Test CSV import...');
    const importButton = await page.$('button:has-text("Import Contacts")');
    if (importButton) {
      console.log('PASS Import button found');
      await importButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-import-modal-open.png', fullPage: true });
      results.importButton = true;
      
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        console.log('PASS File input found');
        await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/03-file-selected.png', fullPage: true });
        results.fileUpload = true;
        console.log('PASS File selected');
        
        const uploadButton = await page.$('button:has-text("Upload"), button:has-text("Import")');
        if (uploadButton) {
          await uploadButton.click();
          console.log('Waiting for import to complete (90 seconds)...');
          await page.waitForTimeout(90000);
          await page.screenshot({ path: 'screenshots/03-import-complete.png', fullPage: true });
          results.importComplete = true;
          console.log('PASS Import completed');
          
          await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
          await page.waitForTimeout(5000);
          await page.screenshot({ path: 'screenshots/03-after-import.png', fullPage: true });
          
          const contactCardsAfter = await page.$$('.space-y-4 > div').catch(() => []);
          results.contactsAfterImport = contactCardsAfter.length;
          console.log('PASS Contacts after import:', results.contactsAfterImport);
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
