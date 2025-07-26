// ai_prep.js
// Interactive script to combine selected files from your project

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Configuration
const BACKEND_DIR = 'server_modules';
const FRONTEND_DIR = 'src';
const ROOT_FILES = ['server.js', 'build.js'];
const OUTPUT_FILE = 'output.txt';

// File extensions by category
const EXTENSIONS = {
    html: ['.html'],
    css: ['.css'],
    js: ['.js']
};

let output = '';
let fileCount = 0;

// Utility function to ask questions
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Walk directory and collect files
function walkDir(dirPath, allowedExtensions) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            walkDir(fullPath, allowedExtensions);
        } else if (allowedExtensions.includes(path.extname(entry.name))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            output += `\n--- FILE: ${fullPath} ---\n`;
            output += content + '\n';
            fileCount++;
            console.log(`  ✅ Added: ${fullPath}`);
        }
    }
}

// Process root files
function processRootFiles() {
    console.log('\n📁 Processing root files...');
    for (const file of ROOT_FILES) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf-8');
            output += `\n--- FILE: ${file} ---\n`;
            output += content + '\n';
            fileCount++;
            console.log(`  ✅ Included: ${file}`);
        } else {
            console.warn(`  ⚠️  Not found: ${file}`);
        }
    }
}

// Process backend files
function processBackend(extensions) {
    console.log('\n🔧 Processing backend files...');
    if (fs.existsSync(BACKEND_DIR)) {
        walkDir(BACKEND_DIR, extensions);
    } else {
        console.warn(`  ⚠️  Backend directory not found: ${BACKEND_DIR}`);
    }
}

// Process frontend files
function processFrontend(extensions) {
    console.log('\n🎨 Processing frontend files...');
    if (fs.existsSync(FRONTEND_DIR)) {
        walkDir(FRONTEND_DIR, extensions);
    } else {
        console.warn(`  ⚠️  Frontend directory not found: ${FRONTEND_DIR}`);
    }
}

// Main interactive function
async function main() {
    console.log('🚀 VAPR Project File Merger\n');
    console.log('This tool will help you combine project files for AI analysis.\n');

    try {
        // Main menu
        const mainChoice = await question(
            'What would you like to merge?\n' +
            '  1) Everything (Backend + Frontend)\n' +
            '  2) Backend only (server_modules + root files)\n' +
            '  3) Frontend only (src directory)\n' +
            '  4) Custom selection\n' +
            '\nEnter your choice (1-4): '
        );

        let includeBackend = false;
        let includeFrontend = false;
        let extensions = [];

        switch (mainChoice) {
            case '1':
                includeBackend = true;
                includeFrontend = true;
                extensions = [...EXTENSIONS.html, ...EXTENSIONS.css, ...EXTENSIONS.js];
                break;

            case '2':
                includeBackend = true;
                extensions = [...EXTENSIONS.js];
                break;

            case '3':
                includeFrontend = true;
                const frontendChoice = await question(
                    '\nWhich frontend files to include?\n' +
                    '  1) All (HTML + CSS + JS)\n' +
                    '  2) HTML only\n' +
                    '  3) CSS only\n' +
                    '  4) JS only\n' +
                    '  5) HTML + CSS\n' +
                    '  6) HTML + JS\n' +
                    '  7) CSS + JS\n' +
                    '\nEnter your choice (1-7): '
                );

                switch (frontendChoice) {
                    case '1':
                        extensions = [...EXTENSIONS.html, ...EXTENSIONS.css, ...EXTENSIONS.js];
                        break;
                    case '2':
                        extensions = [...EXTENSIONS.html];
                        break;
                    case '3':
                        extensions = [...EXTENSIONS.css];
                        break;
                    case '4':
                        extensions = [...EXTENSIONS.js];
                        break;
                    case '5':
                        extensions = [...EXTENSIONS.html, ...EXTENSIONS.css];
                        break;
                    case '6':
                        extensions = [...EXTENSIONS.html, ...EXTENSIONS.js];
                        break;
                    case '7':
                        extensions = [...EXTENSIONS.css, ...EXTENSIONS.js];
                        break;
                    default:
                        console.log('Invalid choice. Including all frontend files.');
                        extensions = [...EXTENSIONS.html, ...EXTENSIONS.css, ...EXTENSIONS.js];
                }
                break;

            case '4':
                // Custom selection
                const backendChoice = await question('\nInclude backend files? (y/n): ');
                includeBackend = backendChoice.toLowerCase() === 'y';

                const frontendChoice2 = await question('Include frontend files? (y/n): ');
                includeFrontend = frontendChoice2.toLowerCase() === 'y';

                if (includeFrontend) {
                    const htmlChoice = await question('  Include HTML files? (y/n): ');
                    if (htmlChoice.toLowerCase() === 'y') extensions.push(...EXTENSIONS.html);

                    const cssChoice = await question('  Include CSS files? (y/n): ');
                    if (cssChoice.toLowerCase() === 'y') extensions.push(...EXTENSIONS.css);

                    const jsChoice = await question('  Include JS files? (y/n): ');
                    if (jsChoice.toLowerCase() === 'y') extensions.push(...EXTENSIONS.js);
                }

                if (includeBackend && !extensions.includes('.js')) {
                    extensions.push(...EXTENSIONS.js);
                }
                break;

            default:
                console.log('Invalid choice. Merging everything by default.');
                includeBackend = true;
                includeFrontend = true;
                extensions = [...EXTENSIONS.html, ...EXTENSIONS.css, ...EXTENSIONS.js];
        }

        // Show summary
        console.log('\n📋 Summary:');
        console.log(`  Backend: ${includeBackend ? '✅' : '❌'}`);
        console.log(`  Frontend: ${includeFrontend ? '✅' : '❌'}`);
        console.log(`  File types: ${extensions.join(', ')}`);

        const confirm = await question('\nProceed with merge? (y/n): ');

        if (confirm.toLowerCase() !== 'y') {
            console.log('\n❌ Operation cancelled.');
            rl.close();
            return;
        }

        // Process files based on selection
        console.log('\n🔄 Processing files...\n');

        if (includeBackend) {
            processRootFiles();
            processBackend(extensions);
        }

        if (includeFrontend) {
            processFrontend(extensions);
        }

        // Write output
        if (fileCount > 0) {
            fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
            console.log(`\n✅ Success! Combined ${fileCount} files into ${OUTPUT_FILE}`);
            console.log(`📊 Output file size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
        } else {
            console.log('\n⚠️  No files were processed.');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

// Run the script
main().catch(console.error);