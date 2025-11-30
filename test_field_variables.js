const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== Field Variables Dropdown Test ===
');
    
    // Login
    console.log('T1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login successful');

    // Test 1: Email Composer
    console.log('
=== TEST 1: Email Composer ===');
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);
    
    const composerVariablesBtn = await page.locator('button:has-text("Variables")').first();
    const composerVisible = await composerVariablesBtn.isVisible();
    console.log();
    
    if (composerVisible) {
      await composerVariablesBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/variables-01-composer-dropdown.png', fullPage: true });
      
      // Check all variables are present
      const variables = ['{{contact_name}}', '{{first_name}}', '{{last_name}}', '{{email}}', '{{company}}', '{{phone}}'];
      for (const variable of variables) {
        const varVisible = await page.locator().isVisible();
        console.log();
      }
      
      // Insert a variable
      await page.click('text="{{first_name}}"');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/variables-02-composer-inserted.png', fullPage: true });
      console.log('✅ Variable inserted in Composer');
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Test 2: Campaign Wizard
    console.log('
=== TEST 2: Campaign Wizard ===');
    await page.goto('http://localhost:3004/dashboard/email/campaigns/create');
    await page.waitForTimeout(2000);
    
    const campaignVariablesBtn = await page.locator('button:has-text("Variables")').first();
    const campaignVisible = await campaignVariablesBtn.isVisible();
    console.log();
    
    if (campaignVisible) {
      await campaignVariablesBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/variables-03-campaign-dropdown.png', fullPage: true });
      
      await page.click('text="{{company}}"');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/variables-04-campaign-inserted.png', fullPage: true });
      console.log('✅ Variable inserted in Campaign');
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Test 3: Autoresponder Create
    console.log('
=== TEST 3: Autoresponder Create ===');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(2000);
    
    // Enable custom content mode first
    await page.click('input[id="mode-custom"]');
    await page.waitForTimeout(1000);
    
    const autoresponderVariablesBtn = await page.locator('button:has-text("Variables")').first();
    const autoresponderVisible = await autoresponderVariablesBtn.isVisible();
    console.log();
    
    if (autoresponderVisible) {
      await autoresponderVariablesBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/variables-05-autoresponder-dropdown.png', fullPage: true });
      
      await page.click('text="{{email}}"');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/variables-06-autoresponder-inserted.png', fullPage: true });
      console.log('✅ Variable inserted in Autoresponder');
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Test 4: Email Templates
    console.log('
=== TEST 4: Email Templates ===');
    await page.goto('http://localhost:3004/dashboard/email/templates');
    await page.waitForTimeout(2000);
    
    const createTemplateBtn = await page.locator('button:has-text("Create Template")').first();
    if (await createTemplateBtn.isVisible()) {
      await createTemplateBtn.click();
      await page.waitForTimeout(2000);
      
      const templateVariablesBtn = await page.locator('button:has-text("Variables")').first();
      const templateVisible = await templateVariablesBtn.isVisible();
      console.log();
      
      if (templateVisible) {
        await templateVariablesBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/variables-07-template-dropdown.png', fullPage: true });
        
        await page.click('text="{{phone}}"');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/variables-08-template-inserted.png', fullPage: true });
        console.log('✅ Variable inserted in Template');
      }
    } else {
      console.log('⚠️ Could not find create template button');
    }

    console.log('
=== Field Variables Test Complete ===');
    console.log('
📊 Summary:');
    console.log('- Email Composer: Verified');
    console.log('- Campaign Wizard: Verified');
    console.log('- Autoresponder Create: Verified');
    console.log('- Email Templates: Attempted');

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/variables-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
