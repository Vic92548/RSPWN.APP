async function createVersion(gameId, versionData) {
    return api.request(`/api/games/${gameId}/versions`, {
        method: 'POST',
        body: versionData
    });
}

async function getVersions(gameId) {
    return api.request(`/api/games/${gameId}/versions`);
}

async function addVersionManagementUI() {
    const managementCard = document.getElementById('game-management-card');
    const actionsSection = managementCard.querySelector('.vapr-card-body');

    if (!actionsSection.querySelector('.version-form')) {
        const versionForm = VAPR.createElement('version-form');
        actionsSection.appendChild(versionForm);
    }

    if (!actionsSection.querySelector('#versions-list')) {
        const versionsList = document.createElement('div');
        versionsList.className = 'versions-list';
        versionsList.id = 'versions-list';
        actionsSection.appendChild(versionsList);
    }
}

async function publishVersion() {
    if (!gamesData.currentManagingGame) return;

    const versionNumber = document.getElementById('version-number').value;
    const downloadUrl = document.getElementById('version-url').value;
    const size = document.getElementById('version-size').value;
    const changelog = document.getElementById('version-changelog').value;
    const isRequired = document.getElementById('version-required').checked;

    if (!versionNumber || !downloadUrl) {
        notify.warning('Missing Information', 'Please fill in version number and download URL');
        return;
    }

    try {
        const response = await createVersion(gamesData.currentManagingGame.id, {
            version: versionNumber,
            downloadUrl,
            size: size ? parseInt(size) : null,
            changelog,
            isRequired
        });

        if (response.success) {
            notify.success('Version published successfully!');

            document.getElementById('version-number').value = '';
            document.getElementById('version-url').value = '';
            document.getElementById('version-size').value = '';
            document.getElementById('version-changelog').value = '';
            document.getElementById('version-required').checked = false;

            await loadGameVersions(gamesData.currentManagingGame.id);
        }
    } catch (error) {
        console.error('Error publishing version:', error);
        notify.error('Failed to publish version', error.message);
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
    const container = document.getElementById('versions-list');
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