async function downloadGame(event, gameId, gameTitle, downloadUrl) {
    event.stopPropagation();

    if (!isRunningInTauri()) {
        notify.desktopAppPrompt(() => downloadDesktopApp());
        return;
    }

    try {
        // Find the game in our data
        const game = gamesData.userGames.find(g => g.id === gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        // Add to download manager
        const downloadId = await downloadManager.addDownload({
            id: gameId,
            title: gameTitle,
            coverImage: game.coverImage || '',
            downloadUrl: downloadUrl
        });

        // Show notification
        const result = await Swal.fire({
            icon: 'info',
            title: 'Download Started',
            text: `${gameTitle} has been added to your downloads.`,
            showConfirmButton: true,
            confirmButtonText: 'View Downloads',
            confirmButtonColor: '#4ecdc4',
            showCancelButton: true,
            cancelButtonText: 'OK'
        });

        if (result.isConfirmed) {
            router.navigate('/downloads', true);
        }

        // Update library view to show downloading state
        if (typeof displayLibrary === 'function') {
            displayLibrary();
        }

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

async function uninstallGame(event, gameId, gameTitle) {
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

async function launchGame(event, executablePath) {
    event.stopPropagation();

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

async function downloadUpdate(gameId, version, downloadUrl) {
    if (!isRunningInTauri()) {
        notify.desktopAppPrompt(() => downloadDesktopApp());
        return;
    }

    const game = gamesData.userGames.find(g => g.id === gameId);
    if (!game) return;

    gamesData.updatingGames.set(gameId, true);
    gamesData.downloadingGames.set(gameId, 0);

    await markUpdateSeen(gameId);

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
            gameName: game.title,
            downloadUrl: downloadUrl
        });

        unlisten();
        statusUnlisten();

        if (result.success) {
            await markUpdateDownloaded(gameId, version);

            gamesData.updates = gamesData.updates.filter(u => u.gameId !== gameId);

            if (gamesData.updates.length === 0) {
                const updateBadge = DOM.query('.update-badge');
                if (updateBadge) updateBadge.remove();
            }

            gamesData.downloadingGames.delete(gameId);
            gamesData.updatingGames.delete(gameId);

            notify.success(`${game.title} updated to v${version}!`);
            await loadLibraryData();
        } else {
            throw new Error(result.error || 'Update failed');
        }
    } catch (error) {
        console.error('Error updating game:', error);
        gamesData.downloadingGames.delete(gameId);
        gamesData.updatingGames.delete(gameId);
        displayLibrary();
        notify.error('Update Failed', error.message || 'Failed to update the game. Please try again.');
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

// Initialize a single playtime-session listener (Tauri)
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

// Set up listener on load if running in Tauri
if (isRunningInTauri()) {
    initPlaytimeListener();
}

// Expose functions to window for template onclick handlers
window.downloadGame = downloadGame;
window.updateGameDownloadProgress = updateGameDownloadProgress;
window.updateGameDownloadStatus = updateGameDownloadStatus;
window.cancelDownload = cancelDownload;
window.uninstallGame = uninstallGame;
window.launchGame = launchGame;
window.downloadUpdate = downloadUpdate;