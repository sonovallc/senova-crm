const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.setDefaultTimeout(90000);
  
  const timestamp = Date.now();
  const screenshotDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots';
  
  console.log('=== TEST 1: CONTACT CREATION (v3) ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    console.log('Step 1: Login...');
    await page.goto('http://localhost:3004/login');
    await page.fill('input[type="email"]', 'admin@evebeautyma.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotDir + '/test1_v3_01_dashboard.png', fullPage: true });
    console.log('✓ Login successful');
    
    console.log('Step 2: Navigate to Contacts...');
    await page.click('text=Contacts');
    await page.waitForURL('**/contacts', { timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotDir + '/test1_v3_02_contacts.png', fullPage: true });
    console.log('✓ Navigated to Contacts');
    
    console.log('Step 3: Open Add Contact Form...');
    await page.click('button:has-text("Add Contact")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: screenshotDir + '/test1_v3_03_form.png', fullPage: true });
    console.log('✓ Form opened');
    
    console.log('Step 4: Fill Form...');
    const testEmail = 'test_automated_v3_' + timestamp + '@test.com';
    
    await page.fill('input[name="first_name"]', 'TestContact');
    await page.fill('input[name="last_name"]', 'AutomatedV3');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="company"]', 'Test Company V3');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotDir + '/test1_v3_04_filled.png', fullPage: true });
    console.log('✓ Form filled');
    console.log('Test Email:', testEmail);
    
    console.log('Step 5: Check for Test ID and Submit...');
    
    const submitButtonWithTestId = await page.$('[data-testid="contact-form-submit"]');
    
    if (submitButtonWithTestId) {
      console.log('✓ Found button with data-testid="contact-form-submit"');
      await submitButtonWithTestId.click();
      console.log('✓ Clicked submit button via test ID');
    } else {
      console.log('✗ Button with data-testid="contact-form-submit" NOT FOUND');
      console.log('Attempting fallback: scrolling to bottom and clicking Create button...');
      
      await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          modal.scrollTop = modal.scrollHeight;
        }
      });
      await page.waitForTimeout(1000);
      
      const createButton = await page.$('button[type="submit"]:has-text("Create")');
      if (createButton) {
        await createButton.click();
        console.log('✓ Clicked Create button via fallback');
      } else {
        throw new Error('Could not find submit button via test ID or fallback method');
      }
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: screenshotDir + '/test1_v3_05_submitted.png', fullPage: true });
    console.log('✓ Form submitted');
    
    console.log('Step 6: Verify...');
    
    const successToast = await page.$('text=/created successfully/i');
    const contactInList = await page.$('text=' + testEmail);
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotDir + '/test1_v3_06_verified.png', fullPage: true });
    
    if (successToast || contactInList) {
      console.log('✓ Contact creation verified');
      console.log('=== TEST RESULT: PASS ===');
      console.log('Test ID Found:', submitButtonWithTestId ? 'YES' : 'NO');
      console.log('Contact Email:', testEmail);
    } else {
      console.log('✗ Could not verify contact creation');
      console.log('=== TEST RESULT: FAIL ===');
      console.log('Reason: No success confirmation found');
    }
    
  } catch (error) {
    console.error('✗ TEST FAILED');
    console.error('Error:', error.message);
    await page.screenshot({ path: screenshotDir + '/test1_v3_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
