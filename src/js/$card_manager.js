// Card Manager - Manages slide-up cards (add post, analytics, backgrounds)
const cardManager = {
    currentCard: null,
    cards: new Map(),

    // Register a card with its callbacks
    register(cardId, options = {}) {
        this.cards.set(cardId, {
            onShow: options.onShow || (() => {}),
            onHide: options.onHide || (() => {}),
            onLoad: options.onLoad || null,
            ...options
        });
    },

    // Show a card
    async show(cardId) {
        const card = document.getElementById(cardId);
        if (!card) {
            console.error(`Card ${cardId} not found`);
            return;
        }

        // Hide menu if it's open
        if (window.hideMenu) hideMenu();

        // Hide current card if any (without restoring post)
        if (this.currentCard && this.currentCard !== cardId) {
            await this.hideCard(this.currentCard, true);
        }

        // Hide the post
        const post = document.querySelector('.post');
        if (post) {
            post.style.display = 'none';
        }

        // Show the card
        card.style.display = 'block';

        // Trigger animation after a frame
        setTimeout(() => {
            card.classList.add('show');
        }, 10);

        this.currentCard = cardId;

        // Handle loading if needed
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

        // Call onShow
        config.onShow();
    },

    // Hide a card
    hide(cardId) {
        return this.hideCard(cardId, false);
    },

    // Internal hide method
    hideCard(cardId, skipPostRestore = false) {
        return new Promise((resolve) => {
            const card = document.getElementById(cardId);
            if (!card) {
                resolve();
                return;
            }

            const config = this.cards.get(cardId) || {};

            // Remove show class to trigger animation
            card.classList.remove('show');

            // Wait for animation to complete
            setTimeout(() => {
                card.style.display = 'none';

                // Show the post again unless skipping
                if (!skipPostRestore) {
                    const post = document.querySelector('.post');
                    if (post) {
                        post.style.display = 'block';
                    }
                }

                // Call onHide
                config.onHide();

                if (this.currentCard === cardId) {
                    this.currentCard = null;
                }

                resolve();
            }, 800); // Match your CSS transition duration
        });
    },

    // Show loading state
    showLoading(cardId) {
        const card = document.getElementById(cardId);

        // For analytics card
        if (cardId === 'analytics-card') {
            const loading = document.getElementById('analytics-loading');
            const content = document.querySelector('.analytics-body');
            if (loading) loading.style.display = 'block';
            if (content) content.style.opacity = '0.3';
        }
        // For backgrounds card
        else if (cardId === 'backgrounds-card') {
            const loading = document.getElementById('backgrounds-loading');
            const content = document.getElementById('backgroundsContent');
            if (loading) loading.style.display = 'block';
            if (content) content.style.opacity = '0.3';
        }
    },

    // Hide loading state
    hideLoading(cardId) {
        const card = document.getElementById(cardId);

        // For analytics card
        if (cardId === 'analytics-card') {
            const loading = document.getElementById('analytics-loading');
            const content = document.querySelector('.analytics-body');
            if (loading) loading.style.display = 'none';
            if (content) content.style.opacity = '1';
        }
        // For backgrounds card
        else if (cardId === 'backgrounds-card') {
            const loading = document.getElementById('backgrounds-loading');
            const content = document.getElementById('backgroundsContent');
            if (loading) loading.style.display = 'none';
            if (content) content.style.opacity = '1';
        }
    },

    // Check if a card is currently shown
    isShown(cardId) {
        return this.currentCard === cardId;
    },

    // Get current card
    getCurrentCard() {
        return this.currentCard;
    }
};

// Make it globally available
window.cardManager = cardManager;