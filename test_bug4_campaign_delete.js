const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join('C:', 'Users', 'jwood', 'Documents', 'Projects', 'claude-code-agents-wizard-v2', 'screenshots', 'final-verification');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('Step 3: Navigating to campaigns page...');
    await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('Step 4: Taking screenshot of campaigns list...');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-01-campaigns-list.png'),
      fullPage: true 
    });

    const campaignRows = await page.locator('table tbody tr').count();
    console.log('Found campaign rows:', campaignRows);

    if (campaignRows === 0) {
      console.log('No campaigns found. Creating a test campaign first...');
      
      await page.click('button:has-text("Create Campaign"), a:has-text("Create Campaign")');
      await page.waitForTimeout(1500);
      
      await page.fill('input[name="name"]', 'Test Campaign for Delete');
      await page.fill('input[name="subject"]', 'Test Subject');
      
      const templateSelect = await page.locator('select').first();
      if (await templateSelect.count() > 0) {
        await templateSelect.selectOption({ index: 1 });
      }
      
      await page.waitForTimeout(500);
      await page.click('button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(2000);
      
      await page.goto('http://localhost:3004/dashboard/email/campaigns', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      
      console.log('Test campaign created. Taking updated screenshot...');
      await page.screenshot({ 
        path: path.join(screenshotDir, 'bug4-01-campaigns-list.png'),
        fullPage: true 
      });
    }

    console.log('Step 5: Looking for delete button...');
    
    const consoleMessages = [];
    page.on('console', msg => {
      const msgText = msg.type() + ': ' + msg.text();
      consoleMessages.push(msgText);
      console.log('Browser console:', msgText);
    });

    const deleteButton = await page.locator('button[title*="Delete"], button:has(svg.lucide-trash), button:has-text("Delete"), .lucide-trash').first();
    
    if (await deleteButton.count() === 0) {
      console.log('ERROR: Delete button not found!');
      await page.screenshot({ 
        path: path.join(screenshotDir, 'bug4-02-no-delete-button.png'),
        fullPage: true 
      });
    } else {
      console.log('Delete button found. Taking screenshot before delete...');
      await deleteButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, 'bug4-02-delete-action.png'),
        fullPage: true 
      });

      console.log('Step 6: Clicking delete button...');
      await deleteButton.click();
      await page.waitForTimeout(1000);

      const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        console.log('Confirmation dialog found. Confirming deletion...');
        await confirmButton.click();
        await page.waitForTimeout(1500);
      }

      console.log('Step 7: Taking screenshot after delete action...');
      await page.waitForTimeout(1500);
      await page.screenshot({ 
        path: path.join(screenshotDir, 'bug4-03-delete-result.png'),
        fullPage: true 
      });

      const errorToast = await page.locator('text=/Failed to delete campaign/i, .error, .toast-error').count();
      const successToast = await page.locator('text=/deleted successfully/i, text=/Campaign deleted/i, .success, .toast-success').count();

      console.log('RESULTS:');
      console.log('Error toast visible:', errorToast > 0);
      console.log('Success toast visible:', successToast > 0);
      console.log('Console messages:');
      consoleMessages.forEach(msg => console.log('  ', msg));

      if (errorToast > 0) {
        console.log('FAIL: Failed to delete campaign error detected!');
      } else if (successToast > 0) {
        console.log('PASS: Campaign deleted successfully!');
      } else {
        console.log('UNCERTAIN: No clear success or error message found');
      }
    }

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'bug4-error.png'),
      fullPage: true 
    });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
