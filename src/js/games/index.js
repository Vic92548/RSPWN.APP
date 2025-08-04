cardManager.register('games-card', {
    onLoad: async () => {
        await loadGamesData();
    }
});

cardManager.register('library-card', {
    onLoad: async () => {
        await loadLibraryData();
    }
});

cardManager.register('game-management-card', {
    onLoad: async () => {
        if (gamesData.currentManagingGame) {
            await addVersionManagementUI();
            await loadGameKeys(gamesData.currentManagingGame.id);
            await loadGameVersions(gamesData.currentManagingGame.id);
        }
    }
});

async function openGamesShowcase() {
    await cardManager.show('games-card');
}

async function openMyLibrary() {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    await cardManager.show('library-card');
}

function closeGamesCard() {
    cardManager.hide('games-card');
}

function closeLibraryCard() {
    cardManager.hide('library-card');
}

document.addEventListener('DOMContentLoaded', () => {
    initGameEventListeners();
    if (isUserLoggedIn()) {
        setTimeout(checkAndShowUpdates, 3000);
    }
});

setInterval(() => {
    if (isUserLoggedIn()) {
        checkAndShowUpdates();
    }
}, 5 * 60 * 1000);

window.openGamesShowcase = openGamesShowcase;
window.openMyLibrary = openMyLibrary;
window.closeGamesCard = closeGamesCard;
window.closeLibraryCard = closeLibraryCard;
window.closeGameManagementCard = closeGameManagementCard;
window.openRedeemModal = openRedeemModal;
window.closeRedeemModal = closeRedeemModal;
window.redeemKey = redeemKey;
window.openGameManagement = openGameManagement;
window.downloadGame = downloadGame;
window.cancelDownload = cancelDownload;
window.uninstallGame = uninstallGame;
window.launchGame = launchGame;
window.downloadUpdate = downloadUpdate;
window.downloadFilteredKeys = downloadFilteredKeys;
window.filterKeys = filterKeys;
window.generateKeys = generateKeys;
window.copyKey = copyKey;
window.publishVersion = publishVersion;