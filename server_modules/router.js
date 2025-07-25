export class FastRouter {
    constructor() {
        this.routes = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
            PATCH: {}
        };

        this.cache = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
            PATCH: {}
        };

        this.patterns = {
            GET: [],
            POST: [],
            PUT: [],
            DELETE: [],
            PATCH: []
        };
    }

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

        this.routes[method][path] = routeConfig;

        if (routeConfig.isPattern || options.prefix) {
            this.patterns[method].push({
                path,
                ...routeConfig
            });
            this.patterns[method].sort((a, b) => {
                const aSegments = a.path.split('/').length;
                const bSegments = b.path.split('/').length;
                if (aSegments !== bSegments) return bSegments - aSegments;
                return b.path.length - a.path.length;
            });
        }

        return this;
    }

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

    find(method, pathname) {
        const methodRoutes = this.routes[method];
        if (!methodRoutes) {
            return null;
        }

        if (this.cache[method][pathname]) {
            return this.cache[method][pathname];
        }

        if (methodRoutes[pathname]) {
            const route = methodRoutes[pathname];
            if (!route.isPattern) {
                this.cache[method][pathname] = {
                    ...route,
                    params: {}
                };
                return this.cache[method][pathname];
            }
        }

        const patterns = this.patterns[method];
        for (const pattern of patterns) {
            let matches = false;
            let params = {};

            if (pattern.prefix) {
                if (pathname.startsWith(pattern.path)) {
                    matches = true;
                }
            } else if (pattern.path.includes(':')) {
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

    async handle(request, authenticateRequest) {
        const url = new URL(request.url);
        const method = request.method;
        const pathname = url.pathname;

        const route = this.find(method, pathname);

        if (!route) {
            return null;
        }

        if (route.requireAuth) {
            const authResult = await authenticateRequest(request);
            if (!authResult.isValid) {
                return new Response("Unauthorized", { status: 401 });
            }
            return route.handler(request, url, authResult, route.params);
        }

        return route.handler(request, url, route.params);
    }

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