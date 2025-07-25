import { promises as fs } from 'fs';
import path from 'path';

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
    return content;
}

async function combineAndMinifyJS(directory) {
    let combinedJS = '';

    for await (const entry of walk(directory, { exts: ['js'] })) {
        console.log(entry.path);
        const jsContent = await fs.readFile(entry.path, 'utf8');
        combinedJS += jsContent + '\n';
    }

    const minifiedJS = minifyAndObfuscateJS(combinedJS);
    await fs.writeFile('./public/script.min.js', minifiedJS);
    return minifiedJS;
}

async function combineAndMinifyCSS(directory) {
    let combinedCSS = '';

    for await (const entry of walk(directory, { exts: ['css'] })) {
        console.log(entry.path);
        const cssContent = await fs.readFile(entry.path, 'utf8');
        combinedCSS += cssContent + '\n';
    }

    const minifiedCSS = minifyAndObfuscateCSS(combinedCSS);
    await fs.writeFile('./public/style.min.css', minifiedCSS);
    return minifiedCSS;
}

async function main() {
    const entryFilePath = 'index.html';
    const processedContent = await replaceTemplates(entryFilePath);
    const combinedJS = await combineAndMinifyJS('./src/js/');
    const combinedCSS = await combineAndMinifyCSS('./src/css/');
    const minifiedContent = minifyAndObfuscateHTML(processedContent);
    await fs.writeFile('index.html', minifiedContent);
}

main();