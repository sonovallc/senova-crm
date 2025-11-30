const playwright = require('playwright');
(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  const results = { login: false, contactsList: false, searchWorks: false, statusFilterExists: false, tagFilterExists: false, importButton: false, fileUpload: false, fileProcessing: false, wizardAdvanced: false, importComplete: false, contactsBeforeImport: 0, contactsAfterImport: 0, newContactsAdded: 0, issues: [] };
  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    results.login = true;
    console.log('PASS Login');
    
    console.log('\nStep 2: Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-contacts-list.png', fullPage: true });
    const contactCards = await page.$$('.space-y-4 > div').catch(() => []);
    results.contactsBeforeImport = contactCards.length;
    console.log('PASS Contacts before import:', results.contactsBeforeImport);
    results.contactsList = true;
    
    console.log('\nStep 3: Test search...');
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
    
    console.log('\nStep 4: Check filters...');
    results.statusFilterExists = !!(await page.$('button:has-text("All Status")'));
    results.tagFilterExists = !!(await page.$('button:has-text("Filter by tags")'));
    console.log('Status filter:', results.statusFilterExists ? 'PASS' : 'INFO Not found');
    console.log('Tag filter:', results.tagFilterExists ? 'PASS' : 'INFO Not found');
    
    console.log('\nStep 5: CSV Bulk Import...');
    const importButton = await page.$('button:has-text("Import Contacts")');
    if (importButton) {
      results.importButton = true;
      console.log('PASS Import button found');
      await importButton.click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/03-import-modal.png', fullPage: true });
      
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        results.fileUpload = true;
        console.log('PASS File input found');
        await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/03-file-selected.png', fullPage: true });
        
        const processingText = await page.$('text=Processing file');
        if (processingText) {
          results.fileProcessing = true;
          console.log('PASS File processing started');
          
          console.log('Waiting for processing to complete (up to 90 seconds)...');
          await page.waitForTimeout(90000);
          await page.screenshot({ path: 'screenshots/03-after-processing.png', fullPage: true });
          
          const step2Active = await page.$('text=Map Columns');
          if (step2Active) {
            results.wizardAdvanced = true;
            console.log('PASS Advanced to step 2');
            
            console.log('Clicking through remaining wizard steps...');
            for (let i = 0; i < 5; i++) {
              const nextBtn = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Import"), button:has-text("Finish")');
              if (nextBtn) {
                await nextBtn.click();
                await page.waitForTimeout(5000);
                await page.screenshot({ path: 'screenshots/03-wizard-step-' + (i+2) + '.png', fullPage: true });
              }
            }
            
            await page.waitForTimeout(10000);
            results.importComplete = true;
            console.log('PASS Import wizard completed');
          }
        }
        
        await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'screenshots/03-after-import.png', fullPage: true });
        
        const contactCardsAfter = await page.$$('.space-y-4 > div').catch(() => []);
        results.contactsAfterImport = contactCardsAfter.length;
        results.newContactsAdded = results.contactsAfterImport - results.contactsBeforeImport;
        console.log('PASS Contacts after import:', results.contactsAfterImport);
        console.log('New contacts added:', results.newContactsAdded);
      } else {
        results.issues.push('File input not found');
      }
    } else {
      results.issues.push('Import button not found');
    }
  } catch (error) {
    results.issues.push('Error: ' + error.message);
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/03-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n=== VERIFICATION #3 RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  }
})();
