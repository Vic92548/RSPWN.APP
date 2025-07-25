function initPlayerPreferences() {
    if (!window.user) {
        const backgroundUrl = localStorage.getItem('background_url');

        if(backgroundUrl){
            equipBackground(backgroundUrl, false);
        }
    }
}

initPlayerPreferences();