#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';
import { createWriteStream } from 'fs';

// Try to load dotenv if available
try {
    const dotenv = await import('dotenv');
    dotenv.config();
} catch (error) {
    // dotenv not installed, continue without it
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const cliVersionType = args.find(arg => ['--patch', '--minor', '--major'].includes(arg))?.substring(2);
const skipBuild = args.includes('--skip-build');
const skipTests = args.includes('--skip-tests');
const skipDesktop = args.includes('--skip-desktop');
const skipDocker = args.includes('--skip-docker');
const skipRelease = args.includes('--skip-release');
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

function execCommand(command, showOutput = true, cwd = null) {
    try {
        if (dryRun) {
            log(`[DRY RUN] Would execute: ${command}${cwd ? ` (in ${cwd})` : ''}`, colors.magenta);
            return '';
        }
        log(`\n→ Running: ${command}${cwd ? ` (in ${cwd})` : ''}`, colors.cyan);
        const options = {
            encoding: 'utf8',
            stdio: showOutput ? 'inherit' : 'pipe'
        };
        if (cwd) {
            options.cwd = cwd;
        }
        const output = execSync(command, options);
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

function updateVersionInHTML(newVersion) {
    const htmlFiles = [
        'src/components/menu.html',
        'src/components/forms/register.html' // Also update in register.html if needed
    ];

    htmlFiles.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Update version in menu footer
            const versionRegex = /<span>VAPR v[\d.]+<\/span>/g;
            const newVersionText = `<span>VAPR v${newVersion}</span>`;

            if (content.match(versionRegex)) {
                content = content.replace(versionRegex, newVersionText);

                if (!dryRun) {
                    fs.writeFileSync(fullPath, content);
                    log(`✅ Updated version in ${filePath}`, colors.green);
                } else {
                    log(`[DRY RUN] Would update version in ${filePath} to v${newVersion}`, colors.magenta);
                }
            } else {
                log(`⚠️  Version pattern not found in ${filePath}`, colors.yellow);
            }
        } else {
            log(`⚠️  File not found: ${filePath}`, colors.yellow);
        }
    });
}

function updateVersionInTauri(newVersion) {
    const tauriConfigPath = path.join(process.cwd(), 'desktop', 'src-tauri', 'tauri.conf.json');
    const cargoTomlPath = path.join(process.cwd(), 'desktop', 'src-tauri', 'Cargo.toml');

    // Update tauri.conf.json
    if (fs.existsSync(tauriConfigPath)) {
        const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
        tauriConfig.version = newVersion;

        if (!dryRun) {
            fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');
            log(`✅ Updated version in tauri.conf.json`, colors.green);
        } else {
            log(`[DRY RUN] Would update version in tauri.conf.json to ${newVersion}`, colors.magenta);
        }
    } else {
        log(`⚠️  Tauri config not found: ${tauriConfigPath}`, colors.yellow);
    }

    // Update Cargo.toml
    if (fs.existsSync(cargoTomlPath)) {
        let cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
        cargoContent = cargoContent.replace(
            /^version = "[\d.]+"/m,
            `version = "${newVersion}"`
        );

        if (!dryRun) {
            fs.writeFileSync(cargoTomlPath, cargoContent);
            log(`✅ Updated version in Cargo.toml`, colors.green);
        } else {
            log(`[DRY RUN] Would update version in Cargo.toml to ${newVersion}`, colors.magenta);
        }
    } else {
        log(`⚠️  Cargo.toml not found: ${cargoTomlPath}`, colors.yellow);
    }

    // Update package.json in desktop folder
    const desktopPackageJsonPath = path.join(process.cwd(), 'desktop', 'package.json');
    if (fs.existsSync(desktopPackageJsonPath)) {
        const desktopPackageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));
        desktopPackageJson.version = newVersion;

        if (!dryRun) {
            fs.writeFileSync(desktopPackageJsonPath, JSON.stringify(desktopPackageJson, null, 2) + '\n');
            log(`✅ Updated version in desktop/package.json`, colors.green);
        } else {
            log(`[DRY RUN] Would update version in desktop/package.json to ${newVersion}`, colors.magenta);
        }
    }
}

