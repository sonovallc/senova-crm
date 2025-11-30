const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const screenshotDir = path.join('C:', 'Users', 'jwood', 'Documents', 'Projects', 'claude-code-agents-wizard-v2', 'screenshots', 'round2-bugfix');
  console.log('Screenshot directory: ' + screenshotDir);
  
  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('Login successful');
    
    console.log('Step 2: Navigating to inbox...');
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    
    console.log('Step 3: Taking inbox screenshot...');
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-1-inbox.png'), fullPage: true });
    console.log('Screenshot saved: bug-3-1-inbox.png');
    
    console.log('Step 4: Looking for message threads...');
    const messageThread = page.locator('.inbox-message, .message-thread, [class*="message"][class*="item"], .thread-item, tbody tr').first();
    const threadExists = await messageThread.count() > 0;
    
    if (!threadExists) {
      console.log('No message threads found in inbox');
      await browser.close();
      return;
    }
    
    console.log('Found message thread, clicking...');
    await messageThread.click();
    await page.waitForTimeout(3000);
    
    console.log('Step 5: Taking thread screenshot...');
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-2-thread.png'), fullPage: true });
    console.log('Screenshot saved: bug-3-2-thread.png');
    
    console.log('Step 6: Looking for template selector...');
    const allSelects = await page.locator('select').all();
    console.log('Found ' + allSelects.length + ' select elements');
    
    let templateSelector = null;
    for (let i = 0; i < allSelects.length; i++) {
      const selectText = await allSelects[i].textContent();
      const selectName = await allSelects[i].getAttribute('name');
      console.log('Select ' + i + ' (name=' + selectName + '): ' + selectText?.substring(0, 100));
      
      if (selectName && selectName.includes('template')) {
        templateSelector = allSelects[i];
        console.log('Found template selector at index ' + i);
        break;
      }
    }
    
    if (!templateSelector && allSelects.length > 0) {
      templateSelector = allSelects[allSelects.length - 1];
      console.log('Using last select as template selector');
    }
    
    if (!templateSelector) {
      console.log('No template selector found');
      await browser.close();
      return;
    }
    
    const tagName = await templateSelector.evaluate(el => el.tagName);
    const className = await templateSelector.evaluate(el => el.className);
    console.log('DESCRIPTION: Template selector is a ' + tagName + ' with class: ' + className);
    
    console.log('Step 7: Opening template selector...');
    await templateSelector.focus();
    await page.waitForTimeout(1000);
    
    console.log('Step 8: Taking dropdown screenshot...');
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-3-dropdown.png'), fullPage: true });
    console.log('Screenshot saved: bug-3-3-dropdown.png');
    
    console.log('Step 9: Getting template list...');
    const options = await templateSelector.locator('option').all();
    let templates = [];
    for (const option of options) {
      const text = await option.textContent();
      const value = await option.getAttribute('value');
      if (text && text.trim()) {
        templates.push({ text: text.trim(), value: value });
      }
    }
    
    console.log('DESCRIPTION: Available templates:');
    templates.forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t.text + ' (value=' + t.value + ')'));
    
    if (templates.length === 0) {
      console.log('No templates found');
      await browser.close();
      return;
    }
    
    console.log('Step 10: Selecting template...');
    const templateToSelect = templates.find(t => !t.text.toLowerCase().includes('select') && t.text.trim() !== '' && t.value && t.value !== '');
    
    if (!templateToSelect) {
      console.log('No valid template to select');
      await browser.close();
      return;
    }
    
    console.log('Selecting template: ' + templateToSelect.text + ' (value=' + templateToSelect.value + ')');
    const currentUrl = page.url();
    console.log('Current URL before selection: ' + currentUrl);
    
    await templateSelector.selectOption({ value: templateToSelect.value });
    await page.waitForTimeout(3000);
    
    console.log('Step 11: Taking result screenshot...');
    await page.screenshot({ path: path.join(screenshotDir, 'bug-3-4-result.png'), fullPage: true });
    console.log('Screenshot saved: bug-3-4-result.png');
    
    const newUrl = page.url();
    console.log('URL after selection: ' + newUrl);
    
    if (newUrl !== currentUrl) {
      console.log('DESCRIPTION: BUG CONFIRMED - Navigated to different page');
      console.log('Expected: Template content inserted into composer');
      console.log('Actual: Navigation to: ' + newUrl);
      
      const pageTitle = await page.title();
      const pageContent = await page.textContent('body');
      console.log('Page title: ' + pageTitle);
      
      if (pageContent.includes('404') || pageContent.includes('Error') || pageContent.includes('not found')) {
        console.log('ERROR PAGE DETECTED');
      }
    } else {
      console.log('DESCRIPTION: No navigation occurred');
      
      const composer = page.locator('textarea, [contenteditable="true"]').first();
      const composerExists = await composer.count() > 0;
      
      if (composerExists) {
        const composerContent = await composer.textContent().catch(() => '');
        console.log('Composer content length: ' + composerContent.length);
        
        if (composerContent.includes(templateToSelect.text) || composerContent.length > 50) {
          console.log('Template appears to be inserted correctly');
        } else {
          console.log('Template was NOT inserted - possible bug');
        }
      } else {
        console.log('Composer not found to check template insertion');
      }
    }
    
    console.log('BUG-3 REPRODUCTION COMPLETE');
    
  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();
