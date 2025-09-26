console.log('Router initializing...');

class VAPRRouter {
    constructor() {
        this.currentRoute = null;
        this.params = {};
        this.previousRoute = null;
        this.authRetryCount = 0;
        this.initializeRoutes();
    }

    initializeRoutes() {
        console.log('Initializing unified routes...');
        if (typeof window.ROUTES !== 'undefined') {
            for (const [key, route] of Object.entries(window.ROUTES)) {
                console.log('ROUTE REGISTERED', { key, path: route.path, meta: route.meta });
            }
        } else {
            console.warn('Routes not yet loaded, will initialize when available');
        }
    }

    navigate(path, bIsFrontEndOnly = false) {
        if (bIsFrontEndOnly) {
            history.pushState(null, null, path);
            this.handleRoute();
        } else {
            loading.show();
            window.location.href = path;
        }
    }

    navigateToRoute(routeKey, params = {}, frontendOnly = true) {
        const path = window.buildPath ? window.buildPath(routeKey, params) : null;
        if (path) {
            this.navigate(path, frontendOnly);
        } else {
            console.error('Route not found:', routeKey);
        }
    }

    handleRoute() {
        console.log('📍 ROUTE handleRoute() called');
        const path = window.location.pathname;
        console.log('📍 Handling route for path:', path);
        console.log('📍 Current auth state - window.user:', window.user, 'loading_steps:', window.loading_steps);
        this.previousRoute = this.currentRoute;

        if (cardManager.currentCard && !cardManager.isNavigating) {
            cardManager.hide(cardManager.currentCard);
        }

        this.hideAllLegalPages();

        const routeMatch = window.getRouteByPath ? window.getRouteByPath(path) : null;
        console.log('Route match result:', routeMatch);

        if (routeMatch) {
            const { key, route } = routeMatch;
            const params = window.extractParams ? window.extractParams(route.path, path) : {};

            console.log('Executing route:', key, 'with params:', params);
            this.currentRoute = key;
            this.params = params;
            this.authRetryCount = 0; // Reset retry counter on successful route

            if (route.meta.requiresAuth && !isUserLoggedIn()) {
                console.log('Route requires auth but user not logged in');
                console.log('window.user:', window.user);
                console.log('isUserLoggedIn():', isUserLoggedIn());
                console.log('loading_steps:', window.loading_steps);

                // Wait a bit for user data to load if it's still loading
                if ((window.loading_steps > 0 || (localStorage.getItem('userData') && !window.user)) && this.authRetryCount < 5) {
                    this.authRetryCount++;
                    console.log('Auth not ready, retrying route in 500ms (attempt:', this.authRetryCount, ')');
                    setTimeout(() => {
                        this.handleRoute();
                    }, 500);
                    return;
                }

                console.log('Opening register modal');
                openRegisterModal();
                return;
            }

            if (route.frontend) {
                console.log('Calling route frontend handler');
                route.frontend(params);
            } else {
                console.log('No frontend handler for route');
            }

            // Highlight active menu item when route changes
            if (window.menuManager) {
                window.menuManager.highlightActiveMenuItem();
            }
            return;
        } else {
            console.log('No route match found for path:', path);
        }

        this.handle404();
    }

    matchRoute(pattern, path) {
        return window.matchRoutePath ? window.matchRoutePath(pattern, path) : null;
    }

    handle404() {
        this.currentRoute = '404';
        console.log('No route found for:', window.location.pathname);
        showPost();
        displayPost();
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getParams() {
        return this.params;
    }

    getRouteInfo(routeKey) {
        return window.ROUTES ? (window.ROUTES[routeKey] || null) : null;
    }

    hideAllLegalPages() {
        const legalPages = ['privacy-page', 'terms-page', 'store-page'];
        legalPages.forEach(pageId => {
            const page = DOM.get(pageId);
            if (page && page.style.display !== 'none') {
                page.style.display = 'none';
            }
        });
    }
}

console.log('🔧 Creating router, current auth state - window.user:', window.user, 'loading_steps:', window.loading_steps);
window.router = new VAPRRouter();

window.addEventListener('popstate', () => {
    router.handleRoute();
});