const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'screenshots', 'bugfix-verification');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing 9 Bug Fixes...\n');
  
  try {
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type=email]', 'admin@evebeautyma.com');
    await page.fill('input[type=password]', 'TestPass123!');
    await page.click('button[type=submit]');
    await page.waitForTimeout(3000);
    console.log('Logged in');
    
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-campaigns.png'), fullPage: true });
    console.log('Bug 1: Campaigns page');
    
    await page.goto('http://localhost:3004/dashboard/inbox');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '02-inbox.png'), fullPage: true });
    console.log('Bug 2-4: Inbox');
    
    await page.goto('http://localhost:3004/dashboard/activity-log');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '03-activity.png'), fullPage: true });
    console.log('Bug 5: Activity Log');
    
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '04-templates.png'), fullPage: true });
    console.log('Bug 9: Templates');
    
    console.log('\nAll pages loaded - check screenshots');
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
