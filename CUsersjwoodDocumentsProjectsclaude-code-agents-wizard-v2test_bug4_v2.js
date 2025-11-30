const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('\n=== BUG-4 VERIFICATION: Campaign Delete Button ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 2: Navigate to Campaigns
    console.log('\nStep 2: Navigate to campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take screenshot of campaigns page
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-fix-1-campaigns-page.png'),
      fullPage: true 
    });
    console.log('Screenshot: bug4-fix-1-campaigns-page.png');

    // Get page content to understand structure
    const pageText = await page.textContent('body');
    console.log('\nPage contains "campaign":', pageText.toLowerCase().includes('campaign'));

    // Check for table rows
    const rowCount = await page.locator('table tbody tr').count();
    console.log('Table rows found:', rowCount);

    if (rowCount === 0) {
      console.log('\nNo campaigns found. Checking page structure...');
      const h1Text = await page.locator('h1').textContent().catch(() => 'none');
      console.log('Page heading:', h1Text);
      
      // Check for "Create Campaign" button
      const createButton = await page.locator('button:has-text("Create"), a:has-text("Create")').count();
      console.log('Create button found:', createButton > 0);
    } else {
      console.log('\nStep 3: Analyzing campaigns...');
      
      // Get campaigns with their statuses
      const campaigns = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map((row, idx) => {
          const cells = row.querySelectorAll('td');
          const name = cells[0]?.textContent?.trim() || 'Unknown';
          const status = cells[1]?.textContent?.trim().toLowerCase() || 'unknown';
          return { idx, name, status };
        });
      });

      console.log('Campaigns found:');
      campaigns.forEach(c => {
        console.log('  -', c.name, '| Status:', c.status);
      });

      // Test DRAFT campaign
      const draftIdx = campaigns.findIndex(c => c.status === 'draft');
      if (draftIdx >= 0) {
        console.log('\nStep 4a: Testing DRAFT campaign...');
        const draftCampaign = campaigns[draftIdx];
        
        // Click actions button in that row
        const actionsBtn = await page.locator('table tbody tr').nth(draftIdx).locator('button').last();
        await actionsBtn.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ 
          path: path.join(screenshotDir, 'bug4-fix-2-draft-dropdown.png'),
          fullPage: true 
        });
        console.log('Screenshot: bug4-fix-2-draft-dropdown.png');

        const hasDelete = await page.locator('text=Delete').isVisible();
        console.log('  Delete button for DRAFT:', hasDelete ? 'VISIBLE (CORRECT)' : 'HIDDEN (WRONG)');

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      // Test NON-DRAFT campaign
      const nonDraftIdx = campaigns.findIndex(c => c.status !== 'draft' && c.status !== 'cancelled');
      if (nonDraftIdx >= 0) {
        console.log('\nStep 4b: Testing NON-DRAFT campaign...');
        const nonDraftCampaign = campaigns[nonDraftIdx];
        console.log('  Testing:', nonDraftCampaign.name, '| Status:', nonDraftCampaign.status);
        
        const actionsBtn = await page.locator('table tbody tr').nth(nonDraftIdx).locator('button').last();
        await actionsBtn.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ 
          path: path.join(screenshotDir, 'bug4-fix-3-sent-dropdown.png'),
          fullPage: true 
        });
        console.log('Screenshot: bug4-fix-3-sent-dropdown.png');

        const hasDelete = await page.locator('text=Delete').isVisible();
        console.log('  Delete button for', nonDraftCampaign.status.toUpperCase() + ':', hasDelete ? 'VISIBLE (WRONG)' : 'HIDDEN (CORRECT)');

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    console.log('\n=== VERIFICATION COMPLETE ===\n');

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-fix-error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();
