function isRunningInTauri() {
    return typeof window.__TAURI__ !== 'undefined';
}