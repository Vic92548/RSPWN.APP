let gamesData = {
    allGames: [],
    userGames: [],
    currentManagingGame: null,
    installedGames: [],
    downloadingGames: new Map(),
    currentKeyFilter: 'all',
    allKeys: []
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

        if (isRunningInTauri()) {
            try {
                const installedGames = await window.__TAURI__.core.invoke('get_installed_games');
                gamesData.installedGames = installedGames || [];
            } catch (error) {
                console.error('Error loading installed games:', error);
                gamesData.installedGames = [];
            }
        }

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

        if (isRunningInTauri()) {
            try {
                const installedGames = await window.__TAURI__.core.invoke('get_installed_games');
                gamesData.installedGames = installedGames || [];
            } catch (error) {
                console.error('Error loading installed games:', error);
                gamesData.installedGames = [];
            }
        }

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

    VAPR.appendElements(container, 'game-item',
        gamesData.allGames.map(game => ({
            gameId: game.id,
            title: game.title,
            description: game.description,
            coverImage: game.coverImage,
            isOwned: userGameIds.includes(game.id),
            isOwner: isUserLoggedIn() && game.ownerId === window.user.id,
            externalLink: game.externalLink || ''
        }))
    );

    VAPR.refresh();
}

function displayLibrary() {
    const container = document.getElementById('library-grid');
    container.innerHTML = '';

    if (gamesData.userGames.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">No games in your library yet. Redeem a key to get started!</div>';
        return;
    }

    VAPR.appendElements(container, 'library-game-item',
        gamesData.userGames.map(game => {
            const isInstalled = gamesData.installedGames.some(g => g.id === game.id);
            const isDownloading = gamesData.downloadingGames.has(game.id);
            const installedGame = isInstalled ? gamesData.installedGames.find(g => g.id === game.id) : null;

            return {
                gameId: game.id,
                title: game.title,
                description: game.description,
                coverImage: game.coverImage,
                downloadUrl: game.downloadUrl || '',
                ownedAt: game.ownedAt,
                isInstalled: isInstalled,
                isDownloading: isDownloading,
                ...(installedGame?.executable && { executable: installedGame.executable }),
                ...(isDownloading && { downloadProgress: gamesData.downloadingGames.get(game.id) || 0 })
            };
        })
    );

    VAPR.refresh();
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
            gamesData.allKeys = response.keys;
            updateKeyStats();
            displayKeys(response.keys);
        }
    } catch (error) {
        console.error('Error loading keys:', error);
    }
}

function updateKeyStats() {
    const totalKeys = gamesData.allKeys.length;
    const usedKeys = gamesData.allKeys.filter(k => k.usedBy).length;
    const availableKeys = totalKeys - usedKeys;

    document.getElementById('total-keys').textContent = totalKeys;
    document.getElementById('used-keys').textContent = usedKeys;
    document.getElementById('available-keys').textContent = availableKeys;
}

function filterKeys(tag) {
    gamesData.currentKeyFilter = tag;

    document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    let filteredKeys = gamesData.allKeys;

    if (tag !== 'all') {
        filteredKeys = gamesData.allKeys.filter(key => {
            if (tag === '') return !key.tag || key.tag === null;
            return key.tag === tag;
        });
    }

    displayKeys(filteredKeys);
}

function displayKeys(keys) {
    const container = document.getElementById('keys-list');
    container.innerHTML = '';

    if (keys.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255, 255, 255, 0.6);">No keys found</div>';
        return;
    }

    VAPR.appendElements(container, 'game-key-item',
        keys.map(key => ({
            keyCode: key.key,
            tag: key.tag || '',
            isUsed: key.usedBy ? 'true' : 'false',
            ...(key.usedBy && key.userInfo && {
                usedByUsername: key.userInfo.username,
                usedById: key.userInfo.id,
                usedByAvatar: key.userInfo.avatar || '',
                usedAt: key.usedAt
            })
        }))
    );

    VAPR.refresh();
}

async function generateKeys() {
    if (!gamesData.currentManagingGame) return;

    const count = parseInt(document.getElementById('key-count').value) || 5;
    const tag = document.getElementById('key-tag').value || null;

    try {
        const response = await api.request(`/api/games/${gamesData.currentManagingGame.id}/generate-keys`, {
            method: 'POST',
            body: { count, tag }
        });

        if (response.success) {
            notify.success(`${count} keys generated successfully!`);
            await loadGameKeys(gamesData.currentManagingGame.id);
        }
    } catch (error) {
        console.error('Error generating keys:', error);
    }
}

function copyKey(key) {
    notify.copyToClipboard(key, "Key copied to clipboard!");
}

async function downloadFilteredKeys() {
    if (!gamesData.currentManagingGame) return;

    const tag = gamesData.currentKeyFilter === 'all' ? null : gamesData.currentKeyFilter;

    try {
        const url = `/api/games/${gamesData.currentManagingGame.id}/keys/download${tag !== null ? `?tag=${encodeURIComponent(tag)}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to download keys');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;

        const filename = `${gamesData.currentManagingGame.title.replace(/[^a-z0-9]/gi, '_')}_keys${tag ? `_${tag}` : ''}.csv`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        notify.success("Keys downloaded successfully!");
    } catch (error) {
        console.error('Error downloading keys:', error);
        notify.error('Download Failed', 'Failed to download keys. Please try again.');
    }
}

