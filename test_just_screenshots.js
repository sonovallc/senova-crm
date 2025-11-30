const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const dir = path.join(process.cwd(), 'screenshots', 'page-exploration');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    console.log('Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('Navigate to create page...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshots of entire page...');
    await page.screenshot({ path: path.join(dir, '01-full-page.png'), fullPage: true });
    
    console.log('Scrolling and taking viewport screenshots...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '02-viewport-top.png') });
    
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '03-viewport-mid1.png') });
    
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '04-viewport-mid2.png') });
    
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '05-viewport-mid3.png') });
    
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, '06-viewport-bottom.png') });
    
    console.log('Checking for sequence checkbox...');
    const seqLabel = await page.locator('text="Enable multi-step sequence"').count();
    console.log('Found "Enable multi-step sequence" labels:', seqLabel);
    
    if (seqLabel > 0) {
      console.log('Sequence section EXISTS! Scrolling to it...');
      await page.locator('text="Enable multi-step sequence"').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(dir, '07-sequence-section.png') });
      
      console.log('Clicking sequence checkbox...');
      await page.locator('text="Enable multi-step sequence"').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(dir, '08-sequence-enabled.png'), fullPage: true });
      
      console.log('Adding step...');
      const addBtn = await page.locator('button:has-text("Add Sequence Step")').count();
      console.log('Found Add Step buttons:', addBtn);
      
      if (addBtn > 0) {
        await page.locator('button:has-text("Add Sequence Step")').first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(dir, '09-step-added.png'), fullPage: true });
        console.log('SEQUENCE STEP ADDED!');
      }
    } else {
      console.log('ERROR: Sequence section NOT found on page!');
    }

    console.log('\nDONE - Check screenshots in:', dir);
    await page.waitForTimeout(3000);

  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, 'ERROR.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

test();
