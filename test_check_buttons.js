const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  page.setDefaultTimeout(90000);
  
  try {
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    
    await page.click('a:has-text("Contacts")');
    await page.waitForURL('**/contacts', { timeout: 90000 });
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(2000);
    
    const modal = await page.locator('[role="dialog"]');
    await modal.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(1000);
    
    console.log('Looking for ALL buttons in modal...');
    const modalButtons = await modal.locator('button').all();
    console.log('Total buttons in modal:', modalButtons.length);
    
    for (let i = 0; i < modalButtons.length; i++) {
      const btn = modalButtons[i];
      const text = await btn.textContent();
      const testId = await btn.getAttribute('data-testid');
      const type = await btn.getAttribute('type');
      const isVisible = await btn.isVisible();
      console.log(`Button ${i}: text="${text}", testid="${testId}", type="${type}", visible=${isVisible}`);
    }
    
    console.log('\nLooking for Create button specifically...');
    const createBtn = await page.locator('button:has-text("Create")').first();
    console.log('Create button found:', await createBtn.isVisible());
    console.log('Create button testid:', await createBtn.getAttribute('data-testid'));
    
    console.log('\nLooking for Cancel button specifically...');
    const cancelBtn = await page.locator('button:has-text("Cancel")').first();
    console.log('Cancel button found:', await cancelBtn.isVisible());
    console.log('Cancel button testid:', await cancelBtn.getAttribute('data-testid'));
    
    await page.screenshot({ path: 'screenshots/button_inspection.png', fullPage: true });
    console.log('\nScreenshot saved: button_inspection.png');
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
