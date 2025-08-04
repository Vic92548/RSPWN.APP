async function openGameManagement(event, gameId) {
    event.stopPropagation();

    const game = gamesData.allGames.find(g => g.id === gameId);
    if (!game) return;

    gamesData.currentManagingGame = game;
    document.getElementById('management-game-name').textContent = game.title;

    await cardManager.show('game-management-card');
}

function closeGameManagementCard() {
    cardManager.hide('game-management-card');
}