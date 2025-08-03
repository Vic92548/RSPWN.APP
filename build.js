// build.js
import { promises as fs } from 'fs';
import path from 'path';
import * as sass from 'sass';

async function* walk(dir, options = {}) {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
            yield* walk(filePath, options);
        } else if (file.isFile()) {
            if (!options.exts || options.exts.some(ext => file.name.endsWith(`.${ext}`))) {
                yield { path: filePath, name: file.name };
            }
        }
    }
}

async function replaceTemplates(filePath) {
    let content = await fs.readFile(path.join('./src/components', filePath), 'utf8');
    const templateRegex = /\[\[(.*?)\]\]/g;
    const replacements = [];

    content.replace(templateRegex, (match, p1) => {
        const promise = replaceTemplates(p1).then(includedContent => {
            content = content.replace(match, includedContent);
        });
        replacements.push(promise);
    });

    await Promise.all(replacements);
    return content;
}

function minifyAndObfuscateHTML(content) {
    content = content.replace(/<!--[\s\S]*?-->/g, '');
    content = content.replace(/\s+/g, ' ').trim();
    return content;
}

function minifyAndObfuscateJS(content) {
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/(^|\s)\/\/.*(?=[\n\r])/g, '');
    return content;
}

function minifyAndObfuscateCSS(content) {
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // More aggressive CSS minification
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/:\s+/g, ':');
    content = content.replace(/;\s+/g, ';');
    content = content.replace(/{\s+/g, '{');
    content = content.replace(/}\s+/g, '}');
    content = content.replace(/,\s+/g, ',');
    content = content.trim();
    return content;
}

async function combineAndMinifyJS(directory) {
    let combinedJS = '';

    for await (const entry of walk(directory, { exts: ['js'] })) {
        console.log(`Processing JS: ${entry.path}`);
        const jsContent = await fs.readFile(entry.path, 'utf8');
        combinedJS += jsContent + '\n';
    }

    const minifiedJS = minifyAndObfuscateJS(combinedJS);
    await fs.writeFile('./public/script.min.js', minifiedJS);
    return minifiedJS;
}

async function compileSass(filePath) {
    try {
        const result = sass.compile(filePath, {
            style: 'compressed',
            sourceMap: false
        });
        return result.css;
    } catch (error) {
        console.error(`Error compiling Sass file ${filePath}:`, error.message);
        throw error;
    }
}

async function combineAndMinifyCSS(cssDirectory, sassDirectory) {
    let combinedCSS = '';

    // First, compile all Sass/SCSS files
    if (sassDirectory && await fs.access(sassDirectory).then(() => true).catch(() => false)) {
        console.log(`\nCompiling Sass files from ${sassDirectory}...`);

        // Create a main.scss file that imports all other scss files in order
        let mainScssContent = '';
        const scssFiles = [];

        for await (const entry of walk(sassDirectory, { exts: ['scss', 'sass'] })) {
            // Skip partials (files starting with _)
            if (!path.basename(entry.name).startsWith('_')) {
                scssFiles.push(entry);
            }
        }

        // Sort files to ensure consistent order
        scssFiles.sort((a, b) => {
            // Put files starting with $ first (variables), then _ (mixins), then others
            const aName = path.basename(a.name);
            const bName = path.basename(b.name);

            if (aName.startsWith('$') && !bName.startsWith('$')) return -1;
            if (!aName.startsWith('$') && bName.startsWith('$')) return 1;
            if (aName.startsWith('_') && !bName.startsWith('_')) return -1;
            if (!aName.startsWith('_') && bName.startsWith('_')) return 1;

            return aName.localeCompare(bName);
        });

        // Process each SCSS file
        for (const entry of scssFiles) {
            console.log(`Compiling Sass: ${entry.path}`);
            try {
                const compiledCSS = await compileSass(entry.path);
                combinedCSS += compiledCSS + '\n';
            } catch (error) {
                console.error(`Failed to compile ${entry.path}:`, error);
            }
        }
    }

    const minifiedCSS = minifyAndObfuscateCSS(combinedCSS);
    await fs.writeFile('./public/style.min.css', minifiedCSS);
    return minifiedCSS;
}

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

async function main() {
    console.log('Starting build process...\n');

    // Ensure public directory exists
    await ensureDirectoryExists('./public');

    // Process HTML templates
    console.log('Processing HTML templates...');
    const entryFilePath = 'index.html';
    const processedContent = await replaceTemplates(entryFilePath);
    const minifiedContent = minifyAndObfuscateHTML(processedContent);
    await fs.writeFile('index.html', minifiedContent);
    console.log('✓ HTML processed\n');

    // Process JavaScript
    console.log('Processing JavaScript files...');
    const combinedJS = await combineAndMinifyJS('./src/js/');
    console.log('✓ JavaScript processed\n');

    // Process CSS and Sass
    console.log('Processing CSS and Sass files...');
    const combinedCSS = await combineAndMinifyCSS('./src/css/', './src/scss/');
    console.log('✓ CSS processed\n');

    console.log('Build completed successfully!');
}

// Run the build
main().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
});