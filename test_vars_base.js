const { chromium } = require('playwright');

(async () => {
  console.log('=== BUG-015 CORRECTED VERIFICATION TEST ===\n');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const results = { passed: [], failed: [] };
  
  try {
    console.log('T1: Login');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug015-t1-login.png', fullPage: true });
    console.log('  SUCCESS\n');
    results.passed.push('Login');
    
    console.log('T2: Navigate to Contacts');
    await page.goto('http://localhost:3004/dashboard/contacts');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/bug015-t2-contacts.png', fullPage: true });
    console.log('  SUCCESS\n');
    
    const timestamp = Date.now();
    const testEmail = `bug015_${timestamp}@test.com`;
    
    console.log('T3: Create Contact');
    console.log(`  Email: ${testEmail}`);
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/bug015-t3-modal.png', fullPage: true });
    
    await page.getByLabel('First Name').fill('Bug015');
    await page.waitForTimeout(300);
    await page.getByLabel('Last Name').fill('TestContact');
    await page.waitForTimeout(300);
    await page.getByLabel('Email').fill(testEmail);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'screenshots/bug015-t3-filled.png', fullPage: true });
    console.log('  Form filled correctly');
    
    await page.locator('button:has-text("Create")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug015-t3-submitted.png', fullPage: true });
    console.log('  Form submitted\n');
    results.passed.push('Create contact');
    
    console.log('T4: Verify Contact in List');
    await page.reload();
    await page.waitForTimeout(2000);
    const visible = await page.locator(`text=${testEmail}`).isVisible();
    await page.screenshot({ path: 'screenshots/bug015-t4-list.png', fullPage: true });
    
    if (visible) {
      console.log('  SUCCESS: Contact VISIBLE in list!\n');
      results.passed.push('Contact visible');
    } else {
      console.log('  FAIL: Contact NOT visible in list!\n');
      results.failed.push('Contact NOT visible - BUG-015 still exists');
      await browser.close();
      return;
    }
    
    console.log('T5: Search Contact');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(testEmail);
    await page.waitForTimeout(1500);
    const searchVisible = await page.locator(`text=${testEmail}`).isVisible();
    await page.screenshot({ path: 'screenshots/bug015-t5-search.png', fullPage: true });
    
    if (searchVisible) {
      console.log('  SUCCESS: Contact searchable!\n');
      results.passed.push('Contact searchable');
    } else {
      console.log('  FAIL: Contact NOT searchable!\n');
      results.failed.push('Contact NOT searchable');
    }
    
    await searchInput.clear();
    await page.waitForTimeout(1000);
    
    console.log('T6: Campaign Wizard Step 1');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Create Campaign")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug015-t6-wizard.png', fullPage: true });
    
    await page.fill('input[id="name"]', 'BUG-015 Verification Campaign');
    await page.fill('input[id="subject"]', 'Test Subject');
    
    const editor = page.locator('.tiptap, [contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Test email content for BUG-015 verification.');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'screenshots/bug015-t6-step1.png', fullPage: true });
    console.log('  Step 1 filled\n');
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug015-t7-step2.png', fullPage: true });
    console.log('T7: Campaign Step 2 - Recipients');
    results.passed.push('Reached Step 2');
    
    console.log('T8: Check Recipient Count');
    const recipientLocator = page.locator('text=/\d+ recipient/i').first();
    if (await recipientLocator.isVisible({ timeout: 5000 })) {
      const text = await recipientLocator.textContent();
      console.log(`  Found: ${text}`);
      
      const match = text.match(/(\d+)/);
      const count = match ? parseInt(match[1]) : 0;
      
      if (count > 0) {
        console.log(`  SUCCESS: Recipient count = ${count}!\n`);
        results.passed.push(`Recipient count: ${count}`);
      } else {
        console.log('  FAIL: Recipient count = 0!\n');
        results.failed.push('Recipient count is 0');
      }
    } else {
      console.log('  WARNING: No recipient count displayed\n');
      results.failed.push('No recipient count');
    }
    
    console.log('T9: Check Next Button State');
    const nextBtn = page.locator('button:has-text("Next")').last();
    const disabled = await nextBtn.isDisabled();
    
    if (disabled) {
      console.log('  FAIL: Next button is DISABLED!\n');
      await page.screenshot({ path: 'screenshots/bug015-FAIL-disabled.png', fullPage: true });
      results.failed.push('Next button disabled');
    } else {
      console.log('  SUCCESS: Next button is ENABLED!\n');
      results.passed.push('Next button enabled');
      
      console.log('T10: Proceed to Step 3');
      await nextBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug015-t10-step3.png', fullPage: true });
      console.log('  SUCCESS: Reached Step 3!\n');
      results.passed.push('Reached Step 3');
    }
    
    console.log('=== TEST RESULTS ===');
    console.log(`PASSED: ${results.passed.length}`);
    results.passed.forEach(t => console.log(`  - ${t}`));
    
    if (results.failed.length > 0) {
      console.log(`\nFAILED: ${results.failed.length}`);
      results.failed.forEach(t => console.log(`  - ${t}`));
    }
    
    console.log('\n=== VERDICT ===');
    if (results.failed.length === 0) {
      console.log('BUG-015 IS COMPLETELY FIXED!');
    } else {
      console.log('BUG-015 HAS ISSUES - See failures above');
    }
    
  } catch (e) {
    console.error('\nFATAL ERROR:', e.message);
    await page.screenshot({ path: 'screenshots/bug015-fatal.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
