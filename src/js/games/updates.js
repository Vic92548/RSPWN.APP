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
    if (!isUserLoggedIn()) return;

    try {
        const response = await checkForGameUpdates();
        if (response.success && response.updates.length > 0) {
            gamesData.updates = response.updates;
            showUpdateNotification(response.updates.length);
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

function showUpdateNotification(count) {
    const libraryMenuItems = document.querySelectorAll('.menu-item');
    libraryMenuItems.forEach(item => {
        const icon = item.querySelector('.menu-item-icon.library');
        if (icon && !icon.querySelector('.update-badge')) {
            const badge = document.createElement('span');
            badge.className = 'update-badge';
            badge.textContent = count;
            icon.appendChild(badge);
        }
    });
}