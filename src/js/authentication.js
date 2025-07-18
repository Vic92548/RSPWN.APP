function loadUserData(){
    if(MainPage){
        document.getElementById("sign_in").style.display = "none";
        document.getElementById("add_post").style.display = "none";
    }


    makeApiRequest("/me").then(data => {
        window.user = data;

        if(!MainPage){
            return;
        }

        updateUsername();
        updateLevel();

        /*
        for (let i = 0; i < background_images.length; i++) {
            if(background_images[i].id === data.backgroundId){
                const background_url = 'https://vapr.b-cdn.net/background_images/' + background_images[i].id + '.webp';
                equipBackground(background_url);
                break;
            }
        }

         */

        const oldUser = {
            xp: 0,
            level: window.user.level,
            xp_required: window.user.xp_required
        };

        setXPProgress(oldUser, true);

        document.getElementById("sign_in").style.display = "none";
        if(window.innerWidth <= 768){
            document.getElementById("add_post").style.display = "block";
        }

        document.getElementById("xp_bar").style.display = "block";

        loading_steps--;
        hideLoading();

        handleReferral();

    }).catch( error => {
        document.getElementById("sign_in").style.display = "block";
        if(window.innerWidth <= 768){
            document.getElementById("add_post").style.display = "block";
        }
        document.getElementById("add_post").onclick = openRegisterModal;
        loading_steps--;
        hideLoading();
    })
}