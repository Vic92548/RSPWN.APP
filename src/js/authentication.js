function loadUserData(){
    DOM.hide("sign_in");
    DOM.hide("add_post");

    api.getMe().then(function(data){
        window.user = data;

        if (window.updateSDKUserInfo) {
            window.updateSDKUserInfo();
        }

        updateUsername();
        updateLevel();

        try {
            if (typeof updateApplyUIForAuth === 'function') updateApplyUIForAuth();
        } catch (e) { }

        const oldUser = {
            xp: 0,
            level: window.user.level,
            xp_required: window.user.xp_required
        };

        setXPProgress(oldUser, true);

        syncBackgroundFromBackend();

        DOM.hide("sign_in");
        if(window.innerWidth <= 768){
            DOM.show("add_post");
        }

        DOM.show("xp_bar");

        loading_steps--;

        handleReferral();

        loadGamesData().then(() => {
            updateDeveloperSection();
            const accountSection = DOM.get('account_section');
            if (accountSection) DOM.show(accountSection);
        });

        checkAndShowUpdates();
    }).catch(error => {

        DOM.show("sign_in");
        if(window.innerWidth <= 768){
            DOM.show("add_post");
        }
        DOM.get("add_post").onclick = openRegisterModal;
        loading_steps--;

        try {
            if (typeof updateApplyUIForAuth === 'function') updateApplyUIForAuth();
        } catch (e) { }

        const accountSection = DOM.get('account_section');
        if (accountSection) DOM.hide(accountSection);
    })
}

function syncBackgroundFromBackend() {
    if (window.user && window.user.backgroundUrl) {
        equipBackground(window.user.backgroundUrl, false);
        localStorage.setItem('background_url', window.user.backgroundUrl);
        console.log('Background synchronized from backend:', window.user.backgroundUrl);
    } else {
        const savedBackgroundUrl = localStorage.getItem('background_url');
        if (savedBackgroundUrl) {
            equipBackground(savedBackgroundUrl, false);
        } else {
            setDefaultBackground();
        }
    }
}