const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const dir = path.join(__dirname, 'screenshots', 'campaigns-comprehensive-test');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const r = { pass: [], fail: [], err: [] };
  page.on('console', m => { if (m.type() === 'error') r.err.push('Console: ' + m.text()); });
  page.on('pageerror', e => r.err.push('Error: ' + e.message));
  const ss = (n) => page.screenshot({ path: path.join(dir, n + '.png'), fullPage: true });
  console.log('===== CAMPAIGNS COMPREHENSIVE TEST =====\n');
  try {
    console.log('LOGIN...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('OK\n');

    console.log('TEST 1: CAMPAIGNS LIST');
    await page.goto('http://localhost:3000/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await ss('01-list');
    const cb = page.locator('button:has-text("Create Campaign"), a:has-text("Create Campaign")').first();
    if (await cb.isVisible()) { console.log('  PASS: Create button'); r.pass.push('Create button'); }
    else { console.log('  FAIL: Create button'); r.fail.push('Create button'); }

    console.log('\nTEST 2: NAVIGATE TO WIZARD');
    await cb.click();
    await page.waitForURL('**/campaigns/create', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await ss('02-wizard');
    console.log('  PASS: Wizard nav'); r.pass.push('Wizard nav');

    console.log('\nTEST 3: STEP 1 FIELDS');
    const name = page.locator('input[name="name"], input[placeholder*="Campaign Name" i]').first();
    if (await name.isVisible()) { await name.fill('Test_' + Date.now()); console.log('  PASS: Name field'); r.pass.push('Name field'); }
    else { console.log('  FAIL: Name'); r.fail.push('Name'); }
    const templ = page.locator('select[name="template"]').first();
    if (await templ.count() > 0 && await templ.isVisible()) { const o = await templ.locator('option').count(); console.log('  PASS: Template (' + o + ' opts)'); r.pass.push('Template'); if (o > 1) await templ.selectOption({ index: 1 }); }
    else { console.log('  FAIL: Template'); r.fail.push('Template'); }
    const subj = page.locator('input[name="subject"], input[placeholder*="Subject" i]').first();
    if (await subj.isVisible()) { await subj.fill('Test Subject'); console.log('  PASS: Subject'); r.pass.push('Subject'); }
    else { console.log('  FAIL: Subject'); r.fail.push('Subject'); }
    await ss('03-fields');

    console.log('\nTEST 4: COMPOSER TOOLBAR');
    const cont = page.locator('[contenteditable="true"], textarea[name="content"]').first();
    if (await cont.isVisible()) {
      await cont.click(); await cont.fill('Test '); console.log('  PASS: Content'); r.pass.push('Content');
      const bold = page.locator('button[title*="Bold" i]').first();
      if (await bold.count() > 0 && await bold.isVisible()) { await bold.click(); await cont.type('bold '); await bold.click(); console.log('  PASS: Bold'); r.pass.push('Bold'); } else { console.log('  FAIL: Bold'); r.fail.push('Bold'); }
      const ital = page.locator('button[title*="Italic" i]').first();
      if (await ital.count() > 0 && await ital.isVisible()) { await ital.click(); await cont.type('italic '); await ital.click(); console.log('  PASS: Italic'); r.pass.push('Italic'); } else { console.log('  FAIL: Italic'); r.fail.push('Italic'); }
      const bull = page.locator('button[title*="Bullet" i], button[title*="Unordered" i]').first();
      if (await bull.count() > 0 && await bull.isVisible()) { await bull.click(); console.log('  PASS: Bullet'); r.pass.push('Bullet'); } else { console.log('  FAIL: Bullet'); r.fail.push('Bullet'); }
      const numb = page.locator('button[title*="Numbered" i], button[title*="Ordered" i]').first();
      if (await numb.count() > 0 && await numb.isVisible()) { await numb.click(); console.log('  PASS: Numbered'); r.pass.push('Numbered'); } else { console.log('  FAIL: Numbered'); r.fail.push('Numbered'); }
      const undo = page.locator('button[title*="Undo" i]').first();
      if (await undo.count() > 0 && await undo.isVisible()) { await undo.click(); console.log('  PASS: Undo'); r.pass.push('Undo'); } else { console.log('  FAIL: Undo'); r.fail.push('Undo'); }
      const redo = page.locator('button[title*="Redo" i]').first();
      if (await redo.count() > 0 && await redo.isVisible()) { await redo.click(); console.log('  PASS: Redo'); r.pass.push('Redo'); } else { console.log('  FAIL: Redo'); r.fail.push('Redo'); }
      await ss('04-toolbar');
    } else { console.log('  FAIL: Content'); r.fail.push('Content'); }

    console.log('\nTEST 5: VARIABLES');
    const vars = page.locator('select:has(option:text-matches("first_name|last_name", "i"))').first();
    if (await vars.count() > 0 && await vars.isVisible()) {
      const vo = await vars.locator('option').allTextContents();
      console.log('  PASS: Variables (' + vo.length + ')'); r.pass.push('Variables');
      console.log('    ' + vo.join(', '));
      if (vo.length > 1) { await vars.selectOption({ index: 1 }); await ss('05-vars'); console.log('  PASS: Var insert'); r.pass.push('Var insert'); }
    } else { console.log('  FAIL: Variables'); r.fail.push('Variables'); }

    console.log('\nTEST 6: STEPS 2 & 3');
    const n1 = page.locator('button:has-text("Next")').first();
    if (await n1.isVisible()) {
      await n1.click(); await page.waitForTimeout(1000);
      const s2 = await page.locator('text=/Step 2|Recipients/i').count();
      if (s2 > 0) { console.log('  PASS: Step 2'); r.pass.push('Step 2'); await ss('06-step2'); }
      const n2 = page.locator('button:has-text("Next")').first();
      if (await n2.isVisible()) {
        await n2.click(); await page.waitForTimeout(1000);
        const s3 = await page.locator('text=/Step 3|Schedule/i').count();
        if (s3 > 0) { console.log('  PASS: Step 3'); r.pass.push('Step 3'); await ss('07-step3'); }
        const sn = page.locator('label:has-text("Send Now")').first();
        if (await sn.count() > 0) { console.log('  PASS: Send Now'); r.pass.push('Send Now'); }
        const sc = page.locator('label:has-text("Schedule")').first();
        if (await sc.count() > 0) { console.log('  PASS: Schedule'); r.pass.push('Schedule'); await sc.click(); await ss('08-sched'); }
        const sub = page.locator('button:has-text("Send"), button:has-text("Schedule")').first();
        if (await sub.isVisible()) { console.log('  PASS: Submit btn'); r.pass.push('Submit'); }
      }
    }

    console.log('\n===== SUMMARY =====');
    console.log('PASSED:', r.pass.length);
    console.log('FAILED:', r.fail.length);
    console.log('ERRORS:', r.err.length);
    const rate = ((r.pass.length / (r.pass.length + r.fail.length)) * 100).toFixed(1);
    console.log('PASS RATE:', rate + '%');
    if (r.fail.length > 0) { console.log('\nFAILED:'); r.fail.forEach((f, i) => console.log('  ' + (i+1) + '. ' + f)); }
    if (r.err.length > 0) { console.log('\nERRORS:'); r.err.forEach((e, i) => console.log('  ' + (i+1) + '. ' + e)); }
    console.log('\nPASSED:'); r.pass.forEach((p, i) => console.log('  ' + (i+1) + '. ' + p));
    fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(r, null, 2));
    console.log('\nResults:', path.join(dir, 'results.json'));
  } catch (error) {
    console.error('\nFATAL:', error.message);
    await ss('ERROR');
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})().catch(console.error);
