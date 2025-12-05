const { chromium } = require('playwright');

async function testLogin() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    console.log('1. Navigating to login page...');
    await page.goto('https://crm.senovallc.com/login');
    await page.waitForTimeout(2000);
    
    // Take screenshot of login page
    await page.screenshot({ 
        path: 'screenshots/production-login-test/01-login-page.png',
        fullPage: true 
    });
    console.log('   Screenshot: 01-login-page.png');
    
    console.log('2. Entering credentials...');
    await page.fill('input[type="email"]', 'jwoodcapital@gmail.com');
    await page.fill('input[type="password"]', 'D3n1w3n1!');
    
    // Take screenshot with credentials
    await page.screenshot({ 
        path: 'screenshots/production-login-test/02-credentials-entered.png',
        fullPage: true 
    });
    console.log('   Screenshot: 02-credentials-entered.png');
    
    console.log('3. Clicking Sign in button...');
    await page.click('button:has-text("Sign in")');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    // Take screenshot after login
    await page.screenshot({ 
        path: 'screenshots/production-login-test/03-after-login.png',
        fullPage: true 
    });
    console.log('   Screenshot: 03-after-login.png');
    
    // Check where we ended up
    const url = page.url();
    console.log('\nResult:');
    console.log('   Final URL:', url);
    
    if (url.includes('/dashboard')) {
        console.log('   ✅ LOGIN SUCCESSFUL - Redirected to dashboard');
    } else if (url.includes('/login')) {
        console.log('   ❌ LOGIN FAILED - Still on login page');
        
        // Check for error messages
        const errorMsg = await page.locator('.text-red-500, .text-red-600, [role="alert"]').first().textContent().catch(() => null);
        if (errorMsg) {
            console.log('   Error message:', errorMsg);
        }
    } else {
        console.log('   ⚠️ Redirected to:', url);
    }
    
    await browser.close();
}

testLogin().catch(console.error);
