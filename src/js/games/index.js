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

async function openKeyManagement(gameId) {
    const game = gamesData.allGames.find(g => g.id === gameId) ||
        developerData.myGames.find(g => g.id === gameId);

    if (!game) return;

    gamesData.currentManagingGame = game;

    let existingCard = document.getElementById('key-management-card');
    if (!existingCard) {
        const keyCard = VAPR.createElement('key-management-card', {
            gameTitle: game.title
        });
        document.querySelector('#feed').appendChild(keyCard);

        VAPR.refresh();

        cardManager.register('key-management-card', {
            onLoad: async () => {
                if (gamesData.currentManagingGame) {
                    await loadGameKeys(gamesData.currentManagingGame.id);
                }
            }
        });
    }

    await cardManager.show('key-management-card');
}

async function openVersionManagement(gameId) {
    const game = gamesData.allGames.find(g => g.id === gameId) ||
        developerData.myGames.find(g => g.id === gameId);

    if (!game) return;

    gamesData.currentManagingGame = game;

    let existingCard = document.getElementById('version-management-card');
    if (!existingCard) {
        const versionCard = VAPR.createElementWithContent('version-management-card',
            { gameTitle: game.title },
            `<version-form></version-form>
             <div class="versions-list" id="versions-list"></div>`
        );
        document.querySelector('#feed').appendChild(versionCard);

        VAPR.refresh();

        cardManager.register('version-management-card', {
            onLoad: async () => {
                if (gamesData.currentManagingGame) {
                    await loadGameVersions(gamesData.currentManagingGame.id);
                }
            }
        });
    }

    await cardManager.show('version-management-card');
}

function closeKeyManagementCard() {
    cardManager.hide('key-management-card');
}

function closeVersionManagementCard() {
    cardManager.hide('version-management-card');
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
window.openRedeemModal = openRedeemModal;
window.closeRedeemModal = closeRedeemModal;
window.redeemKey = redeemKey;
window.openGameManagement = openGameManagement;
window.openKeyManagement = openKeyManagement;
window.openVersionManagement = openVersionManagement;
window.closeKeyManagementCard = closeKeyManagementCard;
window.closeVersionManagementCard = closeVersionManagementCard;
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