cardManager.register('games-card', {
    route: '/games',
    onLoad: async () => {
        await Promise.all([
            loadGamesData(),
            loadTebexGames()
        ]);
    }
});

cardManager.register('library-card', {
    route: '/library',
    onLoad: async () => {
        await loadLibraryData();
    }
});

function initGameEventListeners() {
    const gamesGrid = DOM.get('games-grid');
    if (gamesGrid) {
        gamesGrid.addEventListener('click', (e) => {
            const gameItem = e.target.closest('.game-item');
            if (gameItem && !e.target.closest('button')) {
                const gameId = gameItem.id.replace('game-item-', '');
                const game = gamesData.allGames.find(g => g.id === gameId);
                if (game && game.externalLink) {
                    window.open(game.externalLink, '_blank');
                }
            }
        });
    }
}

async function openMyLibrary() {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }
    hideMenu();
    router.navigate('/library', true);
}

function closeLibraryCard() {
    cardManager.hide('library-card');
}

function openRedeemModal() {
    DOM.show('redeem-modal', 'flex');
    DOM.get('game-key-input').value = '';
    DOM.get('game-key-input').focus();
}

function closeRedeemModal() {
    DOM.hide('redeem-modal');
}

async function redeemKey(event) {
    event.preventDefault();

    const keyInput = DOM.get('game-key-input');
    const key = keyInput.value.trim();

    try {
        const response = await api.request('/api/games/redeem-key', {
            method: 'POST',
            body: { key }
        });

        if (response.success) {
            closeRedeemModal();

            await notify.confirm(
                'Success!',
                `You now own ${response.game.title}!`,
                {
                    icon: 'success',
                    confirmButtonText: 'View Library',
                    showCancelButton: false
                }
            );
            openMyLibrary();
            await loadLibraryData();
        }
    } catch (error) {
        notify.error('Invalid Key', error.message || 'The key you entered is invalid or has already been used.');
    }
}

async function openKeyManagement(gameId) {
    const game = gamesData.allGames.find(g => g.id === gameId) ||
        developerData.myGames.find(g => g.id === gameId);

    if (!game) return;

    gamesData.currentManagingGame = game;

    let existingCard = DOM.get('key-management-card');
    if (!existingCard) {
        const keyCard = VAPR.createElement('key-management-card', {
            gameTitle: game.title
        });
        DOM.query('#feed').appendChild(keyCard);

        VAPR.refresh();

        cardManager.register('key-management-card', {
            onLoad: async () => {
                if (gamesData.currentManagingGame) {
                    await loadGameKeys(gamesData.currentManagingGame.id);
                }
            }
        });
    }

    await cardManager.show('key-management-card');
}

async function openVersionManagement(gameId) {
    const game = gamesData.allGames.find(g => g.id === gameId) ||
        developerData.myGames.find(g => g.id === gameId);

    if (!game) return;

    gamesData.currentManagingGame = game;

    let existingCard = DOM.get('version-management-card');
    if (!existingCard) {
        const versionCard = VAPR.createElementWithContent('version-management-card',
            { gameTitle: game.title },
            `<version-form></version-form>
             <div class="versions-list" id="versions-list"></div>`
        );
        DOM.query('#feed').appendChild(versionCard);

        VAPR.refresh();

        cardManager.register('version-management-card', {
            onLoad: async () => {
                if (gamesData.currentManagingGame) {
                    await loadGameVersions(gamesData.currentManagingGame.id);
                }
            }
        });
    }

    await cardManager.show('version-management-card');
}

function closeKeyManagementCard() {
    cardManager.hide('key-management-card');
}

function closeVersionManagementCard() {
    cardManager.hide('version-management-card');
}

VAPR.on('game-item', 'mounted', (element) => {
    const viewDetailsBtn = element.querySelector('[onclick*="showGameDetails"]');
    if (viewDetailsBtn) {
        const gameId = element.getAttribute('game-id');
        viewDetailsBtn.onclick = (e) => {
            e.stopPropagation();
            const game = gamesData.allGames.find(g => g.id === gameId);
            if (game) {
                const toSlug = (s) => String(s)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                const slug = toSlug(game.title);
                router.navigate(`/games/${slug}`, true);
            }
        };
    }
});

VAPR.on('tebex-game-item', 'mounted', (element) => {
    const gameId = element.getAttribute('game-id');
    element.onclick = () => {
        const game = gamesData.tebexGames.find(g => g.id === gameId);
        if (game) {
            const toSlug = (s) => String(s)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            const slug = toSlug(game.title);
            router.navigate(`/games/${slug}`, true);
        }
    };
});

VAPR.on('.game-tag-item', 'mounted', (element) => {
    const titleEl = element.querySelector('.game-tag-item-title');
    if (titleEl) {
        const gameTitle = titleEl.textContent;
        const toSlug = (s) => String(s)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const slug = toSlug(gameTitle);

        element.onclick = (e) => {
            e.preventDefault();
            router.navigate(`/games/${slug}`, true);
        };
    }
});

window.openTaggedGame = async function() {
    loading.show();
    if (window.currentPostTaggedGame && window.currentPostTaggedGame.id) {
        if (current_post && current_post.id) {
            try {
                const gameId = window.currentPostTaggedGame.id;
                console.log('Tracking game click for game:', gameId, 'post:', current_post.id);

                await api.request('/api/creators/track-game-click', {
                    method: 'POST',
                    body: {
                        gameId: gameId,
                        postId: current_post.id
                    }
                });
                console.log('Successfully tracked game click for creator attribution');
            } catch (error) {
                console.error('Failed to track game click:', error);
            }
        }

        if (!gamesData.tebexGames || gamesData.tebexGames.length === 0) {
            await loadTebexGames();
        }

        const toSlug = (s) => String(s)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const slug = toSlug(window.currentPostTaggedGame.title);

        loading.hide();
        router.navigate(`/games/${slug}`, true);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initGameEventListeners();
    if (isUserLoggedIn()) {
        setTimeout(checkAndShowUpdates, 3000);
    }
});

setInterval(() => {
    if (isUserLoggedIn()) {
        checkAndShowUpdates();
    }
}, 5 * 60 * 1000);