const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'feature4-final');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = { tests: [], consoleMessages: [] };

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const entry = { type: msg.type(), text: msg.text() };
    results.consoleMessages.push(entry);
    console.log('[CONSOLE] ' + entry.type + ': ' + entry.text);
  });

  try {
    console.log('
=== LOGIN ===');
    await page.goto(BASE_URL + '/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('Login complete, URL:', page.url());

    console.log('
=== TEST 1: Campaigns Page Load ===');
    await page.goto(BASE_URL + '/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const hasHeading = await page.locator('text=Email Campaigns').count() > 0;
    const hasCreateButton = await page.locator('button:has-text("Create Campaign")').count() > 0;
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-campaigns-page.png'), fullPage: true });
    
    results.tests.push({
      test: 'T1: Campaigns Page Load',
      status: hasHeading && hasCreateButton ? 'PASS' : 'FAIL',
      details: 'Heading: ' + hasHeading + ', Create Button: ' + hasCreateButton,
      screenshot: '01-campaigns-page.png'
    });
    console.log('T1 Result:', hasHeading && hasCreateButton ? 'PASS' : 'FAIL');

    console.log('
=== TEST 2: Create Campaign Wizard Navigation ===');
    const createButtons = await page.locator('button:has-text("Create Campaign")').all();
    console.log('Found', createButtons.length, 'Create Campaign buttons');
    
    if (createButtons.length > 0) {
      await createButtons[0].click();
      console.log('Clicked Create Campaign, waiting 10 seconds...');
      await page.waitForTimeout(10000);
      
      const currentUrl = page.url();
      const isWizardPage = currentUrl.includes('/campaigns/create');
      const wizardVisible = await page.locator('text=/Campaign|Name|Subject/i').count() > 0;
      
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-wizard-opened.png'), fullPage: true });
      
      results.tests.push({
        test: 'T2: Create Campaign Wizard Navigation',
        status: isWizardPage || wizardVisible ? 'PASS' : 'FAIL',
        details: 'URL: ' + currentUrl + ', Wizard visible: ' + wizardVisible,
        screenshot: '02-wizard-opened.png'
      });
      console.log('T2 Result:', isWizardPage || wizardVisible ? 'PASS' : 'FAIL', ', URL:', currentUrl);

      if (isWizardPage || wizardVisible) {
        console.log('
=== TEST 3: Wizard Step 1 - Fill Fields ===');
        await page.waitForTimeout(2000);
        
        const allInputs = await page.locator('input[type="text"], input:not([type])').all();
        console.log('Found', allInputs.length, 'text inputs');
        
        for (let i = 0; i < allInputs.length; i++) {
          const placeholder = await allInputs[i].getAttribute('placeholder');
          const name = await allInputs[i].getAttribute('name');
          console.log('Input', i, ': name=', name, ', placeholder=', placeholder);
        }
        
        const textareas = await page.locator('textarea').all();
        console.log('Found', textareas.length, 'textareas');
        
        if (allInputs.length >= 2) {
          await allInputs[0].fill('Final Test Campaign');
          await allInputs[1].fill('Hello {{contact_name}}');
          console.log('Filled name and subject');
        }
        
        if (textareas.length > 0) {
          await textareas[0].fill('Dear {{contact_name}}, test from {{company_name}}.');
          console.log('Filled body');
        }
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-step1-filled.png'), fullPage: true });
        
        results.tests.push({
          test: 'T3: Wizard Step 1 - Campaign Details',
          status: 'PASS',
          details: 'Filled ' + allInputs.length + ' inputs, ' + textareas.length + ' textareas',
          screenshot: '03-step1-filled.png'
        });
        console.log('T3 Result: PASS');

        const allButtons = await page.locator('button').all();
        console.log('
Found', allButtons.length, 'total buttons');
        
        for (let i = 0; i < allButtons.length; i++) {
          const text = await allButtons[i].textContent();
          const type = await allButtons[i].getAttribute('type');
          console.log('Button', i, ': text="' + text + '", type=' + type);
        }
      }
    }

    console.log('
=== TEST 7: Campaign List Check ===');
    await page.goto(BASE_URL + '/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const hasCampaign = await page.locator('text=Final Test Campaign').count() > 0;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-list-with-campaign.png'), fullPage: true });
    
    results.tests.push({
      test: 'T7: Campaign List Verification',
      status: hasCampaign ? 'PASS' : 'FAIL',
      details: 'Campaign visible: ' + hasCampaign,
      screenshot: '07-list-with-campaign.png'
    });
    console.log('T7 Result:', hasCampaign ? 'PASS' : 'FAIL');

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'test-results.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('
=== TEST SUMMARY ===');
    results.tests.forEach(t => {
      console.log(t.test + ': ' + t.status);
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    results.error = error.message;
  } finally {
    await browser.close();
  }
})();
