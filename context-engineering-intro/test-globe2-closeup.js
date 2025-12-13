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
  
  // Get all images and log them
  const images = await page.locator('img').all();
  console.log(`Found ${images.length} images on page`);
  
  // Find globes - look for the snow globe container or images
  const globeContainers = await page.locator('[class*="globe"], [class*="snow"], [class*="group"]').all();
  console.log(`Found ${globeContainers.length} potential globe containers`);
  
  // Let's examine the actual HTML structure
  const bodyHTML = await page.content();
  
  // Take a high-resolution crop of just the globes area
  const globesArea = await page.locator('body').boundingBox();
  
  if (globesArea) {
    // Zoom in on globe area (from approx y:190 to y:380)
    const croppedScreenshot = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/05-globe2-detailed-closeup.png';
    await page.screenshot({ 
      path: croppedScreenshot,
      clip: {
        x: 350,
        y: 190,
        width: 250,
        height: 210
      }
    });
    console.log('Captured globe 2 close-up: ' + croppedScreenshot);
  }
  
  // Also get all three globes in one detailed shot
  const allGlobesCloseup = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/06-all-globes-detailed.png';
  await page.screenshot({ 
    path: allGlobesCloseup,
    clip: {
      x: 150,
      y: 180,
      width: 750,
      height: 220
    }
  });
  console.log('Captured all globes close-up: ' + allGlobesCloseup);
  
  await browser.close();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
