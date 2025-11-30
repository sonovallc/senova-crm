const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('\n=== BUG-4 VERIFICATION: Campaign Delete Button Conditional Visibility ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Step 2: Navigate to Campaigns
    console.log('\nStep 2: Navigating to Campaigns page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForTimeout(2000);

    // Take screenshot of campaigns page
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-fix-1-campaigns-page.png'),
      fullPage: true 
    });
    console.log('Screenshot saved: bug4-fix-1-campaigns-page.png');

    // Step 3: Analyze campaigns and their statuses
    console.log('\nStep 3: Analyzing campaign statuses...');
    
    // Get all campaign rows
    const campaigns = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return null;
        
        const name = cells[0]?.textContent?.trim() || '';
        const status = cells[1]?.textContent?.trim().toLowerCase() || '';
        
        return { name, status };
      }).filter(c => c !== null);
    });

    console.log('Found campaigns:', campaigns.length);
    campaigns.forEach((c, i) => {
      console.log('  Campaign', i + 1, ':', c.name, '-', c.status);
    });

    // Step 4: Test dropdown for DRAFT campaign
    const draftCampaign = campaigns.find(c => c.status === 'draft');
    if (draftCampaign) {
      console.log('\nStep 4a: Testing DRAFT campaign:', draftCampaign.name);
      
      // Find the row with this campaign
      const draftRow = await page.locator('table tbody tr').filter({ hasText: draftCampaign.name }).first();
      
      // Click the actions dropdown button (three dots)
      const actionsButton = draftRow.locator('button').last();
      await actionsButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of draft dropdown
      await page.screenshot({ 
        path: path.join(screenshotDir, 'bug4-fix-2-draft-dropdown.png'),
        fullPage: true 
      });
      console.log('Screenshot saved: bug4-fix-2-draft-dropdown.png');

      // Check if Delete button is visible
      const deleteButtonVisible = await page.locator('text=Delete').isVisible();
      console.log('  Delete button visible for DRAFT:', deleteButtonVisible ? 'YES (CORRECT)' : 'NO (WRONG)');

      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('\nNo DRAFT campaign found for testing');
    }

    // Step 5: Test dropdown for NON-DRAFT campaign (sent, scheduled, etc.)
    const nonDraftCampaign = campaigns.find(c => c.status === 'sent' || c.status === 'scheduled' || c.status === 'sending');
    if (nonDraftCampaign) {
      console.log('\nStep 4b: Testing NON-DRAFT campaign:', nonDraftCampaign.name, '(', nonDraftCampaign.status, ')');
      
      // Find the row with this campaign
      const nonDraftRow = await page.locator('table tbody tr').filter({ hasText: nonDraftCampaign.name }).first();
      
      // Click the actions dropdown button
      const actionsButton = nonDraftRow.locator('button').last();
      await actionsButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of non-draft dropdown
      await page.screenshot({ 
        path: path.join(screenshotDir, 'bug4-fix-3-sent-dropdown.png'),
        fullPage: true 
      });
      console.log('Screenshot saved: bug4-fix-3-sent-dropdown.png');

      // Check if Delete button is visible
      const deleteButtonVisible = await page.locator('text=Delete').isVisible();
      console.log('  Delete button visible for', nonDraftCampaign.status.toUpperCase() + ':', deleteButtonVisible ? 'YES (WRONG)' : 'NO (CORRECT)');

      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('\nNo non-draft campaign found for testing');
    }

    console.log('\n=== VERIFICATION COMPLETE ===\n');

  } catch (error) {
    console.error('\nERROR during verification:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-fix-error.png'),
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
})();
