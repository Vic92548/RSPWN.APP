async function loadGamesData() {
    try {
        DOM.show('games-loading');

        const [gamesResponse, userGamesResponse] = await Promise.all([
            api.request('/api/games'),
            isUserLoggedIn() ? api.request('/api/my-games') : Promise.resolve({ games: [] })
        ]);

        gamesData.allGames = gamesResponse.games || [];
        gamesData.userGames = userGamesResponse.games || [];

        if (isRunningInTauri()) {
            try {
                const installedGames = await window.__TAURI__.core.invoke('get_installed_games');
                gamesData.installedGames = installedGames || [];
            } catch (error) {
                console.error('Error loading installed games:', error);
                gamesData.installedGames = [];
            }
        }

        displayGames();
    } catch (error) {
        console.error('Error loading games:', error);
    } finally {
        DOM.hide('games-loading');
    }
}

async function loadLibraryData() {
    try {
        DOM.show('library-loading');

        const response = await api.request('/api/my-games');
        gamesData.userGames = response.games || [];

        if (isRunningInTauri()) {
            try {
                const installedGames = await window.__TAURI__.core.invoke('get_installed_games');
                gamesData.installedGames = installedGames || [];
            } catch (error) {
                console.error('Error loading installed games:', error);
                gamesData.installedGames = [];
            }
        }

        displayLibrary();
    } catch (error) {
        console.error('Error loading library:', error);
    } finally {
        DOM.hide('library-loading');
    }
}