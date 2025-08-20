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