class VAPRRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.params = {};
        this.previousRoute = null;
    }

    register(pattern, handler) {
        this.routes.set(pattern, handler);
        console.log('ROUTE REGISTERED', {pattern, handler});
    }

    navigate(path, bIsFrontEndOnly = false) {
        if(bIsFrontEndOnly){
            history.pushState(null, null, path);
            this.handleRoute();
        }
        else{
            loading.show();
            window.location.href = path;
        }
    }

    handleRoute() {
        console.log('ROUTE');
        const path = window.location.pathname;
        this.previousRoute = this.currentRoute;

        if (cardManager.currentCard && !cardManager.isNavigating) {
            cardManager.hide(cardManager.currentCard);
        }

        if (path.startsWith('/@')) {
            this.currentRoute = '/@:username';
            const handler = this.routes.get('/@:username');
            if (handler) {
                handler(this.params);
                return;
            }
        }

        for (const [pattern, handler] of this.routes) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                this.currentRoute = pattern;
                this.params = match.params;
                handler(match.params);
                return;
            }
        }

        this.handle404();
    }

    matchRoute(pattern, path) {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length) return null;

        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                const paramName = patternParts[i].slice(1);
                params[paramName] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }

        return { params };
    }

    handle404() {
        this.currentRoute = '404';
        console.log('No route found for:', window.location.pathname);
        // Make sure to show the post when no route is found
        showPost();
        displayPost();
    }
}

window.router = new VAPRRouter();

window.addEventListener('popstate', () => {
    router.handleRoute();
});