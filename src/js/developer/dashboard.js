let developerData = {
    myGames: [],
    totalKeys: 0,
    totalPlayers: 0,
    totalDownloads: 0
};

cardManager.register('developer-dashboard-card', {
    onLoad: async () => {
        await loadDeveloperData();
    }
});

async function openDeveloperDashboard() {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    await cardManager.show('developer-dashboard-card');
}

function closeDeveloperDashboard() {
    cardManager.hide('developer-dashboard-card');
}

async function loadDeveloperData() {
    try {
        DOM.show('developer-loading');

        const allGamesResponse = await api.request('/api/games');

        if (allGamesResponse.success) {
            developerData.myGames = allGamesResponse.games.filter(game =>
                game.ownerId === window.user.id
            );

            let totalKeys = 0;
            let totalUsedKeys = 0;

            for (const game of developerData.myGames) {
                try {
                    const keysResponse = await api.request(`/api/games/${game.id}/keys`);
                    if (keysResponse.success) {
                        const keys = keysResponse.keys;
                        totalKeys += keys.length;
                        totalUsedKeys += keys.filter(k => k.usedBy).length;

                        game.totalKeys = keys.length;
                        game.usedKeys = keys.filter(k => k.usedBy).length;
                        game.players = keys.filter(k => k.usedBy).length;
                    }
                } catch (error) {
                    console.error(`Error loading keys for game ${game.id}:`, error);
                    game.totalKeys = 0;
                    game.usedKeys = 0;
                    game.players = 0;
                }
            }

            developerData.totalKeys = totalKeys;
            developerData.totalPlayers = totalUsedKeys;
            developerData.totalDownloads = totalUsedKeys;

            displayDeveloperStats();
            displayDeveloperGames();
        }
    } catch (error) {
        console.error('Error loading developer data:', error);
        notify.error('Failed to load developer data');
    } finally {
        DOM.hide('developer-loading');
    }
}

function displayDeveloperStats() {
    DOM.setText('dev-total-games', developerData.myGames.length);
    DOM.setText('dev-total-keys', formatNumber(developerData.totalKeys));
    DOM.setText('dev-total-players', formatNumber(developerData.totalPlayers));
    DOM.setText('dev-total-downloads', formatNumber(developerData.totalDownloads));
}

function displayDeveloperGames() {
    const container = DOM.get('dev-games-grid');
    container.innerHTML = '';

    if (developerData.myGames.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-gamepad"></i>
                <h4>No games yet</h4>
                <p>Start by adding your first game to VAPR</p>
            </div>
        `;
        return;
    }

    VAPR.appendElements(container, 'developer-game-item',
        developerData.myGames.map(game => ({
            gameId: game.id,
            title: game.title,
            coverImage: game.coverImage,
            totalKeys: game.totalKeys || 0,
            usedKeys: game.usedKeys || 0,
            availableKeys: (game.totalKeys || 0) - (game.usedKeys || 0),
            players: game.players || 0,
            currentVersion: game.currentVersion || '1.0.0',
            hasUpdate: false
        }))
    );

    VAPR.refresh();
}

async function openGameDashboard(gameId) {
    gamesData.currentManagingGame = developerData.myGames.find(g => g.id === gameId);
    if (gamesData.currentManagingGame) {
        await cardManager.show('game-management-card');
    }
}

async function quickGenerateKeys(gameId) {
    const { value: count } = await Swal.fire({
        title: 'Generate Keys',
        input: 'number',
        inputLabel: 'Number of keys to generate',
        inputValue: 5,
        inputAttributes: {
            min: 1,
            max: 100
        },
        showCancelButton: true,
        confirmButtonText: 'Generate',
        confirmButtonColor: '#4ecdc4',
        background: 'rgba(23, 33, 43, 0.95)',
        color: '#fff'
    });

    if (count) {
        try {
            const response = await api.request(`/api/games/${gameId}/generate-keys`, {
                method: 'POST',
                body: { count: parseInt(count), tag: null }
            });

            if (response.success) {
                notify.success(`${count} keys generated successfully!`);
                await loadDeveloperData();
            }
        } catch (error) {
            console.error('Error generating keys:', error);
            notify.error('Failed to generate keys');
        }
    }
}