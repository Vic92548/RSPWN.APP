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

    document.getElementById('game-details-cover').src = game.coverImage;
    document.getElementById('game-details-backdrop').src = game.coverImage;
    document.getElementById('game-hero-title').textContent = game.title;
    document.getElementById('game-details-description').innerHTML = game.description;

    const versionEl = document.getElementById('game-details-version');
    versionEl.textContent = game.currentVersion || game.version || '1.0.0';

    const developerEl = document.getElementById('game-details-developer');
    const heroDeveloperEl = document.getElementById('game-hero-developer');

    const updateDeveloperElements = (text, href = '#', clickable = false) => {
        [developerEl, heroDeveloperEl].forEach(el => {
            if (el) {
                el.textContent = text;
                el.href = href;
                el.style.cursor = clickable ? 'pointer' : 'default';
                el.onclick = clickable ? (e) => {
                    e.preventDefault();
                    closeGameDetails();
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                } : (e) => e.preventDefault();
            }
        });
    };

    updateDeveloperElements('Loading...', '#', false);

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
                updateDeveloperElements('@' + developerInfo.username, `/@${developerInfo.username}`, true);
            } else {
                throw new Error('Could not get developer info');
            }
        } catch (error) {
            console.error('Error fetching developer:', error);

            if (window.user && window.user.id === game.ownerId) {
                updateDeveloperElements('@' + window.user.username, `/@${window.user.username}`, true);
            } else {
                updateDeveloperElements('Unknown Developer', '#', false);
            }
        }
    } else if (game.developer) {
        updateDeveloperElements(game.developer, '#', false);
    } else {
        updateDeveloperElements('Unknown Developer', '#', false);
    }

    const releaseDateEl = document.getElementById('game-details-release-date');
    const heroReleaseDateEl = document.getElementById('game-hero-release-date');
    const releaseDate = game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'TBA';

    if (releaseDateEl) releaseDateEl.textContent = releaseDate;
    if (heroReleaseDateEl) heroReleaseDateEl.textContent = releaseDate;

    const userGameIds = gamesData.userGames.map(g => g.id);
    const isOwned = userGameIds.includes(game.id) ||
        (game.isTebexProduct && userGameIds.some(id => {
            const ownedGame = gamesData.userGames.find(g => g.id === id);
            return ownedGame && ownedGame.title.toLowerCase() === game.title.toLowerCase();
        }));

    const priceSection = document.getElementById('game-details-price-section');
    const ownedSection = document.getElementById('game-details-owned-section');
    const giftButton = document.getElementById('game-details-gift-button');
    const priceBox = document.querySelector('.price-box');
    const originalPriceEl = document.getElementById('game-details-original-price');
    const currentPriceEl = document.getElementById('game-details-price');

    if (game.isTebexProduct) {
        priceBox.style.display = 'flex';

        if (game.onSale) {
            originalPriceEl.style.display = 'inline';
            originalPriceEl.textContent = `${game.currency} ${game.originalPrice.toFixed(2)}`;
        } else {
            originalPriceEl.style.display = 'none';
        }

        currentPriceEl.textContent = `${game.currency} ${game.price.toFixed(2)}`;

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

            const addToCartBtn = document.getElementById('game-details-add-to-cart');
            addToCartBtn.onclick = () => {
                addToCart(game.tebexId);
                closeGameDetails();
            };
        }
    } else {
        priceBox.style.display = 'none';
        priceSection.style.display = 'none';

        if (isOwned) {
            ownedSection.style.display = 'flex';
            giftButton.style.display = 'none';
        } else {
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