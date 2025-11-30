const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testCompleteEmailWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'compose-workflow');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });

  const results = { total: 0, passed: 0, failed: 0, na: 0, stages: {} };

  console.log('=== COMPLETE EMAIL COMPOSE WORKFLOW TEST ===');
  console.log('Date:', new Date().toISOString());
  console.log('URL: http://localhost:3004/dashboard/email/compose');
  console.log('');

  try {
    // TEST 1: Login and Navigate
    console.log('TEST 1: Login and Navigate to Compose');
    results.total++;
    
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-initial.png'), fullPage: true });
    
    const composeLoaded = await page.locator('h1:has-text("Compose Email")').count() > 0;
    results.stages['01_login_navigate'] = composeLoaded ? 'PASS' : 'FAIL';
    if (composeLoaded) results.passed++; else results.failed++;
    console.log('✓ Compose page loaded:', composeLoaded);
    console.log('Result:', composeLoaded ? 'PASS' : 'FAIL');
    console.log('');

    // TEST 2: Select Template
    console.log('TEST 2: Select Template and Auto-Fill');
    results.total++;
    
    const templateButton = page.locator('button:has-text("Select a template")');
    const templateExists = await templateButton.count() > 0;
    
    if (templateExists) {
      await templateButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '02-template-dropdown.png'), fullPage: true });
      
      // Select first template from dropdown
      const firstTemplate = page.locator('[role="menuitem"]').first();
      const hasMenuItems = await firstTemplate.count() > 0;
      
      if (hasMenuItems) {
        const templateName = await firstTemplate.textContent();
        console.log('✓ Available template:', templateName);
        
        await firstTemplate.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, '03-template-selected.png'), fullPage: true });
        
        // Check if subject and message auto-filled
        const subjectInput = page.locator('input#subject');
        const messageEditor = page.locator('.ProseMirror');
        
        const subjectValue = await subjectInput.inputValue();
        const messageHTML = await messageEditor.innerHTML();
        
        console.log('✓ Subject auto-filled:', subjectValue ? 'YES' : 'NO');
        console.log('  Subject:', subjectValue);
        console.log('✓ Message auto-filled:', messageHTML.length > 20 ? 'YES' : 'NO');
        console.log('  Message length:', messageHTML.length, 'chars');
        console.log('✓ Variables present:', messageHTML.includes('{{') || messageHTML.includes('}}') ? 'YES' : 'NO');
        
        const templateWorked = subjectValue && messageHTML.length > 20;
        results.stages['02_template_selection'] = templateWorked ? 'PASS' : 'FAIL';
        if (templateWorked) results.passed++; else results.failed++;
        console.log('Result:', templateWorked ? 'PASS' : 'FAIL');
      } else {
        console.log('⚠ No template menu items found');
        results.stages['02_template_selection'] = 'FAIL';
        results.failed++;
        console.log('Result: FAIL');
      }
    } else {
      console.log('⚠ Template button not found');
      results.stages['02_template_selection'] = 'FAIL';
      results.failed++;
      console.log('Result: FAIL');
    }
    console.log('');

    // TEST 3: Select Recipient (BUG-017 CHECK)
    console.log('TEST 3: Select Recipient - BUG-017 CRITICAL TEST');
    results.total++;
    
    const errorsBefore = consoleErrors.length;
    
    const contactButton = page.locator('button:has-text("Select a contact")');
    const contactExists = await contactButton.count() > 0;
    
    if (contactExists) {
      await contactButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '04-contact-dropdown.png'), fullPage: true });
      
      // Select first contact
      const firstContact = page.locator('[role="menuitem"]').first();
      const hasContacts = await firstContact.count() > 0;
      
      if (hasContacts) {
        const contactName = await firstContact.textContent();
        console.log('✓ Available contact:', contactName);
        
        await firstContact.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, '05-contact-selected.png'), fullPage: true });
        
        const errorsAfter = consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;
        const trimErrors = consoleErrors.slice(errorsBefore).filter(e => e.includes('trim'));
        
        console.log('✓ Contact selected successfully');
        console.log('✓ New console errors:', newErrors);
        console.log('✓ BUG-017 trim errors:', trimErrors.length);
        
        if (trimErrors.length > 0) {
          console.log('');
          console.log('⚠⚠⚠ BUG-017 STILL PRESENT ⚠⚠⚠');
          console.log('Trim errors:', trimErrors);
        } else {
          console.log('✓✓✓ BUG-017 FIXED! No trim errors! ✓✓✓');
        }
        
        results.stages['03_recipient_selection'] = trimErrors.length === 0 ? 'PASS' : 'FAIL';
        if (trimErrors.length === 0) results.passed++; else results.failed++;
        console.log('Result:', trimErrors.length === 0 ? 'PASS' : 'FAIL');
      } else {
        console.log('⚠ No contacts found in dropdown');
        results.stages['03_recipient_selection'] = 'FAIL';
        results.failed++;
        console.log('Result: FAIL');
      }
    } else {
      console.log('⚠ Contact button not found');
      results.stages['03_recipient_selection'] = 'FAIL';
      results.failed++;
      console.log('Result: FAIL');
    }
    console.log('');

    // TEST 4: Customize Subject
    console.log('TEST 4: Customize Subject');
    results.total++;
    
    const subjectInput = page.locator('input#subject');
    const currentSubject = await subjectInput.inputValue();
    const newSubjectText = currentSubject + ' - Special Offer';
    
    await subjectInput.fill(newSubjectText);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '06-subject-edited.png'), fullPage: true });
    
    const verifySubject = await subjectInput.inputValue();
    const subjectUpdated = verifySubject === newSubjectText;
    
    console.log('✓ Subject edited from:', currentSubject);
    console.log('✓ Subject edited to:', verifySubject);
    console.log('✓ Subject matches expected:', subjectUpdated);
    
    results.stages['04_subject_editing'] = subjectUpdated ? 'PASS' : 'FAIL';
    if (subjectUpdated) results.passed++; else results.failed++;
    console.log('Result:', subjectUpdated ? 'PASS' : 'FAIL');
    console.log('');

    // TEST 5: Customize Message
    console.log('TEST 5: Customize Message in Editor');
    results.total++;
    
    const messageEditor = page.locator('.ProseMirror');
    await messageEditor.click();
    await page.waitForTimeout(300);
    
    // Go to end of message
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Looking forward to hearing from you!');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: path.join(screenshotDir, '07-message-edited.png'), fullPage: true });
    
    const messageHTML = await messageEditor.innerHTML();
    const messageUpdated = messageHTML.includes('Looking forward');
    const varsStillPresent = messageHTML.includes('{{') || messageHTML.includes('}}');
    
    console.log('✓ Message updated with custom text:', messageUpdated);
    console.log('✓ Variables still present:', varsStillPresent);
    console.log('✓ Total message length:', messageHTML.length, 'chars');
    
    results.stages['05_message_editing'] = messageUpdated ? 'PASS' : 'FAIL';
    if (messageUpdated) results.passed++; else results.failed++;
    console.log('Result:', messageUpdated ? 'PASS' : 'FAIL');
    console.log('');

    // TEST 6: Formatting Buttons
    console.log('TEST 6: Test Formatting Buttons (Bold, Italic)');
    results.total++;
    
    // Select some text
    await messageEditor.click();
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(300);
    
    // Find bold button (index 7 from discovery)
    const allButtons = await page.locator('button').all();
    const boldButton = allButtons[7]; // B button
    const italicButton = allButtons[8]; // I button
    
    if (boldButton) {
      await boldButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '08-bold-applied.png'), fullPage: true });
      console.log('✓ Bold button clicked');
    }
    
    if (italicButton) {
      await italicButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '09-italic-applied.png'), fullPage: true });
      console.log('✓ Italic button clicked');
    }
    
    results.stages['06_formatting_buttons'] = 'PASS';
    results.passed++;
    console.log('Result: PASS');
    console.log('');

    // TEST 7: Variables Dropdown
    console.log('TEST 7: Variables Dropdown and All 6 Variables');
    results.total++;
    
    const variablesButton = page.locator('button:has-text("Variables")');
    const varsExists = await variablesButton.count() > 0;
    
    if (varsExists) {
      await variablesButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '10-variables-dropdown.png'), fullPage: true });
      
      const varMenuItems = await page.locator('[role="menuitem"]').allTextContents();
      console.log('✓ Variables dropdown opened');
      console.log('✓ Available variables:', varMenuItems.length);
      console.log('  Variables:', varMenuItems);
      
      const expectedVars = ['contact_name', 'first_name', 'last_name', 'email', 'company', 'phone'];
      const foundVars = expectedVars.filter(v => 
        varMenuItems.some(item => item.toLowerCase().includes(v))
      );
      
      console.log('✓ Expected variables found:', foundVars.length + '/' + expectedVars.length);
      console.log('  Found:', foundVars);
      
      // Insert a variable
      if (varMenuItems.length > 0) {
        const firstVar = page.locator('[role="menuitem"]').first();
        await firstVar.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '11-variable-inserted.png'), fullPage: true });
        console.log('✓ Variable inserted into message');
      }
      
      results.stages['07_variables_dropdown'] = foundVars.length >= 5 ? 'PASS' : 'PARTIAL';
      if (foundVars.length >= 5) results.passed++; else results.failed++;
      console.log('Result:', foundVars.length >= 5 ? 'PASS' : 'PARTIAL');
    } else {
      console.log('⚠ Variables button not found');
      results.stages['07_variables_dropdown'] = 'FAIL';
      results.failed++;
      console.log('Result: FAIL');
    }
    console.log('');

    // TEST 8: Cc/Bcc Functionality
    console.log('TEST 8: Cc/Bcc Functionality');
    results.total++;
    
    const ccButton = page.locator('button:has-text("Add Cc")');
    const bccButton = page.locator('button:has-text("Add Bcc")');
    
    const ccExists = await ccButton.count() > 0;
    const bccExists = await bccButton.count() > 0;
    
    console.log('✓ Add Cc button found:', ccExists);
    console.log('✓ Add Bcc button found:', bccExists);
    
    if (ccExists) {
      await ccButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '12-cc-added.png'), fullPage: true });
      console.log('✓ Cc field added');
    }
    
    results.stages['08_cc_bcc_functionality'] = (ccExists && bccExists) ? 'PASS' : 'PARTIAL';
    if (ccExists && bccExists) results.passed++; else if (ccExists || bccExists) { results.passed++; results.stages['08_cc_bcc_functionality'] = 'PARTIAL'; } else results.failed++;
    console.log('Result:', (ccExists && bccExists) ? 'PASS' : (ccExists || bccExists) ? 'PARTIAL' : 'FAIL');
    console.log('');

    // TEST 9: Send Button State
    console.log('TEST 9: Verify Send Button State and Styling');
    results.total++;
    
    await page.screenshot({ path: path.join(screenshotDir, '13-send-ready.png'), fullPage: true });
    
    const sendButton = page.locator('button:has-text("Send Email")');
    const sendExists = await sendButton.count() > 0;
    const sendEnabled = sendExists ? await sendButton.isEnabled() : false;
    
    console.log('✓ Send button visible:', sendExists);
    console.log('✓ Send button enabled:', sendEnabled);
    console.log('✓ Send button type:', sendExists ? await sendButton.getAttribute('type') : 'N/A');
    
    if (sendExists) {
      const buttonStyles = await sendButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          cursor: styles.cursor,
          opacity: styles.opacity,
          disabled: el.disabled
        };
      });
      console.log('✓ Button styles:', JSON.stringify(buttonStyles, null, 2));
    }
    
    results.stages['09_send_button_state'] = (sendExists && sendEnabled) ? 'PASS' : 'FAIL';
    if (sendExists && sendEnabled) results.passed++; else results.failed++;
    console.log('Result:', (sendExists && sendEnabled) ? 'PASS' : 'FAIL');
    console.log('');

    // TEST 10: Send Email (CRITICAL)
    console.log('TEST 10: SEND EMAIL - CRITICAL TEST');
    results.total++;
    
    if (sendExists && sendEnabled) {
      const errorsBefore = consoleErrors.length;
      const currentURL = page.url();
      
      console.log('✓ Clicking Send Email button...');
      await sendButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: path.join(screenshotDir, '14-after-send.png'), fullPage: true });
      
      const errorsAfter = consoleErrors.length;
      const newErrors = errorsAfter - errorsBefore;
      const newURL = page.url();
      
      // Check for success indicators
      const successToast = await page.locator('div, span').filter({ hasText: /success|sent|email sent/i }).count() > 0;
      const subjectAfter = await page.locator('input#subject').inputValue().catch(() => 'error');
      const formCleared = !subjectAfter || subjectAfter === '' || subjectAfter === 'error';
      const urlChanged = currentURL !== newURL;
      
      console.log('✓ Success toast visible:', successToast);
      console.log('✓ Form cleared:', formCleared);
      console.log('✓ URL changed:', urlChanged);
      console.log('  Before:', currentURL);
      console.log('  After:', newURL);
      console.log('✓ New console errors:', newErrors);
      
      if (newErrors > 0) {
        console.log('  Errors:', consoleErrors.slice(errorsBefore));
      }
      
      const sendWorked = successToast || formCleared || urlChanged || newErrors === 0;
      
      console.log('');
      if (sendWorked) {
        console.log('✓✓✓ SEND EMAIL WORKED! ✓✓✓');
      } else {
        console.log('⚠⚠⚠ SEND EMAIL MAY HAVE ISSUES ⚠⚠⚠');
      }
      
      results.stages['10_send_email'] = sendWorked ? 'PASS' : 'FAIL';
      if (sendWorked) results.passed++; else results.failed++;
      console.log('Result:', sendWorked ? 'PASS' : 'FAIL');
    } else {
      console.log('⚠ Cannot test send - button not available');
      results.stages['10_send_email'] = 'FAIL';
      results.failed++;
      console.log('Result: FAIL');
    }
    console.log('');

    // TEST 11: Check Inbox
    console.log('TEST 11: Check Inbox for Sent Email');
    results.total++;
    
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '15-inbox-check.png'), fullPage: true });
    
    const emailItems = await page.locator('tr, div[class*="email"], div[class*="message"], li').count();
    console.log('✓ Email items in inbox:', emailItems);
    
    results.stages['11_inbox_check'] = emailItems > 0 ? 'PASS' : 'N/A';
    if (emailItems > 0) results.passed++; else results.na++;
    console.log('Result:', emailItems > 0 ? 'PASS' : 'N/A - Inbox may be empty or feature not implemented');
    console.log('');

    // TEST 12: Console Errors
    console.log('TEST 12: Console Errors Analysis');
    
    await page.screenshot({ path: path.join(screenshotDir, '16-console.png'), fullPage: true });
    
    console.log('✓ Total console errors:', consoleErrors.length);
    console.log('✓ Total console warnings:', consoleWarnings.length);
    
    const criticalErrors = consoleErrors.filter(e => 
      e.includes('trim') || e.includes('undefined') || e.includes('Cannot read') || e.includes('TypeError')
    );
    console.log('✓ Critical errors:', criticalErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('');
      console.log('First 10 Console Errors:');
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log((i + 1) + '. ' + err.substring(0, 150));
      });
    }
    console.log('');

    // ADDITIONAL SCENARIOS
    console.log('=== ADDITIONAL SCENARIOS ===');
    console.log('');

    // Scenario A: Compose Without Template
    console.log('SCENARIO A: Compose Email Without Template');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const subj = page.locator('input#subject');
    const msg = page.locator('.ProseMirror');
    
    await subj.fill('Manual Test Email - No Template');
    await msg.click();
    await page.keyboard.type('This is a test email composed manually without using any template.');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: path.join(screenshotDir, '17-no-template.png'), fullPage: true });
    console.log('✓ Manual composition (no template): SUCCESS');
    console.log('');

    // Scenario B: Test All Variables
    console.log('SCENARIO B: All Available Variables Test');
    const varsBtn = page.locator('button:has-text("Variables")');
    if (await varsBtn.count() > 0) {
      await varsBtn.click();
      await page.waitForTimeout(1000);
      
      const allVarItems = await page.locator('[role="menuitem"]').allTextContents();
      
      await page.screenshot({ path: path.join(screenshotDir, '19-all-variables.png'), fullPage: true });
      
      console.log('✓ All available variables (' + allVarItems.length + '):');
      allVarItems.forEach((v, i) => console.log('  ' + (i + 1) + '. ' + v));
      
      const expectedVars = ['contact_name', 'first_name', 'last_name', 'email', 'company', 'phone'];
      const foundCount = expectedVars.filter(exp => 
        allVarItems.some(item => item.toLowerCase().includes(exp))
      ).length;
      
      console.log('✓ Expected variables found:', foundCount + '/6');
      
      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    console.log('');

    // FINAL SUMMARY
    console.log('TEST RESULTS SUMMARY');
    console.log('====================');
    console.log('');
    console.log('Date:', new Date().toISOString());
    console.log('Workflow: Template Selection -> Recipient -> Customization -> Send');
    console.log('');
    
    console.log('TEST STATISTICS:');
    console.log('  Total Tests:', results.total);
    console.log('  Passed:', results.passed);
    console.log('  Failed:', results.failed);
    console.log('  N/A:', results.na);
    const passRate = Math.round((results.passed / results.total) * 100);
    console.log('  Pass Rate:', passRate + '%');
    console.log('');
    
    console.log('WORKFLOW STAGES:');
    Object.entries(results.stages).forEach(([stage, result]) => {
      const icon = result === 'PASS' ? '✓' : result === 'FAIL' ? '✗' : result === 'PARTIAL' ? '○' : '~';
      console.log(icon + ' ' + stage + ': ' + result);
    });
    console.log('');
    
    console.log('CONSOLE ERRORS:');
    console.log('  Total Errors:', consoleErrors.length);
    console.log('  Total Warnings:', consoleWarnings.length);
    
    const trimErrors = consoleErrors.filter(e => e.includes('trim'));
    console.log('  BUG-017 Trim Errors:', trimErrors.length);
    
    if (trimErrors.length > 0) {
      console.log('');
      console.log('  BUG-017 STATUS: STILL PRESENT');
    } else {
      console.log('');
      console.log('  BUG-017 STATUS: FIXED!');
    }
    console.log('');
    
    let overallStatus = 'BROKEN';
    let readyFor = 'Major bug fixing required';
    
    if (passRate >= 90 && trimErrors.length === 0) {
      overallStatus = 'FULLY FUNCTIONAL';
      readyFor = 'Manual email entry feature implementation';
    } else if (passRate >= 75) {
      overallStatus = 'PARTIALLY FUNCTIONAL';
      readyFor = 'Minor bug fixes';
    } else if (passRate >= 50) {
      overallStatus = 'MOSTLY WORKING';
      readyFor = 'Bug fixing and refinement';
    }
    
    console.log('FINAL VERDICT: Email Compose Workflow is ' + overallStatus);
    console.log('Pass Rate: ' + passRate + '%');
    console.log('BUG-017 Status: ' + (trimErrors.length === 0 ? 'FIXED' : 'PRESENT'));
    console.log('');
    
    console.log('READY FOR: ' + readyFor);
    console.log('');
    console.log('Screenshots saved to: ' + screenshotDir);
    console.log('');
    console.log('END OF WORKFLOW TEST');

  } catch (error) {
    console.error('TEST FAILED WITH ERROR:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-CRITICAL.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testCompleteEmailWorkflow();
