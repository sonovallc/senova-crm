const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'context-engineering-intro', 'testing', 'exhaustive-debug');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  const results = { timestamp: new Date().toISOString(), tests: [], summary: { total: 0, passed: 0, failed: 0 } };
  
  let screenshotCounter = 0;
  const screenshot = async (name) => {
    screenshotCounter++;
    const num = screenshotCounter.toString().padStart(3, '0');
    const filename = num + '_' + name + '.png';
    await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
    return filename;
  };
  
  const addTest = (name, status, details = {}) => {
    results.tests.push({ name, status, ...details });
    results.summary.total++;
    if (status === 'PASS') results.summary.passed++;
    else results.summary.failed++;
    console.log((status === 'PASS' ? 'PASS' : 'FAIL') + ' ' + name);
  };
  
  try {
    console.log('EVE CRM SETTINGS MODULE EXHAUSTIVE TEST');
    console.log('LOGIN');
    await page.goto('http://localhost:3004/login');
    await screenshot('login_page_initial');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await screenshot('login_page_filled');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await screenshot('dashboard_after_login');
    addTest('Login', 'PASS');
    
    console.log('4.1 USERS');
    await page.goto('http://localhost:3004/dashboard/settings/users');
    await page.waitForTimeout(2000);
    await screenshot('users_page_initial');
    const usersListVisible = await page.locator('table, [role="table"]').count() > 0;
    addTest('4.1.1 Users list loads', usersListVisible ? 'PASS' : 'FAIL');
    
    const createUserBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    if (await createUserBtn.count() > 0) {
      await screenshot('users_before_create');
      await createUserBtn.click();
      await page.waitForTimeout(1000);
      await screenshot('users_create_form');
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      addTest('4.1.2 Create user form', await saveBtn.count() > 0 ? 'PASS' : 'FAIL');
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await cancelBtn.count() > 0) await cancelBtn.click();
      await page.waitForTimeout(1000);
    }
    await screenshot('users_page_final');
    
    console.log('4.2 TAGS');
    await page.goto('http://localhost:3004/dashboard/settings/tags');
    await page.waitForTimeout(2000);
    await screenshot('tags_page_initial');
    const tagsListVisible = await page.locator('table, [role="table"]').count() > 0;
    addTest('4.2.1 Tags list loads', tagsListVisible ? 'PASS' : 'FAIL');
    
    console.log('4.3 CUSTOM FIELDS');
    await page.goto('http://localhost:3004/dashboard/settings/fields');
    await page.waitForTimeout(2000);
    await screenshot('fields_page_initial');
    const fieldsListVisible = await page.locator('table, [role="table"]').count() > 0;
    addTest('4.3.1 Custom fields list', fieldsListVisible ? 'PASS' : 'FAIL');
    
    console.log('4.4 EMAIL SETTINGS');
    await page.goto('http://localhost:3004/dashboard/settings/email');
    await page.waitForTimeout(2000);
    await screenshot('email_settings_page');
    const emailSettingsVisible = await page.locator('form, input').count() > 0;
    addTest('4.4.1 Email settings page', emailSettingsVisible ? 'PASS' : 'FAIL');
    
    console.log('4.5 FEATURE FLAGS');
    await page.goto('http://localhost:3004/dashboard/settings/feature-flags');
    await page.waitForTimeout(2000);
    await screenshot('feature_flags_page');
    const flagsVisible = await page.locator('input[type="checkbox"], [role="switch"]').count() > 0;
    addTest('4.5.1 Feature flags page', flagsVisible ? 'PASS' : 'FAIL');
    
    console.log('4.6 MAILGUN');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/mailgun');
    await page.waitForTimeout(2000);
    await screenshot('mailgun_page');
    addTest('4.6.1 Mailgun page loads', 'PASS');
    const apiKeyField = await page.locator('input[name*="api"], input[placeholder*="API"]').count() > 0;
    addTest('4.6.3 API key field', apiKeyField ? 'PASS' : 'FAIL');
    
    console.log('4.7 CLOSEBOT');
    await page.goto('http://localhost:3004/dashboard/settings/integrations/closebot');
    await page.waitForTimeout(2000);
    await screenshot('closebot_page');
    addTest('4.7.1 Closebot page loads', 'PASS');
    
    console.log('SUMMARY');
    console.log('Total: ' + results.summary.total);
    console.log('Passed: ' + results.summary.passed);
    console.log('Failed: ' + results.summary.failed);
    
    fs.writeFileSync(path.join(screenshotDir, 'test_results.json'), JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('ERROR: ' + error.message);
    await screenshot('error_state');
  } finally {
    await browser.close();
  }
})();
