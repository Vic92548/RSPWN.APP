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
});

const originalLoadUserData = window.loadUserData;
window.loadUserData = function() {
    originalLoadUserData();
};