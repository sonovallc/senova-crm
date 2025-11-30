const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log("=== BUG-6 Autoresponder Edit Verification ===");
  
  try {
    console.log("Step 1: Login...");
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log("Login successful");
    
    console.log("Step 2: Navigate to autoresponders...");
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\round2-bugfix';
    await page.screenshot({ path: screenshotDir + '\bug-6-verify-1-list.png', fullPage: true });
    console.log("Screenshot saved: bug-6-verify-1-list.png");
    
    console.log("Step 3: Find Edit button...");
    const rows = await page.locator('table tbody tr').all();
    console.log('Found rows: ' + rows.length);
    
    if (rows.length === 0) {
      console.log("No autoresponders found");
      await browser.close();
      return;
    }
    
    const firstRow = rows[0];
    const actionsCell = firstRow.locator('td').last();
    const buttons = await actionsCell.locator('button').all();
    console.log('Found buttons: ' + buttons.length);
    
    if (buttons.length < 2) {
      console.log("Expected at least 2 buttons");
      await browser.close();
      return;
    }
    
    console.log("Step 4: Click Edit button...");
    const editButton = buttons[1];
    
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });
    
    await editButton.click();
    console.log("Edit button clicked");
    
    console.log("Step 5: Wait for edit page...");
    await page.waitForURL('**/autoresponders/**/edit', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL: ' + currentUrl);
    
    const headingCount = await page.locator('h1, h2').filter({ hasText: /Edit Autoresponder/i }).count();
    console.log('Edit heading found: ' + (headingCount > 0));
    
    const nameCount = await page.locator('input[name="name"]').count();
    const triggerCount = await page.locator('text=/Trigger Type/i').count();
    const contentCount = await page.locator('text=/Email Content|Subject|Body/i').count();
    
    console.log('Name field: ' + (nameCount > 0));
    console.log('Trigger section: ' + (triggerCount > 0));
    console.log('Content section: ' + (contentCount > 0));
    
    await page.screenshot({ path: screenshotDir + '\bug-6-verify-2-result.png', fullPage: true });
    console.log("Screenshot saved: bug-6-verify-2-result.png");
    
    const errors = consoleMessages.filter(m => m.type === 'error');
    const corsErrors = errors.filter(e => e.text.toLowerCase().includes('cors'));
    
    console.log("\n=== CONSOLE ERRORS ===");
    if (corsErrors.length > 0) {
      console.log("CORS ERRORS DETECTED:");
      corsErrors.forEach(e => console.log('  - ' + e.text));
    } else if (errors.length > 0) {
      console.log("Other errors:");
      errors.forEach(e => console.log('  - ' + e.text));
    } else {
      console.log("No errors detected");
    }
    
    console.log("\n=== TEST RESULT ===");
    if (currentUrl.includes('/edit') && headingCount > 0 && nameCount > 0 && corsErrors.length === 0) {
      console.log("PASS: Edit page loaded successfully!");
    } else {
      console.log("FAIL: Issues detected");
      if (!currentUrl.includes('/edit')) console.log("  - URL issue");
      if (headingCount === 0) console.log("  - Heading missing");
      if (nameCount === 0) console.log("  - Form fields missing");
      if (corsErrors.length > 0) console.log("  - CORS errors present");
    }
    
  } catch (error) {
    console.error("TEST ERROR:", error.message);
  } finally {
    await browser.close();
  }
})();
