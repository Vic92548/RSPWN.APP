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

        // Notify creator program (and any other listeners) that auth is available
        try {
            if (typeof updateApplyUIForAuth === 'function') updateApplyUIForAuth();
        } catch (e) { /* no-op */ }

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

        setTimeout(() => {
            migrateLocalBackgroundToBackend();
        }, 1000);

        loadGamesData().then(() => {
            updateDeveloperSection();
            // Ensure Account section (with Logout) is visible when authenticated
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

        // Ensure guest-facing UI (like creator program apply section) is gated
        try {
            if (typeof updateApplyUIForAuth === 'function') updateApplyUIForAuth();
        } catch (e) { /* no-op */ }

        // Hide Account section when unauthenticated
        const accountSection = DOM.get('account_section');
        if (accountSection) DOM.hide(accountSection);
    })
}

function syncBackgroundFromBackend() {
    if (window.user && window.user.backgroundId) {
        const userBackground = background_images.find(bg => bg.id === window.user.backgroundId);

        if (userBackground) {
            equipBackground(userBackground.image_url, true);
            localStorage.setItem('background_url', userBackground.image_url);
            localStorage.setItem('background_id', userBackground.id);
            console.log('Background synchronized from backend:', userBackground.title);
        } else {
            console.log('User background ID not found in available backgrounds:', window.user.backgroundId);
            setDefaultBackground();
        }
    } else {
        const savedBackgroundUrl = localStorage.getItem('background_url');
        if (savedBackgroundUrl) {
            equipBackground(savedBackgroundUrl, false);
        } else {
            setDefaultBackground();
        }
    }
}

function setDefaultBackground() {
    if (background_images.length > 0) {
        const defaultBg = background_images[0];
        equipBackground(defaultBg.image_url, true);
        localStorage.setItem('background_url', defaultBg.image_url);
        localStorage.setItem('background_id', defaultBg.id);
    }
}