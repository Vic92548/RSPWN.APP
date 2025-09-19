import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let ROUTES, getStaticPaths, getRouteByPath, extractParams;

try {
    const routesContent = readFileSync(join(__dirname, '../src/js/$shared-routes.js'), 'utf8');

    const routesCode = routesContent
        .replace(/window\./g, 'global.')
        .replace(/console\.log\(.*?\);?/g, '');

    eval(routesCode);

    ROUTES = global.ROUTES;
    getStaticPaths = global.getStaticPaths;
    getRouteByPath = global.getRouteByPath;
    extractParams = global.extractParams;

    console.log('✓ Unified routes loaded for backend');
} catch (error) {
    console.error('Failed to load unified routes:', error);
    ROUTES = {};
    getStaticPaths = () => [];
    getRouteByPath = () => null;
    extractParams = () => ({});
}

import { config } from './config.js';

export function setupUnifiedRoutes(app, templates) {
    console.log('Setting up SPA fallback routing...');

    // Add a catch-all handler for unmatched routes (SPA fallback)
    app.get('*', async (req, res, next) => {
        // Skip API routes, static files, and other specific handlers
        if (req.path.startsWith('/api/') ||
            req.path.startsWith('/auth/') ||
            req.path.startsWith('/me') ||
            req.path.startsWith('/feed') ||
            req.path.startsWith('/posts/') ||
            req.path.startsWith('/post/') ||
            req.path.startsWith('/games/') ||
            req.path.startsWith('/like/') ||
            req.path.startsWith('/dislike/') ||
            req.path.startsWith('/skip/') ||
            req.path.includes('.') ||
            req.path === '/login' ||
            req.path === '/logout' ||
            req.path === '/sitemap.xml' ||
            req.path.startsWith('/@') ||
            req.path.startsWith('/creators') ||
            req.path.startsWith('/partners') ||
            req.path.startsWith('/terms') ||
            req.path.startsWith('/downloads') ||
            req.path.startsWith('/privacy') ||
            req.path.startsWith('/store')) {
            return next();
        }

        // SPA fallback - serve main index.html for unmatched routes
        const routeMatch = getRouteByPath(req.path);
        const meta = routeMatch?.route?.meta || {};

        await res.render('index.html', {
            meta_description: meta.description || config.meta.default.description,
            meta_author: config.meta.default.author,
            meta_image: config.meta.default.image,
            meta_url: (config.server?.baseUrl || config.meta.default.url) + req.path
        });
    });

    console.log('✓ Unified SPA fallback routing configured');
}

export function getRouteMetaForPath(path) {
    const routeMatch = getRouteByPath(path);
    if (routeMatch) {
        return routeMatch.route.meta;
    }
    return null;
}

export function isValidRoute(path) {
    return getRouteByPath(path) !== null;
}

export function getRouteParams(path) {
    const routeMatch = getRouteByPath(path);
    if (routeMatch) {
        return extractParams(routeMatch.route.path, path);
    }
    return {};
}