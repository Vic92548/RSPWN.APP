function isRunningInTauri() {
    return typeof window.__TAURI__ !== 'undefined';
}

function isGameDeveloper() {
    if (!window.user) return false;

    return gamesData.allGames.some(game => game.ownerId === window.user.id);
}