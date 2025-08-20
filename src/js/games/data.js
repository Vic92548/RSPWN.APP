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

        // map totals to object for quick lookup
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

        const [response, totalsResponse] = await Promise.all([
            api.request('/api/my-games'),
            isUserLoggedIn() ? api.getPlaytimeTotals().catch(() => ({ success: false, totals: [] })) : Promise.resolve({ success: true, totals: [] })
        ]);
        gamesData.userGames = response.games || [];

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

        displayLibrary();
    } catch (error) {
        console.error('Error loading library:', error);
    } finally {
        DOM.hide('library-loading');
    }
}