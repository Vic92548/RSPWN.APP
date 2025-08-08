window.gamesData = {
    allGames: [],
    userGames: [],
    currentManagingGame: null,
    installedGames: [],
    downloadingGames: new Map(),
    currentKeyFilter: 'all',
    allKeys: [],
    updates: [],
    versions: [],
    updatingGames: new Map(),
    // gameId -> totalSeconds
    playtimeTotals: {}
};