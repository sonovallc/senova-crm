const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // This works fine in simple tests
  await page.goto('http://localhost:3004');
  
  // But when we need to test dropdowns with selectors...
  await page.click('button[aria-label="Variables"]');
  
  // And check for specific text content...
  const hasVariable = await page.locator('text={{contact_name}}').isVisible();
  
  // The curly braces and quotes create escaping nightmares in heredocs
  console.log('Test result:', hasVariable);
  
  await browser.close();
})();
