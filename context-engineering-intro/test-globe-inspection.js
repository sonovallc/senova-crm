const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate to the page
  await page.goto('http://localhost:3004/hana-beauty-december-2025', { waitUntil: 'networkidle' });
  
  // Wait for content to load
  await page.waitForTimeout(3000);
  
  // Take full page screenshot
  await page.screenshot({ path: '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/full-page-globes.png', fullPage: true });
  console.log('Saved full page screenshot');
  
  // Get the globe section and make a detailed screenshot
  const viewport = await page.viewportSize();
  if (viewport) {
    const screenshot = await page.screenshot({ fullPage: false });
    fs.writeFileSync('/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/globes-viewport-screenshot.png', screenshot);
    console.log('Saved viewport screenshot');
  }
  
  // Inspect the images
  const images = await page.locator('img').all();
  console.log('Found ' + images.length + ' images total');
  
  for (let i = 0; i < images.length; i++) {
    const src = await images[i].getAttribute('src');
    const alt = await images[i].getAttribute('alt');
    const bbox = await images[i].boundingBox();
    console.log('Image ' + i + ': src=' + src + ', alt=' + alt);
  }
  
  await browser.close();
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
