// ai_prep.js
// Combines all .html, .css, and .js files from 'deno_modules' and 'src' into one big text file.

const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['deno_modules', 'src'];
const OUTPUT_FILE = 'output.txt';
const ALLOWED_EXTENSIONS = ['.html', '.css', '.js'];

let output = '';

function walkDir(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath);
        } else if (ALLOWED_EXTENSIONS.includes(path.extname(entry.name))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            output += `\n--- FILE: ${fullPath} ---\n`;
            output += content + '\n';
        }
    }
}

for (const dir of TARGET_DIRS) {
    if (fs.existsSync(dir)) {
        walkDir(dir);
    } else {
        console.warn(`Directory not found: ${dir}`);
    }
}

fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
console.log(`✅ Combined content written to ${OUTPUT_FILE}`);
