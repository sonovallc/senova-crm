const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const bug4Dir = path.join(__dirname, 'screenshots', 'bug4-fix-verification');
  const bug7Dir = path.join(__dirname, 'screenshots', 'bug7-fix-verification');
  
  if (!fs.existsSync(bug4Dir)) fs.mkdirSync(bug4Dir, { recursive: true });
  if (!fs.existsSync(bug7Dir)) fs.mkdirSync(bug7Dir, { recursive: true });

  console.log('\n=== BUG-4 AND BUG-7 VERIFICATION ===\n');

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Logged in\n');

    console.log('=== BUG-4: CAMPAIGN DELETE ===\n');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(bug4Dir, '01-before.png'), fullPage: true });
    
    const beforeCount = await page.$$eval('tbody tr', rows => rows.length);
    console.log('Before count:', beforeCount);

    const ellipsisButtons = await page.$$('button:has(svg)');
    for (const btn of ellipsisButtons) {
      const svg = await btn.$('svg');
      if (svg) {
        const classes = await svg.getAttribute('class');
        if (classes && classes.includes('lucide-more-horizontal')) {
          await btn.click();
          break;
        }
      }
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(bug4Dir, '02-menu.png'), fullPage: true });
    
    await page.click('text=Delete');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(bug4Dir, '03-confirm.png'), fullPage: true });
    
    const confirmBtn = await page.$('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');
    if (confirmBtn) await confirmBtn.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(bug4Dir, '04-after.png'), fullPage: true });
    const afterCount = await page.$$eval('tbody tr', rows => rows.length);
    const bug4Pass = afterCount < beforeCount;
    console.log('After count:', afterCount);
    console.log('BUG-4:', bug4Pass ? 'PASS' : 'FAIL', '\n');

    console.log('=== BUG-7: AUTORESPONDER EDIT ===\n');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(bug7Dir, '01-list.png'), fullPage: true });
    
    const rows = await page.$$('tbody tr');
    if (rows.length > 0) await rows[0].click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(bug7Dir, '02-initial.png'), fullPage: true });

    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      const checked = await checkbox.isChecked();
      if (!checked) await checkbox.check();
    }
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Add Sequence Step"), button:has-text("Add Step")');
    await page.waitForTimeout(2000);

    const timingSelect = await page.$('select[name="timing_mode"]');
    if (timingSelect) await timingSelect.selectOption('either_or');
    
    const delayInput = await page.$('input[name="delay_days"]');
    if (delayInput) await delayInput.fill('2');
    
    const triggerSelect = await page.$('select[name="trigger_event"]');
    if (triggerSelect) await triggerSelect.selectOption({ index: 1 });
    
    const subjectInput = await page.$('input[name="subject"]');
    if (subjectInput) await subjectInput.fill('BUG-7 Test');
    
    const bodyInput = await page.$('textarea[name="body"]');
    if (bodyInput) await bodyInput.fill('Test body');

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(bug7Dir, '03-configured.png'), fullPage: true });
    
    await page.click('button:has-text("Save Changes"), button:has-text("Save")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(bug7Dir, '04-saved.png'), fullPage: true });

    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(bug7Dir, '05-away.png'), fullPage: true });

    const rows2 = await page.$$('tbody tr');
    if (rows2.length > 0) await rows2[0].click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(bug7Dir, '06-persisted.png'), fullPage: true });

    const subjectCheck = await page.$('input[name="subject"]');
    const subjectValue = subjectCheck ? await subjectCheck.inputValue() : '';
    const bug7Pass = subjectValue.includes('BUG-7 Test');
    console.log('Subject:', subjectValue);
    console.log('BUG-7:', bug7Pass ? 'PASS' : 'FAIL', '\n');

    console.log('=== RESULTS ===');
    console.log('BUG-4:', bug4Pass ? 'PASS' : 'FAIL');
    console.log('BUG-7:', bug7Pass ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
