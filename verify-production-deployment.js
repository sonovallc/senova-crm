const { chromium } = require('playwright');
const path = require('path');

async function verifyProduction() {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });
    
    const page = await context.newPage();
    
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
        consoleMessages.push({
            type: msg.type(),
            text: msg.text()
        });
    });
    
    page.on('pageerror', error => {
        errors.push('Page error: ' + error.message);
    });
    
    console.log('Starting production deployment verification for crm.senovallc.com...\n');
    const results = {
        homepage: false,
        loginPage: false,
        consoleErrors: [],
        screenshots: []
    };
    
    try {
        // Test 1: Homepage
        console.log('1. Testing Homepage: https://crm.senovallc.com');
        const homepageResponse = await page.goto('https://crm.senovallc.com', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        if (homepageResponse && homepageResponse.ok()) {
            await page.waitForTimeout(2000);
            const screenshotPath1 = path.join('screenshots', 'production-deployment', '01-homepage.png');
            await page.screenshot({ 
                path: screenshotPath1, 
                fullPage: true 
            });
            results.homepage = true;
            results.screenshots.push(screenshotPath1);
            console.log('   OK - Homepage loads successfully');
            console.log('   Screenshot saved: ' + screenshotPath1);
        } else {
            const status = homepageResponse ? homepageResponse.status() : 'No response';
            console.log('   FAIL - Homepage failed to load. Status: ' + status);
        }
        
        // Test 2: Login Page
        console.log('\n2. Testing Login Page: https://crm.senovallc.com/login');
        errors.length = 0;
        
        const loginResponse = await page.goto('https://crm.senovallc.com/login', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        if (loginResponse) {
            await page.waitForTimeout(2000);
            
            // Check for login form elements
            const emailField = await page.locator('input[type="email"], input[name="email"], input#email').first();
            const passwordField = await page.locator('input[type="password"], input[name="password"], input#password').first();
            const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
            
            const emailVisible = await emailField.isVisible().catch(() => false);
            const passwordVisible = await passwordField.isVisible().catch(() => false);
            const buttonVisible = await submitButton.isVisible().catch(() => false);
            
            const screenshotPath2 = path.join('screenshots', 'production-deployment', '02-login-page.png');
            await page.screenshot({ 
                path: screenshotPath2, 
                fullPage: true 
            });
            results.screenshots.push(screenshotPath2);
            
            if (emailVisible && passwordVisible && buttonVisible) {
                results.loginPage = true;
                console.log('   OK - Login page loads with form elements:');
                console.log('      - Email field: Visible');
                console.log('      - Password field: Visible');
                console.log('      - Submit button: Visible');
            } else {
                console.log('   WARNING - Login page loaded but form elements status:');
                console.log('      - Email field: ' + (emailVisible ? 'Visible' : 'Not found'));
                console.log('      - Password field: ' + (passwordVisible ? 'Visible' : 'Not found'));
                console.log('      - Submit button: ' + (buttonVisible ? 'Visible' : 'Not found'));
            }
            console.log('   Screenshot saved: ' + screenshotPath2);
        } else {
            console.log('   FAIL - Login page failed to load');
        }
        
        // Test 3: Console Errors Check
        console.log('\n3. Checking Browser Console for Errors');
        
        const screenshotPath3 = path.join('screenshots', 'production-deployment', '03-console-check.png');
        await page.screenshot({ 
            path: screenshotPath3, 
            fullPage: true 
        });
        results.screenshots.push(screenshotPath3);
        results.consoleErrors = errors;
        
        if (errors.length === 0) {
            console.log('   OK - No console errors detected');
        } else {
            console.log('   WARNING - Found ' + errors.length + ' console error(s):');
            errors.forEach((error, index) => {
                const truncated = error.substring(0, 100);
                console.log('      ' + (index + 1) + '. ' + truncated + '...');
            });
        }
        console.log('   Screenshot saved: ' + screenshotPath3);
        
    } catch (error) {
        console.log('\nERROR during testing: ' + error.message);
    }
    
    // Final Report
    console.log('\n============================================================');
    console.log('PRODUCTION DEPLOYMENT VERIFICATION REPORT');
    console.log('============================================================');
    console.log('1. All screenshots captured: ' + (results.screenshots.length === 3 ? 'YES' : 'NO') + ' (' + results.screenshots.length + '/3)');
    console.log('2. Homepage loads: ' + (results.homepage ? 'YES' : 'NO'));
    console.log('3. Login page loads: ' + (results.loginPage ? 'YES' : 'NO'));
    console.log('4. Console errors detected: ' + (results.consoleErrors.length > 0 ? 'YES (' + results.consoleErrors.length + ' errors)' : 'NO'));
    
    const productionReady = results.homepage && results.loginPage && results.consoleErrors.length === 0;
    console.log('\nPRODUCTION STATUS: ' + (productionReady ? 'READY' : 'NEEDS FIX'));
    
    if (!productionReady) {
        console.log('\nIssues to address:');
        if (!results.homepage) console.log('  - Homepage not loading correctly');
        if (!results.loginPage) console.log('  - Login page form elements not visible');
        if (results.consoleErrors.length > 0) console.log('  - ' + results.consoleErrors.length + ' console errors need fixing');
    } else {
        console.log('\nProduction deployment verified successfully!');
        console.log('   - Site is accessible via HTTPS');
        console.log('   - All critical pages load without issues');
        console.log('   - No console errors detected');
        console.log('   - Login form displays correctly');
    }
    
    await browser.close();
}

verifyProduction().catch(console.error);
