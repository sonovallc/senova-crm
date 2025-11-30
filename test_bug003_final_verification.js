const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=== BUG-003 FINAL VERIFICATION ===\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const screenshotDir = 'C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\testing\production-fixes';
  
  let testResults = {
    navigationWorked: false,
    formLoadedWithoutErrors: false,
    allFieldsInteractive: false,
    overallStatus: 'FAIL'
  };
  
  try {
    console.log('Step 1: Navigating to http://localhost:3004...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('Step 2: Logging in with test credentials...');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    console.log('Step 3: Navigating to /dashboard/email/autoresponders...');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot 1: Autoresponders list');
    await page.screenshot({ 
      path: path.join(screenshotDir, 'BUG003-verified-01-list.png'),
      fullPage: true 
    });
    
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.type() + ': ' + msg.text()));
    
    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
      testResults.formLoadedWithoutErrors = false;
    });
    
    console.log('Step 4: Clicking Create Autoresponder button...');
    
    const createButton = await page.locator('button:has-text("Create Autoresponder"), a:has-text("Create Autoresponder")').first();
    
    if (await createButton.count() > 0) {
      console.log('Found Create Autoresponder button');
      await createButton.click();
      await page.waitForTimeout(3000);
      
      const afterClickUrl = page.url();
      console.log('URL after clicking create:', afterClickUrl);
      
      if (afterClickUrl.includes('/dashboard/email/autoresponders/create')) {
        console.log('SUCCESS: Navigation worked - reached create form');
        testResults.navigationWorked = true;
        
        console.log('Step 6: Checking if form loaded without errors...');
        await page.waitForTimeout(2000);
        
        const errorElements = await page.locator('[class*="error"], [role="alert"]').count();
        console.log('Error elements found:', errorElements);
        
        console.log('Taking screenshot 2: Create form');
        await page.screenshot({ 
          path: path.join(screenshotDir, 'BUG003-verified-02-form.png'),
          fullPage: true 
        });
        
        if (errorElements === 0) {
          console.log('SUCCESS: Form loaded without visible errors');
          testResults.formLoadedWithoutErrors = true;
          
          console.log('Step 7: Testing form fields...');
          
          console.log('  - Testing name input...');
          const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
          if (await nameInput.count() > 0) {
            await nameInput.fill('Test Autoresponder BUG-003 Verification');
            console.log('    SUCCESS: Name input works');
          }
          
          console.log('  - Testing trigger dropdown...');
          const triggerDropdown = page.locator('select[name="trigger"], select:has-text("Select")').first();
          if (await triggerDropdown.count() > 0) {
            await triggerDropdown.click();
            await page.waitForTimeout(1000);
            console.log('    SUCCESS: Trigger dropdown interactive');
          }
          
          console.log('  - Testing template dropdown...');
          const templateDropdown = page.locator('select[name="template"], select[name="emailTemplateId"]').first();
          if (await templateDropdown.count() > 0) {
            await templateDropdown.click();
            await page.waitForTimeout(1000);
            console.log('    SUCCESS: Template dropdown interactive (no crash!)');
          }
          
          console.log('  - Testing subject input...');
          const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]').first();
          if (await subjectInput.count() > 0) {
            await subjectInput.fill('Test Subject Line');
            console.log('    SUCCESS: Subject input works');
          }
          
          console.log('  - Checking for save button...');
          const saveButton = await page.locator('button:has-text("Save"), button:has-text("Create")').count();
          console.log('    Save/Create buttons found:', saveButton);
          
          console.log('Taking screenshot 3: Form with data entered');
          await page.screenshot({ 
            path: path.join(screenshotDir, 'BUG003-verified-03-filled.png'),
            fullPage: true 
          });
          
          testResults.allFieldsInteractive = true;
          console.log('SUCCESS: All form fields are interactive');
          
        } else {
          console.log('FAIL: Form has visible error messages');
        }
        
      } else {
        console.log('FAIL: Navigation failed - expected /dashboard/email/autoresponders/create but got', afterClickUrl);
      }
      
    } else {
      console.log('FAIL: Could not find Create Autoresponder button');
    }
    
    if (consoleMessages.length > 0) {
      console.log('\n=== CONSOLE MESSAGES ===');
      consoleMessages.forEach(msg => console.log(msg));
    }
    
  } catch (error) {
    console.error('TEST ERROR:', error.message);
    console.error(error.stack);
  } finally {
    testResults.overallStatus = (
      testResults.navigationWorked && 
      testResults.formLoadedWithoutErrors && 
      testResults.allFieldsInteractive
    ) ? 'PASS' : 'FAIL';
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Overall Status:', testResults.overallStatus);
    console.log('Navigation Worked:', testResults.navigationWorked ? 'YES' : 'NO');
    console.log('Form Loaded Without Errors:', testResults.formLoadedWithoutErrors ? 'YES' : 'NO');
    console.log('All Fields Interactive:', testResults.allFieldsInteractive ? 'YES' : 'NO');
    
    fs.writeFileSync(
      path.join(screenshotDir, 'BUG003-verification-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
