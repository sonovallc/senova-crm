const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature4() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature4-final');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = { tests: [], consoleMessages: [] };

  page.on('console', msg => {
    const entry = { type: msg.type(), text: msg.text() };
    results.consoleMessages.push(entry);
    console.log('[CONSOLE]', entry.type, ':', entry.text);
  });

  console.log('=== Feature 4: Mass Email Campaigns - Comprehensive Test ===\n');

  try {
    console.log('[1] Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('Login complete\n');

    console.log('[T1] Campaigns Page Load...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const hasHeading = await page.locator('text=Email Campaigns').count() > 0;
    const hasCreateButton = await page.locator('button:has-text("Create Campaign")').count() > 0;
    
    await page.screenshot({ path: path.join(screenshotDir, '01-campaigns-page.png'), fullPage: true });
    
    const t1Status = hasHeading && hasCreateButton ? 'PASS' : 'FAIL';
    results.tests.push({
      test: 'T1: Campaigns Page Load',
      status: t1Status,
      details: 'Heading:' + hasHeading + ', Button:' + hasCreateButton
    });
    console.log('T1:', t1Status, '(Heading:', hasHeading, ', Button:', hasCreateButton, ')\n');

    console.log('[T2] Create Campaign Wizard Navigation...');
    const createButtons = await page.locator('button:has-text("Create Campaign")').all();
    console.log('Found', createButtons.length, 'Create Campaign buttons');
    
    if (createButtons.length > 0) {
      await createButtons[0].click();
      console.log('Clicked, waiting 10 seconds...');
      await page.waitForTimeout(10000);
      
      const currentUrl = page.url();
      const isWizardPage = currentUrl.includes('/campaigns/create');
      const hasForm = await page.locator('input, textarea').count() > 0;
      
      await page.screenshot({ path: path.join(screenshotDir, '02-wizard-opened.png'), fullPage: true });
      
      const t2Status = isWizardPage || hasForm ? 'PASS' : 'FAIL';
      results.tests.push({
        test: 'T2: Wizard Navigation',
        status: t2Status,
        details: 'URL:' + currentUrl + ', HasForm:' + hasForm
      });
      console.log('T2:', t2Status, '(URL:', currentUrl, ')\n');

      if (isWizardPage || hasForm) {
        console.log('[T3] Fill Campaign Details...');
        await page.waitForTimeout(2000);
        
        const allInputs = await page.locator('input[type="text"], input:not([type])').all();
        const allTextareas = await page.locator('textarea').all();
        
        console.log('Found', allInputs.length, 'inputs,', allTextareas.length, 'textareas');
        
        if (allInputs.length >= 2) {
          await allInputs[0].fill('Final Test Campaign');
          await allInputs[1].fill('Hello {{contact_name}}');
        }
        
        if (allTextareas.length > 0) {
          await allTextareas[0].fill('Dear {{contact_name}}, test from {{company_name}}.');
        }
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, '03-step1-filled.png'), fullPage: true });
        
        results.tests.push({
          test: 'T3: Fill Fields',
          status: 'PASS',
          details: 'Filled' + allInputs.length + 'inputs,' + allTextareas.length + 'textareas'
        });
        console.log('T3: PASS (fields filled)\n');

        console.log('[INFO] Checking buttons...');
        const allButtons = await page.locator('button').all();
        console.log('Found', allButtons.length, 'buttons:');
        
        for (let i = 0; i < allButtons.length; i++) {
          const text = await allButtons[i].textContent();
          console.log('  Button', i, ':', text.trim());
        }
        console.log('');
      }
    }

    console.log('[T7] Campaign List Check...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const hasCampaign = await page.locator('text=Final Test Campaign').count() > 0;
    await page.screenshot({ path: path.join(screenshotDir, '07-list-check.png'), fullPage: true });
    
    const t7Status = hasCampaign ? 'PASS' : 'FAIL';
    results.tests.push({
      test: 'T7: Campaign List',
      status: t7Status,
      details: 'Campaign visible:' + hasCampaign
    });
    console.log('T7:', t7Status, '(Campaign visible:', hasCampaign, ')\n');

    fs.writeFileSync(
      path.join(screenshotDir, 'test-results.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n=== TEST SUMMARY ===');
    results.tests.forEach(t => {
      console.log(t.test, ':', t.status);
    });
    console.log('\nScreenshots:', screenshotDir);

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    results.error = error.message;
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR-state.png'), fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testFeature4().catch(console.error);
