class VAPRTemplateEngine {
    constructor() {
        this.templates = new Map();
        this.rendered = new WeakSet();
        this.hooks = new Map();
    }

    init() {
        this.loadTemplates();
        this.processDocument();
        this.observeDOM();
    }

    on(selector, event, callback) {
        const key = `${selector}:${event}`;
        if (!this.hooks.has(key)) {
            this.hooks.set(key, []);
        }
        this.hooks.get(key).push(callback);
    }

    off(selector, event, callback) {
        const key = `${selector}:${event}`;
        if (this.hooks.has(key)) {
            const callbacks = this.hooks.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(element, event) {
        const tagName = element.tagName.toLowerCase();
        const id = element.id;
        const classes = Array.from(element.classList);

        const selectors = [
            tagName,
            ...classes.map(c => `.${c}`),
            id ? `#${id}` : null
        ].filter(Boolean);

        selectors.forEach(selector => {
            const key = `${selector}:${event}`;
            if (this.hooks.has(key)) {
                this.hooks.get(key).forEach(callback => {
                    callback(element);
                });
            }
        });

        const customSelectors = element.getAttribute('data-hook');
        if (customSelectors) {
            customSelectors.split(' ').forEach(selector => {
                const key = `${selector}:${event}`;
                if (this.hooks.has(key)) {
                    this.hooks.get(key).forEach(callback => {
                        callback(element);
                    });
                }
            });
        }
    }

    loadTemplates() {
        const templates = document.querySelectorAll('template[data-vapr]');
        templates.forEach(template => {
            const name = template.dataset.vapr;
            this.templates.set(name.toLowerCase(), template.innerHTML.trim());
        });
        console.log(`VAPR: Loaded ${this.templates.size} templates`);
    }

    processDocument() {
        this.templates.forEach((template, name) => {
            this.processElements(name);
        });
    }

    processElements(tagName) {
        const elements = document.querySelectorAll(tagName);
        elements.forEach(element => {
            if (!this.rendered.has(element)) {
                this.renderElement(element, tagName);
            }
        });
    }

    processConditionals(html, attributes) {
        // Process conditionals by finding matching pairs
        const processBlock = (text, isNegative) => {
            const regex = isNegative
                ? /\{\{\^([\w-]+)\}\}/g
                : /\{\{#([\w-]+)\}\}/g;

            let result = text;
            let match;

            // Find all opening tags
            const openings = [];
            while ((match = regex.exec(text)) !== null) {
                openings.push({
                    attr: match[1],
                    start: match.index,
                    end: match.index + match[0].length,
                    tag: match[0]
                });
            }

            // Process from last to first to handle nested conditionals
            for (let i = openings.length - 1; i >= 0; i--) {
                const opening = openings[i];
                const closingTag = `{{/${opening.attr}}}`;
                const closingIndex = result.indexOf(closingTag, opening.end);

                if (closingIndex !== -1) {
                    const content = result.substring(opening.end, closingIndex);
                    const value = attributes[opening.attr];

                    let shouldShow;
                    if (isNegative) {
                        // For negative conditionals, show if falsy
                        shouldShow = !value || value === 'false' || value === '';
                    } else {
                        // For positive conditionals, show if truthy
                        shouldShow = value && value !== 'false' && value !== '';
                    }

                    const replacement = shouldShow ? this.processConditionals(content, attributes) : '';

                    // Replace the entire conditional block
                    result = result.substring(0, opening.start) +
                        replacement +
                        result.substring(closingIndex + closingTag.length);
                }
            }

            return result;
        };

        // Process negative conditionals first
        html = processBlock(html, true);
        // Then process positive conditionals
        html = processBlock(html, false);

        return html;
    }

    renderElement(element, tagName) {
        const template = this.templates.get(tagName.toLowerCase());
        if (!template) return;

        const content = element.innerHTML;
        const attributes = {};

        for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
        }

        let html = template;

        // Replace slot tags
        html = html.replace(/<slot\s*\/?>/gi, content);

        // Process all conditionals (including nested ones)
        html = this.processConditionals(html, attributes);

        // Replace simple variables
        html = html.replace(/\{\{([\w-]+)\}\}/g, (match, attrName) => {
            const value = attributes[attrName];
            return value !== undefined && value !== null ? value : '';
        });

        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        let rootElement;
        let elementsToEmit = [];

        if (wrapper.children.length === 1) {
            const newElement = wrapper.firstElementChild;

            for (let attr of element.attributes) {
                if (!newElement.hasAttribute(attr.name)) {
                    newElement.setAttribute(attr.name, attr.value);
                }
            }

            element.replaceWith(newElement);
            rootElement = newElement;

            elementsToEmit = [newElement, ...newElement.querySelectorAll('*')];
        } else {
            element.innerHTML = wrapper.innerHTML;
            rootElement = element;

            elementsToEmit = [element, ...element.querySelectorAll('*')];
        }

        this.rendered.add(rootElement);

        elementsToEmit.forEach(el => {
            this.emit(el, 'created');
        });

        requestAnimationFrame(() => {
            if (rootElement.isConnected) {
                const connectedElements = wrapper.children.length === 1
                    ? [rootElement, ...rootElement.querySelectorAll('*')]
                    : [rootElement, ...rootElement.querySelectorAll('*')];

                connectedElements.forEach(el => {
                    if (el.isConnected) {
                        this.emit(el, 'mounted');
                    }
                });
            }
        });
    }

    observeDOM() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const tagName = node.tagName?.toLowerCase();

                        if (tagName && this.templates.has(tagName)) {
                            if (!this.rendered.has(node)) {
                                this.renderElement(node, tagName);
                            }
                        }

                        this.templates.forEach((template, name) => {
                            const children = node.querySelectorAll(name);
                            children.forEach(child => {
                                if (!this.rendered.has(child)) {
                                    this.renderElement(child, name);
                                }
                            });
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    refresh() {
        this.rendered = new WeakSet();
        this.processDocument();
    }

    render(element) {
        const tagName = element.tagName.toLowerCase();
        if (this.templates.has(tagName)) {
            this.renderElement(element, tagName);
        }
    }

    querySelector(selector) {
        return document.querySelector(selector);
    }

    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }
}

window.VAPR = new VAPRTemplateEngine();
window.VAPR.init();