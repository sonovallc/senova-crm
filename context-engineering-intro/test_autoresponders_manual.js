const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const dir = path.join(__dirname, 'screenshots', 'autoresponders-manual-test');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const results = { pass: [], fail: [] };
  
  try {
    console.log('LOGIN');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.waitForTimeout(2000);
    
    console.log('NAVIGATE TO CREATE PAGE');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, '01-page-loaded.png'), fullPage: true });
    
    console.log('CLICK CUSTOM CONTENT RADIO');
    const customRadio = await page.$('input[type="radio"][value="custom"]');
    if (customRadio) {
      await customRadio.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(dir, '02-custom-clicked.png'), fullPage: true });
      results.pass.push('Custom Content radio clicked');
    } else {
      results.fail.push('Custom Content radio not found');
    }
    
    console.log('SCROLL TO EDITOR');
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, '03-scrolled-to-editor.png'), fullPage: true });
    
    console.log('CHECK TOOLBAR BUTTONS');
    const bold = await page.$('button[title*="Bold"]');
    results[bold ? 'pass' : 'fail'].push('Bold button');
    
    const italic = await page.$('button[title*="Italic"]');
    results[italic ? 'pass' : 'fail'].push('Italic button');
    
    console.log('CHECK VARIABLES');
    const varsSelect = await page.$('select:has(option:text("First Name"))');
    if (varsSelect) {
      const options = await varsSelect.$$('option');
      console.log('Variables found:', options.length);
      results.pass.push('Variables dropdown (' + options.length + ' vars)');
    } else {
      results.fail.push('Variables dropdown');
    }
    
    console.log('ENABLE SEQUENCE');
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(1000);
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      await checkbox.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(dir, '04-sequence-enabled.png'), fullPage: true });
      results.pass.push('Sequence enabled');
    }
    
    console.log('TEST TIMING MODES');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(1000);
    
    const timingSelect = await page.$('select:has(option:text("FIXED_DURATION"))');
    if (timingSelect) {
      const options = await timingSelect.$$('option');
      console.log('Timing modes:', options.length);
      
      for (let i = 0; i < options.length; i++) {
        await timingSelect.selectOption({ index: i });
        await page.waitForTimeout(1500);
        const text = await options[i].textContent();
        await page.screenshot({ path: path.join(dir, '05-timing-' + i + '.png'), fullPage: true });
        
        const delays = await page.$$('input[name*="delay"]');
        const triggers = await page.$$('select[name*="trigger"]:not([name*="timing"])');
        
        console.log(text + ': delays=' + delays.length + ', triggers=' + triggers.length);
        
        if (text.includes('FIXED') && delays.length > 0 && triggers.length === 0) {
          results.pass.push('FIXED_DURATION mode');
        } else if (text.includes('WAIT') && triggers.length > 0 && delays.length === 0) {
          results.pass.push('WAIT_FOR_TRIGGER mode');
        } else if (text.includes('EITHER') && delays.length > 0 && triggers.length > 0) {
          results.pass.push('EITHER_OR mode');
        } else {
          results.fail.push(text + ' mode (wrong fields visible)');
        }
      }
    } else {
      results.fail.push('Timing selector not found');
    }
    
    await page.screenshot({ path: path.join(dir, '06-final.png'), fullPage: true });
    
    console.log('\n=== RESULTS ===');
    console.log('PASSED:', results.pass.length);
    console.log('FAILED:', results.fail.length);
    console.log('\nPassed:', results.pass.join(', '));
    if (results.fail.length > 0) {
      console.log('\nFailed:', results.fail.join(', '));
    }
    
    fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(results, null, 2));
    
  } catch (e) {
    console.error('ERROR:', e.message);
    await page.screenshot({ path: path.join(dir, '99-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
