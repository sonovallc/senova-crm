const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature4() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature4-testing');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== FEATURE 4: Mass Email Campaigns Testing ===\n');

  try {
    // TEST 1: Navigate to Campaigns Page
    console.log('TEST 1: Navigate to Campaigns Page');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-01-campaigns-list.png'), fullPage: true });
    console.log('Screenshot: Campaigns list page');
    
    const createButton = await page.locator('button:has-text("Create Campaign"), a:has-text("Create Campaign")');
    const buttonCount = await createButton.count();
    console.log(buttonCount > 0 ? 'PASS: Create Campaign button found\n' : 'FAIL: Create Campaign button not found\n');

    // TEST 2: Open Campaign Creation Wizard
    if (buttonCount > 0) {
      console.log('TEST 2: Campaign Creation Wizard - Step 1');
      await createButton.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'feature4-02a-wizard-opened.png'), fullPage: true });
      console.log('Screenshot: Wizard opened');
      
      // Fill campaign details
      const nameInput = await page.locator('input[name="name"], input[id="name"]');
      if (await nameInput.count() > 0) {
        await nameInput.first().fill('Playwright Test Campaign');
        console.log('Filled: Campaign name');
      }
      
      const subjectInput = await page.locator('input[name="subject"], input[id="subject"]');
      if (await subjectInput.count() > 0) {
        await subjectInput.first().fill('Special Offer for {{contact_name}}');
        console.log('Filled: Email subject');
      }
      
      const contentTextarea = await page.locator('textarea[name="content"], textarea[id="content"]');
      if (await contentTextarea.count() > 0) {
        await contentTextarea.first().fill('Dear {{contact_name}}, we have a special offer!');
        console.log('Filled: Email content');
      }
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, 'feature4-02b-wizard-filled.png'), fullPage: true });
      console.log('Screenshot: Form filled\n');
      
      // Look for Next or Submit button
      const nextButton = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Create"), button:has-text("Submit")');
      if (await nextButton.count() > 0) {
        console.log('Found button, clicking...');
        await nextButton.first().click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(screenshotDir, 'feature4-03-after-submit.png'), fullPage: true });
        console.log('Screenshot: After submission\n');
      }
    }

    // TEST 3: Verify campaign in list
    console.log('TEST 3: Verify Campaign in List');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature4-04-campaigns-list-updated.png'), fullPage: true });
    
    const campaignInList = await page.locator('text=Playwright Test Campaign');
    const campaignFound = await campaignInList.count() > 0;
    console.log(campaignFound ? 'PASS: Campaign found in list\n' : 'FAIL: Campaign not in list\n');

    // TEST 4: Database verification via API
    console.log('TEST 4: Database Verification');
    const apiResponse = await fetch('http://localhost:8000/api/v1/campaigns');
    const campaigns = await apiResponse.json();
    console.log('API Response Status:', apiResponse.status);
    console.log('Campaigns count:', Array.isArray(campaigns) ? campaigns.length : 'unknown');
    
    if (Array.isArray(campaigns)) {
      const testCampaign = campaigns.find(c => c.name === 'Playwright Test Campaign');
      if (testCampaign) {
        console.log('PASS: Campaign found in database');
        console.log('  ID:', testCampaign.id);
        console.log('  Name:', testCampaign.name);
        console.log('  Subject:', testCampaign.subject);
        console.log('  Status:', testCampaign.status);
      } else {
        console.log('FAIL: Campaign not found in database');
      }
    }

    console.log('\n=== Testing Complete ===');

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-state.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

testFeature4().catch(console.error);
