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
    
    await page.locator('text=Dolores Fay').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir + '/bug-3-2-thread.png', fullPage: true });
    console.log('Thread open');
    
    const selects = await page.locator('select').all();
    let templateSelect = selects.find(async s => {
      const text = await s.textContent();
      return text.toLowerCase().includes('template');
    });
    
    if (!templateSelect && selects.length > 0) {
      templateSelect = selects[0];
    }
    
    if (!templateSelect) {
      console.log('No template selector found');
      await browser.close();
      return;
    }
    
    await templateSelect.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: dir + '/bug-3-3-dropdown.png', fullPage: true });
    
    const options = await templateSelect.locator('option').all();
    let templates = [];
    for (const opt of options) {
      const text = await opt.textContent();
      const val = await opt.getAttribute('value');
      if (text && text.trim()) templates.push({ text: text.trim(), value: val });
    }
    
    console.log('Available templates:', templates.length);
    templates.slice(0, 5).forEach((t, i) => console.log((i+1) + '.', t.text));
    
    const template = templates.find(t => 
      t.value && 
      t.value !== '' && 
      t.value !== 'no-template' &&
      !t.text.toLowerCase().includes('custom') &&
      !t.text.toLowerCase().includes('no template')
    );
    
    if (!template) {
      console.log('No real template found');
      await browser.close();
      return;
    }
    
    const beforeUrl = page.url();
    console.log('\nTesting with template:', template.text);
    console.log('Template value:', template.value);
    console.log('URL before:', beforeUrl);
    
    await templateSelect.selectOption({ value: template.value });
    await page.waitForTimeout(4000);
    
    const afterUrl = page.url();
    console.log('URL after:', afterUrl);
    
    await page.screenshot({ path: dir + '/bug-3-4-result.png', fullPage: true });
    
    console.log('\n=== ANALYSIS ===');
    if (beforeUrl !== afterUrl) {
      console.log('*** BUG CONFIRMED: NAVIGATION OCCURRED ***');
      console.log('Expected: Template content inserted into composer');
      console.log('Actual: Navigated to:', afterUrl);
      
      const title = await page.title();
      const body = await page.textContent('body');
      console.log('Page title:', title);
      
      if (body.includes('404') || body.includes('Error') || body.toLowerCase().includes('not found')) {
        console.log('*** ERROR PAGE DETECTED ***');
        console.log('This confirms BUG-3: Template selection opens error page');
      }
      
      await page.screenshot({ path: dir + '/bug-3-5-error-page.png', fullPage: true });
      console.log('Error page screenshot saved');
    } else {
      console.log('No navigation - checking if template was inserted');
      
      const composer = page.locator('textarea, [contenteditable="true"]').first();
      const exists = await composer.count() > 0;
      
      if (exists) {
        const content = await composer.textContent().catch(() => '');
        console.log('Composer has', content.length, 'characters');
        
        if (content.length > 100) {
          console.log('Template appears to be inserted');
          console.log('Preview:', content.substring(0, 150));
        } else {
          console.log('Composer is empty or has minimal content');
          console.log('BUG: Template was not inserted');
        }
      } else {
        console.log('Composer not found');
      }
    }
    
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
