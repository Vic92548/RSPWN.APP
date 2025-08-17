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

router.register('/analytics', async () => {
    hidePost();
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('analytics-card');
});

router.register('/backgrounds', async () => {
    hidePost();
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('backgrounds-card');
});

router.register('/games', async () => {
    hidePost();
    await cardManager.show('games-card');
});

router.register('/library', async () => {
    hidePost();
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('library-card');
});

router.register('/games/:gameName', async (params) => {
    try {
        hidePost();

        const toSlug = (s) => String(s)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

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

router.register('/creator-program', async () => {
    try {
        hidePost();
        await cardManager.show('creator-program-card');
    } catch (err) {
        console.error('Error opening creator program:', err);
    }
});

router.register('/developer', async () => {
    hidePost();
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('developer-dashboard-card');
});

router.register('/creator-dashboard', async () => {
    hidePost();
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('creator-dashboard-card');
});

router.register('/new-post', async () => {
    hidePost();
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('add-post-card');
});

router.register('/downloads', async () => {

    if (!isRunningInTauri()) {
        notify.warning('Desktop App Required', 'The downloads manager requires the VAPR desktop app.');
        return;
    }
    hidePost();
    await cardManager.show('downloads-card');
});