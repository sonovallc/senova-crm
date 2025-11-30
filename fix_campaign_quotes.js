const fs = require('fs');

const filePath = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/frontend/src/app/(website)/solutions/campaign-activation/page.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Replace all curly quotes
content = content
    .replace(/'/g, "'")  // Left single curly quote
    .replace(/'/g, "'")  // Right single curly quote
    .replace(/"/g, '"')  // Left double curly quote
    .replace(/"/g, '"'); // Right double curly quote

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed all curly quotes in campaign-activation page');