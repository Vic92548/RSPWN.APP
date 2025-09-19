window.navigation = {
    goTo: (routeKey, params = {}, frontendOnly = true) => {
        if (window.router && window.router.navigateToRoute) {
            window.router.navigateToRoute(routeKey, params, frontendOnly);
        } else {
            const path = window.buildPath ? window.buildPath(routeKey, params) : null;
            if (path) {
                if (frontendOnly) {
                    history.pushState(null, null, path);
                    if (window.router && window.router.handleRoute) {
                        window.router.handleRoute();
                    }
                } else {
                    window.location.href = path;
                }
            }
        }
    },

    goToPost: (postId, frontendOnly = true) => {
        window.navigation.goTo('post', { id: postId }, frontendOnly);
    },

    goToProfile: (username, frontendOnly = true) => {
        window.navigation.goTo('profile', { username }, frontendOnly);
    },

    goToGame: (gameName, frontendOnly = true) => {
        window.navigation.goTo('games', { gameName }, frontendOnly);
    },

    goHome: (frontendOnly = true) => {
        window.navigation.goTo('home', {}, frontendOnly);
    },

    goToLibrary: (frontendOnly = true) => {
        window.navigation.goTo('library', {}, frontendOnly);
    },

    goToCreate: (frontendOnly = true) => {
        window.navigation.goTo('create', {}, frontendOnly);
    },

    goToAuth: (frontendOnly = true) => {
        window.navigation.goTo('auth', {}, frontendOnly);
    },

    goToStore: (frontendOnly = true) => {
        window.navigation.goTo('store', {}, frontendOnly);
    },

    goToTerms: (frontendOnly = true) => {
        window.navigation.goTo('terms', {}, frontendOnly);
    },

    goToPrivacy: (frontendOnly = true) => {
        window.navigation.goTo('privacy', {}, frontendOnly);
    },

    goToDownloads: (frontendOnly = true) => {
        window.navigation.goTo('downloads', {}, frontendOnly);
    },

    goToCreators: (frontendOnly = true) => {
        window.navigation.goTo('creators', {}, frontendOnly);
    },

    goToPartners: (frontendOnly = true) => {
        window.navigation.goTo('partners', {}, frontendOnly);
    },

    getCurrentRoute: () => {
        return window.router ? window.router.getCurrentRoute() : null;
    },

    getParams: () => {
        return window.router ? window.router.getParams() : {};
    },

    refresh: () => {
        if (window.router && window.router.handleRoute) {
            window.router.handleRoute();
        }
    }
};