const { chromium } = require('playwright');

async function inspect() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Get all input elements
    const inputs = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('input').forEach(el => {
        result.push({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          class: el.className
        });
      });
      return result;
    });
    
    console.log('Inputs found on login page:');
    console.log(JSON.stringify(inputs, null, 2));
    
    // Get all buttons
    const buttons = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('button').forEach(el => {
        result.push({
          type: el.type,
          text: el.innerText,
          class: el.className
        });
      });
      return result;
    });
    
    console.log('\nButtons found:');
    console.log(JSON.stringify(buttons, null, 2));
    
    // Take a screenshot
    await page.screenshot({ path: 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug/login_inspect.png', fullPage: true });
    console.log('\nScreenshot saved: login_inspect.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  }

  await context.close();
  await browser.close();
}

inspect().catch(console.error);
