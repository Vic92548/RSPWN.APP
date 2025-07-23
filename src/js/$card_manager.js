const cardManager = {
    currentCard: null,
    cards: new Map(),

    register(cardId, options = {}) {
        this.cards.set(cardId, {
            onShow: options.onShow || (() => {}),
            onHide: options.onHide || (() => {}),
            onLoad: options.onLoad || null,
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

        if (this.currentCard && this.currentCard !== cardId) {
            await this.hideCard(this.currentCard, true);
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

        config.onShow();
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

            card.classList.remove('show');

            setTimeout(() => {
                card.style.display = 'none';

                if (!skipPostRestore) {
                    const post = document.querySelector('.post');
                    if (post) {
                        post.style.display = 'block';
                    }
                }

                config.onHide();

                if (this.currentCard === cardId) {
                    this.currentCard = null;
                }

                resolve();
            }, 800);
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
    },

    isShown(cardId) {
        return this.currentCard === cardId;
    },

    getCurrentCard() {
        return this.currentCard;
    }
};

window.cardManager = cardManager;