let gamesData = {
    allGames: [],
    userGames: [],
    currentManagingGame: null,
    installedGames: [],
    downloadingGames: new Map()
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
        gameEl.id = `game-item-${game.id}`;

        const isTauri = isRunningInTauri();
        const isInstalled = gamesData.installedGames.some(g => g.id === game.id);
        const isDownloading = gamesData.downloadingGames.has(game.id);

        let actionContent = '';
        if (game.downloadUrl) {
            if (isTauri) {
                if (isDownloading) {
                    const progress = gamesData.downloadingGames.get(game.id) || 0;
                    actionContent = `
                        <div class="download-progress-overlay">
                            <div class="download-progress-info">
                                <span class="download-status">Downloading...</span>
                                <span class="download-percentage">${Math.round(progress)}%</span>
                            </div>
                            <div class="download-progress-bar">
                                <div class="download-progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <button class="cancel-download-btn" onclick="window.cancelDownload('${game.id}')">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    `;
                } else if (isInstalled) {
                    const installedGame = gamesData.installedGames.find(g => g.id === game.id);
                    if (installedGame && installedGame.executable) {
                        actionContent = `
                            <div class="game-actions">
                                <button class="download-button play-button" onclick="window.launchGame(event, '${installedGame.executable.replace(/\\/g, '\\\\')}')">
                                    <i class="fa-solid fa-play"></i> Play
                                </button>
                                <button class="uninstall-button" onclick="window.uninstallGame(event, '${game.id}', '${game.title.replace(/'/g, "\\'")}')">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        `;
                    }
                } else {
                    actionContent = `<button class="download-button" onclick="window.downloadGame(event, '${game.id}', '${game.title.replace(/'/g, "\\'")}', '${game.downloadUrl}')"><i class="fa-solid fa-download"></i> Install</button>`;
                }
            } else {
                actionContent = `<button class="download-button" onclick="window.downloadGame(event, '${game.id}', '${game.title.replace(/'/g, "\\'")}', '${game.downloadUrl}')"><i class="fa-solid fa-download"></i> Download</button>`;
            }
        }

        gameEl.innerHTML = `
            ${actionContent}
            <div class="game-cover-wrapper">
                <img src="${game.coverImage}" class="game-cover" alt="${game.title}">
            </div>
            <div class="game-info">
                <h4 class="game-title">${game.title}</h4>
                <p class="game-description">${game.description}</p>
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 5px;">
                    Owned since ${new Date(game.ownedAt).toLocaleDateString()}
                    ${isInstalled ? ' • <i class="fa-solid fa-check-circle"></i> Installed' : ''}
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
    const percentage = gameEl.querySelector('.download-percentage');
    const status = gameEl.querySelector('.download-status');

    if (progressFill) progressFill.style.width = `${progress.percentage}%`;
    if (percentage) percentage.textContent = `${Math.round(progress.percentage)}%`;
    if (status) status.textContent = `Downloading... ${progress.speed.toFixed(2)} MB/s`;
}

function updateGameDownloadStatus(gameId, statusText) {
    const gameEl = document.getElementById(`game-item-${gameId}`);
    if (!gameEl) return;

    const status = gameEl.querySelector('.download-status');
    if (status) status.textContent = statusText;
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