// build-all.js - Builds both the main app and partners dashboard
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runBuild(name, command, cwd = __dirname) {
    console.log(`\n🔨 Building ${name}...`);
    try {
        const { stdout, stderr } = await execAsync(command, { cwd });
        if (stdout) console.log(stdout);
        if (stderr && !stderr.includes('warning')) console.error(stderr);
        console.log(`✅ ${name} build completed`);
    } catch (error) {
        console.error(`❌ ${name} build failed:`, error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting full build process...\n');

    try {
        // Build main app
        await runBuild('Main App', 'node build.js');

        // Build partners dashboard
        const partnersDir = path.join(__dirname, 'dashboards', 'partners');

        // First install dependencies if needed
        console.log('\n📦 Installing Partners Dashboard dependencies...');
        await runBuild('Partners Dependencies', 'npm install', partnersDir);

        // Then build
        await runBuild('Partners Dashboard', 'npm run build:prod', partnersDir);

        console.log('\n🎉 All builds completed successfully!');
        console.log('📁 Main app built to: ./public');
        console.log('📁 Partners dashboard built to: ./public/partners');

    } catch (error) {
        console.error('\n❌ Build process failed:', error);
        process.exit(1);
    }
}

// Run the build
main();