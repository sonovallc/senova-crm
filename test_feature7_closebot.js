const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature7Closebot() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'feature7-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== FEATURE 7: CLOSEBOT AI PLACEHOLDER TEST ===');
  console.log('');

  const results = {
    pageLoads: false,
    comingSoonBadge: false,
    apiKeyField: false,
    apiKeyDisabled: false,
    agentIdField: false,
    agentIdDisabled: false,
    closebotTitle: false,
    saveButtonDisabled: false
  };

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
    console.log('  Screenshot: 01-login-page.png');
    console.log('');

    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.screenshot({ path: path.join(screenshotDir, '02-credentials-filled.png'), fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, '03-dashboard.png'), fullPage: true });
    console.log('  Login successful');
    console.log('  Screenshot: 03-dashboard.png');
    console.log('');

    console.log('Step 3: Navigating to Closebot page...');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/closebot', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    results.pageLoads = true;
    await page.screenshot({ path: path.join(screenshotDir, '04-closebot-full.png'), fullPage: true });
    console.log('  Page loaded');
    console.log('  Screenshot: 04-closebot-full.png');
    console.log('');

    console.log('Step 4: Verifying page content...');
    const pageTitle = await page.locator('h1:has-text("Closebot AI Integration")');
    results.closebotTitle = await pageTitle.count() > 0;
    console.log('  Title: ' + (results.closebotTitle ? 'FOUND' : 'NOT FOUND'));

    const comingSoonBadge = await page.locator('text=/coming soon/i');
    results.comingSoonBadge = await comingSoonBadge.count() > 0;
    console.log('  Coming Soon badge: ' + (results.comingSoonBadge ? 'FOUND' : 'NOT FOUND'));
    console.log('');

    console.log('Step 5: Verifying API Key field...');
    const apiKeyField = await page.locator('input#closebot-api-key');
    results.apiKeyField = await apiKeyField.count() > 0;
    console.log('  API Key field: ' + (results.apiKeyField ? 'FOUND' : 'NOT FOUND'));
    
    if (results.apiKeyField) {
      results.apiKeyDisabled = await apiKeyField.isDisabled();
      console.log('  Disabled: ' + (results.apiKeyDisabled ? 'YES' : 'NO'));
    }
    console.log('');

    console.log('Step 6: Verifying Agent ID field...');
    const agentIdField = await page.locator('input#closebot-agent-id');
    results.agentIdField = await agentIdField.count() > 0;
    console.log('  Agent ID field: ' + (results.agentIdField ? 'FOUND' : 'NOT FOUND'));
    
    if (results.agentIdField) {
      results.agentIdDisabled = await agentIdField.isDisabled();
      console.log('  Disabled: ' + (results.agentIdDisabled ? 'YES' : 'NO'));
    }
    console.log('');

    console.log('Step 7: Verifying Save button...');
    const saveButton = await page.locator('button:has-text("Save Settings")');
    const hasSaveButton = await saveButton.count() > 0;
    console.log('  Save button: ' + (hasSaveButton ? 'FOUND' : 'NOT FOUND'));
    
    if (hasSaveButton) {
      results.saveButtonDisabled = await saveButton.isDisabled();
      console.log('  Disabled: ' + (results.saveButtonDisabled ? 'YES' : 'NO'));
    }
    console.log('');

    console.log('Step 8: Taking detailed screenshots...');
    await page.screenshot({ path: path.join(screenshotDir, '05-closebot-viewport.png') });
    console.log('  Screenshot: 05-closebot-viewport.png');
    console.log('');

    console.log('');
    console.log('=== TEST SUMMARY ===');
    console.log('');
    console.log('Page loads: ' + (results.pageLoads ? 'PASS' : 'FAIL'));
    console.log('Closebot title: ' + (results.closebotTitle ? 'PASS' : 'FAIL'));
    console.log('Coming Soon badge: ' + (results.comingSoonBadge ? 'PASS' : 'FAIL'));
    console.log('API Key field: ' + (results.apiKeyField ? 'PASS' : 'FAIL'));
    console.log('API Key disabled: ' + (results.apiKeyDisabled ? 'PASS' : 'FAIL'));
    console.log('Agent ID field: ' + (results.agentIdField ? 'PASS' : 'FAIL'));
    console.log('Agent ID disabled: ' + (results.agentIdDisabled ? 'PASS' : 'FAIL'));
    console.log('Save button disabled: ' + (results.saveButtonDisabled ? 'PASS' : 'FAIL'));
    console.log('');
    
    const allPass = results.pageLoads && results.closebotTitle && results.comingSoonBadge &&
                    results.apiKeyField && results.apiKeyDisabled && results.agentIdField &&
                    results.agentIdDisabled && results.saveButtonDisabled;
    
    console.log('OVERALL: ' + (allPass ? 'PASS' : 'FAIL'));
    console.log('');
    console.log('Screenshots: ' + screenshotDir);

  } catch (error) {
    console.error('');
    console.error('TEST ERROR:');
    console.error(error.message);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR.png'), fullPage: true });
  } finally {
    console.log('');
    console.log('Closing in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testFeature7Closebot().catch(console.error);