const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature4WithLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature4-with-login');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== FEATURE 4: Testing with Login ===\n');

  try {
    // LOGIN FIRST
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('Login successful\n');

    // Now navigate to campaigns
    console.log('Step 2: Navigate to campaigns page');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '01-campaigns-page.png'), fullPage: true });
    console.log('Screenshot taken: campaigns page');
    
    // Check page content
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('URL:', page.url());
    
    if (pageContent.includes('404')) {
      console.log('ERROR: 404 page detected!');
    } else if (pageContent.includes('Campaign')) {
      console.log('SUCCESS: Campaigns page loaded');
    }
    
    // Look for "Create Campaign" button
    const createButton = await page.locator('button:has-text("Create Campaign"), a:has-text("Create Campaign")');
    const buttonCount = await createButton.count();
    console.log('Create Campaign buttons found:', buttonCount);
    
    if (buttonCount > 0) {
      console.log('\nCLICKING Create Campaign button...');
      await createButton.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '02-create-wizard.png'), fullPage: true });
      console.log('Screenshot: Create wizard');
    } else {
      console.log('WARNING: Create Campaign button not found');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testFeature4WithLogin().catch(console.error);
