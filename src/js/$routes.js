router.register('/', () => {
    console.log('MAIN ROUTE SHOW INITIAL POST');
    showInitialPost();
});

router.register('/post/:id', (params) => {
    showPost();
    displayPost(params.id);
});

router.register('/@:username', async (params) => {
    hidePost();
    cardManager.show('profile-card');
});

// Display game details by slug: /games/:gameName
router.register('/games/:gameName', async (params) => {
    try {
        hidePost();

        const toSlug = (s) => String(s)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Ensure games data is loaded
        if (!window.gamesData || (!gamesData.allGames?.length && !gamesData.tebexGames?.length)) {
            try {
                if (typeof loadGamesData === 'function') await loadGamesData();
                if (typeof loadTebexGames === 'function') await loadTebexGames();
            } catch (e) {
                console.error('Error loading games data:', e);
            }
        }

        const slug = decodeURIComponent(params.gameName || '').toLowerCase();

        let game = null;
        if (gamesData?.allGames?.length) {
            game = gamesData.allGames.find(g => toSlug(g.title) === slug) || null;
        }
        if (!game && gamesData?.tebexGames?.length) {
            game = gamesData.tebexGames.find(g => toSlug(g.title) === slug) || null;
        }

        if (game) {
            await showGameDetails(game.id);
        } else {
            console.warn('Game not found for slug:', slug);
            notify?.warning?.('Not found', 'We could not find that game.');
        }
    } catch (err) {
        console.error('Error handling game route:', err);
        notify?.error?.('Error', 'Failed to open game details');
    }
});

// Creator Program page: /creator-program
router.register('/creator-program', async () => {
    try {
        hidePost();
        if (typeof openCreatorProgram === 'function') {
            await openCreatorProgram();
        } else {
            // Fallback: show card directly if function missing
            cardManager.show('creator-program-card');
        }
    } catch (err) {
        console.error('Error opening creator program:', err);
    }
});

// Terms of Service page: /terms
router.register('/terms', () => {
    try {
        hidePost();
        cardManager.show('terms-card');
    } catch (err) {
        console.error('Error opening Terms of Service:', err);
    }
});

// Privacy Policy page: /privacy
router.register('/privacy', () => {
    try {
        hidePost();
        cardManager.show('privacy-card');
    } catch (err) {
        console.error('Error opening Privacy Policy:', err);
    }
});