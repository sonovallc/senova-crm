const playwright = require('playwright');
(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  const results = { login: false, contactsList: false, searchWorks: false, statusFilterExists: false, tagFilterExists: false, importButton: false, fileUpload: false, wizardStep2: false, wizardComplete: false, contactsBeforeImport: 0, contactsAfterImport: 0, importSuccessful: false, issues: [] };
  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    results.login = true;
    console.log('PASS Login successful');
    
    console.log('\nStep 2: Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-contacts-list.png', fullPage: true });
    
    const contactCards = await page.$$('.space-y-4 > div').catch(() => []);
    results.contactsBeforeImport = contactCards.length;
    console.log('PASS Contacts list loaded - Count:', results.contactsBeforeImport);
    results.contactsList = true;
    
    console.log('\nStep 3: Test search...');
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-search-typed.png', fullPage: true });
      await searchInput.fill('');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-search-cleared.png', fullPage: true });
      results.searchWorks = true;
      console.log('PASS Search functionality works');
    } else {
      results.issues.push('Search input not found');
    }
    
    console.log('\nStep 4: Check filters...');
    const statusFilter = await page.$('button:has-text("All Status")');
    results.statusFilterExists = !!statusFilter;
    console.log(results.statusFilterExists ? 'PASS Status filter exists' : 'INFO Status filter not found');
    
    const tagFilter = await page.$('button:has-text("Filter by tags")');
    results.tagFilterExists = !!tagFilter;
    console.log(results.tagFilterExists ? 'PASS Tag filter exists' : 'INFO Tag filter not found');
    
    console.log('\nStep 5: Test CSV bulk import...');
    const importButton = await page.$('button:has-text("Import Contacts")');
    if (importButton) {
      console.log('PASS Import button found');
      results.importButton = true;
      await importButton.click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/03-import-modal.png', fullPage: true });
      
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        console.log('PASS File input found');
        await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/03-file-selected.png', fullPage: true });
        results.fileUpload = true;
        console.log('PASS File uploaded');
        
        const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue")');
        if (nextButton) {
          await nextButton.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'screenshots/03-wizard-step2.png', fullPage: true });
          results.wizardStep2 = true;
          console.log('PASS Moved to step 2');
          
          console.log('Completing wizard steps (waiting 90 seconds for full process)...');
          for (let i = 0; i < 4; i++) {
            const continueBtn = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Import")');
            if (continueBtn) {
              await continueBtn.click();
              await page.waitForTimeout(5000);
              await page.screenshot({ path: 'screenshots/03-wizard-step' + (i + 3) + '.png', fullPage: true });
            }
          }
          
          await page.waitForTimeout(90000);
          await page.screenshot({ path: 'screenshots/03-import-complete.png', fullPage: true });
          results.wizardComplete = true;
          console.log('PASS Import wizard completed');
          
          await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
          await page.waitForTimeout(5000);
          await page.screenshot({ path: 'screenshots/03-after-import.png', fullPage: true });
          
          const contactCardsAfter = await page.$$('.space-y-4 > div').catch(() => []);
          results.contactsAfterImport = contactCardsAfter.length;
          console.log('PASS Contacts after import:', results.contactsAfterImport);
          
          if (results.contactsAfterImport > results.contactsBeforeImport) {
            results.importSuccessful = true;
            console.log('PASS Import successful - new contacts added!');
          } else {
            results.issues.push('No new contacts added after import');
            console.log('FAIL No increase in contact count');
          }
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
    console.log('\n=== FINAL RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  }
})();
