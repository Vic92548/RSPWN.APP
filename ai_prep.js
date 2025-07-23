// ai_prep.js
// Combines all .html, .css, and .js files from 'deno_modules' and 'src' into one big text file.
// Also includes server.js from the root directory.

const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['deno_modules', 'src'];
const ROOT_FILES = ['server.js','build.js'];
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

// Process root files first
for (const file of ROOT_FILES) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        output += `\n--- FILE: ${file} ---\n`;
        output += content + '\n';
        console.log(`✅ Included root file: ${file}`);
    } else {
        console.warn(`Root file not found: ${file}`);
    }
}

// Process directories
for (const dir of TARGET_DIRS) {
    if (fs.existsSync(dir)) {
        walkDir(dir);
    } else {
        console.warn(`Directory not found: ${dir}`);
    }
}

fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
console.log(`✅ Combined content written to ${OUTPUT_FILE}`);