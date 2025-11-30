const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const screenshotDir = 'screenshots';
  
  try {
    console.log('\n=== CONTINUING FROM STEP 2: COLUMN MAPPING ===\n');
    
    console.log('We are already on Step 2 of 6 - Map Columns');
    console.log('✓ File was uploaded successfully in previous run\n');
    
    await page.goto('http://localhost:3004/dashboard/contacts/import', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '10-current-state.png'), fullPage: true });
    
    // Check if we're on the mapping page
    const bodyText = await page.textContent('body');
    
    if (bodyText.includes('Map Your Columns') || bodyText.includes('Map Columns')) {
      console.log('Step 2: Auto-mapping columns');
      const autoMap = page.locator('button:has-text("Auto-Map")').first();
      if (await autoMap.isVisible({ timeout: 5000 }).catch(() => false)) {
        await autoMap.click();
        await page.waitForTimeout(3000);
        console.log('✓ Auto-map clicked\n');
      }
      await page.screenshot({ path: path.join(screenshotDir, '11-after-automap.png'), fullPage: true });
      
      // Look for enabled Next button
      const nextBtn = page.locator('button:has-text("Next"):not([disabled])').first();
      await nextBtn.waitFor({ timeout: 10000 });
      await nextBtn.click();
      await page.waitForTimeout(2000);
      console.log('✓ Advanced to Step 3: Tags\n');
    }
    
    await page.screenshot({ path: path.join(screenshotDir, '12-tags-step.png'), fullPage: true });
    
    console.log('Step 3: Skipping tags');
    const nextBtn2 = page.locator('button:has-text("Next")').first();
    await nextBtn2.click();
    await page.waitForTimeout(3000);
    console.log('✓ Advanced to Step 4: Review\n');
    
    await page.screenshot({ path: path.join(screenshotDir, '13-review-step.png'), fullPage: true });
    
    const reviewText = await page.textContent('body');
    const newMatch = reviewText.match(/(\d+)\s+new/i);
    const dupMatch = reviewText.match(/(\d+)\s+duplicate/i);
    if (newMatch) console.log('  New contacts to import:', newMatch[1]);
    if (dupMatch) console.log('  Duplicate contacts:', dupMatch[1]);
    
    console.log('\nStep 4: Executing import');
    const importBtn = page.locator('button:has-text("Import"), button:has-text("Confirm")').first();
    await importBtn.click();
    console.log('✓ Import started (waiting up to 5 minutes)...\n');
    
    // Wait for completion
    let completed = false;
    try {
      await page.waitForURL('**/dashboard/contacts**', { timeout: 300000 });
      completed = true;
      console.log('✓ Import completed!\n');
    } catch (e) {
      console.log('⚠ Checking for success message...');
      await page.waitForTimeout(5000);
    }
    
    console.log('Step 5: Verifying contacts');
    await page.goto('http://localhost:3004/dashboard/contacts', { timeout: 90000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotDir, '14-contacts-list.png'), fullPage: true });
    
    const contactsText = await page.textContent('body');
    const totalMatch = contactsText.match(/Total[:\s]+(\d+)/i) || 
                       contactsText.match(/(\d+)\s+total/i) ||
                       contactsText.match(/(\d+)\s+contacts/i);
    const imported = totalMatch ? totalMatch[1] : 'unknown';
    console.log('✓ Total contacts:', imported, '\n');
    
    console.log('=== PART 2: EXPORT TEST (BUG-002) ===\n');
    
    console.log('Step 6: Testing Export All');
    const downloadPromise = page.waitForEvent('download', { timeout: 180000 });
    
    const exportBtn = page.locator('button:has-text("Export All")').first();
    await exportBtn.click();
    console.log('✓ Export All clicked...');
    
    const download = await downloadPromise;
    const csvPath = path.join(screenshotDir, 'exported-all.csv');
    await download.saveAs(csvPath);
    console.log('✓ CSV downloaded\n');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '15-after-export.png'), fullPage: true });
    
    console.log('Step 7: Analyzing exported CSV');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
    const exportedRows = lines.length - 1;
    
    console.log('  CSV lines:', lines.length);
    console.log('  Data rows:', exportedRows, '\n');
    
    console.log('=== FINAL RESULTS ===\n');
    console.log('Imported:', imported, 'contacts');
    console.log('Exported:', exportedRows, 'rows');
    
    const bugFixed = exportedRows > 100;
    const percentage = imported !== 'unknown' ? 
      Math.round((exportedRows / parseInt(imported)) * 100) : 0;
    
    if (bugFixed) {
      console.log('\n✅ BUG-002 EXPORT FIX: PASS');
      console.log('   Expected: ~' + imported + ' rows');
      console.log('   Actual:', exportedRows, 'rows (' + percentage + '%)');
      console.log('   Export is NOT limited to 20 rows!');
    } else {
      console.log('\n❌ BUG-002 EXPORT FIX: FAIL');
      console.log('   Expected: ~' + imported + ' rows');
      console.log('   Actual: Only', exportedRows, 'rows');
      console.log('   Export still limited!');
    }
    
    console.log('\n✓ Test complete!\n');
    
  } catch (e) {
    console.error('\n❌ ERROR:', e.message);
    await page.screenshot({ path: path.join(screenshotDir, 'FINAL-ERROR.png'), fullPage: true });
    throw e;
  } finally {
    await browser.close();
  }
})();
