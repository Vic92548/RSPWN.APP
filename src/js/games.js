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

    gamesData.allGames.forEach(game => {
        const isOwned = userGameIds.includes(game.id);
        const isOwner = isUserLoggedIn() && game.ownerId === window.user.id;

        const gameEl = document.createElement('div');
        gameEl.className = 'game-item';

        const manageButton = isOwner ? `<button class="game-action-button secondary" onclick="window.openGameManagement(event, '${game.id}')"><i class="fa-solid fa-key"></i> Manage</button>` : '';

        gameEl.innerHTML = `
            ${isOwned ? '<div class="owned-badge">OWNED</div>' : ''}
            <div class="game-cover-wrapper">
                <img src="${game.coverImage}" class="game-cover" alt="${game.title}">
            </div>
            <div class="game-content">
                <h4 class="game-title">${game.title}</h4>
                <p class="game-description">${game.description}</p>
                <div class="game-actions">
                    ${game.externalLink ? `<button class="game-action-button" onclick="window.open('${game.externalLink}', '_blank'); event.stopPropagation();"><i class="fa-solid fa-external-link"></i> Learn More</button>` : ''}
                    ${manageButton}
                </div>
            </div>
        `;

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
        gameEl.id = `game-item-${game.id}`;

        const isTauri = isRunningInTauri();
        const isInstalled = gamesData.installedGames.some(g => g.id === game.id);
        const isDownloading = gamesData.downloadingGames.has(game.id);

        let statusBadge = '';
        let actionContent = '';

        if (isInstalled) {
            statusBadge = '<div class="game-status-badge installed"><i class="fa-solid fa-check-circle"></i> Installed</div>';
        }

        if (isDownloading) {
            const progress = gamesData.downloadingGames.get(game.id) || 0;
            actionContent = `
                <div class="download-progress-overlay">
                    <div class="download-progress-container">
                        <div class="download-progress-header">
                            <div class="download-progress-icon">
                                <i class="fa-solid fa-download"></i>
                            </div>
                            <div class="download-progress-title">Downloading Game</div>
                            <div class="download-progress-subtitle">${game.title}</div>
                        </div>
                        <div class="download-progress-stats">
                            <div class="download-stat">
                                <span class="download-stat-value">${Math.round(progress)}%</span>
                                <span class="download-stat-label">Progress</span>
                            </div>
                            <div class="download-stat">
                                <span class="download-stat-value" id="download-speed-${game.id}">0 MB/s</span>
                                <span class="download-stat-label">Speed</span>
                            </div>
                        </div>
                        <div class="download-progress-bar-wrapper">
                            <div class="download-progress-bar">
                                <div class="download-progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="download-info">
                                <span><i class="fa-solid fa-database"></i> <span id="download-size-${game.id}">0 MB / 0 MB</span></span>
                                <span><i class="fa-solid fa-clock"></i> <span id="download-eta-${game.id}">Calculating...</span></span>
                            </div>
                        </div>
                        <button class="cancel-download-btn" onclick="window.cancelDownload('${game.id}')">
                            <i class="fa-solid fa-xmark"></i> Cancel Download
                        </button>
                    </div>
                </div>
            `;
        }

        let gameActions = '';
        if (game.downloadUrl && !isDownloading) {
            if (isTauri) {
                if (isInstalled) {
                    const installedGame = gamesData.installedGames.find(g => g.id === game.id);
                    if (installedGame && installedGame.executable) {
                        gameActions = `
                            <div class="game-actions">
                                <button class="game-action-button play" onclick="window.launchGame(event, '${installedGame.executable.replace(/\\/g, '\\\\')}')">
                                    <i class="fa-solid fa-play"></i> Play
                                </button>
                                <button class="game-action-button icon-only danger" onclick="window.uninstallGame(event, '${game.id}', '${game.title.replace(/'/g, "\\'")}')">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        `;
                    }
                } else {
                    gameActions = `
                        <div class="game-actions">
                            <button class="game-action-button primary" onclick="window.downloadGame(event, '${game.id}', '${game.title.replace(/'/g, "\\'")}', '${game.downloadUrl}')">
                                <i class="fa-solid fa-download"></i> Install
                            </button>
                        </div>
                    `;
                }
            } else {
                gameActions = `
                    <div class="game-actions">
                        <button class="game-action-button primary" onclick="window.downloadGame(event, '${game.id}', '${game.title.replace(/'/g, "\\'")}', '${game.downloadUrl}')">
                            <i class="fa-solid fa-download"></i> Download
                        </button>
                    </div>
                `;
            }
        }

        gameEl.innerHTML = `
            ${statusBadge}
            <div class="game-cover-wrapper">
                <img src="${game.coverImage}" class="game-cover" alt="${game.title}">
            </div>
            <div class="game-content">
                <h4 class="game-title">${game.title}</h4>
                <p class="game-description">${game.description}</p>
                <div class="game-meta">
                    <div class="game-meta-item">
                        <i class="fa-solid fa-calendar"></i>
                        <span>Owned ${new Date(game.ownedAt).toLocaleDateString()}</span>
                    </div>
                </div>
                ${gameActions}
            </div>
            ${actionContent}
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

    keys.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = 'key-item';

        let userInfo = '';
        if (key.usedBy && key.userInfo) {
            const avatarUrl = key.userInfo.avatar
                ? `https://cdn.discordapp.com/avatars/${key.userInfo.id}/${key.userInfo.avatar}.png?size=64`
                : 'https://vapr-club.b-cdn.net/default_vapr_avatar.png';

            userInfo = `
                <div class="key-user-info">
                    <div class="key-user-avatar">
                        <img src="${avatarUrl}" alt="${key.userInfo.username}">
                    </div>
                    <a href="/@${key.userInfo.username}" class="key-user-name" target="_blank">
                        @${key.userInfo.username}
                    </a>
                    <span class="key-used-date">${new Date(key.usedAt).toLocaleDateString()}</span>
                </div>
            `;
        }

        keyEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="key-code">${key.key}</span>
                ${key.tag ? `<span class="key-tag">${key.tag}</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                ${key.usedBy ? userInfo : `<span class="key-status available">Available</span>`}
                ${!key.usedBy ? `<button class="copy-key-btn" onclick="copyKey('${key.key}')"><i class="fa-solid fa-copy"></i> Copy</button>` : ''}
            </div>
        `;
        container.appendChild(keyEl);
    });
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
                    title: `${count} keys generated successfully!`
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
                title: "Keys downloaded successfully!"
            });
        }
    } catch (error) {
        console.error('Error downloading keys:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download keys. Please try again.'
        });
    }
}

