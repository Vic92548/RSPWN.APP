cardManager.register('library-card', {
    route: '/library',
    onLoad: async () => {
        await loadLibraryData();
    },
    onShow: () => {
        if (isRunningInTauri()) {
            window.__TAURI__.core.invoke('get_installed_games').then(installedGames => {
                if (installedGames && JSON.stringify(installedGames) !== JSON.stringify(gamesData.installedGames)) {
                    gamesData.installedGames = installedGames;
                    displayLibrary();
                }
            }).catch(console.error);
        }
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