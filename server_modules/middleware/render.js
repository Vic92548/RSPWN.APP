import { config } from '../config.js';

export function createRenderMiddleware(templates) {
    return function render(req, res, next) {
        res.render = async function(templatePath, data = {}) {
            try {
                const htmlContent = await templates.render(templatePath, data);
                res.status(200).type('html').send(htmlContent);
            } catch (error) {
                console.error('Template rendering error:', error);
                res.status(500).send(config.messages.errors.internalError);
            }
        };
        next();
    };
}