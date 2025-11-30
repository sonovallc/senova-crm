const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const dir = path.join(process.cwd(), 'screenshots', 'campaigns-complete');
  if (\!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const r = { list: [], s1: [], s2: [], s3: [], add: [], err: [] };
  page.on('console', m => { if (m.type() === 'error') r.err.push(m.text()); });
