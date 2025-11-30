const fs = require('fs');
const path = require('path');

function fixCurlyQuotesInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Replace all types of curly quotes
        content = content
            .replace(/'/g, "'")  // Left single curly quote
            .replace(/'/g, "'")  // Right single curly quote
            .replace(/"/g, '"')  // Left double curly quote
            .replace(/"/g, '"'); // Right double curly quote

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let fixedCount = 0;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            fixedCount += processDirectory(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            if (fixCurlyQuotesInFile(fullPath)) {
                console.log(`✓ Fixed: ${path.relative(baseDir, fullPath)}`);
                fixedCount++;
            }
        }
    }

    return fixedCount;
}

const baseDir = 'C:/Users/jwood/Documents/Projects/claude-code-agents-wizard-v2/context-engineering-intro/frontend/src/app/(website)';

console.log('Fixing curly quotes in all website files...\n');
const fixedCount = processDirectory(baseDir);
console.log(`\n✅ Fixed curly quotes in ${fixedCount} files`);