const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to composer
    await page.goto('http://localhost:3004/dashboard/email/compose');
    await page.waitForTimeout(2000);

    console.log('=== EMAIL COMPOSER TEMPLATE TESTING ===');

    // Click template dropdown
    await page.click('text=Select a template');
    await page.waitForTimeout(1000);

    // Count templates
    const templates = await page.$$('[role="option"]');
    console.log(`Total templates found: ${templates.length}`);

    // Get template names first
    const templateNames = [];
    for (let i = 0; i < templates.length; i++) {
      const name = await templates[i].textContent();
      templateNames.push(name);
    }
    console.log('Template list:', templateNames);

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Test each template
    for (let i = 0; i < templateNames.length; i++) {
      console.log(`\nTesting template ${i + 1}/${templateNames.length}: ${templateNames[i]}`);

      // Click template dropdown
      await page.click('text=Select a template');
      await page.waitForTimeout(500);

      // Click specific template by index
      const options = await page.$$('[role="option"]');
      if (options[i]) {
        await options[i].click();
        await page.waitForTimeout(1000);

        // Check if subject filled
        try {
          const subjectValue = await page.inputValue('[placeholder*="subject" i]');
          console.log(`  Subject: ${subjectValue || 'EMPTY'}`);
        } catch (e) {
          console.log(`  Subject: Could not read`);
        }

        // Take screenshot
        await page.screenshot({ path: `screenshots/exhaust-composer/template-${i + 1}.png`, fullPage: false });
        console.log(`  Screenshot saved: template-${i + 1}.png`);

        // Reload for next test
        await page.reload();
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n=== TEMPLATE TESTING COMPLETE ===');
    console.log(`Total templates tested: ${templates.length}`);

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
