const cardManager = {
    currentCard: null,
    cards: new Map(),
    isNavigating: false,
    previousPath: null,

    register(cardId, options = {}) {
        this.cards.set(cardId, {
            onShow: options.onShow || (() => {}),
            onHide: options.onHide || (() => {}),
            onLoad: options.onLoad || null,
            route: options.route || null,
            ...options
        });
    },

    async show(cardId) {
        const card = document.getElementById(cardId);
        if (!card) {
            console.error(`Card ${cardId} not found`);
            return;
        }

        if (window.hideMenu) hideMenu();

        this.previousPath = window.location.pathname;

        if (this.currentCard && this.currentCard !== cardId) {
            await this.hideCard(this.currentCard, true);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const post = document.querySelector('.post');
        if (post) {
            post.style.display = 'none';
        }

        card.style.display = 'block';

        setTimeout(() => {
            card.classList.add('show');
        }, 10);

        this.currentCard = cardId;

        const config = this.cards.get(cardId) || {};

        if (config.route && window.router && !this.isNavigating) {
            const currentPath = window.location.pathname;
            if (currentPath !== config.route) {
                this.isNavigating = true;
                window.history.pushState(null, null, config.route);
                this.isNavigating = false;
            }
        }

        if (config.onLoad) {
            this.showLoading(cardId);
            try {
                await config.onLoad();
            } catch (error) {
                console.error(`Error loading card ${cardId}:`, error);
            } finally {
                this.hideLoading(cardId);
            }
        }

        if(config.onShow) config.onShow();
    },

    hide(cardId) {
        return this.hideCard(cardId, false);
    },

    hideCard(cardId, skipPostRestore = false) {
        return new Promise((resolve) => {
            const card = document.getElementById(cardId);
            if (!card) {
                resolve();
                return;
            }

            const config = this.cards.get(cardId) || {};

            if (cardId === 'downloads-card' && window.downloadManager) {
                window.downloadManager.pauseEventProcessing();
            }

            card.classList.remove('show');

            setTimeout(() => {
                card.style.display = 'none';

                if(config.onHide) {
                    try {
                        config.onHide();
                    } catch (error) {
                        console.error('Error in onHide:', error);
                    }
                }

                if (this.currentCard === cardId) {
                    this.currentCard = null;
                }

                if (cardId === 'downloads-card' && window.downloadManager) {
                    setTimeout(() => {
                        window.downloadManager.resumeEventProcessing();
                    }, 100);
                }

                if (!skipPostRestore) {
                    const post = document.querySelector('.post');
                    if (post) {
                        post.style.display = 'block';
                        post.style.transform = 'translate(0px, 0px) rotate(0deg)';
                    }

                    if (window.router && !this.isNavigating) {
                        let targetPath = '/';

                        if (window.current_post_id) {
                            targetPath = `/post/${window.current_post_id}`;
                        } else if (this.previousPath && this.previousPath !== window.location.pathname) {
                            targetPath = this.previousPath;
                        }

                        this.isNavigating = true;
                        window.history.pushState(null, null, targetPath);

                        if (targetPath === '/' || targetPath.startsWith('/post/')) {
                            if (window.showPost) window.showPost();
                            if (window.displayPost) {
                                if (targetPath.startsWith('/post/')) {
                                    const postId = targetPath.split('/')[2];
                                    window.displayPost(postId);
                                } else {
                                    window.displayPost();
                                }
                            }
                        }

                        this.isNavigating = false;
                    }
                }

                resolve();
            }, 300);
        });
    },

    showLoading(cardId) {
        const card = document.getElementById(cardId);

        if (cardId === 'analytics-card') {
            const loading = document.getElementById('analytics-loading');
            const content = document.querySelector('.analytics-body');
            if (loading) loading.style.display = 'block';
            if (content) content.style.opacity = '0.3';
        }
        else if (cardId === 'backgrounds-card') {
            const loading = document.getElementById('backgrounds-loading');
            const content = document.getElementById('backgroundsContent');
            if (loading) loading.style.display = 'block';
            if (content) content.style.opacity = '0.3';
        }
        else if (cardId === 'games-card') {
            const loading = document.getElementById('games-loading');
            const content = document.getElementById('gamesContent');
            if (loading) loading.style.display = 'block';
            if (content) content.style.opacity = '0.3';
        }
    },

    hideLoading(cardId) {
        const card = document.getElementById(cardId);

        if (cardId === 'analytics-card') {
            const loading = document.getElementById('analytics-loading');
            const content = document.querySelector('.analytics-body');
            if (loading) loading.style.display = 'none';
            if (content) content.style.opacity = '1';
        }
        else if (cardId === 'backgrounds-card') {
            const loading = document.getElementById('backgrounds-loading');
            const content = document.getElementById('backgroundsContent');
            if (loading) loading.style.display = 'none';
            if (content) content.style.opacity = '1';
        }
        else if (cardId === 'games-card') {
            const loading = document.getElementById('games-loading');
            const content = document.getElementById('gamesContent');
            if (loading) loading.style.display = 'none';
            if (content) content.style.opacity = '1';
        }
    }
};

window.cardManager = cardManager;