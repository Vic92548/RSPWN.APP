async function createVersion(gameId, versionData) {
    return api.request(`/api/games/${gameId}/versions`, {
        method: 'POST',
        body: versionData
    });
}

async function getVersions(gameId) {
    return api.request(`/api/games/${gameId}/versions`);
}

async function publishVersion() {
    if (!gamesData.currentManagingGame) return;

    const versionNumber = DOM.get('version-number').value;
    const downloadUrl = DOM.get('version-url').value;
    const changelog = DOM.get('version-changelog').value;
    const isRequired = DOM.get('version-required').checked;

    if (!versionNumber) {
        notify.warning('Missing Information', 'Please fill in version number');
        return;
    }

    if (!downloadUrl) {
        notify.warning('Missing Information', 'Please fill in download URL');
        return;
    }

    const publishBtn = event.target;
    const originalText = publishBtn.innerHTML;
    publishBtn.disabled = true;
    publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';

    try {
        const response = await createVersion(gamesData.currentManagingGame.id, {
            version: versionNumber,
            downloadUrl,
            size: null,
            changelog,
            isRequired
        });

        if (response.success) {
            notify.success('Version published successfully!');

            DOM.get('version-number').value = '';
            DOM.get('version-url').value = '';
            DOM.get('version-changelog').value = '';
            DOM.get('version-required').checked = false;

            await loadGameVersions(gamesData.currentManagingGame.id);
        }
    } catch (error) {
        console.error('Error publishing version:', error);
        notify.error('Failed to publish version', error.message);
    } finally {
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalText;
    }
}

async function loadGameVersions(gameId) {
    try {
        const response = await getVersions(gameId);
        if (response.success) {
            displayVersions(response.versions);
        }
    } catch (error) {
        console.error('Error loading versions:', error);
    }
}

function displayVersions(versions) {
    const container = DOM.get('versions-list');
    if (!container) return;

    container.innerHTML = '<h4>Version History</h4>';

    if (versions.length === 0) {
        container.innerHTML += '<p class="no-versions">No versions published yet</p>';
        return;
    }

    VAPR.appendElements(container, 'version-item',
        versions.map(version => ({
            version: version.version,
            changelog: version.changelog || '',
            downloads: version.downloads || 0,
            isRequired: version.isRequired ? 'true' : '',
            createdAt: version.createdAt
        }))
    );

    VAPR.refresh();
}