window.downloadFilteredKeys = downloadFilteredKeys;
window.filterKeys = filterKeys;

window.downloadGame = async function(event, gameId, gameTitle, downloadUrl) {
    event.stopPropagation();

    if (!isRunningInTauri()) {
        notify.desktopAppPrompt(() => downloadDesktopApp());
        return;
    }

    gamesData.downloadingGames.set(gameId, 0);
    displayLibrary();

    try {
        const unlisten = await window.__TAURI__.event.listen('download-progress', (event) => {
            const progress = event.payload;
            if (progress.game_id === gameId) {
                gamesData.downloadingGames.set(gameId, progress.percentage);
                updateGameDownloadProgress(gameId, progress);
            }
        });

        const statusUnlisten = await window.__TAURI__.event.listen('download-status', (event) => {
            const data = event.payload;
            if (data.game_id === gameId) {
                updateGameDownloadStatus(gameId, data.status);
            }
        });

        const result = await window.__TAURI__.core.invoke('download_and_install_game', {
            gameId: gameId,
            gameName: gameTitle,
            downloadUrl: downloadUrl
        });

        unlisten();
        statusUnlisten();

        if (result.success) {
            gamesData.downloadingGames.delete(gameId);
            notify.success(`${gameTitle} installed successfully!`);
            await loadLibraryData();
        } else {
            throw new Error(result.error || 'Installation failed');
        }
    } catch (error) {
        console.error('Error downloading game:', error);
        gamesData.downloadingGames.delete(gameId);
        displayLibrary();
        notify.error('Download Failed', error.message || 'Failed to download the game. Please try again.');
    }
}

function updateGameDownloadProgress(gameId, progress) {
    const gameEl = document.getElementById(`game-item-${gameId}`);
    if (!gameEl) return;

    const progressFill = gameEl.querySelector('.download-progress-fill');
    const progressValue = gameEl.querySelector('.download-stat-value');
    const speedEl = document.getElementById(`download-speed-${gameId}`);
    const sizeEl = document.getElementById(`download-size-${gameId}`);
    const etaEl = document.getElementById(`download-eta-${gameId}`);

    if (progressFill) progressFill.style.width = `${progress.percentage}%`;
    if (progressValue) progressValue.textContent = `${Math.round(progress.percentage)}%`;
    if (speedEl) speedEl.textContent = `${progress.speed.toFixed(2)} MB/s`;

    if (sizeEl) {
        const downloaded = (progress.downloaded / 1024 / 1024).toFixed(2);
        const total = (progress.total / 1024 / 1024).toFixed(2);
        sizeEl.textContent = `${downloaded} MB / ${total} MB`;
    }

    if (etaEl) {
        etaEl.textContent = formatTime(progress.eta);
    }
}

function updateGameDownloadStatus(gameId, statusText) {
    const gameEl = document.getElementById(`game-item-${gameId}`);
    if (!gameEl) return;

    const subtitleEl = gameEl.querySelector('.download-progress-subtitle');
    if (subtitleEl) subtitleEl.textContent = statusText;
}

window.cancelDownload = function(gameId) {
    gamesData.downloadingGames.delete(gameId);
    displayLibrary();
}

window.uninstallGame = async function(event, gameId, gameTitle) {
    event.stopPropagation();

    const confirmed = await notify.confirmDanger(
        'Uninstall Game?',
        `Are you sure you want to uninstall ${gameTitle}? This will remove all game files from your computer.`,
        'Yes, uninstall'
    );

    if (confirmed) {
        try {
            await window.__TAURI__.core.invoke('uninstall_game', { gameId });
            notify.success(`${gameTitle} uninstalled successfully`);
            await loadLibraryData();
        } catch (error) {
            console.error('Error uninstalling game:', error);
            notify.error('Uninstall Failed', error.message || 'Failed to uninstall the game. Please try again.');
        }
    }
}

window.launchGame = async function(event, executablePath) {
    event.stopPropagation();

    if (!isRunningInTauri()) return;

    const button = event.target.closest('button');
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Launching...';

    try {
        await window.__TAURI__.core.invoke('launch_game', {
            executablePath: executablePath
        });
        notify.success("Game launched!");
    } catch (error) {
        console.error('Error launching game:', error);
        notify.error('Launch Failed', error.message || 'Failed to launch the game. Please try again.');
    } finally {
        button.disabled = false;
        button.innerHTML = originalContent;
    }
}

function formatTime(seconds) {
    if (seconds === 0) return 'Calculating...';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s remaining`;
    } else {
        return `${secs}s remaining`;
    }
}

function isRunningInTauri() {
    return typeof window.__TAURI__ !== 'undefined';
}

VAPR.on('library-game-item', 'mounted', (element) => {
    const ownedAt = element.getAttribute('owned-at');
    if (ownedAt) {
        const dateEl = element.querySelector('.owned-date');
        if (dateEl) {
            dateEl.textContent = new Date(ownedAt).toLocaleDateString();
        }
    }

    const downloadBtn = element.querySelector('.download-button-text');
    if (downloadBtn) {
        downloadBtn.textContent = isRunningInTauri() ? 'Install' : 'Download';
    }
});

VAPR.on('game-key-item', 'mounted', (element) => {
    const usedAt = element.getAttribute('used-at');
    if (usedAt) {
        const dateEl = element.querySelector('.key-used-date');
        if (dateEl) {
            dateEl.textContent = new Date(usedAt).toLocaleDateString();
        }
    }
});

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