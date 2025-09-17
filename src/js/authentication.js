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
            if (typeof showAuthRequiredElements === 'function') {
                showAuthRequiredElements();
            }
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
        if (typeof hideAuthRequiredElements === 'function') {
            hideAuthRequiredElements();
        }
    })
}

function syncBackgroundFromBackend() {
    console.log(window.user);
    if (window.user && window.user.backgroundId) {
        equipBackground(window.user.backgroundId, false);
        console.log('Background synchronized from backend:', window.user.backgroundId);
    } else {
        const background_id = localStorage.getItem('background_id');
        if (background_id) {
            equipBackground(background_id, false);
        } else {
            setDefaultBackground();
        }
    }
}