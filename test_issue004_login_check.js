const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:3004');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('Taking screenshot of login page');
    await page.screenshot({ path: 'testing/production-fixes/login-page-check.png', fullPage: true });

    console.log('Looking for input fields...');
    const allInputs = await page.locator('input').count();
    console.log('Total input elements found:', allInputs);

    for (let i = 0; i < allInputs; i++) {
      const input = page.locator('input').nth(i);
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      console.log('Input', i, '- type:', type, 'name:', name, 'placeholder:', placeholder);
    }

    console.log('\nLooking for buttons...');
    const allButtons = await page.locator('button').count();
    console.log('Total buttons found:', allButtons);

    for (let i = 0; i < allButtons; i++) {
      const button = page.locator('button').nth(i);
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log('Button', i, '- text:', text.trim(), 'type:', type);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
