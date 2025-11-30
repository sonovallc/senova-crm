const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const dir = path.join(__dirname, 'screenshots', 'autoresponders-label-test');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  try {
    console.log('LOGIN');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.waitForTimeout(2000);
    
    console.log('GO TO CREATE PAGE');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-initial.png'), fullPage: true });
    
    console.log('CLICK "Custom Content" LABEL');
    await page.click('text=Custom Content');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(dir, '02-after-click-label.png'), fullPage: true });
    
    console.log('SCROLL DOWN');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '03-scrolled.png'), fullPage: true });
    
    console.log('CHECK FOR EDITOR');
    const editor = await page.$('[contenteditable="true"], textarea[name="content"]');
    console.log('Editor found:', editor !== null);
    
    console.log('CHECK FOR TOOLBAR');
    const bold = await page.$('button[title*="Bold"]');
    console.log('Bold button:', bold !== null);
    
    console.log('CHECK FOR VARIABLES');
    const vars = await page.$$('select option');
    console.log('Total select options on page:', vars.length);
    
    console.log('ENABLE SEQUENCE');
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(1000);
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      await checkbox.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(dir, '04-sequence-enabled.png'), fullPage: true });
    }
    
    console.log('SCROLL TO TIMING');
    await page.evaluate(() => window.scrollTo(0, 1800));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '05-timing-section.png'), fullPage: true });
    
    console.log('FINAL SCREENSHOT');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '06-bottom.png'), fullPage: true });
    
    console.log('DONE - Check screenshots in:', dir);
    
  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, '99-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
