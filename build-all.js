// build-all.js - Legacy build script (now just runs main app build)
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runBuild(name, command) {
    console.log(`\n🔨 Building ${name}...`);
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log(stdout);
        if (stderr && !stderr.includes('warning')) console.error(stderr);
        console.log(`✅ ${name} build completed`);
    } catch (error) {
        console.error(`❌ ${name} build failed:`, error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting build process...\n');

    try {
        // Build main app
        await runBuild('Main App', 'node build.js');
        console.log('📁 Main app built to: ./public');
        console.log('\n🎉 Build process completed!');
    } catch (error) {
        console.error('\n❌ Build process failed:', error);
        process.exit(1);
    }
}

// Show help if requested
if (process.argv.includes('--help')) {
    console.log(`
Build All - VAPR Project Builder (Legacy)

Usage: node build-all.js

This script now simply builds the main app (equivalent to 'node build.js').
Dashboard functionality has been removed.

Examples:
  node build-all.js    # Build main app
  node build.js        # Same as above (recommended)
    `);
    process.exit(0);
}

// Run the build
main();