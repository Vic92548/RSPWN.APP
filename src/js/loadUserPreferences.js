function initPlayerPreferences() {
    const backgroundUrl = localStorage.getItem('background_url');

    if(backgroundUrl){
        equipBackground(backgroundUrl);
    }
}

initPlayerPreferences();