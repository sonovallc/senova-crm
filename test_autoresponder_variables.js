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
    console.log('✓ Login successful\n');

    // Navigate to Autoresponders Create
    console.log('Navigating to Autoresponders Create page...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders/create');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\auto-vars-01-initial.png',
      fullPage: true
    });
    console.log('✓ Initial screenshot taken\n');

    // Scroll to Email Content section
    console.log('Scrolling to Email Content section...');
    await page.evaluate(() => {
      const emailContentCard = Array.from(document.querySelectorAll('h3'))
        .find(h => h.textContent.includes('Email Content'));
      if (emailContentCard) {
        emailContentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\auto-vars-02-email-content.png',
      fullPage: true
    });
    console.log('✓ Email Content section screenshot taken\n');

    // Check current mode
    const useTemplateChecked = await page.locator('#mode-template').isChecked();
    const customContentChecked = await page.locator('#mode-custom').isChecked();
    console.log(`Current mode: Use Template=${useTemplateChecked}, Custom=${customContentChecked}\n`);

    // If in template mode, switch to custom
    if (useTemplateChecked && !customContentChecked) {
      console.log('Switching to Custom Content mode...');
      await page.click('#mode-custom');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\auto-vars-03-custom-mode.png',
        fullPage: true
      });
      console.log('✓ Switched to Custom Content mode\n');
    }

    // Now check for Variables button
    console.log('Checking for Variables button...');
    const variablesButtons = await page.locator('button:has-text("Variables")').count();
    console.log(`Variables buttons found: ${variablesButtons}`);

    if (variablesButtons > 0) {
      console.log('✓ Variables button FOUND!\n');

      // Click it
      await page.click('button:has-text("Variables")');
      await page.waitForTimeout(1000);

      // Check for dropdown items
      const contactName = await page.locator('text=/{{contact_name}}/').count();
      const firstName = await page.locator('text=/{{first_name}}/').count();
      const lastName = await page.locator('text=/{{last_name}}/').count();
      const email = await page.locator('text=/{{email}}/').count();
      const company = await page.locator('text=/{{company}}/').count();
      const phone = await page.locator('text=/{{phone}}/').count();

      console.log('Dropdown variables:');
      console.log(`  {{contact_name}}: ${contactName > 0 ? '✓' : '✗'}`);
      console.log(`  {{first_name}}: ${firstName > 0 ? '✓' : '✗'}`);
      console.log(`  {{last_name}}: ${lastName > 0 ? '✓' : '✗'}`);
      console.log(`  {{email}}: ${email > 0 ? '✓' : '✗'}`);
      console.log(`  {{company}}: ${company > 0 ? '✓' : '✗'}`);
      console.log(`  {{phone}}: ${phone > 0 ? '✓' : '✗'}\n');

      await page.screenshot({
        path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\auto-vars-04-dropdown-open.png',
        fullPage: true
      });
      console.log('✓ Dropdown screenshot taken');

      const allVariables = contactName && firstName && lastName && email && company && phone;
      console.log(`\n✓✓✓ RESULT: ${allVariables ? 'ALL 6 VARIABLES PRESENT' : 'SOME VARIABLES MISSING'}`);
    } else {
      console.log('✗ Variables button NOT FOUND');
      await page.screenshot({
        path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\auto-vars-04-not-found.png',
        fullPage: true
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({
      path: 'C:\\Users\\jwood\\Documents\\Projects\\claude-code-agents-wizard-v2\\screenshots\\auto-vars-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
})();
