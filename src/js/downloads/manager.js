// src/js/downloads/manager.js
class DownloadManager {
    constructor() {
        this.downloads = new Map();
        this.queue = [];
        this.activeDownloads = new Set();
        this.maxConcurrentDownloads = 3;
        this.listeners = new Map();

        if (isRunningInTauri()) {
            this.initTauriListeners();
        }
    }

    async initTauriListeners() {
        // Listen for download progress updates
        await window.__TAURI__.event.listen('download-progress', (event) => {
            this.handleProgress(event.payload);
        });

        // Listen for download status changes
        await window.__TAURI__.event.listen('download-status', (event) => {
            this.handleStatusChange(event.payload);
        });

        // Listen for download completion
        await window.__TAURI__.event.listen('download-complete', (event) => {
            this.handleCompletion(event.payload);
        });

        // Listen for download errors
        await window.__TAURI__.event.listen('download-error', (event) => {
            this.handleError(event.payload);
        });
    }

    async addDownload(gameData) {
        const downloadId = `download-${Date.now()}-${gameData.id}`;

        const download = {
            id: downloadId,
            gameId: gameData.id,
            title: gameData.title,
            coverImage: gameData.coverImage,
            downloadUrl: gameData.downloadUrl,
            status: 'queued',
            progress: 0,
            downloadedSize: 0,
            totalSize: 0,
            speed: 0,
            eta: 0,
            startTime: null,
            endTime: null,
            error: null
        };

        this.downloads.set(downloadId, download);
        this.queue.push(downloadId);

        this.emit('download-added', download);
        this.processQueue();

        return downloadId;
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
            // Call Tauri backend to start the download
            const result = await window.__TAURI__.core.invoke('start_download', {
                downloadId: downloadId,
                gameId: download.gameId,
                gameName: download.title,
                downloadUrl: download.downloadUrl
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

        // Process next in queue
        this.processQueue();
    }

    handleError(payload) {
        const download = this.downloads.get(payload.download_id);
        if (!download) return;

        download.status = 'error';
        download.error = payload.error;

        this.activeDownloads.delete(payload.download_id);
        this.emit('download-error', download);

        // Process next in queue
        this.processQueue();
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

        this.listeners.get(event).forEach(callback => {
            callback(data);
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
}

// Create global instance
window.downloadManager = new DownloadManager();