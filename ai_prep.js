// ai_prep.js
// Interactive script to combine selected files from your project

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Parse command line arguments
const args = process.argv.slice(2);
const NO_CSS = args.includes('--no-css');

// Configuration
const BACKEND_DIR = 'server_modules';
const FRONTEND_DIR = 'src';
const PARTNERS_DIR = 'dashboards/partners';
const DESKTOP_DIR = 'desktop';
const ROOT_FILES = ['server.js', 'build.js', 'scripts/add-game.js','scripts/manage-games.js'];
const OUTPUT_FILE = 'output.txt';

// File extensions by category
const EXTENSIONS = {
    html: ['.html'],
    css: ['.css','.scss'],
    js: ['.js', '.jsx', '.ts', '.tsx'],
    rust: ['.rs'],
    config: ['.toml', '.json', '.conf.json'],
    desktopConfig: ['.toml', '.conf.json']  // Specific config for desktop/Tauri
};

let output = '';
let fileCount = 0;

// Utility function to ask questions
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Filter out CSS extensions if --no-css flag is set
function filterExtensions(extensions) {
    if (NO_CSS) {
        return extensions.filter(ext => !EXTENSIONS.css.includes(ext));
    }
    return extensions;
}

// Walk directory and collect files
function walkDir(dirPath, allowedExtensions) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip common directories to ignore
        if (entry.isDirectory()) {
            if (['node_modules', 'target', 'dist', '.git', 'build', '.next', 'out'].includes(entry.name)) {
                continue;
            }
            walkDir(fullPath, allowedExtensions);
        } else if (allowedExtensions.some(ext => entry.name.endsWith(ext))) {
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

// Process regular frontend files
function processRegularFrontend(extensions) {
    console.log('\n🎨 Processing regular frontend files...');
    if (fs.existsSync(FRONTEND_DIR)) {
        walkDir(FRONTEND_DIR, extensions);
    } else {
        console.warn(`  ⚠️  Frontend directory not found: ${FRONTEND_DIR}`);
    }
}

// Process partners dashboard files
function processPartnersFrontend(extensions) {
    console.log('\n👥 Processing partners dashboard files...');
    if (fs.existsSync(PARTNERS_DIR)) {
        walkDir(PARTNERS_DIR, extensions);
    } else {
        console.warn(`  ⚠️  Partners dashboard directory not found: ${PARTNERS_DIR}`);
    }
}

// Process desktop (Tauri) files
function processDesktop(extensions) {
    console.log('\n🖥️  Processing desktop (Tauri) files...');
    if (fs.existsSync(DESKTOP_DIR)) {
        walkDir(DESKTOP_DIR, extensions);
    } else {
        console.warn(`  ⚠️  Desktop directory not found: ${DESKTOP_DIR}`);
    }
}

// Get frontend file extensions based on user choice
async function getFrontendExtensions() {
    const frontendChoice = await question(
        '\nWhich frontend files to include?\n' +
        '  1) All (HTML + CSS + JS/TS)\n' +
        '  2) HTML only\n' +
        (NO_CSS ? '' : '  3) CSS/SCSS only\n') +
        '  4) JS/TS only\n' +
        (NO_CSS ? '' : '  5) HTML + CSS/SCSS\n') +
        '  6) HTML + JS/TS\n' +
        (NO_CSS ? '' : '  7) CSS/SCSS + JS/TS\n') +
        '\nEnter your choice: '
    );

    let extensions = [];
    switch (frontendChoice) {
        case '1':
            extensions = [...EXTENSIONS.html, ...EXTENSIONS.css, ...EXTENSIONS.js];
            break;
        case '2':
            extensions = [...EXTENSIONS.html];
            break;
        case '3':
            if (!NO_CSS) {
                extensions = [...EXTENSIONS.css];
            } else {
                console.log('Invalid choice with --no-css flag. Defaulting to JS/TS.');
                extensions = [...EXTENSIONS.js];
            }
            break;
        case '4':
            extensions = [...EXTENSIONS.js];
            break;
        case '5':
            if (!NO_CSS) {
                extensions = [...EXTENSIONS.html, ...EXTENSIONS.css];
            } else {
                console.log('Invalid choice with --no-css flag. Defaulting to HTML + JS/TS.');
                extensions = [...EXTENSIONS.html, ...EXTENSIONS.js];
            }
            break;
        case '6':
            extensions = [...EXTENSIONS.html, ...EXTENSIONS.js];
            break;
        case '7':
            if (!NO_CSS) {
                extensions = [...EXTENSIONS.css, ...EXTENSIONS.js];
            } else {
                console.log('Invalid choice with --no-css flag. Defaulting to JS/TS.');
                extensions = [...EXTENSIONS.js];
            }
            break;
        default:
            console.log('Invalid choice. Including all frontend files.');
            extensions = [...EXTENSIONS.html, ...EXTENSIONS.css, ...EXTENSIONS.js];
    }
    return extensions;
}

// Main interactive function
async function main() {
    console.log('🚀 VAPR Project File Merger\n');
    console.log('This tool will help you combine project files for AI analysis.\n');

    if (NO_CSS) {
        console.log('🎨 --no-css flag detected: CSS/SCSS files will be skipped\n');
    }

    try {
        // Step 1: Choose frontend
        const frontendTypeChoice = await question(
            'Step 1: Which frontend would you like to include?\n' +
            '  1) Regular frontend (src directory)\n' +
            '  2) Partners dashboard (dashboards/partners)\n' +
            '  3) Both frontends\n' +
            '  4) No frontend\n' +
            '\nEnter your choice (1-4): '
        );

        let includeRegularFrontend = false;
        let includePartnersFrontend = false;
        let frontendExtensions = [];

        switch (frontendTypeChoice) {
            case '1':
                includeRegularFrontend = true;
                frontendExtensions = await getFrontendExtensions();
                break;
            case '2':
                includePartnersFrontend = true;
                frontendExtensions = await getFrontendExtensions();
                break;
            case '3':
                includeRegularFrontend = true;
                includePartnersFrontend = true;
                frontendExtensions = await getFrontendExtensions();
                break;
            case '4':
                // No frontend selected
                break;
            default:
                console.log('Invalid choice. Skipping frontend.');
        }

        // Step 2: Choose backend
        const backendChoice = await question(
            '\nStep 2: Include backend files (server_modules + root files)? (y/n): '
        );
        const includeBackend = backendChoice.toLowerCase() === 'y';

        // Step 3: Choose desktop
        const desktopChoice = await question(
            '\nStep 3: Include desktop app (Tauri) files? (y/n): '
        );
        const includeDesktop = desktopChoice.toLowerCase() === 'y';

        // Collect all extensions needed
        let allExtensions = [...frontendExtensions];

        if (includeBackend) {
            allExtensions.push(...EXTENSIONS.js);
        }

        if (includeDesktop) {
            const desktopFileChoice = await question(
                '\nWhich desktop files to include?\n' +
                '  1) All (Rust + JS/TS + Config)\n' +
                '  2) Rust files only\n' +
                '  3) JS/TS files only\n' +
                '  4) Config files only (TOML + .conf.json)\n' +
                '  5) Rust + Config\n' +
                '  6) JS/TS + Config\n' +
                '\nEnter your choice (1-6): '
            );

            switch (desktopFileChoice) {
                case '1':
                    allExtensions.push(...EXTENSIONS.rust, ...EXTENSIONS.js, ...EXTENSIONS.desktopConfig);
                    break;
                case '2':
                    allExtensions.push(...EXTENSIONS.rust);
                    break;
                case '3':
                    allExtensions.push(...EXTENSIONS.js);
                    break;
                case '4':
                    allExtensions.push(...EXTENSIONS.desktopConfig);
                    break;
                case '5':
                    allExtensions.push(...EXTENSIONS.rust, ...EXTENSIONS.desktopConfig);
                    break;
                case '6':
                    allExtensions.push(...EXTENSIONS.js, ...EXTENSIONS.desktopConfig);
                    break;
                default:
                    console.log('Invalid choice. Including all desktop files.');
                    allExtensions.push(...EXTENSIONS.rust, ...EXTENSIONS.js, ...EXTENSIONS.desktopConfig);
            }
        }

        // Remove duplicates and apply --no-css filter
        allExtensions = [...new Set(allExtensions)];
        allExtensions = filterExtensions(allExtensions);

        // Show summary
        console.log('\n📋 Summary:');
        console.log(`  Regular Frontend: ${includeRegularFrontend ? '✅' : '❌'}`);
        console.log(`  Partners Frontend: ${includePartnersFrontend ? '✅' : '❌'}`);
        console.log(`  Backend: ${includeBackend ? '✅' : '❌'}`);
        console.log(`  Desktop: ${includeDesktop ? '✅' : '❌'}`);
        console.log(`  File types: ${allExtensions.join(', ')}`);
        if (NO_CSS) {
            console.log(`  CSS/SCSS: ❌ (excluded by --no-css flag)`);
        }

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
            processBackend(allExtensions);
        }

        if (includeRegularFrontend) {
            processRegularFrontend(frontendExtensions);
        }

        if (includePartnersFrontend) {
            processPartnersFrontend(frontendExtensions);
        }

        if (includeDesktop) {
            // For desktop, we use the desktop-specific extensions
            const desktopExtensions = allExtensions.filter(ext =>
                EXTENSIONS.rust.includes(ext) ||
                EXTENSIONS.js.includes(ext) ||
                EXTENSIONS.desktopConfig.includes(ext)
            );
            processDesktop(desktopExtensions);
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