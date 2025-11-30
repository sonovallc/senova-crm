const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const pages = [
    { name: "homepage", path: "/" },
    { name: "platform", path: "/platform" },
    { name: "pricing", path: "/pricing" },
    { name: "demo", path: "/demo" },
    { name: "about", path: "/about" },
    { name: "contact", path: "/contact" },
    { name: "solutions-crm", path: "/solutions/crm" },
    { name: "solutions-analytics", path: "/solutions/analytics" }
  ];
  
  console.log("Starting HOT COLOR VERIFICATION");
  console.log("Testing site at: http://localhost:3004");
  console.log("================================");
  
  for (const pageInfo of pages) {
    try {
      console.log(`Testing ${pageInfo.name} at ${pageInfo.path}...`);
      
      await page.goto(`http://localhost:3004${pageInfo.path}`, { 
        waitUntil: "networkidle",
        timeout: 30000 
      });
      
      await page.waitForTimeout(2000);
      
      const screenshotPath = `C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/hot-color-verification/${pageInfo.name}-full.png`;
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      console.log(`Screenshot saved: ${pageInfo.name}-full.png`);
      
      const viewportPath = `C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/screenshots/hot-color-verification/${pageInfo.name}-viewport.png`;
      await page.screenshot({ 
        path: viewportPath,
        fullPage: false 
      });
      console.log(`Viewport screenshot saved: ${pageInfo.name}-viewport.png`);
      
    } catch (error) {
      console.error(`ERROR on ${pageInfo.name}: ${error.message}`);
    }
  }
  
  console.log("All screenshots captured!");
  console.log("Screenshots saved to: C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\screenshots\hot-color-verification\\");
  
  await browser.close();
})();
