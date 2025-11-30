const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const screenshotDir = '../screenshots/final-test';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  // Capture homepage
  await page.goto('http://localhost:3000');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'homepage.png'),
    fullPage: false
  });
  console.log('Captured homepage');
  
  // Capture a solution page
  await page.goto('http://localhost:3000/solutions/crm');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'solution-crm.png'),
    fullPage: false
  });
  console.log('Captured CRM solution page');
  
  // Capture an industry page
  await page.goto('http://localhost:3000/industries/medical-spas');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'industry-medical-spas.png'),
    fullPage: false
  });
  console.log('Captured Medical Spas industry page');
  
  // Login and capture dashboard
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
  await page.fill('input[type="password"]', 'D3n1w3n1!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.screenshot({ 
    path: path.join(screenshotDir, 'dashboard.png'),
    fullPage: false
  });
  console.log('Captured dashboard');
  
  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'mobile-view.png'),
    fullPage: false
  });
  console.log('Captured mobile view');
  
  await browser.close();
  console.log('\nAll screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
