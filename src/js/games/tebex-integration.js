async function initializeTebexIntegration() {
    if (!window.tebexCart) {
        window.tebexCart = new TebexCart();
    }
}

async function addToCart(tebexPackageId) {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    try {
        const basketResponse = await tebexAPI.createBasket(
            `${window.location.origin}/checkout/success`,
            `${window.location.origin}/checkout/cancel`
        );

        const basketIdent = basketResponse.data.ident;

        await tebexAPI.addToBasket(basketIdent, tebexPackageId, 1);

        const gameId = await findGameIdFromPackageId(tebexPackageId);
        if (gameId) {
            const creatorResponse = await api.request(`/api/creators/code-for-purchase/${gameId}`);
            if (creatorResponse.success && creatorResponse.hasCreatorCode) {
                await tebexAPI.applyCreatorCode(basketIdent, creatorResponse.creatorCode);
            }
        }

        const basketData = await tebexAPI.getBasket(basketIdent);
        window.location.href = basketData.data.links.checkout;

    } catch (error) {
        console.error('Failed to redirect to checkout:', error);
        notify.error('Failed to process checkout');
    }
}

async function findGameIdFromPackageId(packageId) {
    const tebexGame = gamesData.tebexGames?.find(g => g.tebexId === packageId);
    if (tebexGame) {
        const vaprGameId = await findVAPRGameIdByTitle(tebexGame.title);
        return vaprGameId;
    }
    return null;
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

    if (isUserLoggedIn()) {
        initializeTebexIntegration();
    }
});

const originalLoadUserData = window.loadUserData;
window.loadUserData = function() {
    originalLoadUserData();
    setTimeout(() => {
        initializeTebexIntegration();
    }, 500);
};