import { walk } from "https://deno.land/std/fs/mod.ts";

// Function to replace templates in an HTML file
async function replaceTemplates(filePath) {
    // Read the content of the specified file
    let content = await Deno.readTextFile(`./src/components/${filePath}`);

    // Regex to find all templates in the format [[path/to/file.html]]
    const templateRegex = /\[\[(.*?)\]\]/g;

    // Array to hold promises for asynchronous replacements
    const replacements = [];

    // Function to process each match found by the regex
    content.replace(templateRegex, (match, p1) => {
        const promise = replaceTemplates(p1).then(includedContent => {
            content = content.replace(match, includedContent);
        });
        replacements.push(promise);
    });

    // Wait for all replacements to complete
    await Promise.all(replacements);

    return content;
}

// Custom HTML minifier and obfuscator
function minifyAndObfuscateHTML(content) {
    // Remove comments
    content = content.replace(/<!--[\s\S]*?-->/g, '');

    // Collapse whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return content;
}

// Custom JS minifier and obfuscator
function minifyAndObfuscateJS(content) {
    // Remove multiline comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments but not URLs
    content = content.replace(/(^|\s)\/\/.*(?=[\n\r])/g, '');

    // Collapse whitespace
   // content = content.replace(/\s+/g, ' ').trim();

    return content;
}

// Custom CSS minifier and obfuscator
function minifyAndObfuscateCSS(content) {
    // Remove comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Collapse whitespace
    //content = content.replace(/\s+/g, ' ').trim();

    return content;
}

// Function to combine and minify JS files
async function combineAndMinifyJS(directory) {
    let combinedJS = '';

    for await (const entry of walk(directory, { exts: ['js'] })) {
        const jsContent = await Deno.readTextFile(entry.path);
        combinedJS += jsContent + '\n';
    }

    // Minify and obfuscate the combined JS content
    const minifiedJS = minifyAndObfuscateJS(combinedJS);
    await Deno.writeTextFile('./public/script.min.js', minifiedJS);
    return minifiedJS;
}

// Function to combine and minify CSS files
async function combineAndMinifyCSS(directory) {
    let combinedCSS = '';

    for await (const entry of walk(directory, { exts: ['css'] })) {
        const cssContent = await Deno.readTextFile(entry.path);
        combinedCSS += cssContent + '\n';
    }

    // Minify and obfuscate the combined CSS content
    const minifiedCSS = minifyAndObfuscateCSS(combinedCSS);
    await Deno.writeTextFile('./public/style.min.css', minifiedCSS);
    return minifiedCSS;
}

// Main function to start the process
async function main() {
    // Specify the entry HTML file
    const entryFilePath = 'index.html';

    // Process the entry file
    const processedContent = await replaceTemplates(entryFilePath);

    // Combine and minify JS files
    const combinedJS = await combineAndMinifyJS('./src/js/');

    // Combine and minify CSS files
    const combinedCSS = await combineAndMinifyCSS('./src/css/');

    // Minify and obfuscate the final HTML content
    const minifiedContent = minifyAndObfuscateHTML(processedContent);

    // Write the minified content to a new file
    await Deno.writeTextFile('index.html', minifiedContent);
}

// Run the main function
main();
