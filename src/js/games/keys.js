async function loadGameKeys(gameId) {
    try {
        const response = await api.request(`/api/games/${gameId}/keys`);

        if (response.success) {
            gamesData.allKeys = response.keys;
            updateKeyStats();
            createTagFilters();
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

function createTagFilters() {
    const container = DOM.get('tag-filters');
    if (!container) return;

    container.innerHTML = '';

    const tagCounts = {
        all: gamesData.allKeys.length,
        '': 0,
        tebex: 0,
        keymailer: 0,
        review: 0,
        giveaway: 0,
        partner: 0
    };

    const availableTagCounts = {
        all: 0,
        '': 0,
        tebex: 0,
        keymailer: 0,
        review: 0,
        giveaway: 0,
        partner: 0
    };

    gamesData.allKeys.forEach(key => {
        const tag = key.tag || '';
        if (tagCounts.hasOwnProperty(tag)) {
            tagCounts[tag]++;
        }

        if (!key.usedBy) {
            availableTagCounts.all++;
            if (availableTagCounts.hasOwnProperty(tag)) {
                availableTagCounts[tag]++;
            }
        }
    });

    tagCounts[''] = gamesData.allKeys.filter(k => !k.tag || k.tag === null).length;
    availableTagCounts[''] = gamesData.allKeys.filter(k => (!k.tag || k.tag === null) && !k.usedBy).length;

    const tags = [
        { value: 'all', label: 'All', icon: 'fa-list' },
        { value: '', label: 'No Tag', icon: 'fa-tag-slash' },
        { value: 'tebex', label: 'Tebex', icon: 'fa-shopping-cart' },
        { value: 'keymailer', label: 'Keymailer', icon: 'fa-envelope' },
        { value: 'review', label: 'Review', icon: 'fa-star' },
        { value: 'giveaway', label: 'Giveaway', icon: 'fa-gift' },
        { value: 'partner', label: 'Partner', icon: 'fa-handshake' }
    ];

    tags.forEach(tag => {
        const count = tagCounts[tag.value] || 0;
        const availableCount = availableTagCounts[tag.value] || 0;

        if (count > 0) {
            const filterGroup = DOM.create('div', {
                class: 'tag-filter-group'
            });

            const filterBtn = DOM.create('button', {
                class: `tag-filter-btn ${tag.value === 'all' ? 'active' : ''}`,
                onclick: () => filterKeys(tag.value)
            });

            filterBtn.innerHTML = `
                <i class="fa-solid ${tag.icon}"></i>
                <span>${tag.label}</span>
                <span class="tag-count">${availableCount}/${count}</span>
            `;

            filterGroup.appendChild(filterBtn);

            if (availableCount > 0) {
                const downloadBtn = DOM.create('button', {
                    class: 'tag-download-btn',
                    onclick: () => downloadKeysByTag(tag.value),
                    title: `Download ${availableCount} available ${tag.label} keys`
                });

                downloadBtn.innerHTML = `<i class="fa-solid fa-download"></i>`;
                filterGroup.appendChild(downloadBtn);

                const copyBtn = DOM.create('button', {
                    class: 'tag-copy-btn',
                    onclick: () => copyKeysByTag(tag.value),
                    title: `Copy ${availableCount} available ${tag.label} keys`
                });

                copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i>`;
                filterGroup.appendChild(copyBtn);
            }

            container.appendChild(filterGroup);
        }
    });
}

function filterKeys(tag) {
    gamesData.currentKeyFilter = tag;

    DOM.queryAll('.tag-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = DOM.query(`.tag-filter-btn[onclick*="'${tag}'"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

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

function copyKeysByTag(tag) {
    // Determine filter for tag; when tag === 'all' include all tags, '' means untagged
    const tagParam = tag === 'all' ? null : tag;

    const keysToCopy = gamesData.allKeys
        .filter(key => {
            const matchesTag = tagParam === null
                ? true
                : (tagParam === '' ? (!key.tag || key.tag === null) : key.tag === tagParam);
            return matchesTag && !key.usedBy; // only copy available (unused) keys
        })
        .map(k => k.key);

    if (keysToCopy.length === 0) {
        notify.error('No available keys to copy');
        return;
    }

    notify.copyToClipboard(keysToCopy.join('\n'), `${keysToCopy.length} keys copied to clipboard!`);
}

async function downloadKeysByTag(tag) {
    if (!gamesData.currentManagingGame) return;

    const tagParam = tag === 'all' ? null : tag;
    const tagLabel = tag === '' ? 'untagged' : (tag === 'all' ? 'all' : tag);

    try {
        const url = `/api/games/${gamesData.currentManagingGame.id}/keys/download${tagParam !== null ? `?tag=${encodeURIComponent(tagParam)}` : ''}`;

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
            download: `${gamesData.currentManagingGame.title.replace(/[^a-z0-9]/gi, '_')}_keys_${tagLabel}.csv`
        });

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        notify.success(`${tagLabel} keys downloaded successfully!`);
    } catch (error) {
        console.error('Error downloading keys:', error);
        notify.error('Download Failed', 'Failed to download keys. Please try again.');
    }
}

async function downloadFilteredKeys() {
    const tag = gamesData.currentKeyFilter === 'all' ? 'all' : gamesData.currentKeyFilter;
    await downloadKeysByTag(tag);
}

function copyFilteredKeys() {
    const tag = gamesData.currentKeyFilter === 'all' ? 'all' : gamesData.currentKeyFilter;
    copyKeysByTag(tag);
}