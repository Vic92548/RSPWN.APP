// build.js for partners dashboard
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

async function copyDirectory(src, dest) {
    await ensureDirectoryExists(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

async function modifyHTMLForSubpath(htmlPath) {
    let content = await fs.readFile(htmlPath, 'utf8');

    // Update all absolute paths to use /downloads prefix
    content = content.replace(/src="\/assets\//g, 'src="/downloads/assets/');
    content = content.replace(/href="\/assets\//g, 'href="/downloads/assets/');
    content = content.replace(/from "\/assets\//g, 'from "/downloads/assets/');

    // Update the base path for React Router
    content = content.replace(
        '<div id="root"></div>',
        '<div id="root" data-base-path="/downloads"></div>'
    );

    await fs.writeFile(htmlPath, content);
}

async function modifyJSForSubpath(jsPath) {
    let content = await fs.readFile(jsPath, 'utf8');

    // Update API base URL to use relative paths
    content = content.replace(
        /VITE_API_URL\|\|"http:\/\/localhost:8080"/g,
        'VITE_API_URL||""'
    );

    // Update router base path
    content = content.replace(
        '<BrowserRouter>',
        '<BrowserRouter basename="/downloads">'
    );

    await fs.writeFile(jsPath, content);
}

async function main() {
    console.log('🚀 Starting downloads Dashboard build process...\n');

    const outputDir = path.join(__dirname, '..', '..', 'public', 'downloads');

    try {
        // Step 1: Build the Vite project
        console.log('📦 Building with Vite...');
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: __dirname
        });

        if (stderr && !stderr.includes('warning')) {
            console.error('Build errors:', stderr);
        }
        console.log('✅ Vite build completed\n');

        // Step 2: Ensure output directory exists
        await ensureDirectoryExists(outputDir);

        // Step 3: Copy built files to public/downloads
        console.log('📁 Copying built files...');
        const distPath = path.join(__dirname, 'dist');

        // Copy all files from dist to public/downloads
        await copyDirectory(distPath, outputDir);
        console.log('✅ Files copied to public/downloads\n');

        // Step 4: Modify index.html for subpath
        console.log('🔧 Modifying files for /partners subpath...');
        const indexPath = path.join(outputDir, 'index.html');
        await modifyHTMLForSubpath(indexPath);

        // Step 5: Find and modify the main JS file
        const files = await fs.readdir(path.join(outputDir, 'assets'));
        const mainJsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
        if (mainJsFile) {
            await modifyJSForSubpath(path.join(outputDir, 'assets', mainJsFile));
        }
        console.log('✅ Files modified for subpath\n');

        console.log('🎉 Downloads build completed successfully!');
        console.log(`📍 Files built to: ${outputDir}`);

    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run the build
main();