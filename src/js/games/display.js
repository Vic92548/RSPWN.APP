function formatDurationShort(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds || 0)));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${secs}s`;
}

function displayLibrary() {
    const container = DOM.get('library-grid');
    container.innerHTML = '';

    if (gamesData.userGames.length === 0) {
        container.innerHTML += '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">No games in your library yet. Redeem a key to get started!</div>';
        return;
    }

    VAPR.appendElements(container, 'library-game-item',
        gamesData.userGames.map(game => {
            const isInstalled = gamesData.installedGames.some(g => g.id === game.id);
            const isDownloading = gamesData.downloadingGames.has(game.id);
            const isUpdating = gamesData.updatingGames.has(game.id);
            const installedGame = isInstalled ? gamesData.installedGames.find(g => g.id === game.id) : null;
            const hasUpdate = gamesData.updates.some(u => u.gameId === game.id);
            const updateInfo = hasUpdate ? gamesData.updates.find(u => u.gameId === game.id) : null;
            const totalSeconds = Number(gamesData.playtimeTotals?.[game.id] || 0);
            const totalPlaytime = formatDurationShort(totalSeconds);

            return {
                gameId: game.id,
                title: game.title,
                description: game.description,
                coverImage: game.coverImage,
                downloadUrl: game.downloadUrl || '',
                ownedAt: game.ownedAt,
                isInstalled: isInstalled ? 'true' : '',
                isDownloading: isDownloading ? 'true' : '',
                isUpdating: isUpdating ? 'true' : '',
                hasUpdate: hasUpdate ? 'true' : '',
                installedVersion: installedGame?.version || game.installedVersion || '',
                latestVersion: updateInfo?.toVersion || game.currentVersion || '',
                ...(installedGame?.executable && { executable: installedGame.executable.replaceAll('\\','/') }),
                ...(isDownloading && { downloadProgress: gamesData.downloadingGames.get(game.id) || 0 }),
                totalPlaytime,
                totalPlaytimeSeconds: totalSeconds
            };
        })
    );

    VAPR.refresh();
}