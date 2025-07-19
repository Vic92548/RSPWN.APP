// router.js - Fast pattern-matching router with caching
export class FastRouter {
    constructor() {
        // Structure: routes[method][path] for ALL routes (exact and patterns)
        this.routes = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
            PATCH: {}
        };

        // Cache for resolved paths: cache[method][actualPath] = routeConfig
        this.cache = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
            PATCH: {}
        };

        // Pattern routes that need matching (stored separately for efficiency)
        this.patterns = {
            GET: [],
            POST: [],
            PUT: [],
            DELETE: [],
            PATCH: []
        };
    }

    // Add route
    add(method, path, handler, options = {}) {
        if (!this.routes[method]) {
            throw new Error(`Unsupported method: ${method}`);
        }

        const routeConfig = {
            path,
            handler,
            requireAuth: options.requireAuth || false,
            isPattern: path.includes(':') || path.includes('*') || options.prefix,
            ...options
        };

        // Store in main routes object
        this.routes[method][path] = routeConfig;

        // If it's a pattern route, also store in patterns array
        if (routeConfig.isPattern || options.prefix) {
            this.patterns[method].push({
                path,
                ...routeConfig
            });
            // Sort patterns by specificity (longer paths first, then by number of segments)
            this.patterns[method].sort((a, b) => {
                const aSegments = a.path.split('/').length;
                const bSegments = b.path.split('/').length;
                if (aSegments !== bSegments) return bSegments - aSegments;
                return b.path.length - a.path.length;
            });
        }

        return this;
    }

    // Convenience methods
    get(path, handler, options) {
        return this.add('GET', path, handler, options);
    }

    post(path, handler, options) {
        return this.add('POST', path, handler, options);
    }

    put(path, handler, options) {
        return this.add('PUT', path, handler, options);
    }

    delete(path, handler, options) {
        return this.add('DELETE', path, handler, options);
    }

    patch(path, handler, options) {
        return this.add('PATCH', path, handler, options);
    }

    // Extract params from dynamic route
    extractParams(pattern, pathname) {
        const params = {};
        const patternParts = pattern.split('/');
        const pathParts = pathname.split('/');

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            }
        }

        return params;
    }

    // Find matching route
    find(method, pathname) {
        const methodRoutes = this.routes[method];
        if (!methodRoutes) {
            return null;
        }

        // 1. Check cache first (O(1))
        if (this.cache[method][pathname]) {
            return this.cache[method][pathname];
        }

        // 2. Try exact match (O(1))
        if (methodRoutes[pathname]) {
            const route = methodRoutes[pathname];
            if (!route.isPattern) {
                // Cache it for next time (even exact matches benefit from cache)
                this.cache[method][pathname] = {
                    ...route,
                    params: {}
                };
                return this.cache[method][pathname];
            }
        }

        // 3. Try pattern matching
        const patterns = this.patterns[method];
        for (const pattern of patterns) {
            let matches = false;
            let params = {};

            if (pattern.prefix) {
                // Simple prefix matching
                if (pathname.startsWith(pattern.path)) {
                    matches = true;
                }
            } else if (pattern.path.includes(':')) {
                // Dynamic route matching
                const patternParts = pattern.path.split('/');
                const pathParts = pathname.split('/');

                if (patternParts.length === pathParts.length) {
                    matches = true;
                    for (let i = 0; i < patternParts.length; i++) {
                        if (patternParts[i].startsWith(':')) {
                            params[patternParts[i].slice(1)] = pathParts[i];
                        } else if (patternParts[i] !== pathParts[i]) {
                            matches = false;
                            break;
                        }
                    }
                }
            }

            if (matches) {
                // Found a match! Cache it for next time
                const resolvedRoute = {
                    ...pattern,
                    params
                };

                this.cache[method][pathname] = resolvedRoute;
                return resolvedRoute;
            }
        }

        return null;
    }

    // Main handler method
    async handle(request, authenticateRequest) {
        const url = new URL(request.url);
        const method = request.method;
        const pathname = url.pathname;

        // Find matching route (using cache if available)
        const route = this.find(method, pathname);

        if (!route) {
            return null; // Let the caller handle 404
        }

        // Handle authentication if required
        if (route.requireAuth) {
            const authResult = await authenticateRequest(request);
            if (!authResult.isValid) {
                return new Response("Unauthorized", { status: 401 });
            }
            // Pass the authResult object as the third parameter
            return route.handler(request, url, authResult, route.params);
        }

        return route.handler(request, url, route.params);
    }

    // Cache management methods
    clearCache() {
        this.cache = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
            PATCH: {}
        };
    }

    getCacheStats() {
        const stats = {};
        for (const method in this.cache) {
            stats[method] = Object.keys(this.cache[method]).length;
        }
        return stats;
    }
}