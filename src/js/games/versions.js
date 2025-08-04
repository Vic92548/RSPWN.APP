async function createVersion(gameId, versionData) {
    return api.request(`/api/games/${gameId}/versions`, {
        method: 'POST',
        body: versionData
    });
}

async function getVersions(gameId) {
    return api.request(`/api/games/${gameId}/versions`);
}

function toggleUploadMethod(method) {
    const urlGroup = document.getElementById('url-input-group');
    const fileGroup = document.getElementById('file-input-group');
    const sizeGroup = document.getElementById('size-input-group');
    const methodBtns = document.querySelectorAll('.method-btn');

    methodBtns.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.method-btn').classList.add('active');

    if (method === 'url') {
        urlGroup.style.display = 'block';
        fileGroup.style.display = 'none';
        sizeGroup.style.display = 'block';
    } else {
        urlGroup.style.display = 'none';
        fileGroup.style.display = 'block';
        sizeGroup.style.display = 'none';
    }
}

function clearFileUpload(event) {
    event.stopPropagation();
    const fileInput = document.getElementById('version-file');
    fileInput.value = '';
    document.getElementById('file-upload-placeholder').style.display = 'flex';
    document.getElementById('file-upload-preview').style.display = 'none';
}

async function publishVersion() {
    if (!gamesData.currentManagingGame) return;

    const versionNumber = document.getElementById('version-number').value;
    const changelog = document.getElementById('version-changelog').value;
    const isRequired = document.getElementById('version-required').checked;

    const isFileUpload = document.getElementById('file-input-group').style.display !== 'none';

    if (!versionNumber) {
        notify.warning('Missing Information', 'Please fill in version number');
        return;
    }

    const publishBtn = event.target;
    const originalText = publishBtn.innerHTML;
    publishBtn.disabled = true;
    publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';

    try {
        let downloadUrl, size;

        if (isFileUpload) {
            const fileInput = document.getElementById('version-file');
            const file = fileInput.files[0];

            if (!file) {
                notify.warning('No file selected', 'Please select a ZIP file to upload');
                publishBtn.disabled = false;
                publishBtn.innerHTML = originalText;
                return;
            }

            publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading file...';

            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch(`/api/games/${gamesData.currentManagingGame.id}/upload-update`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Failed to upload file');
            }

            downloadUrl = uploadResult.downloadUrl;
            size = uploadResult.size;

            publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating version...';
        } else {
            downloadUrl = document.getElementById('version-url').value;
            size = document.getElementById('version-size').value;

            if (!downloadUrl) {
                notify.warning('Missing Information', 'Please fill in download URL');
                publishBtn.disabled = false;
                publishBtn.innerHTML = originalText;
                return;
            }
        }

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

            if (isFileUpload) {
                clearFileUpload({ stopPropagation: () => {} });
            }

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

function handleVersionFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
        notify.error('Invalid file type', 'Please select a ZIP file');
        event.target.value = '';
        return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
        notify.error('File too large', 'Maximum file size is 500MB');
        event.target.value = '';
        return;
    }

    document.getElementById('file-upload-placeholder').style.display = 'none';
    document.getElementById('file-upload-preview').style.display = 'flex';
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = `(${(file.size / 1024 / 1024).toFixed(2)} MB)`;
}

function initVersionFileUpload() {
    const uploadArea = document.querySelector('.file-upload-area');
    if (!uploadArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragging');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragging');
        }, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const fileInput = document.getElementById('version-file');
            fileInput.files = files;
            handleVersionFileSelect({ target: fileInput });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('version-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleVersionFileSelect);
    }
});

VAPR.on('.version-form', 'mounted', () => {
    initVersionFileUpload();
});

window.toggleUploadMethod = toggleUploadMethod;
window.clearFileUpload = clearFileUpload;
window.handleVersionFileSelect = handleVersionFileSelect;