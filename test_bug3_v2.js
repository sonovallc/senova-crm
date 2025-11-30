const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const dir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\round2-bugfix';
  
  try {
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    
    await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, 'bug-3-1-inbox.png'), fullPage: true });
    
    await page.locator('text=Dolores Fay').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(dir, 'bug-3-2-thread.png'), fullPage: true });
    
    const selects = await page.locator('select').all();
    console.log('Found', selects.length, 'select elements');
    
    let templateSelect = null;
    for (let i = 0; i < selects.length; i++) {
      const name = await selects[i].getAttribute('name');
      const text = await selects[i].textContent();
      console.log('Select', i, 'name:', name, 'text:', text.substring(0, 100));
      if (name && name.includes('template')) {
        templateSelect = selects[i];
        break;
      }
    }
    
    if (!templateSelect) {
      console.log('No template selector found');
      await browser.close();
      return;
    }
    
    await templateSelect.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, 'bug-3-3-dropdown.png'), fullPage: true });
    
    const options = await templateSelect.locator('option').all();
    let templates = [];
    for (const opt of options) {
      const text = await opt.textContent();
      const val = await opt.getAttribute('value');
      if (text && text.trim()) templates.push({ text: text.trim(), value: val });
    }
    
    console.log('Templates:');
    templates.forEach((t, i) => console.log(i+1, t.text, 'value:', t.value));
    
    const template = templates.find(t => t.value && t.value !== '' && !t.text.toLowerCase().includes('select'));
    if (!template) {
      console.log('No valid template found');
      await browser.close();
      return;
    }
    
    const beforeUrl = page.url();
    console.log('Before:', beforeUrl);
    console.log('Selecting:', template.text);
    
    await templateSelect.selectOption({ value: template.value });
    await page.waitForTimeout(3000);
    
    const afterUrl = page.url();
    console.log('After:', afterUrl);
    
    await page.screenshot({ path: path.join(dir, 'bug-3-4-result.png'), fullPage: true });
    
    if (beforeUrl !== afterUrl) {
      console.log('BUG CONFIRMED: Navigation occurred');
      console.log('Navigated to:', afterUrl);
      const title = await page.title();
      const body = await page.textContent('body');
      console.log('Page title:', title);
      if (body.includes('404') || body.includes('Error')) {
        console.log('ERROR PAGE DETECTED');
      }
    } else {
      console.log('No navigation - checking composer');
      const composer = await page.locator('textarea, [contenteditable="true"]').first().textContent().catch(() => '');
      console.log('Composer length:', composer.length);
    }
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
})();
