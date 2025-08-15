function equipBackground(url, save = true) {
    document.body.style.backgroundImage = 'url(' + url + ')';

    if (save) {
        localStorage.setItem('background_url', url);

        if (isUserLoggedIn() && navigator.onLine) {
            api.updateBackground(url)
                .then(response => {
                    console.log('Background synced successfully:', response);
                    if (window.user) {
                        window.user.backgroundUrl = url;
                    }
                })
                .catch(error => {
                    console.error('Failed to sync background:', error);
                });
        }
    }
}

function setDefaultBackground() {
    const defaultBgUrl = "https://vapr-club.b-cdn.net/backgrounds/sunset_crush.png";
    equipBackground(defaultBgUrl, true);
}

window.addEventListener('online', async () => {
    if (isUserLoggedIn()) {
        const pendingBackgroundUrl = localStorage.getItem('background_url');
        if (pendingBackgroundUrl && window.user && window.user.backgroundUrl !== pendingBackgroundUrl) {
            try {
                await api.updateBackground(pendingBackgroundUrl);
                console.log('Synced pending background change');
            } catch (error) {
                console.error('Failed to sync pending background:', error);
            }
        }
    }
});