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
        DOM.show('game-details-loading');

        let game = null;
        let vaprGame = null;
        let playerCount = 0;

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

                        try {
                            const keysResponse = await api.request(`/api/games/${vaprGame.id}/keys`);
                            if (keysResponse.success) {
                                playerCount = keysResponse.keys.filter(k => k.usedBy).length;
                            }
                        } catch (error) {
                            console.error('Error loading player count:', error);
                        }
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

            if (game) {
                try {
                    const keysResponse = await api.request(`/api/games/${game.id}/keys`);
                    if (keysResponse.success) {
                        playerCount = keysResponse.keys.filter(k => k.usedBy).length;
                    }
                } catch (error) {
                    console.error('Error loading player count:', error);
                }
            }
        }

        if (!game) {
            throw new Error('Game not found');
        }

        game.playerCount = playerCount;

        console.log('Final game data with ownerId:', game);

        await displayGameDetails(game);

    } catch (error) {
        console.error('Error loading game details:', error);
        notify.error('Failed to load game details');
    } finally {
        DOM.hide('game-details-loading');
    }
}

async function displayGameDetails(game) {
    console.log({ game });

    DOM.get('game-details-cover').src = game.coverImage;
    DOM.get('game-details-backdrop').src = game.coverImage;
    DOM.setText('game-hero-title', game.title);
    DOM.setHTML('game-details-description', game.description);

    const versionEl = DOM.get('game-details-version');
    const metaVersionEl = DOM.get('game-details-meta-version');
    const version = game.currentVersion || game.version || '1.0.0';
    DOM.setText(versionEl, version);
    if (metaVersionEl) DOM.setText(metaVersionEl, version);

    const playerCountEl = DOM.get('game-details-players');
    if (playerCountEl) {
        DOM.setText(playerCountEl, game.playerCount || 0);
    }

    const developerEl = DOM.get('game-details-developer');
    const heroDeveloperEl = DOM.get('game-hero-developer');

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

    const releaseDateEl = DOM.get('game-details-release-date');
    const heroReleaseDateEl = DOM.get('game-hero-release-date');
    const releaseDate = game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'TBA';

    if (releaseDateEl) DOM.setText(releaseDateEl, releaseDate);
    if (heroReleaseDateEl) DOM.setText(heroReleaseDateEl, releaseDate);

    const userGameIds = gamesData.userGames.map(g => g.id);
    const isOwned = userGameIds.includes(game.id) ||
        (game.isTebexProduct && userGameIds.some(id => {
            const ownedGame = gamesData.userGames.find(g => g.id === id);
            return ownedGame && ownedGame.title.toLowerCase() === game.title.toLowerCase();
        }));

    const priceSection = DOM.get('game-details-price-section');
    const ownedSection = DOM.get('game-details-owned-section');
    const giftButton = DOM.get('game-details-gift-button');
    const priceBox = DOM.query('.price-box');
    const originalPriceEl = DOM.get('game-details-original-price');
    const currentPriceEl = DOM.get('game-details-price');
    const disclaimerSection = DOM.get('game-details-disclaimer-section');

    if (game.isTebexProduct) {
        DOM.show(priceBox, 'flex');
        DOM.show(disclaimerSection);

        if (game.onSale) {
            DOM.show(originalPriceEl, 'inline');
            DOM.setText(originalPriceEl, `${game.currency} ${game.originalPrice.toFixed(2)}`);
        } else {
            DOM.hide(originalPriceEl);
        }

        DOM.setText(currentPriceEl, `${game.currency} ${game.price.toFixed(2)}`);

        if (isOwned) {
            DOM.hide(priceSection);
            DOM.show(ownedSection, 'flex');
            DOM.show(giftButton, 'inline-flex');
            giftButton.onclick = () => {
                addToCart(game.tebexId);
                closeGameDetails();
            };
        } else {
            DOM.show(priceSection, 'flex');
            DOM.hide(ownedSection);

            const addToCartBtn = DOM.get('game-details-add-to-cart');
            addToCartBtn.onclick = () => {
                addToCart(game.tebexId);
                closeGameDetails();
            };
        }
    } else {
        DOM.hide(priceBox);
        DOM.hide(priceSection);
        DOM.hide(disclaimerSection);

        if (isOwned) {
            DOM.show(ownedSection, 'flex');
            DOM.hide(giftButton);
        } else {
            DOM.hide(ownedSection);
        }
    }

    const changelogSection = DOM.get('game-details-changelog-section');
    const changelogContainer = DOM.get('game-details-changelog');

    if (game.changelog || game.updates) {
        DOM.show(changelogSection);
        DOM.setHTML(changelogContainer, game.changelog || game.updates || 'No recent updates');
    } else {
        DOM.hide(changelogSection);
    }

    const externalSection = DOM.get('game-details-external-section');
    const externalLink = DOM.get('game-details-external-link');

    if (game.externalLink) {
        DOM.show(externalSection);
        externalLink.href = game.externalLink;
    } else {
        DOM.hide(externalSection);
    }
}

function toggleDisclaimer() {
    const disclaimerContent = DOM.get('disclaimer-content');
    const disclaimerToggle = DOM.get('disclaimer-toggle');

    if (disclaimerContent.classList.contains('collapsed')) {
        disclaimerContent.classList.remove('collapsed');
        DOM.setHTML(disclaimerToggle, '<i class="fa-solid fa-chevron-up"></i>');
    } else {
        disclaimerContent.classList.add('collapsed');
        DOM.setHTML(disclaimerToggle, '<i class="fa-solid fa-chevron-down"></i>');
    }
}

window.showGameDetails = showGameDetails;
window.closeGameDetails = closeGameDetails;
window.toggleDisclaimer = toggleDisclaimer;