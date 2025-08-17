// build-all.js - Builds both the main app and all dashboard frontends
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for all dashboards
const DASHBOARDS = ['partners', 'store', 'creators'];

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

async function dashboardExists(dashboardName) {
    const dashboardDir = path.join(__dirname, 'dashboards', dashboardName);
    try {
        await fs.promises.access(dashboardDir, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function buildDashboard(dashboardName) {
    const dashboardDir = path.join(__dirname, 'dashboards', dashboardName);

    // Check if dashboard directory exists
    if (!await dashboardExists(dashboardName)) {
        console.log(`⚠️  Skipping ${dashboardName} dashboard - directory not found`);
        return false;
    }

    try {
        // First install dependencies if needed
        console.log(`\n📦 Installing ${dashboardName} dashboard dependencies...`);
        await runBuild(`${dashboardName} Dependencies`, 'npm install', dashboardDir);

        // Then build
        await runBuild(`${dashboardName} Dashboard`, 'npm run build:prod', dashboardDir);

        console.log(`📁 ${dashboardName} dashboard built to: ./public/${dashboardName}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to build ${dashboardName} dashboard:`, error);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting full build process...\n');

    const args = process.argv.slice(2);
    const skipDashboards = args.includes('--skip-dashboards');
    const onlyDashboards = args.includes('--only-dashboards');
    const specificDashboards = args.filter(arg => DASHBOARDS.includes(arg));

    try {
        // Build main app (unless --only-dashboards flag is set)
        if (!onlyDashboards) {
            await runBuild('Main App', 'node build.js');
            console.log('📁 Main app built to: ./public');
        }

        // Build dashboards (unless --skip-dashboards flag is set)
        if (!skipDashboards) {
            console.log('\n🎨 Building dashboard frontends...');

            // Determine which dashboards to build
            const dashboardsToBuild = specificDashboards.length > 0
                ? specificDashboards
                : DASHBOARDS;

            const results = {
                successful: [],
                failed: [],
                skipped: []
            };

            // Build each dashboard
            for (const dashboard of dashboardsToBuild) {
                const success = await buildDashboard(dashboard);
                if (success) {
                    results.successful.push(dashboard);
                } else if (await dashboardExists(dashboard)) {
                    results.failed.push(dashboard);
                } else {
                    results.skipped.push(dashboard);
                }
            }

            // Summary
            console.log('\n📊 Dashboard Build Summary:');
            if (results.successful.length > 0) {
                console.log(`✅ Successfully built: ${results.successful.join(', ')}`);
            }
            if (results.failed.length > 0) {
                console.log(`❌ Failed to build: ${results.failed.join(', ')}`);
            }
            if (results.skipped.length > 0) {
                console.log(`⚠️  Skipped (not found): ${results.skipped.join(', ')}`);
            }
        }

        console.log('\n🎉 Build process completed!');

        // Exit with error if any dashboards failed
        if (!skipDashboards && specificDashboards.length > 0) {
            const failedSpecific = specificDashboards.filter(d =>
                !results.successful.includes(d) && dashboardExists(d)
            );
            if (failedSpecific.length > 0) {
                process.exit(1);
            }
        }

    } catch (error) {
        console.error('\n❌ Build process failed:', error);
        process.exit(1);
    }
}

// Show help if requested
if (process.argv.includes('--help')) {
    console.log(`
Build All - VAPR Project Builder

Usage: node build-all.js [options] [dashboard-names]

Options:
  --skip-dashboards    Skip building all dashboards
  --only-dashboards    Only build dashboards, skip main app
  --help              Show this help message

Dashboard names:
  partners, store, creators

Examples:
  node build-all.js                    # Build everything
  node build-all.js --skip-dashboards  # Build only main app
  node build-all.js --only-dashboards  # Build only dashboards
  node build-all.js partners store     # Build main app + specific dashboards
  node build-all.js --only-dashboards partners  # Build only partners dashboard
    `);
    process.exit(0);
}

// Run the build
main();