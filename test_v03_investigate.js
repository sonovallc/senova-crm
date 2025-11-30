const playwright = require('playwright');
(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();
  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('Navigate to contacts...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-before-click.png', fullPage: true });
    
    console.log('Looking for import button...');
    const importButtons = await page.$$('button');
    for (let i = 0; i < importButtons.length; i++) {
      const text = await importButtons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
    const importButton = await page.$('button:has-text("Import Contacts")');
    if (importButton) {
      console.log('Found Import Contacts button, clicking...');
      await importButton.click({ force: true });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'screenshots/03-after-click.png', fullPage: true });
      
      console.log('Looking for modal or file input...');
      const modal = await page.$('[role="dialog"], .modal, [class*="modal"]');
      console.log('Modal found:', !!modal);
      
      const fileInput = await page.$('input[type="file"]');
      console.log('File input found:', !!fileInput);
      
      if (!fileInput) {
        console.log('Checking all inputs on page:');
        const allInputs = await page.$$('input');
        for (let i = 0; i < allInputs.length; i++) {
          const type = await allInputs[i].getAttribute('type');
          const placeholder = await allInputs[i].getAttribute('placeholder');
          console.log(`Input ${i}: type="${type}", placeholder="${placeholder}"`);
        }
      }
    } else {
      console.log('Import button not found');
    }
    
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'screenshots/03-error-investigate.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
