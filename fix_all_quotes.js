const fs = require('fs');
const path = require('path');

const dir = 'context-engineering-intro/frontend/src/app/(website)/solutions/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let totalFixed = 0;
const results = [];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Replace all curly quotes
  content = content.replace(/'/g, "'");
  content = content.replace(/'/g, "'");  
  content = content.replace(/"/g, '"');
  content = content.replace(/"/g, '"');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const count = (original.match(/[''""]/g) || []).length;
    results.push({file, count});
    totalFixed += count;
  }
});

if (results.length > 0) {
  console.log('Files fixed:');
  results.forEach(r => console.log(`  ${r.file}: ${r.count} replacements`));
  console.log(`\nTotal: ${totalFixed} curly quotes fixed`);
} else {
  console.log('No curly quotes found in any files');
}
