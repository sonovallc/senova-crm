const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature4() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature5-testing');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== FEATURE 4: Autoresponders Testing ===\n');

  try {
    // LOGIN FIRST
    console.log('LOGGING IN...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('Login complete\n');
');


    // TEST 1: Navigate to Autoresponders Page
    console.log('TEST 1: Navigate to Autoresponders Page');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature5-01-autoresponders-list.png'), fullPage: true });
    console.log('Screenshot: Autoresponders list page');
    
    const createButton = await page.locator('button:has-text("Create Autoresponder"), a:has-text("Create Autoresponder")');
    const buttonCount = await createButton.count();
    console.log(buttonCount > 0 ? 'PASS: Create button found\n' : 'FAIL: Create Autoresponder button not found\n');

    // TEST 2: Open Autoresponder Creation Form
    if (buttonCount > 0) {
      console.log('TEST 2: Autoresponder Creation Wizard - Step 1');
      await createButton.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotDir, 'feature5-02a-wizard-opened.png'), fullPage: true });
      console.log('Screenshot: Wizard opened');
      
      // Fill autoresponder details
      const nameInput = await page.locator('input[name="name"], input[id="name"]');
      if (await nameInput.count() > 0) {
        await nameInput.first().fill('Test Autoresponder QA');
        console.log('Filled: Autoresponder name');
      }
      
      const subjectInput = await page.locator('input[name="subject"], input[id="subject"]');
      if (await subjectInput.count() > 0) {
        await subjectInput.first().fill('Test autoresponder description}}');
        console.log('Filled: Email subject');
      }
      
      const contentTextarea = await page.locator('textarea[name="content"], textarea[id="content"]');
      if (await contentTextarea.count() > 0) {
        await contentTextarea.first().fill('Test autoresponder body content');
        console.log('Filled: Email content');
      }
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, 'feature5-02b-wizard-filled.png'), fullPage: true });
      console.log('Screenshot: Form filled\n');
      
      // Look for Next or Submit button
      const nextButton = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Create"), button:has-text("Submit")');
      if (await nextButton.count() > 0) {
        console.log('Found button, clicking...');
        await nextButton.first().click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(screenshotDir, 'feature5-03-after-submit.png'), fullPage: true });
        console.log('Screenshot: After submission\n');
      }
    }

    // TEST 3: Verify autoresponder in list
    console.log('TEST 3: Verify Autoresponder in List');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, 'feature5-04-autoresponders-list-updated.png'), fullPage: true });
    
    const autoresponderInList = await page.locator('text=Playwright Test Autoresponder');
    const autoresponderFound = await autoresponderInList.count() > 0;
    console.log(autoresponderFound ? 'PASS: Autoresponder found in list\n' : 'FAIL: Autoresponder not in list\n');

    // TEST 4: Database verification via API
    console.log('TEST 4: Database Verification');
    const apiResponse = await fetch('http://localhost:8000/api/v1/autoresponders');
    const autoresponders = await apiResponse.json();
    console.log('API Response Status:', apiResponse.status);
    console.log('Autoresponders count:', Array.isArray(autoresponders) ? autoresponders.length : 'unknown');
    
    if (Array.isArray(autoresponders)) {
      const testAutoresponder = autoresponders.find(c => c.name === 'Playwright Test Autoresponder');
      if (testAutoresponder) {
        console.log('PASS: Autoresponder found in database');
        console.log('  ID:', testAutoresponder.id);
        console.log('  Name:', testAutoresponder.name);
        console.log('  Description:', testAutoresponder.subject);
        console.log('  Status:', testAutoresponder.status);
      } else {
        console.log('FAIL: Autoresponder not found in database');
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
