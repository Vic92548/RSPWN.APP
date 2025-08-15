async function addToCart(tebexPackageId) {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    try {
        loading.show();

        // Find the game and its store info
        const game = gamesData.tebexGames.find(g => g.tebexId === tebexPackageId);
        if (!game || !game.storeInfo) {
            throw new Error('Game or store information not found');
        }

        const webstoreToken = game.storeInfo.webstoreToken;

        const basketResponse = await tebexAPI.createBasket(
            `${window.location.origin}/checkout/success`,
            `${window.location.origin}/checkout/cancel`,
            webstoreToken
        );

        const basketIdent = basketResponse.data.ident;

        await tebexAPI.addToBasket(basketIdent, tebexPackageId, 1);

        // Try to apply creator code if applicable
        const gameId = await findGameIdFromPackageId(tebexPackageId);
        if (gameId) {
            const creatorResponse = await api.request(`/api/creators/code-for-purchase/${gameId}`);
            if (creatorResponse.success && creatorResponse.hasCreatorCode) {
                await tebexAPI.applyCreatorCode(basketIdent, creatorResponse.creatorCode, webstoreToken);
            }
        }

        const basketData = await tebexAPI.getBasket(basketIdent, webstoreToken);

        // Redirect to checkout
        window.location.href = basketData.data.links.checkout;

    } catch (error) {
        console.error('Failed to redirect to checkout:', error);
        notify.error('Failed to process checkout');
    } finally {
        loading.hide();
    }
}

function handleCheckoutSuccess() {
    notify.success('Purchase completed successfully!');

    if (window.loadLibraryData) {
        loadLibraryData();
    }
}

function handleCheckoutCancel() {
    notify.info('Checkout cancelled');
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (window.location.pathname === '/checkout/success') {
        handleCheckoutSuccess();
        window.history.replaceState({}, '', '/');
    } else if (window.location.pathname === '/checkout/cancel') {
        handleCheckoutCancel();
        window.history.replaceState({}, '', '/');
    }
});

window.addToCart = addToCart;