const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function fixCurlyQuotes() {
    console.log('Fixing curly quotes in website TSX files...\n');

    // Find all TSX files in the website section
    const pattern = 'context-engineering-intro/frontend/src/app/(website)/**/*.tsx';
    const files = await glob(pattern, { windowsPathsNoEscape: true });

    console.log(`Found ${files.length} TSX files to check\n`);

    let fixedCount = 0;

    for (const file of files) {
        try {
            let content = fs.readFileSync(file, 'utf8');
            const originalContent = content;

            // Replace curly quotes with straight quotes
            content = content
                .replace(/'/g, "'")  // Left single curly quote
                .replace(/'/g, "'")  // Right single curly quote
                .replace(/"/g, '"')  // Left double curly quote
                .replace(/"/g, '"'); // Right double curly quote

            if (content !== originalContent) {
                fs.writeFileSync(file, content, 'utf8');
                fixedCount++;
                console.log(`✓ Fixed: ${path.basename(file)}`);
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }

    console.log(`\n✅ Fixed curly quotes in ${fixedCount} files`);
}

fixCurlyQuotes().catch(console.error);