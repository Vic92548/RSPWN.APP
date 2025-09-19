router.register('/', () => {
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

router.register('/library', async () => {
    hidePost();
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('library-card');
});

router.register('/new-post', async () => {
    hidePost();

    // Wait for user data to be loaded if it's still loading
    if (!window.user && loading_steps > 0) {
        // Wait a bit for loadUserData to complete
        await new Promise(resolve => {
            const checkAuth = () => {
                if (window.user || loading_steps === 0) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    openAddPostPage();
});

router.register('/create', async () => {
    hidePost();

    // Wait for user data to be loaded if it's still loading
    if (!window.user && loading_steps > 0) {
        // Wait a bit for loadUserData to complete
        await new Promise(resolve => {
            const checkAuth = () => {
                if (window.user || loading_steps === 0) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    openAddPostPage();
});

router.register('/downloads', async () => {

    if (!isRunningInTauri()) {
        notify.warning('Desktop App Required', 'The downloads manager requires the VAPR desktop app.');
        return;
    }
    hidePost();
    await cardManager.show('downloads-card');
});

router.register('/terms', () => {
    hidePost();
    openTermsPage();
});

router.register('/join', () => {
    hidePost();
    openAuthPage();
});

router.register('/auth', () => {
    hidePost();
    openAuthPage();
});

router.register('/register', () => {
    hidePost();
    openAuthPage();
});

router.register('/login', () => {
    hidePost();
    openAuthPage();
});