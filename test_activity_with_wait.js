const { chromium } = require('playwright');

const SCREENSHOT_DIR = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/testing/exhaustive-debug';

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Activity Log Test with Extended Wait\n');

  try {
    console.log('Step 1: Navigate to Activity Log');
    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'networkidle',
      timeout: 30000
    }).catch(e => console.log('Note: ' + e.message));
    
    console.log('Waiting for content to load...');
    await page.waitForTimeout(5000);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body text: ' + bodyText.substring(0, 200));
    
    const screenshotPath1 = SCREENSHOT_DIR + '/activity_log_001_loaded.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log('Screenshot: activity_log_001_loaded.png\n');

    console.log('Step 2: Check for Activity Log Elements');
    const elements = await page.evaluate(() => {
      return {
        hasActivityLogHeading: document.body.innerText.includes('Activity Log'),
        hasTable: document.querySelector('table') !== null,
        hasTableHeader: document.querySelector('thead') !== null,
        hasTableBody: document.querySelector('tbody') !== null,
        hasLoader: document.querySelector('[class*="spinner"]') !== null || document.body.innerText.includes('Loading'),
        bodyLength: document.body.innerText.length,
        hasNoActivityMessage: document.body.innerText.includes('No activity found')
      };
    });
    
    console.log('Has Activity Log heading: ' + elements.hasActivityLogHeading);
    console.log('Has table: ' + elements.hasTable);
    console.log('Has table header: ' + elements.hasTableHeader);
    console.log('Has table body: ' + elements.hasTableBody);
    console.log('Has loader: ' + elements.hasLoader);
    console.log('Body text length: ' + elements.bodyLength);
    console.log('Has "No activity" message: ' + elements.hasNoActivityMessage);
    console.log();

    // Check for API errors
    console.log('Step 3: Check Network Requests');
    const networkData = [];
    page.on('response', response => {
      if (response.url().includes('api') || response.url().includes('activities')) {
        networkData.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });

    await page.goto('http://localhost:3004/dashboard/activity-log', { 
      waitUntil: 'networkidle',
      timeout: 30000
    }).catch(e => null);
    
    await page.waitForTimeout(3000);
    
    if (networkData.length > 0) {
      console.log('API Requests:');
      networkData.forEach(req => {
        console.log('  ' + req.status + ' ' + req.url.substring(req.url.lastIndexOf('/')) + (req.ok ? ' OK' : ' FAILED'));
      });
    } else {
      console.log('No API requests captured');
    }
    console.log();

    console.log('Step 4: Check Page Structure');
    const structure = await page.evaluate(() => {
      const allText = document.body.innerText;
      return {
        hasTitle: allText.includes('Activity Log'),
        hasTable: document.querySelector('table') !== null,
        rowCount: document.querySelectorAll('tbody tr').length,
        headerText: Array.from(document.querySelectorAll('th')).map(el => el.innerText).join(' | ')
      };
    });
    
    console.log('Structure:');
    console.log('  Has title: ' + structure.hasTitle);
    console.log('  Has table: ' + structure.hasTable);
    console.log('  Row count: ' + structure.rowCount);
    console.log('  Headers: ' + (structure.headerText || 'none'));
    console.log();

    console.log('Step 5: Check Contact Links');
    const linkData = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a').forEach(el => {
        const text = el.innerText.trim();
        if (text && text.length > 0 && text.length < 50) {
          links.push(text);
        }
      });
      return { count: links.length, samples: links.slice(0, 5) };
    });
    
    console.log('Links found: ' + linkData.count);
    if (linkData.samples.length > 0) {
      console.log('Samples: ' + linkData.samples.join(', '));
    }
    console.log();

    console.log('='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('ERROR: ' + error.message);
  }

  await context.close();
  await browser.close();
}

runTests().catch(console.error);
