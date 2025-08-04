function openRedeemModal() {
    document.getElementById('redeem-modal').style.display = 'flex';
    document.getElementById('game-key-input').value = '';
    document.getElementById('game-key-input').focus();
}

function closeRedeemModal() {
    document.getElementById('redeem-modal').style.display = 'none';
}

async function redeemKey(event) {
    event.preventDefault();

    const keyInput = document.getElementById('game-key-input');
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

            closeGamesCard();
            openMyLibrary();
            await loadLibraryData();
        }
    } catch (error) {
        notify.error('Invalid Key', error.message || 'The key you entered is invalid or has already been used.');
    }
}