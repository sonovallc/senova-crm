const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    console.log('✓ Login successful');

    const results = [];

    // Test 1: Email Composer
    console.log('\n=== Test 1: Email Composer ===');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    const composerVariablesButton = await page.locator('button:has-text("Variables")').count();
    results.push({
      location: 'Email Composer',
      variablesButton: composerVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'
    });
    console.log(`Variables button: ${composerVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'}`);

    if (composerVariablesButton > 0) {
      await page.click('button:has-text("Variables")');
      await page.waitForTimeout(500);
      const vars = await page.locator('text=/{{contact_name}}/').count();
      console.log(`Dropdown opens: ${vars > 0 ? 'YES ✓' : 'NO ✗'}`);
      await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\vars-all-01-composer.png' });
    }

    // Test 2: Campaign Wizard
    console.log('\n=== Test 2: Campaign Wizard ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns/create');
    await page.waitForTimeout(3000);
    const campaignVariablesButton = await page.locator('button:has-text("Variables")').count();
    results.push({
      location: 'Campaign Wizard',
      variablesButton: campaignVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'
    });
    console.log(`Variables button: ${campaignVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'}`);

    if (campaignVariablesButton > 0) {
      await page.click('button:has-text("Variables")');
      await page.waitForTimeout(500);
      const vars = await page.locator('text=/{{contact_name}}/').count();
      console.log(`Dropdown opens: ${vars > 0 ? 'YES ✓' : 'NO ✗'}`);
      await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\vars-all-02-campaigns.png' });
    }

    // Test 3: Autoresponders - Create
    console.log('\n=== Test 3: Autoresponders (Create) ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(3000);

    // Check initial mode
    let autoVariablesButton = await page.locator('button:has-text("Variables")').count();
    console.log(`Initial check - Variables button: ${autoVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'}`);

    // Try switching to Custom Content mode
    const customContentRadio = await page.locator('input[value="custom"]').count();
    if (customContentRadio > 0) {
      console.log('Switching to Custom Content mode...');
      await page.click('input[value="custom"]');
      await page.waitForTimeout(1000);
      autoVariablesButton = await page.locator('button:has-text("Variables")').count();
      console.log(`After switch - Variables button: ${autoVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
    }

    results.push({
      location: 'Autoresponders (Create)',
      variablesButton: autoVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'
    });

    if (autoVariablesButton > 0) {
      await page.click('button:has-text("Variables")');
      await page.waitForTimeout(500);
      const vars = await page.locator('text=/{{contact_name}}/').count();
      console.log(`Dropdown opens: ${vars > 0 ? 'YES ✓' : 'NO ✗'}`);
      await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\vars-all-03-autoresponders.png' });
    } else {
      await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\vars-all-03-autoresponders-not-found.png' });
    }

    // Test 4: Email Templates
    console.log('\n=== Test 4: Email Templates ===');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);

    // Click New Template button
    await page.click('button:has-text("New Template")');
    await page.waitForTimeout(2000);

    const templateVariablesButton = await page.locator('button:has-text("Variables")').count();
    results.push({
      location: 'Email Templates (Modal)',
      variablesButton: templateVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'
    });
    console.log(`Variables button in modal: ${templateVariablesButton > 0 ? 'FOUND ✓' : 'NOT FOUND ✗'}`);

    if (templateVariablesButton > 0) {
      await page.click('button:has-text("Variables")');
      await page.waitForTimeout(500);
      const vars = await page.locator('text=/{{contact_name}}/').count();
      console.log(`Dropdown opens: ${vars > 0 ? 'YES ✓' : 'NO ✗'}`);
      await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\vars-all-04-templates.png' });
    } else {
      await page.screenshot({ path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\vars-all-04-templates-not-found.png' });
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.table(results);

    const passCount = results.filter(r => r.variablesButton.includes('FOUND')).length;
    console.log(`\nPass Rate: ${passCount}/4 (${(passCount/4*100).toFixed(0)}%)`);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
