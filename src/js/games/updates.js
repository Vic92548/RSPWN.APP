async function checkForGameUpdates() {
    return api.request('/api/updates/check');
}

async function markUpdateSeen(gameId) {
    return api.request(`/api/updates/${gameId}/seen`, {
        method: 'POST'
    });
}

async function markUpdateDownloaded(gameId, version) {
    return api.request(`/api/updates/${gameId}/downloaded`, {
        method: 'POST',
        body: { version }
    });
}

async function checkAndShowUpdates() {
    if (!isUserLoggedIn() || !isRunningInTauri()) return;

    try {
        // First, ensure we have the latest installed games data
        const installedGames = await window.__TAURI__.core.invoke('get_installed_games');
        gamesData.installedGames = installedGames || [];

        // Get all user games from the server
        const response = await api.request('/api/my-games');
        if (!response.success || !response.games) return;

        const updates = [];

        // Check each installed game for updates
        for (const installedGame of gamesData.installedGames) {
            // Find the corresponding game in user's library
            const serverGame = response.games.find(g => g.id === installedGame.id);

            if (serverGame && serverGame.currentVersion) {
                const installedVersion = installedGame.version || '0.0.0';
                const latestVersion = serverGame.currentVersion;

                // Compare versions (you might want to use semver comparison here)
                if (isNewerVersion(latestVersion, installedVersion)) {
                    updates.push({
                        gameId: installedGame.id,
                        gameName: installedGame.name || serverGame.title,
                        fromVersion: installedVersion,
                        toVersion: latestVersion,
                        downloadUrl: serverGame.downloadUrl
                    });
                }
            }
        }

        gamesData.updates = updates;

        if (updates.length > 0) {
            showUpdateNotification(updates.length);
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

// Helper function to compare versions
function isNewerVersion(latest, current) {
    // Simple version comparison - you might want to use a proper semver library
    const latestParts = latest.split('.').map(n => parseInt(n) || 0);
    const currentParts = current.split('.').map(n => parseInt(n) || 0);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
        const latestPart = latestParts[i] || 0;
        const currentPart = currentParts[i] || 0;

        if (latestPart > currentPart) return true;
        if (latestPart < currentPart) return false;
    }

    return false;
}

function showUpdateNotification(count) {
    const libraryMenuItems = DOM.queryAll('.menu-item');
    libraryMenuItems.forEach(item => {
        const icon = item.querySelector('.menu-item-icon.library');
        if (icon && !icon.querySelector('.update-badge')) {
            const badge = DOM.create('span', {
                class: 'update-badge'
            }, count);
            icon.appendChild(badge);
        }
    });
}