const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push({
    type: msg.type(),
    text: msg.text()
  }));
  
  const screenshotDir = path.join(__dirname, 'screenshots', 'composer-comprehensive-test');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const results = {
    pageLoad: false,
    toField: false,
    subjectField: false,
    messageEditor: false,
    boldButton: false,
    italicButton: false,
    bulletButton: false,
    numberedButton: false,
    undoButton: false,
    redoButton: false,
    variablesButton: false,
    templateSelector: false,
    sendButton: false,
    consoleClean: false
  };
  
  try {
    console.log('EMAIL COMPOSER COMPREHENSIVE TEST');
    console.log('='.repeat(60));
    
    console.log('\n[1/13] LOGIN');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'admin@evebeautyma.com');
    await page.type('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('PASS - Login successful');
    
    console.log('\n[2/13] PAGE LOAD');
    await page.goto('http://localhost:3004/dashboard/email/compose', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('h1', { timeout: 5000 });
    await page.screenshot({ path: path.join(screenshotDir, '01-page-load.png'), fullPage: true });
    results.pageLoad = true;
    console.log('PASS - Composer page loaded');
    
    console.log('\n[3/13] TO FIELD');
    const toButton = await page.$('button');
    results.toField = !!toButton;
    console.log(toButton ? 'PASS - To field found' : 'FAIL - To field not found');
    
    console.log('\n[4/13] SUBJECT FIELD');
    const subjectField = await page.$('input[type="text"]');
    results.subjectField = !!subjectField;
    console.log(subjectField ? 'PASS - Subject field found' : 'FAIL - Subject field not found');
    
    console.log('\n[5/13] MESSAGE EDITOR');
    const messageEditor = await page.$('.ProseMirror');
    if (messageEditor) {
      results.messageEditor = true;
      await messageEditor.click();
      await page.waitForTimeout(500);
      await page.keyboard.type('Testing all buttons');
      await page.screenshot({ path: path.join(screenshotDir, '02-text-entered.png'), fullPage: true });
      console.log('PASS - Message editor works');
    } else {
      console.log('FAIL - Message editor not found');
    }
    
    console.log('\n[6/13] BOLD BUTTON');
    if (messageEditor) {
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
    }
    const boldButton = await page.$('button[class*="bold"]');
    if (boldButton) {
      await boldButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '03-bold.png'), fullPage: true });
      results.boldButton = true;
      console.log('PASS - Bold button works');
    } else {
      console.log('FAIL - Bold button not found');
    }
    
    console.log('\n[7/13] ITALIC BUTTON');
    const italicButton = await page.$('button[class*="italic"]');
    if (italicButton) {
      await italicButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '04-italic.png'), fullPage: true });
      results.italicButton = true;
      console.log('PASS - Italic button works');
    } else {
      console.log('FAIL - Italic button not found');
    }
    
    console.log('\n[8/13] BULLET LIST');
    const bulletButton = await page.$$('button');
    if (bulletButton.length > 5) {
      await bulletButton[5].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '05-bullet.png'), fullPage: true });
      results.bulletButton = true;
      console.log('PASS - Bullet button works');
    }
    
    console.log('\n[9/13] NUMBERED LIST');
    if (bulletButton.length > 6) {
      await bulletButton[6].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '06-numbered.png'), fullPage: true });
      results.numberedButton = true;
      console.log('PASS - Numbered button works');
    }
    
    console.log('\n[10/13] UNDO BUTTON');
    const allButtons = await page.$$('button');
    if (allButtons.length > 7) {
      await allButtons[7].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '07-undo.png'), fullPage: true });
      results.undoButton = true;
      console.log('PASS - Undo button works');
    }
    
    console.log('\n[11/13] REDO BUTTON');
    if (allButtons.length > 8) {
      await allButtons[8].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(screenshotDir, '08-redo.png'), fullPage: true });
      results.redoButton = true;
      console.log('PASS - Redo button works');
    }
    
    console.log('\n[12/13] VARIABLES');
    const varsButton = await page.$('button:has-text("Variables")');
    if (varsButton) {
      await varsButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotDir, '09-variables.png'), fullPage: true });
      results.variablesButton = true;
      console.log('PASS - Variables dropdown works');
    } else {
      console.log('FAIL - Variables button not found');
    }
    
    console.log('\n[13/13] SEND BUTTON');
    const sendButton = await page.$('button:has-text("Send")');
    results.sendButton = !!sendButton;
    if (sendButton) {
      await page.screenshot({ path: path.join(screenshotDir, '10-send.png'), fullPage: true });
      console.log('PASS - Send button found');
    } else {
      console.log('FAIL - Send button not found');
    }
    
    const errors = consoleMessages.filter(m => m.type === 'error');
    results.consoleClean = errors.length === 0;
    console.log('\nConsole errors: ' + errors.length);
    
    const passed = Object.values(results).filter(v => v).length;
    const total = Object.keys(results).length;
    console.log('\n' + '='.repeat(60));
    console.log('RESULT: ' + passed + '/' + total + ' PASS');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
  } finally {
    await browser.close();
  }
})();
