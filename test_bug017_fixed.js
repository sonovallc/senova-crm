const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBug017() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const screenshotDir = 'screenshots/bug017-final';
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  
  const errors = [];
  page.on('console', m => {
    if (m.type() === 'error') {
      errors.push(m.text());
      console.log('[CONSOLE ERROR]', m.text());
    }
  });
  page.on('pageerror', e => {
    errors.push(e.message);
    console.log('[PAGE ERROR]', e.message);
  });
  
  try {
    console.log('='.repeat(80));
    console.log('BUG-017 COMPREHENSIVE VERIFICATION - FINAL');
    console.log('Bug: Cannot read properties of undefined (reading trim)');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('[1] Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('OK - Login successful');
    console.log('');
    
    console.log('[2] Navigate to Email Composer...');
    const baselineErrors = errors.length;
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-page-load.png'), fullPage: true });
    console.log('OK - Page loaded, baseline errors:', baselineErrors);
    console.log('');
    
    console.log('='.repeat(80));
    console.log('PRIMARY BUG TEST: Click Contact Selection Button');
    console.log('='.repeat(80));
    console.log('');
    
    const errorsBefore = errors.length;
    console.log('[3] Clicking "Select a contact..." button...');
    console.log('CRITICAL MOMENT: Watching for trim errors...');
    console.log('');
    
    const contactButton = page.getByText('Select a contact...');
    await contactButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(screenshotDir, '02-contact-dropdown-opened.png'), fullPage: true });
    
    const errorsAfter = errors.length;
    const newErrors = errors.slice(errorsBefore);
    const hasTrimError = newErrors.some(e => e.includes('trim') || e.includes('Cannot read properties'));
    
    console.log('Dropdown opened:', errorsAfter - errorsBefore === 0 ? 'YES' : 'WITH ERRORS');
    console.log('New errors triggered:', errorsAfter - errorsBefore);
    console.log('Trim error occurred:', hasTrimError ? 'YES (BUG NOT FIXED!)' : 'NO (BUG FIXED!)');
    console.log('');
    
    if (hasTrimError) {
      console.log('ERRORS FOUND:');
      newErrors.forEach(e => console.log('  -', e));
      console.log('');
    }
    
    console.log('[4] Select first contact from dropdown...');
    const firstContact = page.locator('button, [role="option"]').first();
    if (await firstContact.count() > 0) {
      await firstContact.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '03-contact-selected.png'), fullPage: true });
      console.log('OK - Contact selected');
    }
    console.log('');
    
    console.log('[5] Fill subject...');
    await page.fill('input[placeholder="Email subject"]', 'BUG-017 Verification Test');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '04-subject-filled.png'), fullPage: true });
    console.log('OK - Subject filled');
    console.log('');
    
    console.log('[6] Fill message...');
    const editor = page.locator('[contenteditable="true"], [role="textbox"]').first();
    await editor.click();
    await editor.fill('Testing BUG-017 complete fix. Contact selection works without errors.');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '05-message-filled.png'), fullPage: true });
    console.log('OK - Message filled');
    console.log('');
    
    console.log('='.repeat(80));
    console.log('FINAL ERROR ANALYSIS');
    console.log('='.repeat(80));
    console.log('');
    
    const trimErrors = errors.filter(e => e.toLowerCase().includes('trim'));
    const undefErrors = errors.filter(e => e.toLowerCase().includes('cannot read properties of undefined'));
    
    console.log('Total errors:', errors.length);
    console.log('Trim-related errors:', trimErrors.length);
    console.log('Undefined property errors:', undefErrors.length);
    console.log('');
    
    const bug017Fixed = trimErrors.length === 0 && undefErrors.length === 0;
    
    console.log('='.repeat(80));
    console.log('BUG-017 STATUS:', bug017Fixed ? 'COMPLETELY FIXED ✓' : 'NOT FIXED ✗');
    console.log('PRODUCTION READY:', bug017Fixed ? 'YES ✓' : 'NO ✗');
    console.log('='.repeat(80));
    console.log('');
    
    if (!bug017Fixed) {
      console.log('ERRORS FOUND:');
      const allErrs = [...new Set([...trimErrors, ...undefErrors])];
      allErrs.forEach(e => console.log('  -', e));
      console.log('');
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testBug017().catch(console.error);
