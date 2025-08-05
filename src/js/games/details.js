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

        if (gameId.startsWith('tebex-')) {
            game = gamesData.tebexGames.find(g => g.id === gameId);
        } else {
            game = gamesData.allGames.find(g => g.id === gameId);
        }

        if (!game) {
            throw new Error('Game not found');
        }

        displayGameDetails(game);

    } catch (error) {
        console.error('Error loading game details:', error);
        notify.error('Failed to load game details');
    } finally {
        document.getElementById('game-details-loading').style.display = 'none';
    }
}

function displayGameDetails(game) {
    document.getElementById('game-details-title').textContent = game.title;
    document.getElementById('game-details-tagline').textContent = game.category || 'Game';
    document.getElementById('game-details-cover').src = game.coverImage;
    document.getElementById('game-details-description').textContent = game.description;

    const versionEl = document.getElementById('game-details-version');
    versionEl.textContent = game.currentVersion || game.version || '1.0.0';

    const developerEl = document.getElementById('game-details-developer');
    if (game.ownerId) {
        loadDeveloperName(game.ownerId, developerEl);
    } else {
        developerEl.textContent = game.developer || 'Unknown';
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

    if (isOwned) {
        priceSection.style.display = 'none';
        ownedSection.style.display = 'block';
    } else if (game.isTebexProduct) {
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
    } else {
        priceSection.style.display = 'none';
        ownedSection.style.display = 'none';
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

async function loadDeveloperName(userId, element) {
    try {
        const response = await api.getUser(userId);
        element.textContent = '@' + response.username;
    } catch (error) {
        element.textContent = 'Unknown';
    }
}

window.showGameDetails = showGameDetails;
window.closeGameDetails = closeGameDetails;