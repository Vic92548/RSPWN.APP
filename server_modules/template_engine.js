import { promises as fs } from 'fs';

class TemplateEngine {
    constructor(options = {}) {
        this.baseDir = options.baseDir || './src/components/';
        this.cache = new Map();
        this.enableCache = options.enableCache !== false;
        this.includePattern = options.includePattern || /\[\[(.+?)\]\]/g;
        this.variablePattern = options.variablePattern || /\{\{(.+?)\}\}/g;
        this.maxDepth = options.maxDepth || 10;
    }

    clearCache() {
        this.cache.clear();
    }

    async loadTemplate(filePath) {
        if (this.enableCache && this.cache.has(filePath)) {
            return this.cache.get(filePath);
        }

        try {
            const fullPath = filePath.startsWith('/') ? filePath : `${this.baseDir}${filePath}`;
            const content = await fs.readFile(fullPath, 'utf8');

            if (this.enableCache) {
                this.cache.set(filePath, content);
            }

            return content;
        } catch (error) {
            throw new Error(`Failed to load template: ${filePath} - ${error.message}`);
        }
    }

    async processIncludes(template, depth = 0) {
        if (depth >= this.maxDepth) {
            throw new Error(`Maximum template inclusion depth (${this.maxDepth}) exceeded`);
        }

        const includes = [];
        let match;

        this.includePattern.lastIndex = 0;
        while ((match = this.includePattern.exec(template)) !== null) {
            includes.push({
                fullMatch: match[0],
                filePath: match[1].trim(),
                index: match.index
            });
        }

        for (let i = includes.length - 1; i >= 0; i--) {
            const include = includes[i];

            try {
                let includedContent = await this.loadTemplate(include.filePath);

                includedContent = await this.processIncludes(includedContent, depth + 1);

                template = template.substring(0, include.index) +
                    includedContent +
                    template.substring(include.index + include.fullMatch.length);
            } catch (error) {
                console.error(`Error including template ${include.filePath}:`, error);
                template = template.replace(include.fullMatch, `<!-- Error loading ${include.filePath} -->`);
            }
        }

        return template;
    }

    replaceVariables(template, data) {
        return template.replace(this.variablePattern, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;

            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return match;
                }
            }

            if (value === null || value === undefined) {
                return '';
            }

            if (typeof value === 'object') {
                return JSON.stringify(value);
            }

            return String(value);
        });
    }

    async render(templatePath, data = {}) {
        try {
            let template = await this.loadTemplate(templatePath);

            template = await this.processIncludes(template);

            template = this.replaceVariables(template, data);

            return template;
        } catch (error) {
            throw new Error(`Failed to render template ${templatePath}: ${error.message}`);
        }
    }

    async renderString(templateString, data = {}) {
        try {
            let template = await this.processIncludes(templateString);

            template = this.replaceVariables(template, data);

            return template;
        } catch (error) {
            throw new Error(`Failed to render template string: ${error.message}`);
        }
    }

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

export function createTemplateEngine(options = {}) {
    return new TemplateEngine(options);
}

export { TemplateEngine };

export async function renderTemplate(path, data = {}, options = {}) {
    const engine = new TemplateEngine(options);
    return engine.render(path, data);
}

export function createRenderer(config = {}) {
    const engine = new TemplateEngine(config);

    return {
        render: (path, data) => engine.render(path, data),
        renderString: (str, data) => engine.renderString(str, data),
        renderBatch: (templates) => engine.renderBatch(templates),
        clearCache: () => engine.clearCache(),
        engine
    };
}