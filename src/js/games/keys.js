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

    DOM.setText('total-keys', totalKeys);
    DOM.setText('used-keys', usedKeys);
    DOM.setText('available-keys', availableKeys);
}

function filterKeys(tag) {
    gamesData.currentKeyFilter = tag;

    DOM.queryAll('.tag-filter-btn').forEach(btn => {
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
    const container = DOM.get('keys-list');
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

    const count = parseInt(DOM.get('key-count').value) || 5;
    const tag = DOM.get('key-tag').value || null;

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
        const a = DOM.create('a', {
            style: { display: 'none' },
            href: downloadUrl,
            download: `${gamesData.currentManagingGame.title.replace(/[^a-z0-9]/gi, '_')}_keys${tag ? `_${tag}` : ''}.csv`
        });

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