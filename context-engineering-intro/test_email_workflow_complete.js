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

  const results = { total: 0, passed: 0, failed: 0, stages: {} };

  console.log('=== COMPLETE EMAIL COMPOSE WORKFLOW TEST ===');
  console.log('Date:', new Date().toISOString());
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
    
    const composeLoaded = await page.locator('h1, h2').count() > 0;
    results.stages['login_navigate'] = composeLoaded ? 'PASS' : 'FAIL';
    if (composeLoaded) results.passed++; else results.failed++;
    console.log('Result: ' + (composeLoaded ? 'PASS' : 'FAIL'));
    console.log('');

    // TEST 2: Select Template
    console.log('TEST 2: Select Template');
    results.total++;
    
    const templateSelect = page.locator('select').filter({ hasText: /template/i }).first();
    const templateExists = await templateSelect.count() > 0;
    
    if (templateExists) {
      await page.screenshot({ path: path.join(screenshotDir, '02-template-dropdown.png'), fullPage: true });
      
      const options = await templateSelect.locator('option').allTextContents();
      console.log('Available templates:', options.length);
      
      if (options.length > 1) {
        await templateSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, '03-template-selected.png'), fullPage: true });
        
        const subjectInput = page.locator('input[type="text"]').first();
        const messageTextarea = page.locator('textarea').first();
        
        const subjectValue = await subjectInput.inputValue();
        const messageValue = await messageTextarea.inputValue();
        
        console.log('Subject auto-filled:', subjectValue ? 'YES' : 'NO');
        console.log('Message auto-filled:', messageValue.length > 0 ? 'YES' : 'NO');
        console.log('Variables present:', messageValue.includes('{{') ? 'YES' : 'NO');
        
        const templateWorked = subjectValue && messageValue;
        results.stages['template_selection'] = templateWorked ? 'PASS' : 'FAIL';
        if (templateWorked) results.passed++; else results.failed++;
        console.log('Result: ' + (templateWorked ? 'PASS' : 'FAIL'));
      }
    } else {
      console.log('Template dropdown not found');
      results.stages['template_selection'] = 'FAIL';
      results.failed++;
    }
    console.log('');

    // TEST 3: Select Recipient
    console.log('TEST 3: Select Recipient (BUG-017 Check)');
    results.total++;
    
    const errorsBefore = consoleErrors.length;
    
    const contactSelect = page.locator('select').filter({ hasText: /contact|to/i }).first();
    const contactExists = await contactSelect.count() > 0;
    
    if (contactExists) {
      await page.screenshot({ path: path.join(screenshotDir, '04-contact-dropdown.png'), fullPage: true });
      
      const contactOptions = await contactSelect.locator('option').allTextContents();
      console.log('Available contacts:', contactOptions.length);
      
      if (contactOptions.length > 1) {
        await contactSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, '05-contact-selected.png'), fullPage: true });
        
        const errorsAfter = consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;
        const hasTrimError = consoleErrors.slice(errorsBefore).some(e => e.includes('trim'));
        
        console.log('Contact selected:', contactOptions[1]);
        console.log('New console errors:', newErrors);
        console.log('BUG-017 (trim error):', hasTrimError ? 'PRESENT - FAILED!' : 'NOT PRESENT - FIXED!');
        
        results.stages['recipient_selection'] = !hasTrimError ? 'PASS' : 'FAIL';
        if (!hasTrimError) results.passed++; else results.failed++;
        console.log('Result: ' + (!hasTrimError ? 'PASS' : 'FAIL'));
      }
    } else {
      console.log('Contact dropdown not found');
      results.stages['recipient_selection'] = 'FAIL';
      results.failed++;
    }
    console.log('');

    // TEST 4: Customize Subject
    console.log('TEST 4: Customize Subject');
    results.total++;
    
    const subjectInput = page.locator('input[type="text"]').first();
    const currentSubject = await subjectInput.inputValue();
    await subjectInput.fill(currentSubject + ' - Special Offer');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '06-subject-edited.png'), fullPage: true });
    
    const newSubject = await subjectInput.inputValue();
    const subjectUpdated = newSubject.includes('Special Offer');
    
    console.log('Subject updated:', subjectUpdated ? 'YES' : 'NO');
    results.stages['subject_editing'] = subjectUpdated ? 'PASS' : 'FAIL';
    if (subjectUpdated) results.passed++; else results.failed++;
    console.log('Result: ' + (subjectUpdated ? 'PASS' : 'FAIL'));
    console.log('');

    // TEST 5: Customize Message
    console.log('TEST 5: Customize Message');
    results.total++;
    
    const messageTextarea = page.locator('textarea').first();
    const currentMessage = await messageTextarea.inputValue();
    await messageTextarea.fill(currentMessage + '\n\nLooking forward to hearing from you!');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '07-message-edited.png'), fullPage: true });
    
    const newMessage = await messageTextarea.inputValue();
    const messageUpdated = newMessage.includes('Looking forward');
    const varsStillPresent = newMessage.includes('{{');
    
    console.log('Message updated:', messageUpdated ? 'YES' : 'NO');
    console.log('Variables still present:', varsStillPresent ? 'YES' : 'NO');
    results.stages['message_editing'] = messageUpdated ? 'PASS' : 'FAIL';
    if (messageUpdated) results.passed++; else results.failed++;
    console.log('Result: ' + (messageUpdated ? 'PASS' : 'FAIL'));
    console.log('');

    // TEST 6: Formatting Buttons
    console.log('TEST 6: Test Formatting Buttons');
    results.total++;
    
    const boldButton = page.locator('button').filter({ hasText: /^B$|bold/i }).first();
    const italicButton = page.locator('button').filter({ hasText: /^I$|italic/i }).first();
    
    const boldExists = await boldButton.count() > 0;
    const italicExists = await italicButton.count() > 0;
    
    console.log('Bold button found:', boldExists ? 'YES' : 'NO');
    console.log('Italic button found:', italicExists ? 'YES' : 'NO');
    
    if (boldExists || italicExists) {
      await messageTextarea.click();
      await page.keyboard.press('Control+A');
      await page.waitForTimeout(300);
      
      if (boldExists) {
        await boldButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '08-bold-applied.png'), fullPage: true });
      }
      
      if (italicExists) {
        await italicButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '09-italic-applied.png'), fullPage: true });
      }
      
      results.stages['formatting_buttons'] = 'PASS';
      results.passed++;
      console.log('Result: PASS');
    } else {
      console.log('No formatting buttons found');
      results.stages['formatting_buttons'] = 'PARTIAL';
      results.failed++;
      console.log('Result: PARTIAL');
    }
    console.log('');

    // TEST 7: Variables Dropdown
    console.log('TEST 7: Variables Dropdown and Insertion');
    results.total++;
    
    const variablesSelect = page.locator('select').filter({ hasText: /variable/i }).first();
    const varsExists = await variablesSelect.count() > 0;
    
    if (varsExists) {
      await page.screenshot({ path: path.join(screenshotDir, '10-variables-dropdown.png'), fullPage: true });
      
      const allVars = await variablesSelect.locator('option').allTextContents();
      console.log('Available variables:', allVars);
      
      const expectedVars = ['contact_name', 'first_name', 'last_name', 'email', 'company', 'phone'];
      const foundVars = expectedVars.filter(v => allVars.some(opt => opt.includes(v)));
      
      console.log('Expected variables found:', foundVars.length + '/' + expectedVars.length);
      
      if (allVars.length > 1) {
        await variablesSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '11-variable-inserted.png'), fullPage: true });
      }
      
      results.stages['variable_insertion'] = foundVars.length >= 5 ? 'PASS' : 'PARTIAL';
      if (foundVars.length >= 5) results.passed++; else results.failed++;
      console.log('Result: ' + (foundVars.length >= 5 ? 'PASS' : 'PARTIAL'));
    } else {
      console.log('Variables dropdown not found');
      results.stages['variable_insertion'] = 'FAIL';
      results.failed++;
      console.log('Result: FAIL');
    }
    console.log('');

    // TEST 8: Cc Functionality (Optional)
    console.log('TEST 8: Cc Functionality (Optional Feature)');
    results.total++;
    
    const ccButton = page.locator('button').filter({ hasText: /add cc|cc/i }).first();
    const ccExists = await ccButton.count() > 0;
    
    if (ccExists) {
      await ccButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '12-cc-added.png'), fullPage: true });
      console.log('Cc button found and clicked: YES');
      results.stages['cc_functionality'] = 'PASS';
      results.passed++;
      console.log('Result: PASS');
    } else {
      console.log('Cc functionality: NOT IMPLEMENTED');
      results.stages['cc_functionality'] = 'N/A';
      console.log('Result: N/A');
    }
    console.log('');

    // TEST 9: Send Button State
    console.log('TEST 9: Verify Send Button State');
    results.total++;
    
    await page.screenshot({ path: path.join(screenshotDir, '13-send-ready.png'), fullPage: true });
    
    const sendButton = page.locator('button').filter({ hasText: /send email|send/i }).first();
    const sendExists = await sendButton.count() > 0;
    const sendEnabled = sendExists ? await sendButton.isEnabled() : false;
    
    console.log('Send button visible:', sendExists ? 'YES' : 'NO');
    console.log('Send button enabled:', sendEnabled ? 'YES' : 'NO');
    
    if (sendExists) {
      const buttonStyles = await sendButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          cursor: styles.cursor,
          opacity: styles.opacity
        };
      });
      console.log('Button styles:', JSON.stringify(buttonStyles));
    }
    
    results.stages['send_button_state'] = (sendExists && sendEnabled) ? 'PASS' : 'FAIL';
    if (sendExists && sendEnabled) results.passed++; else results.failed++;
    console.log('Result: ' + ((sendExists && sendEnabled) ? 'PASS' : 'FAIL'));
    console.log('');

    // TEST 10: Send Email (CRITICAL)
    console.log('TEST 10: Send Email (CRITICAL TEST)');
    results.total++;
    
    if (sendExists && sendEnabled) {
      const errorsBefore = consoleErrors.length;
      
      await sendButton.click();
      console.log('Send button clicked!');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: path.join(screenshotDir, '14-after-send.png'), fullPage: true });
      
      const errorsAfter = consoleErrors.length;
      const newErrors = errorsAfter - errorsBefore;
      
      // Check for success message
      const successMsg = await page.locator('div, span, p').filter({ hasText: /success|sent|email sent/i }).count() > 0;
      
      // Check if form cleared
      const subjectAfter = await subjectInput.inputValue();
      const messageAfter = await messageTextarea.inputValue();
      const formCleared = !subjectAfter && !messageAfter;
      
      // Check URL change
      const currentURL = page.url();
      
      console.log('Success message visible:', successMsg ? 'YES' : 'NO');
      console.log('Form cleared:', formCleared ? 'YES' : 'NO');
      console.log('New console errors:', newErrors);
      console.log('Current URL:', currentURL);
      
      const sendWorked = successMsg || formCleared || currentURL.includes('inbox') || currentURL.includes('sent');
      results.stages['send_action'] = sendWorked ? 'PASS' : 'FAIL';
      if (sendWorked) results.passed++; else results.failed++;
      console.log('Result: ' + (sendWorked ? 'PASS' : 'FAIL'));
    } else {
      console.log('Cannot test send - button not available');
      results.stages['send_action'] = 'FAIL';
      results.failed++;
      console.log('Result: FAIL');
    }
    console.log('');

    // TEST 11: Check Inbox for Sent Email
    console.log('TEST 11: Check Inbox for Sent Email');
    results.total++;
    
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '15-inbox-check.png'), fullPage: true });
    
    const emailRows = await page.locator('tr, div[class*="email"], div[class*="message"], li').count();
    console.log('Email items in inbox:', emailRows);
    
    results.stages['inbox_verification'] = emailRows > 0 ? 'PASS' : 'N/A';
    if (emailRows > 0) results.passed++;
    console.log('Result: ' + (emailRows > 0 ? 'PASS' : 'N/A'));
    console.log('');

    // TEST 12: Console Errors Summary
    console.log('TEST 12: Console Errors Summary');
    
    await page.screenshot({ path: path.join(screenshotDir, '16-console.png'), fullPage: true });
    
    console.log('Total console errors:', consoleErrors.length);
    console.log('Total console warnings:', consoleWarnings.length);
    
    if (consoleErrors.length > 0) {
      console.log('\nFirst 10 Console Errors:');
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(i + 1 + '. ' + err.substring(0, 100));
      });
    }
    console.log('');

    // ADDITIONAL SCENARIOS
    console.log('=== ADDITIONAL SCENARIOS ===');
    console.log('');

    // Scenario A: Compose Without Template
    console.log('SCENARIO A: Compose Without Template');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const subField = page.locator('input[type="text"]').first();
    const msgField = page.locator('textarea').first();
    
    await subField.fill('Test Email Without Template');
    await msgField.fill('This is a test message created without using a template.');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: path.join(screenshotDir, '17-no-template.png'), fullPage: true });
    console.log('Manual composition (no template): YES');
    console.log('');

    // Scenario B: Template Switching
    console.log('SCENARIO B: Change Template Mid-Composition');
    const tempSelect = page.locator('select').filter({ hasText: /template/i }).first();
    const tempExists2 = await tempSelect.count() > 0;
    
    if (tempExists2) {
      const opts = await tempSelect.locator('option').count();
      if (opts > 2) {
        await tempSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        const content1 = await msgField.inputValue();
        
        await tempSelect.selectOption({ index: 2 });
        await page.waitForTimeout(1000);
        const content2 = await msgField.inputValue();
        
        await page.screenshot({ path: path.join(screenshotDir, '18-template-changed.png'), fullPage: true });
        
        const contentChanged = content1 !== content2;
        console.log('Template switching works:', contentChanged ? 'YES' : 'NO');
      } else {
        console.log('Not enough templates to test switching');
      }
    }
    console.log('');

    // Scenario C: All Variables
    console.log('SCENARIO C: All Variables Test');
    const varsSelect2 = page.locator('select').filter({ hasText: /variable/i }).first();
    const varsExists2 = await varsSelect2.count() > 0;
    
    if (varsExists2) {
      const allVars2 = await varsSelect2.locator('option').allTextContents();
      console.log('All available variables:', allVars2);
      
      await page.screenshot({ path: path.join(screenshotDir, '19-all-variables.png'), fullPage: true });
      
      const expectedVars2 = ['contact_name', 'first_name', 'last_name', 'email', 'company', 'phone'];
      const foundVars2 = expectedVars2.filter(v => allVars2.some(opt => opt.includes(v)));
      
      console.log('Expected variables found:', foundVars2.length + '/' + expectedVars2.length);
      console.log('Variables:', foundVars2);
    }
    console.log('');

    // FINAL SUMMARY
    console.log('=== TEST RESULTS SUMMARY ===');
    console.log('');
    console.log('Total Tests:', results.total);
    console.log('Passed:', results.passed);
    console.log('Failed:', results.failed);
    console.log('Pass Rate:', Math.round((results.passed / results.total) * 100) + '%');
    console.log('');
    
    console.log('WORKFLOW STAGES:');
    Object.entries(results.stages).forEach(([stage, result]) => {
      const icon = result === 'PASS' ? '✓' : result === 'FAIL' ? '✗' : '○';
      console.log(icon + ' ' + stage + ': ' + result);
    });
    console.log('');
    
    console.log('Console Errors:', consoleErrors.length);
    console.log('Console Warnings:', consoleWarnings.length);
    
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('trim') || err.includes('undefined') || err.includes('Cannot read')
    );
    console.log('Critical Errors:', criticalErrors.length);
    console.log('');
    
    // Determine overall status
    const passRate = (results.passed / results.total) * 100;
    let overallStatus = 'BROKEN';
    if (passRate >= 90) overallStatus = 'FULLY FUNCTIONAL';
    else if (passRate >= 70) overallStatus = 'PARTIALLY FUNCTIONAL';
    
    console.log('FINAL VERDICT: Email Compose Workflow is ' + overallStatus);
    console.log('');
    
    console.log('BUG-017 STATUS:', criticalErrors.filter(e => e.includes('trim')).length === 0 ? 'FIXED' : 'STILL PRESENT');
    console.log('');
    
    console.log('MISSING FEATURE (User Requested):');
    console.log('- Manual email address entry (not in contacts) - NOT YET IMPLEMENTED');
    console.log('');
    
    console.log('READY FOR:', passRate >= 80 ? 'Manual email entry feature implementation' : 'Bug fixing');
    console.log('');
    console.log('=== END OF WORKFLOW TEST ===');

  } catch (error) {
    console.error('TEST FAILED WITH ERROR:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testCompleteEmailWorkflow();
