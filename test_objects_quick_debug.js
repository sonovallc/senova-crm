const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newContext().then(ctx => ctx.newPage());

  try {
    // Login
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"]', 'D3n1w3n1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go to Objects page
    await page.goto('http://localhost:3004/dashboard/objects');
    await page.waitForTimeout(2000);

    console.log('\n=== OBJECTS PAGE ANALYSIS ===\n');

    // Check what's on the page
    const h1Text = await page.locator('h1').first().textContent();
    console.log(`Page Title (h1): "${h1Text}"`);

    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons:`);
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      if (isVisible && text.trim()) {
        console.log(`  - Button ${i}: "${text.trim()}"`);
      }
    }

    // Find all links
    const links = await page.locator('a').all();
    console.log(`\nFound ${links.length} links:`);
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const text = await links[i].textContent();
      const href = await links[i].getAttribute('href');
      if (text.trim() && href) {
        console.log(`  - Link: "${text.trim()}" -> ${href}`);
      }
    }

    // Find all inputs
    const inputs = await page.locator('input').all();
    console.log(`\nFound ${inputs.length} inputs:`);
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      if (await inputs[i].isVisible()) {
        console.log(`  - Input: type="${type}", name="${name}", placeholder="${placeholder}"`);
      }
    }

    // Check for tables
    const tables = await page.locator('table').count();
    console.log(`\nFound ${tables} tables`);

    // Check for rows in table
    const tableRows = await page.locator('tbody tr').count();
    console.log(`Found ${tableRows} table rows`);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-objects/objects-page-analysis.png', fullPage: true });
    console.log('\nScreenshot saved: objects-page-analysis.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();