function loadUserData(){
    if(MainPage){
        document.getElementById("sign_in").style.display = "none";
        document.getElementById("add_post").style.display = "none";
    }

    fetch('/me', {
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            return response.json();
        })
        .then(data => {
            window.user = data;

            if(!MainPage){
                return;
            }

            updateUsername();
            updateLevel();

            const oldUser = {
                xp: 0,
                level: window.user.level,
                xp_required: window.user.xp_required
            };

            setXPProgress(oldUser, true);

            syncBackgroundFromBackend();

            document.getElementById("sign_in").style.display = "none";
            if(window.innerWidth <= 768){
                document.getElementById("add_post").style.display = "block";
            }

            document.getElementById("xp_bar").style.display = "block";

            loading_steps--;
            hideLoading();

            handleReferral();

            setTimeout(() => {
                migrateLocalBackgroundToBackend();
            }, 1000);

        }).catch( error => {
        document.getElementById("sign_in").style.display = "block";
        if(window.innerWidth <= 768){
            document.getElementById("add_post").style.display = "block";
        }
        document.getElementById("add_post").onclick = openRegisterModal;
        loading_steps--;
        hideLoading();
    });
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