window.downloadFilteredKeys = downloadFilteredKeys;
window.filterKeys = filterKeys;

window.downloadGame = async function(event, gameId, gameTitle, downloadUrl) {
    event.stopPropagation();

    if (!isRunningInTauri()) {
        Swal.fire({
            title: 'Desktop App Required',
            html: `
                <p>To download and play games, you need the VAPR desktop app.</p>
                <p style="margin-top: 20px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                    The desktop app allows you to:
                </p>
                <ul style="text-align: left; margin: 10px 0; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                    <li>Download and install games directly</li>
                    <li>Launch games with one click</li>
                    <li>Track your playtime</li>
                    <li>Get automatic updates</li>
                </ul>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-download"></i> Download Desktop App',
            cancelButtonText: 'Maybe Later',
            confirmButtonColor: '#4ecdc4',
            customClass: {
                container: 'download-prompt-container'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                downloadDesktopApp();
            }
        });
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

            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: "success",
                title: `${gameTitle} installed successfully!`
            });

            await loadLibraryData();
        } else {
            throw new Error(result.error || 'Installation failed');
        }
    } catch (error) {
        console.error('Error downloading game:', error);
        gamesData.downloadingGames.delete(gameId);
        displayLibrary();

        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: error.message || 'Failed to download the game. Please try again.'
        });
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

    const result = await Swal.fire({
        title: 'Uninstall Game?',
        html: `<p>Are you sure you want to uninstall <strong>${gameTitle}</strong>?</p>
               <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-top: 10px;">This will remove all game files from your computer.</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, uninstall',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#e74c3c'
    });

    if (result.isConfirmed) {
        try {
            await window.__TAURI__.core.invoke('uninstall_game', { gameId });

            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: "success",
                title: `${gameTitle} uninstalled successfully`
            });

            await loadLibraryData();
        } catch (error) {
            console.error('Error uninstalling game:', error);
            Swal.fire({
                icon: 'error',
                title: 'Uninstall Failed',
                text: error.message || 'Failed to uninstall the game. Please try again.'
            });
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

        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: "success",
            title: "Game launched!"
        });
    } catch (error) {
        console.error('Error launching game:', error);
        Swal.fire({
            icon: 'error',
            title: 'Launch Failed',
            text: error.message || 'Failed to launch the game. Please try again.'
        });
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