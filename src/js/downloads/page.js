let isDownloadsCardVisible = false;
let downloadUpdateInterval = null;

cardManager.register('downloads-card', {
    route: '/downloads',
    onShow: () => {
        isDownloadsCardVisible = true;
        updateDownloadsView();
        startDownloadUpdates();
    },
    onHide: () => {
        isDownloadsCardVisible = false;
        stopDownloadUpdates();
        return Promise.resolve();
    }
});

async function openDownloadsPage() {
    if (!isRunningInTauri()) {
        notify.warning('Desktop App Required', 'The downloads manager requires the VAPR desktop app.');
        return;
    }

    hideMenu();

    try {
        // Open the downloads window instead of navigating
        await window.__TAURI__.core.invoke('open_downloads_window');
    } catch (error) {
        console.error('Failed to open downloads window:', error);
        notify.error('Failed to open downloads window');
    }
}

function closeDownloadsCard() {
    isDownloadsCardVisible = false;
    stopDownloadUpdates();

    if (cardManager.currentCard === 'downloads-card') {
        cardManager.currentCard = null;
    }

    const card = document.getElementById('downloads-card');
    if (card) {
        card.classList.remove('show');
        card.style.display = 'none';
    }

    router.navigate('/', true);
}

function updateDownloadsView() {
    if (!window.downloadManager) return;

    const downloads = downloadManager.getDownloads();
    const container = DOM.get('downloads-list');
    const emptyState = DOM.get('downloads-empty');

    if (downloads.length === 0) {
        DOM.hide(container);
        DOM.show(emptyState);
        updateDownloadStats();
        return;
    }

    DOM.show(container);
    DOM.hide(emptyState);

    container.innerHTML = '';

    const sortedDownloads = downloads.sort((a, b) => {
        const statusOrder = {
            'downloading': 0,
            'preparing': 1,
            'paused': 2,
            'queued': 3,
            'completed': 4,
            'error': 5
        };

        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

    VAPR.appendElements(container, 'download-item',
        sortedDownloads.map(download => ({
            id: download.id,
            title: download.title,
            coverImage: download.coverImage,
            status: download.status,
            statusText: getStatusText(download),
            progress: Math.round(download.progress || 0),
            downloadedSize: formatFileSize(download.downloadedSize || 0),
            totalSize: formatFileSize(download.totalSize || 0),
            speed: formatSpeed(download.speed || 0),
            eta: formatETA(download.eta || 0),
            isActive: download.status === 'downloading' ? 'true' : '',
            isPaused: download.status === 'paused' ? 'true' : '',
            isQueued: download.status === 'queued' ? 'true' : ''
        }))
    );

    updateDownloadStats();
}

function updateDownloadStats() {
    if (!window.downloadManager) return;

    const active = downloadManager.getActiveDownloads();
    const queued = downloadManager.getQueuedDownloads();
    const completed = downloadManager.getCompletedDownloads();

    DOM.setText('active-downloads', active.length);
    DOM.setText('queued-downloads', queued.length);
    DOM.setText('completed-downloads', completed.length);

    const totalSpeed = active.reduce((sum, d) => sum + (d.speed || 0), 0);
    DOM.setText('total-speed', formatSpeed(totalSpeed));
}

function getStatusText(download) {
    const statusTexts = {
        'preparing': 'Preparing download...',
        'downloading': 'Downloading...',
        'paused': 'Paused',
        'queued': 'Waiting in queue',
        'completed': 'Download complete',
        'error': download.error || 'Download failed',
        'installing': 'Installing...',
        'extracting': 'Extracting files...'
    };

    return download.statusText || statusTexts[download.status] || 'Unknown';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond === 0) return '0 MB/s';
    return formatFileSize(bytesPerSecond) + '/s';
}

function formatETA(seconds) {
    if (seconds === 0 || !isFinite(seconds)) return '';

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function startDownloadUpdates() {
    stopDownloadUpdates();

    if (!isDownloadsCardVisible || !window.downloadManager) return;

    downloadUpdateInterval = setInterval(() => {
        if (!isDownloadsCardVisible || cardManager.currentCard !== 'downloads-card') {
            stopDownloadUpdates();
            return;
        }

        if (downloadManager.getActiveDownloads().length > 0) {
            updateDownloadsView();
        }
    }, 1000);
}

function stopDownloadUpdates() {
    if (downloadUpdateInterval) {
        clearInterval(downloadUpdateInterval);
        downloadUpdateInterval = null;
    }
}

async function pauseAllDownloads() {
    if (!window.downloadManager) return;

    const active = downloadManager.getActiveDownloads();
    for (const download of active) {
        await downloadManager.pauseDownload(download.id);
    }
    updateDownloadsView();
}

async function resumeAllDownloads() {
    if (!window.downloadManager) return;

    const paused = downloadManager.getDownloads().filter(d => d.status === 'paused');
    for (const download of paused) {
        await downloadManager.resumeDownload(download.id);
    }
    updateDownloadsView();
}

function clearCompletedDownloads() {
    if (!window.downloadManager) return;

    downloadManager.clearCompleted();
    updateDownloadsView();
}

async function pauseDownload(downloadId) {
    if (!window.downloadManager) return;

    await downloadManager.pauseDownload(downloadId);
    updateDownloadsView();
}

async function resumeDownload(downloadId) {
    if (!window.downloadManager) return;

    await downloadManager.resumeDownload(downloadId);
    updateDownloadsView();
}

async function cancelDownload(downloadId) {
    if (!window.downloadManager) return;

    const confirmed = await notify.confirm(
        'Cancel Download?',
        'Are you sure you want to cancel this download? You can restart it later from your library.'
    );

    if (confirmed) {
        await downloadManager.cancelDownload(downloadId);
        updateDownloadsView();
    }
}

function prioritizeDownload(downloadId) {
    if (!window.downloadManager) return;

    const index = downloadManager.queue.indexOf(downloadId);
    if (index > 0) {
        downloadManager.queue.splice(index, 1);
        downloadManager.queue.unshift(downloadId);
        updateDownloadsView();
    }
}

function initDownloadManagerListeners() {
    if (!window.downloadManager) return;

    downloadManager.on('download-progress', () => {
        if (isDownloadsCardVisible && cardManager.currentCard === 'downloads-card') {
            updateDownloadsView();
        }
    });

    downloadManager.on('download-completed', (download) => {
        notify.success(`${download.title} downloaded successfully!`);

        if (isDownloadsCardVisible && cardManager.currentCard === 'downloads-card') {
            updateDownloadsView();
        }

        if (cardManager.currentCard === 'library-card') {
            loadLibraryData();
        }
    });

    downloadManager.on('download-error', (download) => {
        notify.error('Download Failed', `Failed to download ${download.title}: ${download.error}`);

        if (isDownloadsCardVisible && cardManager.currentCard === 'downloads-card') {
            updateDownloadsView();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDownloadManagerListeners);
} else {
    setTimeout(initDownloadManagerListeners, 100);
}

window.pauseDownload = pauseDownload;
window.resumeDownload = resumeDownload;
window.cancelDownload = cancelDownload;
window.prioritizeDownload = prioritizeDownload;
window.pauseAllDownloads = pauseAllDownloads;
window.resumeAllDownloads = resumeAllDownloads;
window.clearCompletedDownloads = clearCompletedDownloads;