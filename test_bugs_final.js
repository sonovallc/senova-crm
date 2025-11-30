const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots', 'bug-verification-v2');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = Date.now();
  let bug4Pass = false;
  let bug7Pass = false;

  page.on('dialog', async dialog => {
    console.log('Dialog: ' + dialog.message());
    await dialog.accept();
  });

  try {
    console.log('\n=== BUG-4 and BUG-7 VERIFICATION ===\n');

    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_01_login.png`), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('\n=== BUG-4: CAMPAIGN DELETE ===\n');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_02_campaigns_before.png`), fullPage: true });

    const beforeCount = await page.locator('.grid > div').count();
    console.log('Campaigns before: ' + beforeCount);

    if (beforeCount > 0) {
      const moreBtn = page.locator('button:has(svg.lucide-more-horizontal)').first();
      if (await moreBtn.count() > 0) {
        await moreBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_03_dropdown.png`), fullPage: true });

        let deleteBtn = page.locator('text="Delete"').first();
        if (await deleteBtn.count() === 0) {
          const cancelBtn = page.locator('text="Cancel"').first();
          if (await cancelBtn.count() > 0) {
            await cancelBtn.click();
            await page.waitForTimeout(1500);
            await moreBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        deleteBtn = page.locator('text="Delete"').first();
        if (await deleteBtn.count() > 0) {
          await deleteBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_04_after_delete.png`), fullPage: true });

          const afterCount = await page.locator('.grid > div').count();
          console.log('Campaigns after: ' + afterCount);

          if (afterCount < beforeCount) {
            console.log('PASS: BUG-4');
            bug4Pass = true;
          } else {
            console.log('FAIL: BUG-4');
          }
        }
      }
    }

    console.log('\n=== BUG-7: AUTORESPONDER EDIT ===\n');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_05_autoresponders.png`), fullPage: true });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.count() > 0) {
      const links = await firstRow.locator('a').all();
      if (links.length > 0) {
        const href = await links[0].getAttribute('href');
        if (href && href.includes('/autoresponders/')) {
          const id = href.split('/autoresponders/')[1].split('/')[0];
          await page.goto(`http://localhost:3004/dashboard/email/autoresponders/${id}/edit`);
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_06_edit_page.png`), fullPage: true });

          const addBtn = page.locator('button:has-text("Add Sequence Step")').first();
          if (await addBtn.count() > 0) {
            await addBtn.click();
            await page.waitForTimeout(1500);
            await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_07_step_added.png`), fullPage: true });

            const selects = await page.locator('select').all();
            for (let sel of selects) {
              const opts = await sel.locator('option').allTextContents();
              if (opts.some(o => o.includes('Either/Or'))) {
                await sel.selectOption({ label: 'Either/Or' });
                break;
              }
            }

            for (let sel of selects) {
              const opts = await sel.locator('option').allTextContents();
              if (opts.some(o => o.includes('Email Opened'))) {
                await sel.selectOption({ label: 'Email Opened' });
                break;
              }
            }

            const inputs = await page.locator('input').all();
            for (let inp of inputs) {
              const ph = await inp.getAttribute('placeholder');
              if (ph && ph.toLowerCase().includes('subject')) {
                await inp.fill('Test Follow-up Email');
                break;
              }
            }

            const editor = page.locator('[contenteditable="true"]').last();
            if (await editor.count() > 0) {
              await editor.fill('This is a test follow-up');
            }

            await page.waitForTimeout(1000);
            await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_08_configured.png`), fullPage: true });

            const saveBtn = page.locator('button:has-text("Save Changes"), button:has-text("Save")').first();
            if (await saveBtn.count() > 0) {
              await saveBtn.click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_09_saved.png`), fullPage: true });

              await page.goto('http://localhost:3004/dashboard/email/autoresponders');
              await page.waitForTimeout(1500);

              const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
              if (await editBtn.count() > 0) {
                await editBtn.click();
                await page.waitForTimeout(2000);
              }

              await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_10_returned.png`), fullPage: true });

              const persisted = await page.locator('input[value="Test Follow-up Email"]').count();
              if (persisted > 0) {
                console.log('PASS: BUG-7');
                bug7Pass = true;
              } else {
                console.log('FAIL: BUG-7');
              }
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: path.join(screenshotDir, `${timestamp}_ERROR.png`), fullPage: true });
  } finally {
    console.log('\n=== RESULTS ===');
    console.log('BUG-4: ' + (bug4Pass ? 'PASS' : 'FAIL'));
    console.log('BUG-7: ' + (bug7Pass ? 'PASS' : 'FAIL'));
    await browser.close();
  }
})();
