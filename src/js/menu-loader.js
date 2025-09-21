const menuLoader = {
    async loadMenuSystem() {
        try {
            if (!window.menuManager) {
                const script = document.createElement('script');
                script.src = '/src/js/menu-manager.js';
                script.onload = () => {
                    this.initializeMenuManager();
                };
                document.head.appendChild(script);
            } else {
                this.initializeMenuManager();
            }
        } catch (error) {
            console.error('Failed to load menu system:', error);
        }
    },

    initializeMenuManager() {
        if (window.menuManager && window.menuManager.menuConfig) {
            this.setupMenuUpdateListeners();
        } else {
            setTimeout(() => this.initializeMenuManager(), 100);
        }
    },

    setupMenuUpdateListeners() {
        const originalLoadUserData = window.loadUserData;
        if (originalLoadUserData) {
            window.loadUserData = function() {
                originalLoadUserData.apply(this, arguments);
                setTimeout(() => {
                    if (window.menuManager) {
                        window.menuManager.updateMenu();
                    }
                }, 500);
            };
        }

        window.addEventListener('userLoggedIn', () => {
            if (window.menuManager) {
                window.menuManager.updateMenu();
            }
        });

        window.addEventListener('userLoggedOut', () => {
            if (window.menuManager) {
                window.menuManager.updateMenu();
            }
        });

        window.addEventListener('resize', () => {
            setTimeout(() => {
                if (window.menuManager) {
                    window.menuManager.updateMenu();
                }
            }, 250);
        });
    }
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        menuLoader.loadMenuSystem();
    });
}

window.menuLoader = menuLoader;