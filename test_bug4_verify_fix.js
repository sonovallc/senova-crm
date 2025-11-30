const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('BUG-4 VERIFICATION: Campaign Delete Button');

  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login', { timeout: 60000 });
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  Login successful');

    console.log('Step 2: Navigate to Campaigns...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: screenshotDir + '\bug4-fix-1-campaigns-page.png',
      fullPage: true 
    });
    console.log('  Screenshot: bug4-fix-1-campaigns-page.png');

    console.log('Step 3: Check campaigns...');
    const campaignCards = await page.locator('.space-y-4 > div').count();
    console.log('  Campaign cards found:', campaignCards);

    if (campaignCards === 0) {
      console.log('  No campaigns - test inconclusive');
      return;
    }

    const campaigns = [];
    for (let i = 0; i < campaignCards; i++) {
      const card = page.locator('.space-y-4 > div').nth(i);
      const name = await card.locator('h3').first().textContent().catch(() => 'Unknown');
      const status = await card.locator('.inline-flex').first().textContent().catch(() => 'unknown');
      campaigns.push({ idx: i, name: name.trim(), status: status.trim().toLowerCase() });
      console.log('  Campaign', i + 1, ':', name.trim(), '-', status.trim());
    }

    const draftIdx = campaigns.findIndex(c => c.status === 'draft');
    if (draftIdx >= 0) {
      console.log('Step 4a: Testing DRAFT campaign...');
      const draftCard = page.locator('.space-y-4 > div').nth(draftIdx);
      const menuBtn = draftCard.locator('button').last();
      await menuBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ 
        path: screenshotDir + '\bug4-fix-2-draft-dropdown.png',
        fullPage: true 
      });
      console.log('  Screenshot: bug4-fix-2-draft-dropdown.png');

      const hasDelete = await page.locator('[role="menuitem"]:has-text("Delete")').isVisible();
      console.log('  Delete visible for DRAFT:', hasDelete ? 'YES (CORRECT)' : 'NO (WRONG)');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    const nonDraftIdx = campaigns.findIndex(c => c.status !== 'draft' && c.status !== 'cancelled');
    if (nonDraftIdx >= 0) {
      console.log('Step 4b: Testing non-draft campaign...');
      const nonDraftCard = page.locator('.space-y-4 > div').nth(nonDraftIdx);
      const menuBtn = nonDraftCard.locator('button').last();
      await menuBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ 
        path: screenshotDir + '\bug4-fix-3-sent-dropdown.png',
        fullPage: true 
      });
      console.log('  Screenshot: bug4-fix-3-sent-dropdown.png');

      const hasDelete = await page.locator('[role="menuitem"]:has-text("Delete")').isVisible();
      console.log('  Delete visible for NON-DRAFT:', hasDelete ? 'YES (WRONG)' : 'NO (CORRECT)');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    console.log('VERIFICATION COMPLETE');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ 
      path: screenshotDir + '\bug4-fix-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
})();