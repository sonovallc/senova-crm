const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('========================================');
  console.log('BUG-4 VERIFICATION: Campaign Delete Fix');
  console.log('========================================\n');

  let testResults = {
    draftDeleteVisible: null,
    nonDraftDeleteHidden: null,
    overallPass: false
  };

  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  SUCCESS: Logged in\n');

    console.log('Step 2: Navigate to Campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: path.join('screenshots', 'bug4-fix-1-campaigns-page.png'),
      fullPage: true 
    });
    console.log('  SCREENSHOT: bug4-fix-1-campaigns-page.png\n');

    console.log('Step 3: Analyzing campaigns...');
    
    // Get all campaign card elements
    const campaignCards = await page.locator('div').filter({ hasText: 'Draft' }).or(page.locator('div').filter({ hasText: 'Sent' })).locator('..').all();
    
    // Better approach: find all elements with the three-dot menu button
    const menuButtons = await page.locator('button svg.lucide-ellipsis').or(page.locator('button svg.lucide-more-horizontal')).locator('..').all();
    console.log('  Found', menuButtons.length, 'campaign menu buttons');

    if (menuButtons.length === 0) {
      console.log('  WARNING: No campaigns with menu buttons found\n');
      return;
    }

    // Identify campaign statuses by looking at the badge near each menu button
    const campaigns = [];
    for (let i = 0; i < menuButtons.length; i++) {
      const parent = await menuButtons[i].locator('xpath=ancestor::div[contains(@class, "rounded") or contains(@class, "border")]').first();
      const statusBadge = await parent.locator('.inline-flex, [class*="badge"]').first().textContent().catch(() => '');
      const titleText = await parent.locator('h3, .font-semibold').first().textContent().catch(() => 'Unknown');
      const status = statusBadge.trim().toLowerCase();
      campaigns.push({ index: i, title: titleText.trim(), status });
      console.log('    ' + (i + 1) + '. "' + titleText.trim() + '" - Status: ' + status);
    }
    console.log('');

    // Test DRAFT campaign
    const draftIndex = campaigns.findIndex(c => c.status === 'draft');
    if (draftIndex >= 0) {
      console.log('Step 4a: Testing DRAFT campaign...');
      console.log('  Campaign: "' + campaigns[draftIndex].title + '"');
      
      await menuButtons[draftIndex].click();
      await page.waitForTimeout(1000);

      await page.screenshot({ 
        path: path.join('screenshots', 'bug4-fix-2-draft-dropdown.png'),
        fullPage: true 
      });
      console.log('  SCREENSHOT: bug4-fix-2-draft-dropdown.png');

      const deleteVisible = await page.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")').first().isVisible().catch(() => false);
      testResults.draftDeleteVisible = deleteVisible;
      
      console.log('  Delete button visible: ' + (deleteVisible ? 'YES' : 'NO'));
      console.log('  RESULT: ' + (deleteVisible ? 'PASS - Delete shown for DRAFT' : 'FAIL - Delete missing for DRAFT'));
      console.log('');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('Step 4a: No DRAFT campaign found\n');
    }

    // Test non-DRAFT campaign (sent, scheduled, etc.)
    const nonDraftIndex = campaigns.findIndex(c => c.status !== 'draft' && c.status !== 'cancelled');
    if (nonDraftIndex >= 0) {
      console.log('Step 4b: Testing NON-DRAFT campaign...');
      console.log('  Campaign: "' + campaigns[nonDraftIndex].title + '" (' + campaigns[nonDraftIndex].status + ')');
      
      await menuButtons[nonDraftIndex].click();
      await page.waitForTimeout(1000);

      await page.screenshot({ 
        path: path.join('screenshots', 'bug4-fix-3-sent-dropdown.png'),
        fullPage: true 
      });
      console.log('  SCREENSHOT: bug4-fix-3-sent-dropdown.png');

      const deleteVisible = await page.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")').first().isVisible().catch(() => false);
      testResults.nonDraftDeleteHidden = !deleteVisible;
      
      console.log('  Delete button visible: ' + (deleteVisible ? 'YES' : 'NO'));
      console.log('  RESULT: ' + (deleteVisible ? 'FAIL - Delete shown for ' + campaigns[nonDraftIndex].status.toUpperCase() : 'PASS - Delete hidden for ' + campaigns[nonDraftIndex].status.toUpperCase()));
      console.log('');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('Step 4b: No non-draft campaign found\n');
    }

    // Final verdict
    console.log('========================================');
    console.log('FINAL VERDICT');
    console.log('========================================');
    
    if (testResults.draftDeleteVisible === true && testResults.nonDraftDeleteHidden === true) {
      testResults.overallPass = true;
      console.log('STATUS: PASS');
      console.log('');
      console.log('BUG-4 FIX VERIFIED:');
      console.log('- Delete button SHOWS for draft campaigns');
      console.log('- Delete button HIDDEN for non-draft campaigns');
      console.log('');
      console.log('The fix is working correctly!');
    } else if (testResults.draftDeleteVisible === false) {
      console.log('STATUS: FAIL');
      console.log('ISSUE: Delete button missing for DRAFT campaigns');
    } else if (testResults.nonDraftDeleteHidden === false) {
      console.log('STATUS: FAIL');
      console.log('ISSUE: Delete button still visible for non-draft campaigns');
    } else {
      console.log('STATUS: INCOMPLETE');
      console.log('Not all campaign types were available for testing');
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ 
      path: path.join('screenshots', 'bug4-fix-error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();