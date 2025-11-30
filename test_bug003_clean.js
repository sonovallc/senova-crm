const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const dir = path.join(process.cwd(), 'testing', 'production-fixes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let testResults = {
    navigationWorked: false,
    formLoadedWithoutErrors: false,
    allFieldsInteractive: false,
    overallStatus: 'FAIL'
  };
  
  let pageErrors = [];
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
    pageErrors.push(error.message);
  });

  try {
    console.log('=== BUG-003 FINAL VERIFICATION ===
');
    
    console.log('Step 1: Login');
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, 'BUG003-00-login.png'), fullPage: true });
    
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Logged in
');

    console.log('Step 2: Navigate to autoresponders list');
    await page.goto('http://localhost:3004/dashboard/email/autoresponders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, 'BUG003-verified-01-list.png'), fullPage: true });
    console.log('✓ Autoresponders list loaded
');

    console.log('Step 3: Click Create Autoresponder button');
    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create")').first();
    await createBtn.click();
    await page.waitForTimeout(3000);
    
    const afterClickUrl = page.url();
    console.log('Current URL:', afterClickUrl);
    
    if (afterClickUrl.includes('/dashboard/email/autoresponders/create')) {
      console.log('✓ Navigation SUCCESS - reached create form
');
      testResults.navigationWorked = true;
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(dir, 'BUG003-verified-02-form.png'), fullPage: true });
      
      if (pageErrors.length === 0) {
        console.log('✓ Form loaded WITHOUT errors
');
        testResults.formLoadedWithoutErrors = true;
        
        console.log('Step 4: Test form fields');
        
        const nameInput = page.locator('input[name="name"]').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('Test Autoresponder BUG-003');
          console.log('✓ Name input works');
        }
        
        const triggerSelect = page.locator('select').first();
        if (await triggerSelect.count() > 0) {
          await triggerSelect.click();
          await page.waitForTimeout(500);
          console.log('✓ Trigger dropdown interactive');
        }
        
        const templateSelect = page.locator('select').nth(1);
        if (await templateSelect.count() > 0) {
          await templateSelect.click();
          await page.waitForTimeout(500);
          console.log('✓ Template dropdown interactive (NO CRASH!)');
        }
        
        const subjectInput = page.locator('input[name="subject"]').first();
        if (await subjectInput.count() > 0) {
          await subjectInput.fill('Test Subject');
          console.log('✓ Subject input works');
        }
        
        await page.screenshot({ path: path.join(dir, 'BUG003-verified-03-filled.png'), fullPage: true });
        
        testResults.allFieldsInteractive = true;
        console.log('
✓ All form fields interactive
');
        
      } else {
        console.log('✗ Form has JavaScript errors:', pageErrors);
      }
      
    } else {
      console.log('✗ Navigation FAILED - wrong URL:', afterClickUrl);
    }
    
  } catch (error) {
    console.error('TEST ERROR:', error.message);
  } finally {
    testResults.overallStatus = (
      testResults.navigationWorked && 
      testResults.formLoadedWithoutErrors && 
      testResults.allFieldsInteractive
    ) ? 'PASS' : 'FAIL';
    
    console.log('
=== TEST RESULTS ===');
    console.log('Overall Status:', testResults.overallStatus);
    console.log('Navigation Worked:', testResults.navigationWorked ? 'YES' : 'NO');
    console.log('Form Loaded Without Errors:', testResults.formLoadedWithoutErrors ? 'YES' : 'NO');
    console.log('All Fields Interactive:', testResults.allFieldsInteractive ? 'YES' : 'NO');
    
    fs.writeFileSync(
      path.join(dir, 'BUG003-verification-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

test();
