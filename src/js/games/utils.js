function isRunningInTauri() {
    return typeof window.__TAURI__ !== 'undefined';
}

function isGameDeveloper() {
    if (!window.user) return false;

    // Check if user owns any games
    return gamesData.allGames.some(game => game.ownerId === window.user.id);
}