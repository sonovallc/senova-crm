const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  page.setDefaultTimeout(90000);
  
  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    
    console.log('Navigate to Contacts...');
    await page.click('a:has-text("Contacts")');
    await page.waitForURL('**/contacts', { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/debug_contacts_page.png', fullPage: true });
    console.log('Screenshot: debug_contacts_page.png');
    
    console.log('Looking for Add Contact button...');
    const addButtons = await page.locator('button').all();
    console.log('Total buttons found:', addButtons.length);
    for (let i = 0; i < addButtons.length; i++) {
      const text = await addButtons[i].textContent();
      const isVisible = await addButtons[i].isVisible();
      console.log('Button', i + ':', text, '- visible:', isVisible);
    }
    
    console.log('\nClicking Add Contact button...');
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/debug_after_click.png', fullPage: true });
    console.log('Screenshot: debug_after_click.png');
    
    console.log('\nLooking for form inputs...');
    const inputs = await page.locator('input').all();
    console.log('Total inputs:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const name = await inputs[i].getAttribute('name');
      const type = await inputs[i].getAttribute('type');
      const isVisible = await inputs[i].isVisible();
      console.log('Input', i + ': name=' + name + ', type=' + type + ', visible=' + isVisible);
    }
    
    console.log('\nChecking for modal/dialog...');
    const modals = await page.locator('[role="dialog"], .modal, [class*="modal"]').all();
    console.log('Modals found:', modals.length);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/debug_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