async function createZipArchive(sourceDir, outputPath) {
    const archiver = await import('archiver').catch(() => null);

    if (!archiver) {
        log('⚠️  archiver package not found. Installing...', colors.yellow);
        execCommand('npm install --no-save archiver');
        return createZipArchive(sourceDir, outputPath);
    }

    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputPath);
        const archive = archiver.default('zip', {
            zlib: { level: 9 }
        });

        output.on('close', () => {
            log(`✅ Created zip archive: ${outputPath} (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`, colors.green);
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function createGitHubRelease(version, artifacts) {
    const { Octokit } = await import('@octokit/rest').catch(() => null);

    if (!Octokit) {
        log('⚠️  @octokit/rest package not found. Installing...', colors.yellow);
        execCommand('npm install --no-save @octokit/rest');
        return createGitHubRelease(version, artifacts);
    }

    // Get GitHub token from environment (dotenv will have loaded it from .env if available)
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        log('⚠️  GITHUB_TOKEN not found in environment or .env file.', colors.yellow);
        log('   Add it to .env file:', colors.cyan);
        log('   GITHUB_TOKEN=your_token', colors.cyan);
        log('   Or set it in environment:', colors.cyan);
        log('   export GITHUB_TOKEN=your_token', colors.cyan);

        // Ask if user wants to install dotenv
        const installDotenv = await askQuestion('\nInstall dotenv package for .env file support? (y/n): ');
        if (installDotenv.toLowerCase() === 'y') {
            execCommand('npm install --save-dev dotenv');
            log('✅ Installed dotenv. Please create a .env file with your GITHUB_TOKEN and run again.', colors.green);
        }
        return;
    }

    const octokit = new Octokit({ auth: token });

    try {
        // Create release
        log(`\n📝 Creating GitHub release for v${version}...`, colors.yellow);

        const releaseResponse = await octokit.repos.createRelease({
            owner: "vic92548",
            repo: "vapr",
            tag_name: `v${version}`,
            name: `VAPR v${version}`,
            body: `## VAPR v${version}\n\n### Downloads\n- **Windows Installer**: VAPR_${version}_x64_en-US.msi\n### Installation\n1. Run the MSI installer\n*Built with ❤️ by Victor Chanet*`,
            draft: false,
            prerelease: false
        });

        const releaseId = releaseResponse.data.id;
        log(`✅ Created GitHub release: ${releaseResponse.data.html_url}`, colors.green);

        // Upload artifacts
        for (const artifact of artifacts) {
            if (fs.existsSync(artifact.path)) {
                log(`📤 Uploading ${artifact.name}...`, colors.cyan);

                const fileContent = fs.readFileSync(artifact.path);

                await octokit.repos.uploadReleaseAsset({
                    owner: "vic92548",
                    repo: "vapr",
                    release_id: releaseId,
                    name: artifact.name,
                    data: fileContent,
                    headers: {
                        'content-type': artifact.contentType || 'application/octet-stream',
                        'content-length': fileContent.length
                    }
                });

                log(`✅ Uploaded ${artifact.name}`, colors.green);
            } else {
                log(`⚠️  Artifact not found: ${artifact.path}`, colors.yellow);
            }
        }

        log(`\n🎉 GitHub release created successfully!`, colors.green);
        log(`   View at: ${releaseResponse.data.html_url}`, colors.cyan);

    } catch (error) {
        log(`❌ Failed to create GitHub release: ${error.message}`, colors.red);
        if (error.status === 401) {
            log('   Check that your GITHUB_TOKEN is valid and has the necessary permissions', colors.yellow);
        }
    }
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
    log('  --skip-build     Skip the web build step', colors.cyan);
    log('  --skip-tests     Skip running tests', colors.cyan);
    log('  --skip-desktop   Skip building Tauri desktop app', colors.cyan);
    log('  --skip-docker    Skip Docker build and push', colors.cyan);
    log('  --skip-release   Skip creating GitHub release', colors.cyan);
    log('  --dry-run        Show what would be done without doing it', colors.cyan);
    log('  --help           Show this help message', colors.cyan);
    log('\nEnvironment Variables:', colors.yellow);
    log('  GITHUB_TOKEN     Required for creating GitHub releases', colors.cyan);
    log('                   Can be set in .env file or environment', colors.cyan);
    log('\nExamples:', colors.yellow);
    log('  npm run deploy --patch', colors.cyan);
    log('  npm run deploy --minor --skip-tests', colors.cyan);
    log('  npm run deploy --dry-run', colors.cyan);
    log('\n.env file example:', colors.yellow);
    log('  GITHUB_TOKEN=ghp_your_personal_access_token', colors.cyan);
}

async function buildTauriApp(version) {
    const desktopPath = path.join(process.cwd(), 'desktop');

    // Check if desktop folder exists
    if (!fs.existsSync(desktopPath)) {
        log('⚠️  Desktop folder not found. Skipping Tauri build.', colors.yellow);
        return null;
    }

    log('\n🖥️  Building Tauri Desktop App...', colors.yellow);

    log('🧹 Cleaning Cargo cache...', colors.cyan);
    execCommand('cargo clean', true, path.join(desktopPath, 'src-tauri'));

    // Install dependencies if needed
    const nodeModulesPath = path.join(desktopPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        log('📦 Installing desktop dependencies...', colors.cyan);
        execCommand('npm install', true, desktopPath);
    }

    // Build the Tauri app
    log('🔨 Building Tauri app...', colors.cyan);
    execCommand('npm run tauri build', true, desktopPath);

    // Find the built artifacts
    const artifactsPath = path.join(desktopPath, 'src-tauri', 'target', 'release');
    const bundlePath = path.join(artifactsPath, 'bundle');

    const artifacts = [];

    // Look for MSI installer
    const msiPath = path.join(bundlePath, 'msi');
    if (fs.existsSync(msiPath)) {
        const msiFiles = fs.readdirSync(msiPath).filter(f => f.endsWith('.msi'));
        if (msiFiles.length > 0) {
            const msiFile = msiFiles[0];
            const newMsiName = `VAPR_${version}_x64_en-US.msi`;
            const msiFullPath = path.join(msiPath, msiFile);
            const msiDestPath = path.join(process.cwd(), newMsiName);

            if (!dryRun) {
                fs.copyFileSync(msiFullPath, msiDestPath);
            }

            artifacts.push({
                path: msiDestPath,
                name: newMsiName,
                contentType: 'application/x-msi'
            });

            log(`✅ Found MSI installer: ${newMsiName}`, colors.green);
        }
    }

    // Look for executable
    let exePath = null;
    const possibleExeNames = ['vapr.exe', 'VAPR.exe', 'app.exe'];
    for (const exeName of possibleExeNames) {
        const fullPath = path.join(artifactsPath, exeName);
        if (fs.existsSync(fullPath)) {
            exePath = fullPath;
            break;
        }
    }

    if (exePath) {
        // Create a zip with the executable and any necessary files
        const zipName = `VAPR-windows-${version}.zip`;
        const zipPath = path.join(process.cwd(), zipName);

        // Create temporary directory for zip contents
        const tempDir = path.join(process.cwd(), `temp-vapr-${version}`);
        if (!dryRun) {
            fs.mkdirSync(tempDir, { recursive: true });

            // Copy executable
            fs.copyFileSync(exePath, path.join(tempDir, 'VAPR.exe'));

            // Copy any additional required files (DLLs, resources, etc.)
            const requiredFiles = ['WebView2Loader.dll', 'resources'];
            for (const file of requiredFiles) {
                const srcPath = path.join(artifactsPath, file);
                if (fs.existsSync(srcPath)) {
                    const destPath = path.join(tempDir, file);
                    if (fs.statSync(srcPath).isDirectory()) {
                        fs.cpSync(srcPath, destPath, { recursive: true });
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                }
            }

            // Create README file
            const readmeContent = `# VAPR Desktop v${version}

## Installation
1. Extract all files to a folder
2. Run VAPR.exe

## Requirements
- Windows 10 or later
- WebView2 (will be installed automatically if not present)

## Support
Visit: https://github.com/vic92548/vapr
`;
            fs.writeFileSync(path.join(tempDir, 'README.txt'), readmeContent);

            // Create zip
            await createZipArchive(tempDir, zipPath);

            // Clean up temp directory
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        artifacts.push({
            path: zipPath,
            name: zipName,
            contentType: 'application/zip'
        });

        log(`✅ Created portable ZIP: ${zipName}`, colors.green);
    } else {
        log('⚠️  Could not find built executable', colors.yellow);
    }

    return artifacts;
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

        // Check if Docker is installed and running (only if not skipping Docker)
        if (!skipDocker) {
            try {
                execCommand('docker --version', false);
            } catch (error) {
                log('Docker is not installed or not running!', colors.red);
                log('Use --skip-docker to skip Docker deployment', colors.yellow);
                process.exit(1);
            }

            // Check if user is logged in to Docker Hub
            try {
                execCommand('docker info', false);
            } catch (error) {
                log('Please login to Docker Hub first: docker login', colors.red);
                log('Use --skip-docker to skip Docker deployment', colors.yellow);
                process.exit(1);
            }
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

            // Update version in HTML files
            log('\n📝 Updating version in HTML files...', colors.yellow);
            updateVersionInHTML(newVersion);

            // Update version in Tauri files
            if (!skipDesktop) {
                log('\n📝 Updating version in Tauri files...', colors.yellow);
                updateVersionInTauri(newVersion);
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

        // Build the web project
        if (!skipBuild) {
            log('\n📦 Building web project...', colors.yellow);
            execCommand('npm run build');
            log('✅ Web build completed', colors.green);
        } else {
            log('\n⏩ Skipping web build step', colors.yellow);
        }

        // Build Tauri desktop app
        let desktopArtifacts = [];
        if (!skipDesktop) {
            desktopArtifacts = await buildTauriApp(newVersion) || [];
        } else {
            log('\n⏩ Skipping desktop build', colors.yellow);
        }

        const dockerRepo = 'vic92548/vapr';
        // Docker build and push
        if (!skipDocker) {
            // Docker repository details

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
        } else {
            log('\n⏩ Skipping Docker build and push', colors.yellow);
        }

        // Create GitHub release
        if (!skipRelease && desktopArtifacts.length > 0 && newVersion !== currentVersion) {
            await createGitHubRelease(newVersion, desktopArtifacts);
        } else if (skipRelease) {
            log('\n⏩ Skipping GitHub release', colors.yellow);
        } else if (desktopArtifacts.length === 0 && !skipDesktop) {
            log('\n⚠️  No desktop artifacts found, skipping GitHub release', colors.yellow);
        }

        // Summary with version highlight
        log('\n🎉 Deployment Complete!', colors.bright + colors.green);
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);
        log(`Deployed Version: ${colors.bright}${colors.green}${newVersion}${colors.reset}`, colors.bright);

        if (!skipDocker) {
            log(`Docker Image: ${dockerRepo}:${newVersion}`, colors.cyan);
            log(`Docker Hub: https://hub.docker.com/r/${dockerRepo}`, colors.cyan);
        }

        if (desktopArtifacts.length > 0) {
            log('\nDesktop Artifacts:', colors.yellow);
            desktopArtifacts.forEach(artifact => {
                log(`  • ${artifact.name}`, colors.cyan);
            });
        }

        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim);

        // Show commands to run the container
        if (!skipDocker) {
            log('\n📝 To run the container:', colors.yellow);
            log(`docker run -p 8080:8080 -e DATABASE_URL="your-mongodb-url" ${dockerRepo}:${newVersion}`, colors.cyan);
        }

        // Version history
        if (newVersion !== currentVersion) {
            log('\n📈 Version History:', colors.yellow);
            log(`   Previous: ${currentVersion}`, colors.dim);
            log(`    Current: ${newVersion}`, colors.green);
        }

        // Clean up
        if (!skipDocker) {
            const cleanup = await askQuestion('\nClean up old Docker images? (y/n): ');
            if (cleanup.toLowerCase() === 'y') {
                execCommand('docker image prune -f');
                log('✅ Cleaned up old images', colors.green);
            }
        }

        // Clean up desktop build artifacts
        if (desktopArtifacts.length > 0 && !dryRun) {
            const cleanupDesktop = await askQuestion('\nRemove local desktop build artifacts? (y/n): ');
            if (cleanupDesktop.toLowerCase() === 'y') {
                desktopArtifacts.forEach(artifact => {
                    if (fs.existsSync(artifact.path)) {
                        fs.unlinkSync(artifact.path);
                    }
                });
                log('✅ Cleaned up local build artifacts', colors.green);
            }
        }

    } catch (error) {
        log('\n❌ Deployment failed!', colors.red);
        log(error.message, colors.red);

        // Show recovery instructions
        log('\n📝 Recovery steps:', colors.yellow);
        log('1. Fix the issue that caused the failure', colors.cyan);
        log('2. If version was bumped, you may need to:', colors.cyan);
        log('   - Revert the version in package.json', colors.cyan);
        log('   - Revert the version in HTML files', colors.cyan);
        log('   - Revert the version in Tauri files', colors.cyan);
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