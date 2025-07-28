let gamesData = {
    allGames: [],
    userGames: [],
    currentManagingGame: null
};

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
            await loadGameKeys(gamesData.currentManagingGame.id);
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

function closeGameManagementCard() {
    cardManager.hide('game-management-card');
}

async function loadGamesData() {
    try {
        document.getElementById('games-loading').style.display = 'block';

        const [gamesResponse, userGamesResponse] = await Promise.all([
            api.request('/api/games'),
            isUserLoggedIn() ? api.request('/api/my-games') : Promise.resolve({ games: [] })
        ]);

        gamesData.allGames = gamesResponse.games || [];
        gamesData.userGames = userGamesResponse.games || [];

        displayGames();
    } catch (error) {
        console.error('Error loading games:', error);
    } finally {
        document.getElementById('games-loading').style.display = 'none';
    }
}

async function loadLibraryData() {
    try {
        document.getElementById('library-loading').style.display = 'block';

        const response = await api.request('/api/my-games');
        gamesData.userGames = response.games || [];

        displayLibrary();
    } catch (error) {
        console.error('Error loading library:', error);
    } finally {
        document.getElementById('library-loading').style.display = 'none';
    }
}

function displayGames() {
    const container = document.getElementById('games-grid');
    container.innerHTML = '';

    const userGameIds = gamesData.userGames.map(g => g.id);

    gamesData.allGames.forEach(game => {
        const isOwned = userGameIds.includes(game.id);
        const isOwner = isUserLoggedIn() && game.ownerId === window.user.id;

        const gameEl = document.createElement('div');
        gameEl.className = 'game-item';

        const manageButton = isOwner ? `<button class="manage-button" onclick="window.openGameManagement(event, '${game.id}')"><i class="fa-solid fa-key"></i> Manage</button>` : '';

        gameEl.innerHTML = `
            ${isOwned ? '<div class="owned-badge">OWNED</div>' : ''}
            ${manageButton}
            <div class="game-cover-wrapper">
                <img src="${game.coverImage}" class="game-cover" alt="${game.title}">
            </div>
            <div class="game-info">
                <h4 class="game-title">${game.title}</h4>
                <p class="game-description">${game.description}</p>
                ${game.externalLink ? `<a href="${game.externalLink}" target="_blank" class="game-link" onclick="event.stopPropagation()"><i class="fa-solid fa-external-link"></i> Learn More</a>` : ''}
            </div>
        `;

        if (!isOwner) {
            gameEl.onclick = () => {
                if (game.externalLink) {
                    window.open(game.externalLink, '_blank');
                }
            };
        }

        container.appendChild(gameEl);
    });
}

function displayLibrary() {
    const container = document.getElementById('library-grid');
    container.innerHTML = '';

    if (gamesData.userGames.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">No games in your library yet. Redeem a key to get started!</div>';
        return;
    }

    gamesData.userGames.forEach(game => {
        const gameEl = document.createElement('div');
        gameEl.className = 'game-item';

        const isTauri = typeof window.__TAURI__ !== 'undefined';
        const downloadButton = isTauri && game.downloadUrl ? `<button class="download-button" onclick="window.downloadGame(event, '${game.id}')"><i class="fa-solid fa-download"></i> Download</button>` : '';

        gameEl.innerHTML = `
            ${downloadButton}
            <div class="game-cover-wrapper">
                <img src="${game.coverImage}" class="game-cover" alt="${game.title}">
            </div>
            <div class="game-info">
                <h4 class="game-title">${game.title}</h4>
                <p class="game-description">${game.description}</p>
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 5px;">
                    Owned since ${new Date(game.ownedAt).toLocaleDateString()}
                </div>
            </div>
        `;

        container.appendChild(gameEl);
    });
}

function openRedeemModal() {
    document.getElementById('redeem-modal').style.display = 'flex';
    document.getElementById('game-key-input').value = '';
    document.getElementById('game-key-input').focus();
}

function closeRedeemModal() {
    document.getElementById('redeem-modal').style.display = 'none';
}

async function redeemKey(event) {
    event.preventDefault();

    const keyInput = document.getElementById('game-key-input');
    const key = keyInput.value.trim();

    try {
        const response = await api.request('/api/games/redeem-key', {
            method: 'POST',
            body: { key }
        });

        if (response.success) {
            closeRedeemModal();

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `You now own ${response.game.title}!`,
                    confirmButtonText: 'View Library'
                }).then((result) => {
                    if (result.isConfirmed) {
                        closeGamesCard();
                        openMyLibrary();
                    }
                });
            }

            await loadLibraryData();
        }
    } catch (error) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Key',
                text: error.message || 'The key you entered is invalid or has already been used.'
            });
        }
    }
}

window.openGameManagement = async function(event, gameId) {
    event.stopPropagation();

    const game = gamesData.allGames.find(g => g.id === gameId);
    if (!game) return;

    gamesData.currentManagingGame = game;
    document.getElementById('management-game-name').textContent = game.title;

    await cardManager.show('game-management-card');
}

async function loadGameKeys(gameId) {
    try {
        const response = await api.request(`/api/games/${gameId}/keys`);

        if (response.success) {
            displayKeys(response.keys);
        }
    } catch (error) {
        console.error('Error loading keys:', error);
    }
}

function displayKeys(keys) {
    const container = document.getElementById('keys-list');
    container.innerHTML = '';

    if (keys.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255, 255, 255, 0.6);">No keys generated yet</div>';
        return;
    }

    keys.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = 'key-item';
        keyEl.innerHTML = `
            <span class="key-code">${key.key}</span>
            <span class="key-status ${key.usedBy ? 'used' : 'available'}">${key.usedBy ? 'Used' : 'Available'}</span>
            ${!key.usedBy ? `<button class="copy-key-btn" onclick="copyKey('${key.key}')"><i class="fa-solid fa-copy"></i> Copy</button>` : ''}
        `;
        container.appendChild(keyEl);
    });
}

async function generateKeys() {
    if (!gamesData.currentManagingGame) return;

    try {
        const response = await api.request(`/api/games/${gamesData.currentManagingGame.id}/generate-keys`, {
            method: 'POST',
            body: { count: 5 }
        });

        if (response.success) {
            if (typeof Swal !== 'undefined') {
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                Toast.fire({
                    icon: "success",
                    title: "5 keys generated successfully!"
                });
            }

            await loadGameKeys(gamesData.currentManagingGame.id);
        }
    } catch (error) {
        console.error('Error generating keys:', error);
    }
}

function copyKey(key) {
    navigator.clipboard.writeText(key).then(() => {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: "success",
                title: "Key copied to clipboard!"
            });
        }
    });
}

window.downloadGame = async function(event, gameId) {
    event.stopPropagation();

    try {
        const response = await api.request(`/api/games/${gameId}/download`);

        if (response.success && response.downloadUrl) {
            window.open(response.downloadUrl, '_blank');
        }
    } catch (error) {
        console.error('Error getting download URL:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Download Error',
                text: 'Failed to get download URL. Please try again.'
            });
        }
    }
}

window.openGamesShowcase = openGamesShowcase;
window.openMyLibrary = openMyLibrary;
window.closeGamesCard = closeGamesCard;
window.closeLibraryCard = closeLibraryCard;
window.closeGameManagementCard = closeGameManagementCard;
window.openRedeemModal = openRedeemModal;
window.closeRedeemModal = closeRedeemModal;
window.redeemKey = redeemKey;
window.generateKeys = generateKeys;
window.copyKey = copyKey;