const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Step 1: Navigate to login page...');
  await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);

  console.log('Step 2: Login with credentials...');
  await page.fill('input[type="email"]', 'admin@evebeautyma.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 90000 });
  await page.waitForTimeout(2000);

  console.log('Step 3: Navigate to inbox...');
  await page.goto('http://localhost:3004/dashboard/inbox', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5000);

  console.log('Step 4: Screenshot inbox...');
  await page.screenshot({ path: 'screenshots/round2-bugfix/bug-1-explore-1-inbox.png', fullPage: true });

  console.log('Step 5: Get page HTML structure...');
  const pageStructure = await page.evaluate(() => {
    const body = document.body.innerHTML;
    
    // Look for common thread/message elements
    const divs = Array.from(document.querySelectorAll('div'));
    const clickableDivs = divs.filter(div => 
      div.onclick || 
      div.style.cursor === 'pointer' ||
      div.getAttribute('role') === 'button' ||
      div.classList.toString().toLowerCase().includes('thread') ||
      div.classList.toString().toLowerCase().includes('message') ||
      div.classList.toString().toLowerCase().includes('item')
    );
    
    return {
      totalDivs: divs.length,
      clickableDivs: clickableDivs.length,
      clickableDivInfo: clickableDivs.slice(0, 10).map(div => ({
        tag: div.tagName,
        classes: div.className,
        text: div.textContent.substring(0, 100),
        role: div.getAttribute('role'),
        cursor: div.style.cursor
      })),
      bodyPreview: body.substring(0, 2000)
    };
  });
  
  console.log('Page structure analysis:');
  console.log(JSON.stringify(pageStructure, null, 2));

  console.log('Step 6: Check for "No threads" or empty state...');
  const emptyStateCheck = await page.evaluate(() => {
    const text = document.body.textContent;
    return {
      hasNoThreadsText: text.includes('No threads') || text.includes('No messages') || text.includes('Empty'),
      hasLoadingText: text.includes('Loading') || text.includes('loading'),
      pageText: text.substring(0, 500)
    };
  });
  
  console.log('Empty state check:');
  console.log(JSON.stringify(emptyStateCheck, null, 2));

  console.log('Test complete!');
  await browser.close();
})();
