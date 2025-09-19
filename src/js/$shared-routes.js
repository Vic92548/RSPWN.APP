const ROUTES = {
    home: {
        path: '/',
        meta: {
            title: 'VAPR - The Gamer\'s Social Network',
            description: 'Join RSPWN - The Gamer\'s Social Network. Connect with gamers, share content, and grow your audience.',
            requiresAuth: false
        },
        frontend: () => {
            showInitialPost();
        }
    },

    post: {
        path: '/post/:id',
        meta: {
            title: 'VAPR Post',
            description: 'Check out this post on VAPR',
            requiresAuth: false
        },
        frontend: (params) => {
            showPost();
            displayPost(params.id);
        }
    },

    profile: {
        path: '/@:username',
        meta: {
            title: 'VAPR Profile',
            description: 'View this user\'s profile on VAPR',
            requiresAuth: false
        },
        frontend: async (params) => {
            hidePost();
            cardManager.show('profile-card');
        }
    },

    library: {
        path: '/library',
        meta: {
            title: 'My Library - VAPR',
            description: 'Your personal game library on VAPR',
            requiresAuth: true
        },
        frontend: async () => {
            hidePost();
            if (!isUserLoggedIn()) {
                openRegisterModal();
                return;
            }
            await cardManager.show('library-card');
        }
    },

    newPost: {
        path: '/new-post',
        meta: {
            title: 'Create New Post - VAPR',
            description: 'Share your content with the RSPWN community',
            requiresAuth: true
        },
        frontend: async () => {
            hidePost();
            openAddPostPage();
        }
    },

    create: {
        path: '/create',
        meta: {
            title: 'Create New Post - VAPR',
            description: 'Share your content with the RSPWN community',
            requiresAuth: true
        },
        frontend: async () => {
            hidePost();
            openAddPostPage();
        }
    },

    downloads: {
        path: '/downloads',
        meta: {
            title: 'Downloads - VAPR',
            description: 'Manage your game downloads',
            requiresAuth: true
        },
        frontend: async () => {
            hidePost();
            await openDownloadsPage();
        }
    },

    terms: {
        path: '/terms',
        meta: {
            title: 'Terms of Service - VAPR',
            description: 'VAPR Terms of Service - Read our platform guidelines and user agreement',
            requiresAuth: false
        },
        frontend: () => {
            console.log('Terms route handler called');
            console.log('hidePost function exists:', typeof hidePost);
            console.log('openTermsPage function exists:', typeof openTermsPage);

            if (typeof hidePost === 'function') {
                console.log('Calling hidePost...');
                hidePost();
                console.log('hidePost called');
            }

            if (typeof openTermsPage === 'function') {
                console.log('Calling openTermsPage...');
                openTermsPage();
                console.log('openTermsPage called');
            }
        }
    },

    privacy: {
        path: '/privacy',
        meta: {
            title: 'Privacy Policy - VAPR',
            description: 'VAPR Privacy Policy - Learn how we protect and handle your personal information',
            requiresAuth: false
        },
        frontend: () => {
            console.log('Privacy route handler called');
            console.log('hidePost function exists:', typeof hidePost);
            console.log('openPrivacyPage function exists:', typeof openPrivacyPage);
            hidePost();
            openPrivacyPage();
        }
    },

    store: {
        path: '/store',
        meta: {
            title: 'Game Store - VAPR',
            description: 'VAPR Game Store - Discover and purchase amazing games and digital content',
            requiresAuth: false
        },
        frontend: () => {
            hidePost();
            openStorePage();
        }
    },

    creators: {
        path: '/creators',
        meta: {
            title: 'Creator Program - VAPR',
            description: 'Join the VAPR Creator Program and monetize your content',
            requiresAuth: true
        },
        frontend: () => {
            hidePost();
            window.open('/creators', '_blank');
        }
    },

    partners: {
        path: '/partners',
        meta: {
            title: 'Partner Portal - VAPR',
            description: 'Manage your partnership with VAPR',
            requiresAuth: true
        },
        frontend: () => {
            hidePost();
            window.open('/partners', '_blank');
        }
    },

    join: {
        path: '/join',
        meta: {
            title: 'Join RSPWN',
            description: 'Join RSPWN - The Gamer\'s Social Network. Connect with gamers, share content, and grow your audience.',
            requiresAuth: false
        },
        frontend: () => {
            hidePost();
            openAuthPage();
        }
    },

    auth: {
        path: '/auth',
        meta: {
            title: 'Login - VAPR',
            description: 'Login to your VAPR account',
            requiresAuth: false
        },
        frontend: () => {
            hidePost();
            openAuthPage();
        }
    },

    register: {
        path: '/register',
        meta: {
            title: 'Register - VAPR',
            description: 'Create your VAPR account',
            requiresAuth: false
        },
        frontend: () => {
            hidePost();
            openAuthPage();
        }
    },

    login: {
        path: '/login',
        meta: {
            title: 'Login - VAPR',
            description: 'Login to your VAPR account',
            requiresAuth: false
        },
        frontend: () => {
            hidePost();
            openAuthPage();
        }
    },

    games: {
        path: '/games/:gameName',
        meta: {
            title: 'Game - VAPR',
            description: 'View game details on VAPR',
            requiresAuth: false
        },
        frontend: (params) => {
            hidePost();
            if (typeof openGamePage === 'function') {
                openGamePage(params.gameName);
            } else {
                router.navigate(`/games/${params.gameName}`, false);
            }
        }
    },

    checkoutSuccess: {
        path: '/checkout/success',
        meta: {
            title: 'Purchase Successful - VAPR',
            description: 'Your purchase was successful',
            requiresAuth: false
        },
        frontend: () => {
            hidePost();
            if (typeof showCheckoutSuccess === 'function') {
                showCheckoutSuccess();
            }
        }
    },

    checkoutCancel: {
        path: '/checkout/cancel',
        meta: {
            title: 'Purchase Cancelled - VAPR',
            description: 'Your purchase was cancelled',
            requiresAuth: false
        },
        frontend: () => {
            hidePost();
            if (typeof showCheckoutCancel === 'function') {
                showCheckoutCancel();
            }
        }
    }
};

function getRouteByPath(path) {
    for (const [key, route] of Object.entries(ROUTES)) {
        if (matchRoutePath(route.path, path)) {
            return { key, route };
        }
    }
    return null;
}

function matchRoutePath(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return false;

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            const paramName = patternParts[i].slice(1);
            params[paramName] = decodeURIComponent(pathParts[i]);
        } else if (patternParts[i] !== pathParts[i]) {
            return false;
        }
    }

    return { params };
}

function extractParams(pattern, path) {
    const match = matchRoutePath(pattern, path);
    return match ? match.params : {};
}

function buildPath(routeKey, params = {}) {
    const route = ROUTES[routeKey];
    if (!route) return null;

    let path = route.path;
    for (const [key, value] of Object.entries(params)) {
        path = path.replace(`:${key}`, encodeURIComponent(value));
    }

    return path;
}

function getAllPaths() {
    return Object.values(ROUTES).map(route => route.path);
}

function getStaticPaths() {
    return Object.values(ROUTES)
        .filter(route => !route.path.includes(':'))
        .map(route => route.path);
}

window.ROUTES = ROUTES;
window.getRouteByPath = getRouteByPath;
window.matchRoutePath = matchRoutePath;
window.extractParams = extractParams;
window.buildPath = buildPath;
window.getAllPaths = getAllPaths;
window.getStaticPaths = getStaticPaths;

console.log('Unified routes system loaded with', Object.keys(ROUTES).length, 'routes');