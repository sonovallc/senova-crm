const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate to the page
  await page.goto('http://localhost:3004/hana-beauty-december-2025', { waitUntil: 'networkidle' });
  
  // Wait for content to load
  await page.waitForTimeout(2000);
  
  // Take full page screenshot showing all 3 globes
  const fullPageScreenshot = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/01-all-globes-desktop.png';
  await page.screenshot({ path: fullPageScreenshot, fullPage: true });
  console.log('Captured: ' + fullPageScreenshot);
  
  await page.waitForTimeout(1000);
  
  // Take viewport screenshot
  const viewportScreenshot = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/02-globes-viewport.png';
  await page.screenshot({ path: viewportScreenshot });
  console.log('Captured: ' + viewportScreenshot);
  
  // Scroll down to see different parts of the page
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const scrollScreenshot = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/03-globes-scrolled.png';
  await page.screenshot({ path: scrollScreenshot });
  console.log('Captured: ' + scrollScreenshot);
  
  // Scroll more
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const scrollScreenshot2 = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/04-globes-more.png';
  await page.screenshot({ path: scrollScreenshot2 });
  console.log('Captured: ' + scrollScreenshot2);
  
  await browser.close();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
