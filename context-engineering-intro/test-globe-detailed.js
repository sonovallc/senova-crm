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
  
  // Take crops of each globe separately
  
  // Globe 1 (Mesotherapy - woman)
  const globe1 = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/globe1-mesotherapy.png';
  await page.screenshot({ 
    path: globe1,
    clip: {
      x: 170,
      y: 190,
      width: 180,
      height: 200
    }
  });
  console.log('Captured Globe 1 (Mesotherapy): ' + globe1);
  
  // Globe 2 (Tattoo Removal - couple in plaid) - THE CRITICAL ONE
  const globe2 = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/globe2-tattoo-removal.png';
  await page.screenshot({ 
    path: globe2,
    clip: {
      x: 380,
      y: 190,
      width: 180,
      height: 200
    }
  });
  console.log('Captured Globe 2 (Tattoo Removal - CRITICAL): ' + globe2);
  
  // Globe 3 (Weight Loss - couple with dog)
  const globe3 = '/c/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/phase3-image-positioning/globe3-weight-loss.png';
  await page.screenshot({ 
    path: globe3,
    clip: {
      x: 590,
      y: 190,
      width: 180,
      height: 200
    }
  });
  console.log('Captured Globe 3 (Weight Loss): ' + globe3);
  
  await browser.close();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
