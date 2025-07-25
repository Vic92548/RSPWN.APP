#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const cliVersionType = args.find(arg => ['--patch', '--minor', '--major'].includes(arg))?.substring(2);
const skipBuild = args.includes('--skip-build');
const skipTests = args.includes('--skip-tests');
const dryRun = args.includes('--dry-run');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    dim: '\x1b[2m'
};

// Helper functions
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, showOutput = true) {
    try {
        if (dryRun) {
            log(`[DRY RUN] Would execute: ${command}`, colors.magenta);
            return '';
        }
        log(`\n→ Running: ${command}`, colors.cyan);
        const output = execSync(command, { encoding: 'utf8', stdio: showOutput ? 'inherit' : 'pipe' });
        return output;
    } catch (error) {
        log(`Error executing command: ${command}`, colors.red);
        throw error;
    }
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

function updateVersion(currentVersion, bumpType) {
    const parts = currentVersion.split('.');
    let [major, minor, patch] = parts.map(Number);

    switch(bumpType) {
        case 'major':
            major++;
            minor = 0;
            patch = 0;
            break;
        case 'minor':
            minor++;
            patch = 0;
            break;
        case 'patch':
            patch++;
            break;
    }

    return `${major}.${minor}.${patch}`;
}

function showVersionPreview(currentVersion, bumpType) {
    if (bumpType === 'skip' || bumpType === 'custom') return null;

    const newVersion = updateVersion(currentVersion, bumpType);

    // Create visual version comparison
    log('\n📊 Version Preview:', colors.bright + colors.yellow);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);

    // Show current version
    log(`  Current: ${colors.red}${currentVersion}${colors.reset}`, colors.bright);
    log(`      New: ${colors.green}${newVersion}${colors.reset}`, colors.bright);

    // Show what changes
    const currentParts = currentVersion.split('.');
    const newParts = newVersion.split('.');

    let changeDescription = '';
    if (currentParts[0] !== newParts[0]) {
        changeDescription = `Major version: ${currentParts[0]} → ${newParts[0]} (Breaking changes)`;
    } else if (currentParts[1] !== newParts[1]) {
        changeDescription = `Minor version: ${currentParts[1]} → ${newParts[1]} (New features)`;
    } else if (currentParts[2] !== newParts[2]) {
        changeDescription = `Patch version: ${currentParts[2]} → ${newParts[2]} (Bug fixes)`;
    }

    log(`   Change: ${changeDescription}`, colors.cyan);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);

    return newVersion;
}

async function getVersionBump(currentVersion) {
    if (cliVersionType) {
        const preview = showVersionPreview(currentVersion, cliVersionType);
        if (preview) {
            const confirm = await askQuestion(`\nConfirm version bump to ${colors.green}${preview}${colors.reset}? (y/n): `);
            if (confirm.toLowerCase() !== 'y') {
                log('Version bump cancelled', colors.yellow);
                process.exit(0);
            }
        }
        return cliVersionType;
    }

    log('\n🔢 Version Bump Options:', colors.bright + colors.yellow);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);

    // Show preview for each option
    const patchVersion = updateVersion(currentVersion, 'patch');
    const minorVersion = updateVersion(currentVersion, 'minor');
    const majorVersion = updateVersion(currentVersion, 'major');

    log(`  1) patch: ${colors.dim}${currentVersion}${colors.reset} → ${colors.green}${patchVersion}${colors.reset} ${colors.dim}(Bug fixes)${colors.reset}`);
    log(`  2) minor: ${colors.dim}${currentVersion}${colors.reset} → ${colors.green}${minorVersion}${colors.reset} ${colors.dim}(New features)${colors.reset}`);
    log(`  3) major: ${colors.dim}${currentVersion}${colors.reset} → ${colors.green}${majorVersion}${colors.reset} ${colors.dim}(Breaking changes)${colors.reset}`);
    log(`  4) custom: Enter a specific version`);
    log(`  5) skip: Keep current version ${colors.dim}(${currentVersion})${colors.reset}`);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);

    const answer = await askQuestion('\nEnter your choice (1-5): ');

    let selectedType;
    switch(answer) {
        case '1': selectedType = 'patch'; break;
        case '2': selectedType = 'minor'; break;
        case '3': selectedType = 'major'; break;
        case '4': selectedType = 'custom'; break;
        case '5': selectedType = 'skip'; break;
        default:
            log('Invalid choice, defaulting to patch', colors.yellow);
            selectedType = 'patch';
    }

    // Show preview for selected option
    if (selectedType !== 'custom' && selectedType !== 'skip') {
        showVersionPreview(currentVersion, selectedType);
    }

    return selectedType;
}

