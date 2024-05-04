function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh)";

    post.style.animation = 'swipeRight 0.6s';

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function displayDislikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh)";

    post.style.animation = 'swipeLeft 0.6s';
}

function displaySkipAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh)";

    post.style.animation = 'skip 0.6s';
}

function likePost() {
    if(isUserLoggedIn()){
        displayLikeAnimation();
        makeApiRequest("/like/" + current_post_id).then(data => {

            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };

            window.user = data.user;

            window.analytics.track('like', {postId: current_post_id});

            setXPProgress(oldUser);

            displayPost();


        }).catch(error => {
            console.log(error);
        });
    }else{
        openRegisterModal();
    }

}

function skipPost() {
    if(isUserLoggedIn()){
        displaySkipAnimation();
        makeApiRequest("/skip/" + current_post_id).then(data => {

            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };

            window.user = data.user;

            setXPProgress(oldUser);

            window.analytics.track('skip', {postId: current_post_id});
            displayPost();
        }).catch(error => {
            console.log(error);
        });
    }else{
        openRegisterModal();
    }

}

function dislikePost() {
    if(isUserLoggedIn()){
        displayDislikeAnimation();
        makeApiRequest("/dislike/" + current_post_id).then(data => {

            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };

            window.user = data.user;

            setXPProgress(oldUser);



            window.analytics.track('dislike', {postId: current_post_id});
            displayPost();
        }).catch(error => {
            console.log(error);
        });
    }else{
        openRegisterModal();
    }

}