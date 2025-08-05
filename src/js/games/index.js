cardManager.register('games-card', {
    onLoad: async () => {
        await Promise.all([
            loadGamesData(),
            loadTebexGames()
        ]);
    }
});

cardManager.register('library-card', {
    onLoad: async () => {
        await loadLibraryData();
    }
});

function initGameEventListeners() {
    const gamesGrid = DOM.get('games-grid');
    if (gamesGrid) {
        gamesGrid.addEventListener('click', (e) => {
            const gameItem = e.target.closest('.game-item');
            if (gameItem && !e.target.closest('button')) {
                const gameId = gameItem.id.replace('game-item-', '');
                const game = gamesData.allGames.find(g => g.id === gameId);
                if (game && game.externalLink) {
                    window.open(game.externalLink, '_blank');
                }
            }
        });
    }
}

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

function openRedeemModal() {
    DOM.show('redeem-modal', 'flex');
    DOM.get('game-key-input').value = '';
    DOM.get('game-key-input').focus();
}

function closeRedeemModal() {
    DOM.hide('redeem-modal');
}

async function redeemKey(event) {
    event.preventDefault();

    const keyInput = DOM.get('game-key-input');
    const key = keyInput.value.trim();

    try {
        const response = await api.request('/api/games/redeem-key', {
            method: 'POST',
            body: { key }
        });

        if (response.success) {
            closeRedeemModal();

            await notify.confirm(
                'Success!',
                `You now own ${response.game.title}!`,
                {
                    icon: 'success',
                    confirmButtonText: 'View Library',
                    showCancelButton: false
                }
            );

            closeGamesCard();
            openMyLibrary();
            await loadLibraryData();
        }
    } catch (error) {
        notify.error('Invalid Key', error.message || 'The key you entered is invalid or has already been used.');
    }
}

async function openKeyManagement(gameId) {
    const game = gamesData.allGames.find(g => g.id === gameId) ||
        developerData.myGames.find(g => g.id === gameId);

    if (!game) return;

    gamesData.currentManagingGame = game;

    let existingCard = DOM.get('key-management-card');
    if (!existingCard) {
        const keyCard = VAPR.createElement('key-management-card', {
            gameTitle: game.title
        });
        DOM.query('#feed').appendChild(keyCard);

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

    let existingCard = DOM.get('version-management-card');
    if (!existingCard) {
        const versionCard = VAPR.createElementWithContent('version-management-card',
            { gameTitle: game.title },
            `<version-form></version-form>
             <div class="versions-list" id="versions-list"></div>`
        );
        DOM.query('#feed').appendChild(versionCard);

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