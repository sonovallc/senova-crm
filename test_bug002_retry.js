const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('\n=== BUG-002 EXPORT FIX VERIFICATION ===\n');

    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 90000 });
    console.log('✓ Logged in successfully');

    console.log('\nStep 2: Navigating to contacts page...');
    await page.goto('http://localhost:3004/dashboard/contacts', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    
    console.log('\nStep 3: Checking total contact count...');
    const totalText = await page.textContent('body').catch(() => '');
    
    let totalCount = 'Unknown';
    const possibleSelectors = [
      'text=/\d+ contact/i',
      'text=/total.*\d+/i',
      'text=/showing.*\d+/i'
    ];
    
    for (const selector of possibleSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const text = await element.textContent();
          console.log(`Found count indicator: ${text}`);
          const match = text.match(/(\d+)/);
          if (match) {
            totalCount = match[1];
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`Total contacts displayed: ${totalCount}`);
    await page.screenshot({ path: path.join(screenshotDir, 'bug002-contacts-page.png'), fullPage: true });
    console.log('✓ Screenshot: bug002-contacts-page.png');

    console.log('\nStep 4: Testing Export All functionality...');
    
    page.on('console', msg => console.log('Browser:', msg.text()));
    
    const exportButtons = [
      'button:has-text("Export All")',
      'button:has-text("Export")'
    ];
    
    let exportButton = null;
    for (const selector of exportButtons) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          const text = await btn.textContent();
          console.log(`Found export button: "${text}"`);
          exportButton = btn;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!exportButton) {
      console.log('❌ FAIL: Could not find Export All button');
      await page.screenshot({ path: path.join(screenshotDir, 'bug002-no-export-button.png'), fullPage: true });
      await browser.close();
      return;
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 300000 });
    
    console.log('Clicking Export All button...');
    await exportButton.click();
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'bug002-export-started.png'), fullPage: true });
    console.log('✓ Screenshot: bug002-export-started.png');
    
    console.log('Waiting for download to complete...');
    const download = await downloadPromise;
    
    const downloadPath = path.join(screenshotDir, 'bug002-export-all.csv');
    await download.saveAs(downloadPath);
    console.log(`✓ Download saved to: ${downloadPath}`);
    
    const csvContent = fs.readFileSync(downloadPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    const rowCount = lines.length - 1;
    
    console.log('\n=== EXPORT ALL RESULTS ===');
    console.log(`Total rows in CSV: ${rowCount}`);
    console.log(`Expected: ${totalCount} (or close to it)`);
    
    if (rowCount > 20) {
      console.log('✅ PASS: Export All exported more than 20 contacts');
      console.log(`   Exported ${rowCount} contacts (not just 20)`);
    } else {
      console.log('❌ FAIL: Export All only exported 20 or fewer contacts');
      console.log(`   Expected: ${totalCount}+ contacts, Got: ${rowCount}`);
    }

    console.log('\n\nStep 5: Testing Export Selected (3 contacts)...');
    await page.waitForTimeout(2000);
    
    for (let i = 1; i <= 3; i++) {
      try {
        const checkbox = page.locator('input[type="checkbox"]').nth(i);
        await checkbox.click();
        console.log(`✓ Selected contact ${i}`);
        await page.waitForTimeout(500);
      } catch (e) {
        console.log(`⚠ Could not select contact ${i}`);
      }
    }
    
    await page.screenshot({ path: path.join(screenshotDir, 'bug002-selected-3.png'), fullPage: true });
    console.log('✓ Screenshot: bug002-selected-3.png');
    
    const exportSelectedButtons = [
      'button:has-text("Export (3)")',
      'button:has-text("Export (")',
      'button:has-text("Export Selected")'
    ];
    
    let exportSelectedButton = null;
    for (const selector of exportSelectedButtons) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          const text = await btn.textContent();
          console.log(`Found export selected button: "${text}"`);
          exportSelectedButton = btn;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (exportSelectedButton) {
      const downloadPromise2 = page.waitForEvent('download', { timeout: 60000 });
      await exportSelectedButton.click();
      
      const download2 = await downloadPromise2;
      const downloadPath2 = path.join(screenshotDir, 'bug002-export-selected.csv');
      await download2.saveAs(downloadPath2);
      
      const csvContent2 = fs.readFileSync(downloadPath2, 'utf-8');
      const lines2 = csvContent2.split('\n').filter(line => line.trim().length > 0);
      const rowCount2 = lines2.length - 1;
      
      console.log('\n=== EXPORT SELECTED RESULTS ===');
      console.log(`Total rows in CSV: ${rowCount2}`);
      console.log(`Expected: 3`);
      
      if (rowCount2 === 3) {
        console.log('✅ PASS: Export Selected exported exactly 3 contacts');
      } else {
        console.log('❌ FAIL: Export Selected did not export exactly 3 contacts');
        console.log(`   Expected: 3, Got: ${rowCount2}`);
      }
    } else {
      console.log('⚠ Could not find Export Selected button');
    }

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'bug002-error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
