const { chromium } = require('playwright');

async function verifyHotColorDesign() {
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });
    
    const page = await context.newPage();
    
    console.log('Starting Hot Color Design Verification...\n');
    
    // Test home page first
    console.log('Testing: http://localhost:3004/');
    try {
        const response = await page.goto('http://localhost:3004/', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        console.log('  Status:', response ? response.status() : 'unknown');
        
        await page.waitForTimeout(2000);
        
        // Take screenshot
        await page.screenshot({ 
            path: 'screenshots/hot-color-verification/home-full.png',
            fullPage: true
        });
        console.log('  Home page screenshot saved');
        
        // Header close-up
        const header = await page.$('nav');
        if (header) {
            await header.screenshot({ 
                path: 'screenshots/hot-color-verification/header-closeup.png'
            });
            console.log('  Header close-up saved');
        }
        
    } catch (error) {
        console.error('  Error:', error.message);
    }
    
    // Test other pages
    const pages = [
        '/pricing',
        '/contact', 
        '/solutions/crm',
        '/industries/restaurants'
    ];
    
    for (const pagePath of pages) {
        const url = 'http://localhost:3004' + pagePath;
        console.log('\nTesting:', url);
        
        try {
            const response = await page.goto(url, { 
                waitUntil: 'networkidle',
                timeout: 30000 
            });
            
            console.log('  Status:', response ? response.status() : 'unknown');
            
            await page.waitForTimeout(2000);
            
            const name = pagePath.replace(/\//g, '-').slice(1);
            await page.screenshot({ 
                path: 'screenshots/hot-color-verification/' + name + '.png'
            });
            console.log('  Screenshot saved:', name + '.png');
            
        } catch (error) {
            console.error('  Error:', error.message);
        }
    }
    
    await browser.close();
    console.log('\nVerification complete!');
}

verifyHotColorDesign().catch(console.error);
