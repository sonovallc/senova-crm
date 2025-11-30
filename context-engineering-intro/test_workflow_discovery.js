const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function discoverWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'compose-workflow');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== DISCOVERING EMAIL COMPOSE PAGE STRUCTURE ===');
  console.log('');

  try {
    // Login
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Navigate to compose
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(screenshotDir, 'discovery-01-initial.png'), fullPage: true });
    console.log('Screenshot saved: discovery-01-initial.png');
    console.log('');
    
    // Get all form elements
    console.log('=== FORM ELEMENTS ===');
    
    const inputs = await page.locator('input').all();
    console.log('Total inputs:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const id = await inputs[i].getAttribute('id');
      console.log(i + '. Input - type:', type, 'name:', name, 'placeholder:', placeholder, 'id:', id);
    }
    console.log('');
    
    const textareas = await page.locator('textarea').all();
    console.log('Total textareas:', textareas.length);
    for (let i = 0; i < textareas.length; i++) {
      const name = await textareas[i].getAttribute('name');
      const placeholder = await textareas[i].getAttribute('placeholder');
      const id = await textareas[i].getAttribute('id');
      console.log(i + '. Textarea - name:', name, 'placeholder:', placeholder, 'id:', id);
    }
    console.log('');
    
    const selects = await page.locator('select').all();
    console.log('Total selects:', selects.length);
    for (let i = 0; i < selects.length; i++) {
      const name = await selects[i].getAttribute('name');
      const id = await selects[i].getAttribute('id');
      const label = await page.locator('label[for="' + id + '"]').textContent().catch(() => 'no label');
      const options = await selects[i].locator('option').allTextContents();
      console.log(i + '. Select - name:', name, 'id:', id, 'label:', label);
      console.log('   Options:', options);
    }
    console.log('');
    
    const buttons = await page.locator('button').all();
    console.log('Total buttons:', buttons.length);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(i + '. Button - text:', text.trim(), 'type:', type);
    }
    console.log('');
    
    // Get all labels
    const labels = await page.locator('label').all();
    console.log('Total labels:', labels.length);
    for (let i = 0; i < labels.length; i++) {
      const text = await labels[i].textContent();
      const forAttr = await labels[i].getAttribute('for');
      console.log(i + '. Label - text:', text.trim(), 'for:', forAttr);
    }
    console.log('');
    
    console.log('=== END OF DISCOVERY ===');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'discovery-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

discoverWorkflow();
