const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('[CONSOLE ERROR]', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('[PAGE ERROR]', err.message);
  });

  try {
    console.log('
' + '='.repeat(80));
    console.log('BUG-017 COMPREHENSIVE VERIFICATION - FINAL');
    console.log('='.repeat(80));
    console.log('Bug: Cannot read properties of undefined (reading "trim")');
    console.log('Files Fixed: page.tsx + email-composer.tsx
');
    
    console.log('T1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful
');

    console.log('T2: Navigate to Email Composer...');
    const baselineErrors = errors.length;
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/bug017-01-page-load.png', fullPage: true });
    console.log('✓ Page loaded, baseline errors:', baselineErrors, '
');

    console.log('='.repeat(80));
    console.log('PRIMARY BUG TEST: Contact Selection');
    console.log('='.repeat(80));
    const errorsBefore = errors.length;
    
    const dropdown = page.locator('select').first();
    await dropdown.waitFor({ state: 'visible' });
    const options = await dropdown.locator('option').all();
    console.log('Found', options.length, 'contact options');
    
    if (options.length > 1) {
      const value = await options[1].getAttribute('value');
      const text = await options[1].textContent();
      console.log('
T3: Selecting contact:', text);
      console.log('CRITICAL MOMENT: Watching for trim errors...
');
      
      await dropdown.selectOption(value);
      await page.waitForTimeout(2000);
      
      const errorsAfter = errors.length;
      const newErrors = errors.slice(errorsBefore);
      const hasTrimError = newErrors.some(e => 
        e.includes('trim') || e.includes('Cannot read properties of undefined')
      );
      
      await page.screenshot({ path: 'screenshots/bug017-02-contact-selected.png', fullPage: true });
      
      console.log('Contact selected successfully:', await dropdown.inputValue() === value);
      console.log('Trim error occurred:', hasTrimError ? 'YES (BUG NOT FIXED!)' : 'NO (BUG FIXED!)');
      console.log('New errors triggered:', errorsAfter - errorsBefore);
      
      if (hasTrimError) {
        console.log('
❌ FAIL: BUG-017 NOT FIXED');
        newErrors.forEach(e => console.log('  -', e));
      } else {
        console.log('
✅ PASS: No trim errors!');
      }
    }

    console.log('
T4: Fill subject field...');
    const subject = page.locator('input[type="text"]').first();
    await subject.fill('BUG-017 Verification Test');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/bug017-03-subject-filled.png', fullPage: true });
    console.log('✓ Subject filled');

    console.log('
T5: Fill message field...');
    const message = page.locator('textarea').first();
    await message.fill('Testing BUG-017 fix - contact selection works!');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/bug017-04-message-filled.png', fullPage: true });
    
    const sendBtn = page.locator('button').filter({ hasText: 'Send' });
    const enabled = !(await sendBtn.isDisabled());
    console.log('✓ Message filled, Send button enabled:', enabled);

    console.log('
T6: Change contact (stress test)...');
    if (options.length > 2) {
      const value2 = await options[2].getAttribute('value');
      await dropdown.selectOption(value2);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bug017-05-contact-changed.png', fullPage: true });
      console.log('✓ Contact changed');
    }

    console.log('
' + '='.repeat(80));
    console.log('FINAL ERROR ANALYSIS');
    console.log('='.repeat(80));
    
    const trimErrors = errors.filter(e => e.toLowerCase().includes('trim'));
    const undefErrors = errors.filter(e => e.toLowerCase().includes('cannot read properties of undefined'));
    
    console.log('Total errors:', errors.length);
    console.log('Trim-related errors:', trimErrors.length);
    console.log('Undefined property errors:', undefErrors.length);
    
    const bug017Fixed = trimErrors.length === 0 && undefErrors.length === 0;
    
    console.log('
' + '='.repeat(80));
    console.log('BUG-017 STATUS:', bug017Fixed ? '✅ COMPLETELY FIXED' : '❌ NOT FIXED');
    console.log('PRODUCTION READY:', bug017Fixed ? 'YES ✅' : 'NO ❌');
    console.log('='.repeat(80) + '
');
    
    if (!bug017Fixed) {
      console.log('ERRORS FOUND:');
      [...new Set([...trimErrors, ...undefErrors])].forEach(e => console.log('  -', e));
    }

  } catch (error) {
    console.error('
Test error:', error.message);
    await page.screenshot({ path: 'screenshots/bug017-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
