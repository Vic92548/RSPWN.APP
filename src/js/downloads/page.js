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