function isRunningInTauri() {
    return typeof window.__TAURI__ !== 'undefined';
}

function isGameDeveloper() {
    if (!window.user) return false;

    return gamesData.allGames.some(game => game.ownerId === window.user.id);
}

async function findVAPRGameIdByTitle(title) {
    if (!title) return null;

    try {
        let vaprGames = gamesData.allGames;

        if (!vaprGames || vaprGames.length === 0) {
            const response = await api.request('/api/games');
            if (response.success) {
                vaprGames = response.games;
            } else {
                return null;
            }
        }

        const matchedGame = vaprGames.find(g =>
            g.title.toLowerCase() === title.toLowerCase()
        );

        return matchedGame?.id || null;
    } catch (error) {
        console.error('Error finding VAPR game by title:', error);
        return null;
    }
}

window.findVAPRGameIdByTitle = findVAPRGameIdByTitle;