function showHelp() {
    log('\n📚 VAPR Deploy Script Help', colors.bright + colors.blue);
    log('========================\n', colors.blue);
    log('Usage: npm run deploy [options]', colors.yellow);
    log('\nOptions:', colors.yellow);
    log('  --patch          Bump patch version (0.0.x)', colors.cyan);
    log('  --minor          Bump minor version (0.x.0)', colors.cyan);
    log('  --major          Bump major version (x.0.0)', colors.cyan);
    log('  --skip-build     Skip the build step', colors.cyan);
    log('  --skip-tests     Skip running tests', colors.cyan);
    log('  --dry-run        Show what would be done without doing it', colors.cyan);
    log('  --help           Show this help message', colors.cyan);
    log('\nExamples:', colors.yellow);
    log('  npm run deploy --patch', colors.cyan);
    log('  npm run deploy --minor --skip-tests', colors.cyan);
    log('  npm run deploy --dry-run', colors.cyan);
}

async function deploy() {
    try {
        // Show help if requested
        if (args.includes('--help')) {
            showHelp();
            process.exit(0);
        }

        log('\n🚀 VAPR Deployment Script', colors.bright + colors.blue);
        log('========================\n', colors.blue);

        if (dryRun) {
            log('🔍 Running in DRY RUN mode - no changes will be made', colors.magenta);
        }

        // Check if Docker is installed and running
        try {
            execCommand('docker --version', false);
        } catch (error) {
            log('Docker is not installed or not running!', colors.red);
            process.exit(1);
        }

        // Check if user is logged in to Docker Hub
        try {
            execCommand('docker info', false);
        } catch (error) {
            log('Please login to Docker Hub first: docker login', colors.red);
            process.exit(1);
        }

        // Check for uncommitted changes
        try {
            const gitStatus = execCommand('git status --porcelain', false);
            if (gitStatus && !dryRun) {
                log('\n⚠️  Warning: You have uncommitted changes:', colors.yellow);
                console.log(gitStatus);
                const proceed = await askQuestion('Continue anyway? (y/n): ');
                if (proceed.toLowerCase() !== 'y') {
                    process.exit(1);
                }
            }
        } catch (error) {
            log('Warning: Not a git repository or git not installed', colors.yellow);
        }

        // Read current package.json
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        const currentVersion = packageJson.version || '0.0.0';

        // Show current version prominently
        log('\n📌 Current Version:', colors.bright + colors.yellow);
        log(`   ${colors.bright}${currentVersion}${colors.reset}`, colors.cyan);

        // Get version bump type
        const bumpType = await getVersionBump(currentVersion);
        let newVersion = currentVersion;

        if (bumpType === 'custom') {
            const suggestedNext = updateVersion(currentVersion, 'patch');
            newVersion = await askQuestion(`Enter custom version (current: ${currentVersion}, suggested: ${suggestedNext}): `);

            // Validate version format
            if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
                log('Invalid version format. Using current version.', colors.red);
                newVersion = currentVersion;
            } else {
                // Show custom version preview
                log('\n📊 Custom Version:', colors.bright + colors.yellow);
                log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);
                log(`  Current: ${colors.red}${currentVersion}${colors.reset}`, colors.bright);
                log(`      New: ${colors.green}${newVersion}${colors.reset}`, colors.bright);
                log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);

                const confirm = await askQuestion(`\nConfirm version change to ${colors.green}${newVersion}${colors.reset}? (y/n): `);
                if (confirm.toLowerCase() !== 'y') {
                    log('Version change cancelled', colors.yellow);
                    newVersion = currentVersion;
                }
            }
        } else if (bumpType !== 'skip') {
            newVersion = updateVersion(currentVersion, bumpType);
        }

        // Final version summary before proceeding
        if (newVersion !== currentVersion) {
            log('\n✨ Version will be updated:', colors.bright + colors.green);
            log(`   ${currentVersion} → ${newVersion}`, colors.bright + colors.green);

            const finalConfirm = await askQuestion('\nProceed with deployment? (y/n): ');
            if (finalConfirm.toLowerCase() !== 'y') {
                log('Deployment cancelled', colors.yellow);
                process.exit(0);
            }
        } else {
            log('\n📌 Version will remain:', colors.yellow);
            log(`   ${currentVersion} (unchanged)`, colors.dim);
        }

        // Update package.json if version changed
        if (newVersion !== currentVersion) {
            packageJson.version = newVersion;

            if (!dryRun) {
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
            }

            log(`\n✅ Updated package.json version to: ${newVersion}`, colors.green);

            // Commit version change
            try {
                execCommand(`git add package.json`);
                execCommand(`git commit -m "chore: bump version to ${newVersion}"`);
                log('✅ Committed version change', colors.green);
            } catch (error) {
                if (!dryRun) {
                    log('Warning: Could not commit version change. Continue anyway? (y/n)', colors.yellow);
                    const answer = await askQuestion('');
                    if (answer.toLowerCase() !== 'y') {
                        // Revert package.json
                        packageJson.version = currentVersion;
                        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
                        process.exit(1);
                    }
                }
            }
        }

        // Run tests (if not skipped)
        if (!skipTests && packageJson.scripts && packageJson.scripts.test) {
            log('\n🧪 Running tests...', colors.yellow);
            try {
                execCommand('npm test');
                log('✅ Tests passed', colors.green);
            } catch (error) {
                log('❌ Tests failed', colors.red);
                const proceed = await askQuestion('Continue deployment anyway? (y/n): ');
                if (proceed.toLowerCase() !== 'y') {
                    process.exit(1);
                }
            }
        }

        // Build the project
        if (!skipBuild) {
            log('\n📦 Building project...', colors.yellow);
            execCommand('npm run build');
            log('✅ Build completed', colors.green);
        } else {
            log('\n⏩ Skipping build step', colors.yellow);
        }

        // Docker repository details
        const dockerRepo = 'vic92548/vapr';
        const imageName = `${dockerRepo}:${newVersion}`;
        const latestTag = `${dockerRepo}:latest`;

        // Show Docker tags that will be created
        log('\n🏷️  Docker Tags:', colors.bright + colors.yellow);
        log(`   • ${imageName}`, colors.cyan);
        log(`   • ${latestTag}`, colors.cyan);

        // Build Docker image
        log('\n🐳 Building Docker image...', colors.yellow);
        execCommand(`docker build -t ${imageName} -t ${latestTag} .`);
        log('✅ Docker image built successfully', colors.green);

        // Push to Docker Hub
        log('\n📤 Pushing to Docker Hub...', colors.yellow);
        execCommand(`docker push ${imageName}`);
        execCommand(`docker push ${latestTag}`);
        log('✅ Docker images pushed successfully', colors.green);

        // Create git tag
        if (newVersion !== currentVersion) {
            try {
                execCommand(`git tag -a v${newVersion} -m "Release version ${newVersion}"`);
                log(`✅ Created git tag: v${newVersion}`, colors.green);

                // Ask if user wants to push the tag
                if (!dryRun) {
                    const pushTag = await askQuestion('\nPush git tag to remote? (y/n): ');
                    if (pushTag.toLowerCase() === 'y') {
                        execCommand(`git push origin v${newVersion}`);
                        execCommand(`git push origin main`); // or master, depending on your branch
                        log('✅ Pushed tag and commits to remote', colors.green);
                    }
                }
            } catch (error) {
                log('Warning: Could not create/push git tag', colors.yellow);
            }
        }

        // Summary with version highlight
        log('\n🎉 Deployment Complete!', colors.bright + colors.green);
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);
        log(`Deployed Version: ${colors.bright}${colors.green}${newVersion}${colors.reset}`, colors.bright);
        log(`Docker Image: ${imageName}`, colors.cyan);
        log(`Docker Hub: https://hub.docker.com/r/${dockerRepo}`, colors.cyan);
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);

        // Show commands to run the container
        log('\n📝 To run the container:', colors.yellow);
        log(`docker run -p 8080:8080 -e DATABASE_URL="your-mongodb-url" ${imageName}`, colors.cyan);

        // Version history
        if (newVersion !== currentVersion) {
            log('\n📈 Version History:', colors.yellow);
            log(`   Previous: ${currentVersion}`, colors.dim);
            log(`    Current: ${newVersion}`, colors.green);
        }

        // Clean up old images (optional)
        const cleanup = await askQuestion('\nClean up old Docker images? (y/n): ');
        if (cleanup.toLowerCase() === 'y') {
            execCommand('docker image prune -f');
            log('✅ Cleaned up old images', colors.green);
        }

    } catch (error) {
        log('\n❌ Deployment failed!', colors.red);
        log(error.message, colors.red);

        // Show recovery instructions
        log('\n📝 Recovery steps:', colors.yellow);
        log('1. Fix the issue that caused the failure', colors.cyan);
        log('2. If version was bumped, you may need to:', colors.cyan);
        log('   - Revert the version in package.json', colors.cyan);
        log('   - Delete the git tag: git tag -d v<version>', colors.cyan);
        log('3. Run the deploy script again', colors.cyan);

        process.exit(1);
    }
}

// Run deployment
deploy().catch(error => {
    log('Unexpected error:', colors.red);
    console.error(error);
    process.exit(1);
});