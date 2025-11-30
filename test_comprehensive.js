const { chromium } = require("playwright");

async function testAllPages() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }});
    const page = await context.newPage();
    
    const pages = [
        "/", "/about", "/platform", "/pricing", "/contact", "/demo",
        "/solutions/crm", "/solutions/audience-intelligence", 
        "/solutions/visitor-identification", "/solutions/campaign-activation",
        "/solutions/analytics", "/industries/restaurants",
        "/industries/home-services", "/industries/retail",
        "/industries/professional-services"
    ];
    
    console.log("Testing all pages for hot colors...");
    let successCount = 0;
    let hotColorCount = 0;
    
    for (const path of pages) {
        const url = "http://localhost:3004" + path;
        try {
            const response = await page.goto(url, { waitUntil: "networkidle" });
            const status = response ? response.status() : 0;
            
            if (status === 200) {
                successCount++;
                console.log(path + ": Status " + status);
            } else {
                console.log(path + ": Failed - Status " + status);
            }
        } catch (e) {
            console.log(path + ": Error - " + e.message);
        }
    }
    
    console.log("Summary: " + successCount + "/" + pages.length + " pages loaded");
    
    await browser.close();
}

testAllPages().catch(console.error);
