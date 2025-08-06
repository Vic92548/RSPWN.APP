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