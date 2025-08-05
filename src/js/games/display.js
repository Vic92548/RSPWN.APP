function displayGames() {
    const container = document.getElementById('games-grid');
    container.innerHTML = '';

    const userGameIds = gamesData.userGames.map(g => g.id);
    const tebexGames = gamesData.tebexGames || [];
    const regularGames = gamesData.allGames.filter(g => !g.isTebexProduct);

    const tebexGameTitles = tebexGames.map(g => g.title.toLowerCase());
    const gamesToDisplay = regularGames.filter(game =>
        !tebexGameTitles.includes(game.title.toLowerCase())
    );

    const allGamesToShow = [...gamesToDisplay, ...tebexGames];

    allGamesToShow.forEach(game => {
        const isOwned = userGameIds.includes(game.id) ||
            userGameIds.some(id => {
                const ownedGame = gamesData.userGames.find(g => g.id === id);
                return ownedGame && ownedGame.title.toLowerCase() === game.title.toLowerCase();
            });

        if (game.isTebexProduct) {
            VAPR.appendElement(container, 'tebex-game-item', {
                gameId: game.id,
                title: game.title,
                coverImage: game.coverImage,
                price: game.price.toFixed(2),
                currency: game.currency,
                onSale: game.onSale ? 'true' : '',
                originalPrice: game.originalPrice?.toFixed(2),
                discount: game.discount || 0,
                tebexId: game.tebexId,
                externalLink: game.externalLink || '',
                isOwned: isOwned ? 'true' : ''
            });
        } else {
            VAPR.appendElement(container, 'game-item', {
                gameId: game.id,
                title: game.title,
                description: game.description,
                coverImage: game.coverImage,
                isOwned: isOwned ? 'true' : '',
                isOwner: isUserLoggedIn() && game.ownerId === window.user.id ? 'true' : '',
                externalLink: game.externalLink || ''
            });
        }
    });

    VAPR.refresh();
}

function displayLibrary() {
    const container = document.getElementById('library-grid');
    container.innerHTML = '';

    if (gamesData.userGames.length === 0) {
        container.innerHTML += '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">No games in your library yet. Redeem a key to get started!</div>';
        return;
    }

    VAPR.appendElements(container, 'library-game-item',
        gamesData.userGames.map(game => {
            const isInstalled = gamesData.installedGames.some(g => g.id === game.id);
            const isDownloading = gamesData.downloadingGames.has(game.id);
            const isUpdating = gamesData.updatingGames.has(game.id);
            const installedGame = isInstalled ? gamesData.installedGames.find(g => g.id === game.id) : null;
            const hasUpdate = gamesData.updates.some(u => u.gameId === game.id);
            const updateInfo = hasUpdate ? gamesData.updates.find(u => u.gameId === game.id) : null;

            return {
                gameId: game.id,
                title: game.title,
                description: game.description,
                coverImage: game.coverImage,
                downloadUrl: game.downloadUrl || '',
                ownedAt: game.ownedAt,
                isInstalled: isInstalled ? 'true' : '',
                isDownloading: isDownloading ? 'true' : '',
                isUpdating: isUpdating ? 'true' : '',
                hasUpdate: hasUpdate ? 'true' : '',
                installedVersion: installedGame?.version || game.installedVersion || '',
                latestVersion: updateInfo?.toVersion || game.currentVersion || '',
                ...(installedGame?.executable && { executable: installedGame.executable.replaceAll('\\','/') }),
                ...(isDownloading && { downloadProgress: gamesData.downloadingGames.get(game.id) || 0 })
            };
        })
    );

    VAPR.refresh();
}