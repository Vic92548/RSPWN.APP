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

    // Obfuscate inline JavaScript and CSS
    content = content.replace(/<script>([\s\S]*?)<\/script>/g, (match, p1) => {
        return `<script>${minifyAndObfuscateJS(p1)}</script>`;
    });

    return content;
}

// Custom JS minifier and obfuscator
function minifyAndObfuscateJS(content) {

    // Remove multiline comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments but not URLs
    content = content.replace(/(^|\s)\/\/.*(?=[\n\r])/g, '');

    // Collapse whitespace
    //content = content.replace(/\s+/g, ' ').trim();

    // Obfuscate variable and function names
    /*let variableCount = 0;
    const variableMap = {};
    content = content.replace(/\b[a-zA-Z_]\w*\b/g, (match) => {
        if (!variableMap[match]) {
            variableMap[match] = `_${variableCount++}`;
        }
        return variableMap[match];
    });*/

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

// Main function to start the process
async function main() {
    // Specify the entry HTML file
    const entryFilePath = 'index.html';

    // Process the entry file
    const processedContent = await replaceTemplates(entryFilePath);

    // Combine and minify JS files
    const combinedJS = await combineAndMinifyJS('./src/js/');

    // Minify and obfuscate the final HTML content
    const minifiedContent = minifyAndObfuscateHTML(processedContent);

    // Write the minified content to a new file
    await Deno.writeTextFile('index.html', minifiedContent);
}

// Run the main function
main();
