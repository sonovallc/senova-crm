const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const screenshotDir = 'screenshots';
  
  try {
    console.log('\n=== PART 1: CSV IMPORT ===\n');
    
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login', { timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('✓ Logged in\n');
    
    console.log('Step 2: Navigate to import');
    await page.goto('http://localhost:3004/dashboard/contacts/import', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-import-page.png'), fullPage: true });
    console.log('✓ Import page loaded\n');
    
    console.log('Step 3: Upload CSV file');
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('C:/Users/jwood/Downloads/usethisforuploadtest.csv');
    console.log('✓ File selected, waiting for processing...');
    
    // Wait for Next button to become enabled (file processed)
    await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '02-file-uploaded.png'), fullPage: true });
    console.log('✓ File processed\n');
    
    console.log('Step 4: Advance to column mapping');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '03-column-mapping.png'), fullPage: true });
    console.log('✓ On column mapping page\n');
    
    console.log('Step 5: Auto-map columns');
    const autoMap = page.locator('button:has-text("Auto-Map")').first();
    if (await autoMap.isVisible()) {
      await autoMap.click();
      await page.waitForTimeout(2000);
      console.log('✓ Auto-map clicked');
    }
    await page.screenshot({ path: path.join(screenshotDir, '04-columns-mapped.png'), fullPage: true });
    
    // Wait for Next button to be enabled
    await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 10000 });
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Advanced to tags\n');
    
    console.log('Step 6: Skip tags');
    await page.screenshot({ path: path.join(screenshotDir, '05-tags.png'), fullPage: true });
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '06-review.png'), fullPage: true });
    console.log('✓ On review page\n');
    
    // Capture counts
    const text = await page.textContent('body');
    const newMatch = text.match(/(\d+)\s+new/i);
    const dupMatch = text.match(/(\d+)\s+duplicate/i);
    if (newMatch) console.log('  New contacts:', newMatch[1]);
    if (dupMatch) console.log('  Duplicates:', dupMatch[1]);
    
    console.log('\nStep 7: Execute import');
    const importBtn = page.locator('button:has-text("Import"), button:has-text("Confirm")').first();
    await importBtn.click();
    console.log('✓ Import started (waiting up to 5 minutes)...\n');
    
    // Wait for import to complete
    try {
      await page.waitForURL('**/dashboard/contacts**', { timeout: 300000 });
      console.log('✓ Import completed - redirected to contacts\n');
    } catch (e) {
      console.log('⚠ No redirect, waiting...');
      await page.waitForTimeout(10000);
    }
    
    console.log('Step 8: Verify imported contacts');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '07-contacts-after-import.png'), fullPage: true });
    
    const contactsText = await page.textContent('body');
    const totalMatch = contactsText.match(/Total[:\s]+(\d+)/i) || contactsText.match(/(\d+)\s+total/i);
    const imported = totalMatch ? totalMatch[1] : 'unknown';
    console.log('✓ Total contacts in database:', imported, '\n');
    
    console.log('=== PART 2: EXPORT VERIFICATION (BUG-002) ===\n');
    
    console.log('Step 9: Test Export All');
    const downloadPromise = page.waitForEvent('download', { timeout: 180000 });
    
    const exportBtn = page.locator('button:has-text("Export All")').first();
    await exportBtn.click();
    console.log('✓ Export All clicked, waiting for download...');
    
    await page.screenshot({ path: path.join(screenshotDir, '08-export-initiated.png'), fullPage: true });
    
    const download = await downloadPromise;
    const csvPath = path.join(screenshotDir, 'exported-contacts.csv');
    await download.saveAs(csvPath);
    console.log('✓ CSV downloaded\n');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '09-export-complete.png'), fullPage: true });
    
    console.log('Step 10: Analyze exported CSV');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
    const exportedRows = lines.length - 1; // Subtract header
    
    console.log('  Total lines in CSV:', lines.length);
    console.log('  Header row: 1');
    console.log('  Data rows:', exportedRows, '\n');
    
    // Show sample of CSV
    console.log('First 2 lines of CSV:');
    console.log('  Header:', lines[0].substring(0, 80) + '...');
    if (lines.length > 1) {
      console.log('  Row 1:', lines[1].substring(0, 80) + '...');
    }
    
    console.log('\n=== FINAL RESULTS ===\n');
    console.log('✓ Contacts imported:', imported);
    console.log('✓ Contacts exported:', exportedRows);
    
    const bugFixed = exportedRows > 100;
    
    if (bugFixed) {
      console.log('\n✅ BUG-002 EXPORT FIX: PASS');
      console.log('   Expected: ~' + imported + ' rows');
      console.log('   Actual: ' + exportedRows + ' rows');
      console.log('   Export is NOT limited to 20 rows - fix verified!');
    } else {
      console.log('\n❌ BUG-002 EXPORT FIX: FAIL');
      console.log('   Expected: ~' + imported + ' rows');
      console.log('   Actual: Only ' + exportedRows + ' rows');
      console.log('   Export still appears limited - bug not fixed');
    }
    
    console.log('\n✓ Test completed successfully!\n');
    
  } catch (e) {
    console.error('\n❌ TEST FAILED:', e.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
    throw e;
  } finally {
    await browser.close();
  }
})();
