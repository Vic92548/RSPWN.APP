class DownloadManager {
    constructor() {
        this.downloads = new Map();
        this.queue = [];
        this.activeDownloads = new Set();
        this.maxConcurrentDownloads = 3;
        this.listeners = new Map();
        this.isActive = true;

        if (isRunningInTauri()) {
            this.initTauriListeners();
        }
    }

    pauseEventProcessing() {
        this.isActive = false;
    }

    resumeEventProcessing() {
        this.isActive = true;
    }

    async initTauriListeners() {
        await window.__TAURI__.event.listen('download-progress', (event) => {
            if (this.isActive) {
                this.handleProgress(event.payload);
            }
        });

        await window.__TAURI__.event.listen('download-status', (event) => {
            this.handleStatusChange(event.payload);
        });

        await window.__TAURI__.event.listen('download-complete', (event) => {
            this.handleCompletion(event.payload);
        });

        await window.__TAURI__.event.listen('download-error', (event) => {
            this.handleError(event.payload);
        });

        await window.__TAURI__.event.listen('update-complete', (event) => {
            this.handleUpdateComplete(event.payload);
        });
    }

    async processQueue() {
        while (this.activeDownloads.size < this.maxConcurrentDownloads && this.queue.length > 0) {
            const downloadId = this.queue.shift();
            const download = this.downloads.get(downloadId);

            if (download && download.status === 'queued') {
                await this.startDownload(downloadId);
            }
        }
    }

    async startDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download) return;

        download.status = 'preparing';
        download.startTime = Date.now();
        this.activeDownloads.add(downloadId);

        this.emit('download-started', download);

        try {
            const result = await window.__TAURI__.core.invoke('start_download', {
                downloadId: downloadId,
                gameId: download.gameId,
                gameName: download.title,
                downloadUrl: download.downloadUrl,
                isUpdate: download.isUpdate,
                version: download.version
            });

            if (!result.success) {
                throw new Error(result.error || 'Download failed to start');
            }

            download.status = 'downloading';
            this.emit('download-status-changed', download);

        } catch (error) {
            download.status = 'error';
            download.error = error.message;
            this.activeDownloads.delete(downloadId);
            this.emit('download-error', download);
            this.processQueue();
        }
    }

    async pauseDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download || download.status !== 'downloading') return;

        try {
            await window.__TAURI__.core.invoke('pause_download', { downloadId });
            download.status = 'paused';
            this.activeDownloads.delete(downloadId);
            this.emit('download-paused', download);
            this.processQueue();
        } catch (error) {
            console.error('Failed to pause download:', error);
        }
    }

    async resumeDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download || download.status !== 'paused') return;

        if (this.activeDownloads.size >= this.maxConcurrentDownloads) {
            download.status = 'queued';
            this.queue.push(downloadId);
            this.emit('download-queued', download);
            return;
        }

        try {
            await window.__TAURI__.core.invoke('resume_download', { downloadId });
            download.status = 'downloading';
            this.activeDownloads.add(downloadId);
            this.emit('download-resumed', download);
        } catch (error) {
            console.error('Failed to resume download:', error);
        }
    }

    async cancelDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (!download) return;

        try {
            await window.__TAURI__.core.invoke('cancel_download', { downloadId });

            this.activeDownloads.delete(downloadId);
            this.queue = this.queue.filter(id => id !== downloadId);

            if (download.status !== 'completed') {
                this.downloads.delete(downloadId);
                this.emit('download-cancelled', download);
            }

            this.processQueue();
        } catch (error) {
            console.error('Failed to cancel download:', error);
        }
    }

    handleProgress(payload) {
        const download = this.downloads.get(payload.download_id);
        if (!download) return;

        download.progress = payload.percentage;
        download.downloadedSize = payload.downloaded;
        download.totalSize = payload.total;
        download.speed = payload.speed;
        download.eta = payload.eta;
        download.status = 'downloading';

        this.emit('download-progress', download);
    }

    handleStatusChange(payload) {
        const download = this.downloads.get(payload.download_id);
        if (!download) return;

        download.status = payload.status;
        download.statusText = payload.message;

        this.emit('download-status-changed', download);
    }

    handleCompletion(payload) {
        const download = this.downloads.get(payload.download_id);
        if (!download) return;

        download.status = 'completed';
        download.progress = 100;
        download.endTime = Date.now();
        download.installPath = payload.install_path;
        download.executable = payload.executable;

        this.activeDownloads.delete(payload.download_id);
        this.emit('download-completed', download);
        this.processQueue();
    }

    handleError(payload) {
        const download = this.downloads.get(payload.download_id);
        if (!download) return;

        download.status = 'error';
        download.error = payload.error;

        this.activeDownloads.delete(payload.download_id);
        this.emit('download-error', download);

        this.processQueue();
    }

    async handleUpdateCompleted(payload) {
        if (window.gamesData) {
            window.gamesData.updatingGames.delete(payload.gameId);
            window.gamesData.updates = window.gamesData.updates.filter(u => u.gameId !== payload.gameId);

            const installedGame = window.gamesData.installedGames.find(g => g.id === payload.gameId);
            if (installedGame) {
                installedGame.version = payload.version;
            }
        }

        if (window.notify) {
            window.notify.success(`${payload.gameName} updated to v${payload.version}!`);
        }

        if (window.cardManager && window.cardManager.currentCard === 'library-card') {
            if (typeof window.loadLibraryData === 'function') {
                window.loadLibraryData();
            }
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;

        if (!this.isActive && !['download-completed', 'download-error'].includes(event)) {
            return;
        }

        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in download manager listener for ${event}:`, error);
            }
        });
    }

    getDownloads() {
        return Array.from(this.downloads.values());
    }

    getActiveDownloads() {
        return this.getDownloads().filter(d => d.status === 'downloading');
    }

    getQueuedDownloads() {
        return this.getDownloads().filter(d => d.status === 'queued');
    }

    getCompletedDownloads() {
        return this.getDownloads().filter(d => d.status === 'completed');
    }

    clearCompleted() {
        const completed = this.getCompletedDownloads();
        completed.forEach(download => {
            this.downloads.delete(download.id);
        });
        this.emit('downloads-cleared', completed);
    }

    addDownload(downloadInfo) {
        this.downloads.set(downloadInfo.id, downloadInfo);
        if (this.activeDownloads.size < this.maxConcurrentDownloads) {
            this.startDownload(downloadInfo.id);
        } else {
            downloadInfo.status = 'queued';
            this.queue.push(downloadInfo.id);
        }
    }
}

window.downloadManager = new DownloadManager();