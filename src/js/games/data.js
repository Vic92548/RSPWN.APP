async function loadGamesData() {
    try {
        DOM.show('games-loading');

        const [gamesResponse, userGamesResponse, totalsResponse] = await Promise.all([
            api.request('/api/games'),
            isUserLoggedIn() ? api.request('/api/my-games') : Promise.resolve({ games: [] }),
            isUserLoggedIn() ? api.getPlaytimeTotals().catch(() => ({ success: false, totals: [] })) : Promise.resolve({ success: true, totals: [] })
        ]);

        gamesData.allGames = gamesResponse.games || [];
        gamesData.userGames = userGamesResponse.games || [];

        gamesData.playtimeTotals = {};
        if (totalsResponse && totalsResponse.totals) {
            for (const t of totalsResponse.totals) {
                gamesData.playtimeTotals[t.gameId] = t.totalSeconds || 0;
            }
        }

        if (isRunningInTauri()) {
            try {
                const installedGames = await window.__TAURI__.core.invoke('get_installed_games');
                gamesData.installedGames = installedGames || [];
            } catch (error) {
                console.error('Error loading installed games:', error);
                gamesData.installedGames = [];
            }
        }
    } catch (error) {
        console.error('Error loading games:', error);
    } finally {
        DOM.hide('games-loading');
    }
}

async function loadLibraryData() {
    try {
        DOM.show('library-loading');

        // Load user games from server
        const response = await api.request('/api/my-games');
        gamesData.userGames = response.games || [];

        // Load playtime data
        const totalsResponse = await api.getPlaytimeTotals().catch(() => ({ success: false, totals: [] }));
        gamesData.playtimeTotals = {};
        if (totalsResponse && totalsResponse.totals) {
            for (const t of totalsResponse.totals) {
                gamesData.playtimeTotals[t.gameId] = t.totalSeconds || 0;
            }
        }

        // Load installed games data if in Tauri
        if (isRunningInTauri()) {
            try {
                const installedGames = await window.__TAURI__.core.invoke('get_installed_games');
                gamesData.installedGames = installedGames || [];

                // Clear downloading/updating states
                gamesData.updatingGames.clear();
                gamesData.downloadingGames.clear();

                // Check for updates locally
                await checkAndShowUpdates();
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