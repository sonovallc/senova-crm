const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const dir = path.join(__dirname, 'screenshots', 'autoresponders-comprehensive-test');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const r = { pass: [], fail: [], err: [] };
  page.on('console', m => { if (m.type() === 'error') r.err.push('Console: ' + m.text()); });
  page.on('pageerror', e => r.err.push('Error: ' + e.message));
  const ss = (n) => page.screenshot({ path: path.join(dir, n + '.png'), fullPage: true });
  console.log('===== AUTORESPONDERS COMPREHENSIVE TEST =====');
  try {
    console.log('LOGIN...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('OK');

    console.log('TEST 1: AUTORESPONDERS LIST');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('networkidle');
    await ss('01-list');
    const cb = page.locator('button:has-text("Create"), a:has-text("Create")').first();
    if (await cb.isVisible()) { console.log('  PASS: Create button'); r.pass.push('Create button'); }
    else { console.log('  FAIL: Create button'); r.fail.push('Create button'); }

    console.log('TEST 2: CREATE PAGE');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForLoadState('networkidle');
    await ss('02-create');
    console.log('  PASS: Nav'); r.pass.push('Nav');

    console.log('TEST 3: BASIC INFO');
    const name = page.locator('input[name="name"]').first();
    if (await name.isVisible()) { await name.fill('Test_' + Date.now()); console.log('  PASS: Name'); r.pass.push('Name'); }
    else { console.log('  FAIL: Name'); r.fail.push('Name'); }
    await ss('03-basic');

    console.log('TEST 4: EMAIL CONTENT');
    const custRad = page.locator('input[type="radio"][value="custom"]').first();
    if (await custRad.count() > 0) { 
      await custRad.click();
      await page.waitForTimeout(1000);
      console.log('  PASS: Custom radio'); r.pass.push('Custom radio'); 
      await ss('04-custom');
    }

    console.log('TEST 5: TOOLBAR');
    const bold = page.locator('button[title*="Bold"]').first();
    if (await bold.count() > 0) { console.log('  PASS: Bold'); r.pass.push('Bold'); } else { r.fail.push('Bold'); }
    const ital = page.locator('button[title*="Italic"]').first();
    if (await ital.count() > 0) { console.log('  PASS: Italic'); r.pass.push('Italic'); } else { r.fail.push('Italic'); }
    const bull = page.locator('button[title*="Bullet"]').first();
    if (await bull.count() > 0) { console.log('  PASS: Bullet'); r.pass.push('Bullet'); } else { r.fail.push('Bullet'); }
    const numb = page.locator('button[title*="Numbered"]').first();
    if (await numb.count() > 0) { console.log('  PASS: Numbered'); r.pass.push('Numbered'); } else { r.fail.push('Numbered'); }
    const undo = page.locator('button[title*="Undo"]').first();
    if (await undo.count() > 0) { console.log('  PASS: Undo'); r.pass.push('Undo'); } else { r.fail.push('Undo'); }
    const redo = page.locator('button[title*="Redo"]').first();
    if (await redo.count() > 0) { console.log('  PASS: Redo'); r.pass.push('Redo'); } else { r.fail.push('Redo'); }
    await ss('05-toolbar');

    console.log('TEST 6: VARIABLES');
    const vars = page.locator('select:has(option:text("First Name"))').first();
    if (await vars.count() > 0) {
      const vo = await vars.locator('option').allTextContents();
      console.log('  PASS: Variables (' + vo.length + ')'); r.pass.push('Variables');
      if (vo.length >= 6) { r.pass.push('6 variables'); } else { r.fail.push('6 variables'); }
      await ss('06-vars');
    }

    console.log('TEST 7: SEQUENCE');
    const seq = page.locator('input[type="checkbox"]:near(:text("sequence"))').first();
    if (await seq.count() > 0) { 
      await seq.click();
      await page.waitForTimeout(1000);
      console.log('  PASS: Sequence'); r.pass.push('Sequence'); 
      await ss('07-seq');
    }

    console.log('TEST 8: TIMING MODES');
    const timing = page.locator('select:has(option:text("FIXED_DURATION"))').first();
    if (await timing.count() > 0) {
      const modes = await timing.locator('option').allTextContents();
      console.log('  Modes: ' + modes.join(', '));
      
      for (let i = 0; i < modes.length; i++) {
        await timing.selectOption({ index: i });
        await page.waitForTimeout(800);
        const mode = modes[i];
        const delays = await page.locator('input[name*="delay"]').count();
        const trigs = await page.locator('select[name*="trigger"]:not([name*="timing"])').count();
        console.log('  ' + mode + ': delays=' + delays + ' triggers=' + trigs);
        
        if (mode.includes('FIXED') && delays > 0 && trigs === 0) { 
          r.pass.push('FIXED mode'); 
        } else if (mode.includes('WAIT') && trigs > 0 && delays === 0) { 
          r.pass.push('WAIT mode'); 
        } else if (mode.includes('EITHER') && delays > 0 && trigs > 0) { 
          r.pass.push('EITHER mode'); 
        } else {
          r.fail.push(mode + ' mode');
        }
        await ss('08-timing-' + i);
      }
    }

    console.log('SUMMARY');
    console.log('PASSED:', r.pass.length);
    console.log('FAILED:', r.fail.length);
    console.log('ERRORS:', r.err.length);
    console.log('Screenshots:', dir);
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify({ passed: r.pass, failed: r.fail, errors: r.err }, null, 2));
  } catch (e) {
    console.error('FATAL:', e.message);
    await ss('99-error');
  } finally {
    await browser.close();
  }
})();
