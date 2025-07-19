// deno_modules/template_engine.js

/**
 * A simple but efficient template engine for Deno
 * Supports recursive template inclusion and variable replacement
 */

class TemplateEngine {
    constructor(options = {}) {
        this.baseDir = options.baseDir || './src/components/';
        this.cache = new Map();
        this.enableCache = options.enableCache !== false; // Cache enabled by default
        this.includePattern = options.includePattern || /\[\[(.+?)\]\]/g; // [[filename]]
        this.variablePattern = options.variablePattern || /\{\{(.+?)\}\}/g; // {{variable}}
        this.maxDepth = options.maxDepth || 10; // Prevent infinite recursion
    }

    /**
     * Clear the template cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Load a template file
     * @param {string} filePath - Path to the template file
     * @returns {Promise<string>} - Template content
     */
    async loadTemplate(filePath) {
        // Check cache first
        if (this.enableCache && this.cache.has(filePath)) {
            return this.cache.get(filePath);
        }

        try {
            const fullPath = filePath.startsWith('/') ? filePath : `${this.baseDir}${filePath}`;
            const content = await Deno.readTextFile(fullPath);

            if (this.enableCache) {
                this.cache.set(filePath, content);
            }

            return content;
        } catch (error) {
            throw new Error(`Failed to load template: ${filePath} - ${error.message}`);
        }
    }

    /**
     * Process includes in a template
     * @param {string} template - Template content
     * @param {number} depth - Current recursion depth
     * @returns {Promise<string>} - Processed template
     */
    async processIncludes(template, depth = 0) {
        if (depth >= this.maxDepth) {
            throw new Error(`Maximum template inclusion depth (${this.maxDepth}) exceeded`);
        }

        // Find all includes
        const includes = [];
        let match;

        while ((match = this.includePattern.exec(template)) !== null) {
            includes.push({
                fullMatch: match[0],
                filePath: match[1].trim(),
                index: match.index
            });
        }

        // Process includes in reverse order to maintain string positions
        for (let i = includes.length - 1; i >= 0; i--) {
            const include = includes[i];

            try {
                // Load the included template
                let includedContent = await this.loadTemplate(include.filePath);

                // Process nested includes
                includedContent = await this.processIncludes(includedContent, depth + 1);

                // Replace the include tag with the content
                template = template.substring(0, include.index) +
                    includedContent +
                    template.substring(include.index + include.fullMatch.length);
            } catch (error) {
                console.error(`Error including template ${include.filePath}:`, error);
                // Optionally, you can replace with an error message or leave the include tag
                template = template.replace(include.fullMatch, `<!-- Error loading ${include.filePath} -->`);
            }
        }

        return template;
    }

    /**
     * Replace variables in a template
     * @param {string} template - Template content
     * @param {object} data - Data object for variable replacement
     * @returns {string} - Processed template
     */
    replaceVariables(template, data) {
        return template.replace(this.variablePattern, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;

            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return match; // Return original if key not found
                }
            }

            // Handle different value types
            if (value === null || value === undefined) {
                return '';
            }

            if (typeof value === 'object') {
                return JSON.stringify(value);
            }

            return String(value);
        });
    }

    /**
     * Render a template with data
     * @param {string} templatePath - Path to the template file
     * @param {object} data - Data for variable replacement
     * @returns {Promise<string>} - Rendered HTML
     */
    async render(templatePath, data = {}) {
        try {
            // Load the main template
            let template = await this.loadTemplate(templatePath);

            // Process includes
            template = await this.processIncludes(template);

            // Replace variables
            template = this.replaceVariables(template, data);

            return template;
        } catch (error) {
            throw new Error(`Failed to render template ${templatePath}: ${error.message}`);
        }
    }

    /**
     * Render a template from string (useful for dynamic templates)
     * @param {string} templateString - Template content as string
     * @param {object} data - Data for variable replacement
     * @returns {Promise<string>} - Rendered HTML
     */
    async renderString(templateString, data = {}) {
        try {
            // Process includes
            let template = await this.processIncludes(templateString);

            // Replace variables
            template = this.replaceVariables(template, data);

            return template;
        } catch (error) {
            throw new Error(`Failed to render template string: ${error.message}`);
        }
    }

    /**
     * Batch render multiple templates (useful for performance)
     * @param {Array} templates - Array of {path, data} objects
     * @returns {Promise<Map>} - Map of path to rendered content
     */
    async renderBatch(templates) {
        const results = new Map();

        await Promise.all(templates.map(async ({ path, data }) => {
            try {
                const rendered = await this.render(path, data);
                results.set(path, { success: true, content: rendered });
            } catch (error) {
                results.set(path, { success: false, error: error.message });
            }
        }));

        return results;
    }

    /**
     * Helper to escape HTML (prevent XSS)
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

/**
 * Factory function to create a template engine instance
 * @param {object} options - Configuration options
 * @returns {TemplateEngine} - Template engine instance
 */
export function createTemplateEngine(options = {}) {
    return new TemplateEngine(options);
}

// Export the class as well for direct instantiation
export { TemplateEngine };

// Helper functions for common use cases

/**
 * Render a single template (convenience function)
 * @param {string} path - Template path
 * @param {object} data - Template data
 * @param {object} options - Engine options
 * @returns {Promise<string>} - Rendered template
 */
export async function renderTemplate(path, data = {}, options = {}) {
    const engine = new TemplateEngine(options);
    return engine.render(path, data);
}

/**
 * Create a configured template renderer for your app
 * @param {object} config - Configuration
 * @returns {object} - Object with render methods
 */
export function createRenderer(config = {}) {
    const engine = new TemplateEngine(config);

    return {
        render: (path, data) => engine.render(path, data),
        renderString: (str, data) => engine.renderString(str, data),
        renderBatch: (templates) => engine.renderBatch(templates),
        clearCache: () => engine.clearCache(),
        engine // Expose engine for advanced usage
    };
}