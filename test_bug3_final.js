const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const dir = 'screenshots/round2-bugfix';
  
  try {
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('Login OK');
    
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: dir + '/bug-3-1-inbox.png', fullPage: true });
    console.log('Inbox screenshot saved');
    
    await page.locator('text=Dolores Fay').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/bug-3-2-thread.png', fullPage: true });
    console.log('Thread screenshot saved');
    
    const selects = await page.locator('select').all();
    console.log('Found', selects.length, 'select elements');
    
    let templateSelect = null;
    for (let i = 0; i < selects.length; i++) {
      const name = await selects[i].getAttribute('name');
      const text = await selects[i].textContent();
      console.log('Select', i, 'name:', name, 'preview:', text.substring(0, 80));
      if (name && name.includes('template')) {
        templateSelect = selects[i];
        console.log('Found template select at index', i);
        break;
      }
    }
    
    if (!templateSelect && selects.length > 0) {
      console.log('Checking selects by content...');
      for (let i = 0; i < selects.length; i++) {
        const text = await selects[i].textContent();
        if (text.toLowerCase().includes('template')) {
          templateSelect = selects[i];
          console.log('Found template select by content at index', i);
          break;
        }
      }
    }
    
    if (!templateSelect) {
      console.log('ERROR: No template selector found');
      await browser.close();
      return;
    }
    
    const selectName = await templateSelect.getAttribute('name');
    console.log('DESCRIPTION: Template selector found with name:', selectName);
    
    await templateSelect.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: dir + '/bug-3-3-dropdown.png', fullPage: true });
    console.log('Dropdown screenshot saved');
    
    const options = await templateSelect.locator('option').all();
    let templates = [];
    for (const opt of options) {
      const text = await opt.textContent();
      const val = await opt.getAttribute('value');
      if (text && text.trim()) templates.push({ text: text.trim(), value: val });
    }
    
    console.log('DESCRIPTION: Available templates:');
    templates.forEach((t, i) => console.log((i+1) + '.', t.text, '(value=' + t.value + ')'));
    
    const template = templates.find(t => 
      t.value && 
      t.value !== '' && 
      !t.text.toLowerCase().includes('select')
    );
    
    if (!template) {
      console.log('ERROR: No valid template to select');
      await browser.close();
      return;
    }
    
    const beforeUrl = page.url();
    console.log('URL before selection:', beforeUrl);
    console.log('Selecting template:', template.text, '(value=' + template.value + ')');
    
    await templateSelect.selectOption({ value: template.value });
    await page.waitForTimeout(3000);
    
    const afterUrl = page.url();
    console.log('URL after selection:', afterUrl);
    
    await page.screenshot({ path: dir + '/bug-3-4-result.png', fullPage: true });
    console.log('Result screenshot saved');
    
    console.log('\n=== RESULT ===');
    if (beforeUrl !== afterUrl) {
      console.log('*** BUG CONFIRMED ***');
      console.log('DESCRIPTION: Selecting template caused navigation');
      console.log('Expected: Template inserted into composer');
      console.log('Actual: Navigated to', afterUrl);
      
      const title = await page.title();
      const body = await page.textContent('body');
      console.log('Page title:', title);
      
      if (body.includes('404') || body.includes('Error') || body.toLowerCase().includes('not found')) {
        console.log('*** ERROR PAGE DETECTED ***');
      }
    } else {
      console.log('No navigation occurred');
      const composer = page.locator('textarea, [contenteditable="true"]').first();
      const exists = await composer.count() > 0;
      if (exists) {
        const content = await composer.textContent().catch(() => '');
        console.log('Composer content length:', content.length);
        if (content.length > 50) {
          console.log('Template appears inserted correctly');
        } else {
          console.log('Template NOT inserted - BUG CONFIRMED');
        }
      }
    }
    
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
