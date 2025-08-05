let currentGameDetails = null;

cardManager.register('game-details-card', {
    onLoad: async () => {
        if (currentGameDetails) {
            await loadGameDetails(currentGameDetails);
        }
    }
});

async function showGameDetails(gameId) {
    currentGameDetails = gameId;
    await cardManager.show('game-details-card');
}

function closeGameDetails() {
    cardManager.hide('game-details-card');
    currentGameDetails = null;
}

async function loadGameDetails(gameId) {
    try {
        document.getElementById('game-details-loading').style.display = 'block';

        let game = null;
        let vaprGame = null;

        if (gameId.startsWith('tebex-')) {
            game = gamesData.tebexGames.find(g => g.id === gameId);

            if (game) {
                const vaprGamesResponse = await api.request('/api/games');
                if (vaprGamesResponse.success) {
                    vaprGame = vaprGamesResponse.games.find(g =>
                        g.title.toLowerCase() === game.title.toLowerCase()
                    );

                    if (vaprGame) {
                        game = {
                            ...game,
                            ownerId: vaprGame.ownerId,
                            currentVersion: vaprGame.currentVersion || game.currentVersion,
                            createdAt: vaprGame.createdAt || game.createdAt
                        };
                    }
                }
            }
        } else {
            game = gamesData.allGames.find(g => g.id === gameId);

            if (!game) {
                const response = await api.request(`/api/games`);
                if (response.success) {
                    game = response.games.find(g => g.id === gameId);
                }
            }
        }

        if (!game) {
            throw new Error('Game not found');
        }

        console.log('Final game data with ownerId:', game);

        await displayGameDetails(game);

    } catch (error) {
        console.error('Error loading game details:', error);
        notify.error('Failed to load game details');
    } finally {
        document.getElementById('game-details-loading').style.display = 'none';
    }
}

