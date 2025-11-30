const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const dir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\100-percent-verification';
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  console.log('Taking verification screenshots...');
  
  // Homepage
  await page.goto('http://localhost:3000/');
  await page.screenshot({ path: path.join(dir, '01-homepage.png'), fullPage: true });
  console.log('✅ Homepage screenshot');
  
  // Platform page
  await page.goto('http://localhost:3000/platform');
  await page.screenshot({ path: path.join(dir, '02-platform.png'), fullPage: true });
  console.log('✅ Platform screenshot');
  
  // CRM Solution
  await page.goto('http://localhost:3000/solutions/crm');
  await page.screenshot({ path: path.join(dir, '03-solution-crm.png'), fullPage: true });
  console.log('✅ CRM solution screenshot');
  
  // Login and Dashboard
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
  await page.fill('input[type="password"]', 'D3n1w3n1!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.screenshot({ path: path.join(dir, '04-dashboard.png'), fullPage: true });
  console.log('✅ Dashboard screenshot');
  
  // Contacts
  await page.goto('http://localhost:3000/dashboard/contacts');
  await page.screenshot({ path: path.join(dir, '05-contacts.png'), fullPage: true });
  console.log('✅ Contacts screenshot');
  
  // Mobile view
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/');
  await page.screenshot({ path: path.join(dir, '06-mobile-view.png') });
  
  // Click hamburger menu
  try {
    const button = await page.$('#mobile-menu-button');
    if (button) {
      await button.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(dir, '07-mobile-menu-open.png') });
      console.log('✅ Mobile menu screenshots');
    }
  } catch (err) {
    console.log('Mobile menu button error:', err.message);
  }
  
  await browser.close();
  console.log('\n✅ All screenshots saved to:', dir);
})();
