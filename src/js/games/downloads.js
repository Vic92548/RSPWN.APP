async function downloadGame(gameId, gameTitle, gameCover, downloadUrl, version = null) {
    if (!isRunningInTauri()) {
        notify.desktopAppPrompt(() => downloadDesktopApp());
        return;
    }

    try {
        const game = gamesData.userGames.find(g => g.id === gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        // If version not provided, try to get it from the game data
        if (!version) {
            version = game.currentVersion || game.version || '1.0.0';
        }

        const downloadId = `download-${Date.now()}-${gameId}`;

        await window.__TAURI__.core.invoke('start_download', {
            downloadId: downloadId,
            gameId: gameId,
            gameName: gameTitle,
            gameCover: gameCover,
            downloadUrl: downloadUrl,
            version: version
        });

        console.log({
            downloadId: downloadId,
            gameId: gameId,
            gameName: gameTitle,
            gameCover: gameCover,
            downloadUrl: downloadUrl
        });

        await window.__TAURI__.core.invoke('open_downloads_window');

        notify.success('Download started', `${gameTitle} has been added to your downloads.`);

    } catch (error) {
        console.error('Error starting download:', error);
        notify.error('Download Failed', error.message || 'Failed to start download');
    }
}

function updateGameDownloadProgress(gameId, progress) {
    const gameEl = DOM.get(`game-item-${gameId}`);
    if (!gameEl) return;

    const progressFill = DOM.get(`download-fill-${gameId}`);
    if (progressFill) {
        progressFill.style.width = `${progress.percentage}%`;
    }

    const progressEl = DOM.get(`download-progress-${gameId}`);
    if (progressEl) {
        progressEl.textContent = `${Math.round(progress.percentage)}%`;
    }

    const speedEl = DOM.get(`download-speed-${gameId}`);
    if (speedEl) {
        speedEl.textContent = `${progress.speed.toFixed(2)} MB/s`;
    }

    const sizeEl = DOM.get(`download-size-${gameId}`);
    if (sizeEl) {
        const downloaded = (progress.downloaded / 1024 / 1024).toFixed(2);
        const total = (progress.total / 1024 / 1024).toFixed(2);
        sizeEl.textContent = `${downloaded} MB / ${total} MB`;
    }

    const etaEl = DOM.get(`download-eta-${gameId}`);
    if (etaEl) {
        etaEl.textContent = formatTime(progress.eta);
    }
}

function updateGameDownloadStatus(gameId, statusText) {
    const gameEl = DOM.get(`game-item-${gameId}`);
    if (!gameEl) return;

    const subtitleEl = gameEl.querySelector('.download-progress-subtitle');
    if (subtitleEl) DOM.setText(subtitleEl, statusText);
}

function cancelDownload(gameId) {
    gamesData.downloadingGames.delete(gameId);
    gamesData.updatingGames.delete(gameId);
    displayLibrary();
}

async function uninstallGame(gameId, gameTitle, confirmed = false) {

    if(!confirmed){
        confirmed = await notify.confirmDanger(
            'Uninstall Game?',
            `Are you sure you want to uninstall ${gameTitle}? This will remove all game files from your computer.`,
            'Yes, uninstall'
        );
    }


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

async function launchGame(executablePath) {

    if (!isRunningInTauri()) return;

    const button = event.target.closest('button');
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Launching...';

    try {
        console.log({executablePath});
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

async function downloadUpdate(gameId, version, gameTitle, gameCover, downloadUrl) {
    if (!isRunningInTauri()) {
        notify.desktopAppPrompt(() => downloadDesktopApp());
        return;
    }

    await uninstallGame(gameId, gameTitle, true);
    downloadGame(gameId, gameTitle, gameCover, downloadUrl, version);
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

let __vaprPlaytimeUnlisten = null;
async function initPlaytimeListener() {
    if (!isRunningInTauri() || __vaprPlaytimeUnlisten) return;
    __vaprPlaytimeUnlisten = await window.__TAURI__.event.listen('playtime-session', async (event) => {
        try {
            const p = event.payload || {};
            // Normalize keys from Rust payload
            const startedAt = p.started_at || p.startedAt;
            const endedAt = p.ended_at || p.endedAt;
            const durationSeconds = Number(p.duration_seconds ?? p.durationSeconds ?? 0);
            const executablePath = p.executable_path || p.executablePath || '';

            let gameId = p.game_id || p.gameId || null;
            if (!gameId && Array.isArray(gamesData.installedGames)) {
                const norm = (s) => String(s || '').replaceAll('\\','/').toLowerCase();
                const match = gamesData.installedGames.find(g => norm(g.executable) === norm(executablePath));
                if (match && match.id) gameId = match.id;
            }

            if (!gameId || !durationSeconds || durationSeconds <= 0) {
                console.warn('Skipping playtime session post due to missing data', p);
                return;
            }

            await APIHandler.handle(
                () => api.recordPlaytimeSession({ gameId, startedAt, endedAt, durationSeconds, executablePath }),
                {
                    onSuccess: async () => {
                        try {
                            const res = await api.getPlaytimeTotals();
                            if (res && res.totals) {
                                gamesData.playtimeTotals = {};
                                for (const t of res.totals) {
                                    gamesData.playtimeTotals[t.gameId] = t.totalSeconds || 0;
                                }
                                // Refresh library to reflect new totals
                                if (typeof displayLibrary === 'function') displayLibrary();
                            }
                        } catch (e) {
                            console.error('Failed to refresh playtime totals:', e);
                        }
                    },
                    onError: (e) => console.error('Failed to record playtime session:', e),
                    showLoading: false,
                }
            );
        } catch (err) {
            console.error('Error handling playtime-session event:', err);
        }
    });
}

if (isRunningInTauri()) {
    initPlaytimeListener();
}

window.downloadGame = downloadGame;
window.updateGameDownloadProgress = updateGameDownloadProgress;
window.updateGameDownloadStatus = updateGameDownloadStatus;
window.cancelDownload = cancelDownload;
window.uninstallGame = uninstallGame;
window.launchGame = launchGame;
window.downloadUpdate = downloadUpdate;