async function displayGameDetails(game) {

    console.log({ game });

    document.getElementById('game-details-title').textContent = game.title;
    document.getElementById('game-details-tagline').textContent = game.category || 'Game';
    document.getElementById('game-details-cover').src = game.coverImage;
    document.getElementById('game-details-description').innerHTML = game.description;

    const versionEl = document.getElementById('game-details-version');
    versionEl.textContent = game.currentVersion || game.version || '1.0.0';

    const developerEl = document.getElementById('game-details-developer');
    developerEl.textContent = 'Loading...';
    developerEl.href = '#';
    developerEl.style.cursor = 'default';
    developerEl.onclick = (e) => e.preventDefault();

    console.log('Game ownerId:', game.ownerId);

    if (game.ownerId) {
        try {
            let developerInfo = null;

            if (window.creators && window.creators[game.ownerId]) {
                developerInfo = {
                    username: window.creators[game.ownerId].username,
                    id: game.ownerId
                };
                console.log('Developer from cache:', developerInfo);
            } else {
                const response = await fetch(`/api/user/${game.ownerId}`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    developerInfo = await response.json();
                    console.log('Developer from API:', developerInfo);

                    if (!window.creators) {
                        window.creators = {};
                    }
                    if (!window.creators[game.ownerId]) {
                        window.creators[game.ownerId] = {};
                    }
                    window.creators[game.ownerId].username = developerInfo.username;
                }
            }

            if (developerInfo && developerInfo.username) {
                developerEl.textContent = '@' + developerInfo.username;
                developerEl.href = `/@${developerInfo.username}`;
                developerEl.style.cursor = 'pointer';
                developerEl.onclick = (e) => {
                    e.preventDefault();
                    closeGameDetails();
                    setTimeout(() => {
                        window.location.href = `/@${developerInfo.username}`;
                    }, 300);
                };
            } else {
                throw new Error('Could not get developer info');
            }
        } catch (error) {
            console.error('Error fetching developer:', error);

            if (window.user && window.user.id === game.ownerId) {
                developerEl.textContent = '@' + window.user.username;
                developerEl.href = `/@${window.user.username}`;
                developerEl.style.cursor = 'pointer';
                developerEl.onclick = (e) => {
                    e.preventDefault();
                    closeGameDetails();
                    setTimeout(() => {
                        window.location.href = `/@${window.user.username}`;
                    }, 300);
                };
            } else {
                developerEl.textContent = 'Unknown Developer';
                developerEl.href = '#';
                developerEl.style.cursor = 'default';
                developerEl.onclick = (e) => e.preventDefault();
            }
        }
    } else if (game.developer) {
        developerEl.textContent = game.developer;
        developerEl.href = '#';
        developerEl.style.cursor = 'default';
        developerEl.onclick = (e) => e.preventDefault();
    } else {
        developerEl.textContent = 'Unknown Developer';
        developerEl.href = '#';
        developerEl.style.cursor = 'default';
        developerEl.onclick = (e) => e.preventDefault();
    }

    const releaseDateEl = document.getElementById('game-details-release-date');
    if (game.createdAt) {
        releaseDateEl.textContent = new Date(game.createdAt).toLocaleDateString();
    } else {
        releaseDateEl.textContent = 'TBA';
    }

    const categoryEl = document.getElementById('game-details-category');
    categoryEl.textContent = game.category || 'Game';

    const userGameIds = gamesData.userGames.map(g => g.id);
    const isOwned = userGameIds.includes(game.id) ||
        (game.isTebexProduct && userGameIds.some(id => {
            const ownedGame = gamesData.userGames.find(g => g.id === id);
            return ownedGame && ownedGame.title.toLowerCase() === game.title.toLowerCase();
        }));

    const priceSection = document.getElementById('game-details-price-section');
    const ownedSection = document.getElementById('game-details-owned-section');
    const giftButton = document.getElementById('game-details-gift-button');

    if (game.isTebexProduct) {
        if (isOwned) {
            priceSection.style.display = 'none';
            ownedSection.style.display = 'flex';
            giftButton.style.display = 'inline-flex';
            giftButton.onclick = () => {
                addToCart(game.tebexId);
                closeGameDetails();
            };
        } else {
            priceSection.style.display = 'flex';
            ownedSection.style.display = 'none';

            const originalPriceEl = document.getElementById('game-details-original-price');
            const currentPriceEl = document.getElementById('game-details-price');
            const addToCartBtn = document.getElementById('game-details-add-to-cart');

            if (game.onSale) {
                originalPriceEl.style.display = 'inline';
                originalPriceEl.textContent = `${game.currency} ${game.originalPrice.toFixed(2)}`;
            } else {
                originalPriceEl.style.display = 'none';
            }

            currentPriceEl.textContent = `${game.currency} ${game.price.toFixed(2)}`;
            addToCartBtn.onclick = () => {
                addToCart(game.tebexId);
                closeGameDetails();
            };
        }
    } else {
        if (isOwned) {
            priceSection.style.display = 'none';
            ownedSection.style.display = 'flex';
            giftButton.style.display = 'none';
        } else {
            priceSection.style.display = 'none';
            ownedSection.style.display = 'none';
        }
    }

    const changelogSection = document.getElementById('game-details-changelog-section');
    const changelogContainer = document.getElementById('game-details-changelog');

    if (game.changelog || game.updates) {
        changelogSection.style.display = 'block';
        changelogContainer.innerHTML = game.changelog || game.updates || 'No recent updates';
    } else {
        changelogSection.style.display = 'none';
    }

    const externalSection = document.getElementById('game-details-external-section');
    const externalLink = document.getElementById('game-details-external-link');

    if (game.externalLink) {
        externalSection.style.display = 'block';
        externalLink.href = game.externalLink;
    } else {
        externalSection.style.display = 'none';
    }
}

window.showGameDetails = showGameDetails;
window.closeGameDetails = closeGameDetails;