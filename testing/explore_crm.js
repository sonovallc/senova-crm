const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function exploreCRM() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const screenshotDir = 'email-channel-screenshots/phase-0-exploration';
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  try {
    console.log('Loading public site...');
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(2000);
    
    console.log('Clicking Staff Login...');
    await page.click('a:has-text("Staff Login")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
    
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '02-after-login.png'), fullPage: true });
    
    console.log('\nDashboard navigation links:');
    const links = await page.locator('a').all();
    for (const link of links) {
      const text = await link.textContent();
      if (text && text.trim()) console.log('-', text.trim());
    }
    
    console.log('\nLooking for email-related links...');
    const emailRelated = ['Inbox', 'Email', 'Messages', 'Compose', 'Mail'];
    for (const term of emailRelated) {
      const count = await page.locator(`a:has-text("${term}")`).count();
      if (count > 0) console.log(`Found: "${term}" (${count} instances)`);
    }
    
    console.log('\nLooking for Settings...');
    const settingsCount = await page.locator('a:has-text("Settings")').count();
    console.log(`Settings links found: ${settingsCount}`);
    
    if (settingsCount > 0) {
      console.log('Clicking Settings...');
      await page.click('a:has-text("Settings")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, '03-settings-page.png'), fullPage: true });
      
      console.log('\nSettings sub-sections:');
      const settingsLinks = await page.locator('a').all();
      for (const link of settingsLinks) {
        const text = await link.textContent();
        if (text && text.trim()) console.log('-', text.trim());
      }
    }
    
    console.log('\nScreenshots saved to:', screenshotDir);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

exploreCRM();
