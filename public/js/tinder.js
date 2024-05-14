document.addEventListener('DOMContentLoaded', (event) => {
    const post = document.getElementsByClassName("post")[0];
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    post.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = new Date().getTime();
        post.style.transition = '';
    });

    post.addEventListener('touchmove', (e) => {
        let touch = e.touches[0];
        let changeX = touch.clientX - startX;
        let changeY = touch.clientY - startY;
        post.style.transform = `translate(${changeX}px, ${changeY}px) rotate(${changeX * 0.1}deg)`;
    });

    post.addEventListener('touchend', (e) => {
        let changeX = e.changedTouches[0].clientX - startX;
        let changeY = e.changedTouches[0].clientY - startY;
        let elapsedTime = new Date().getTime() - startTime;
        let velocity = Math.abs(changeX) / elapsedTime;

        if (velocity > 0.3 || Math.abs(changeX) > 100) {
            if (changeX < 0) {
                dislikePost();
            } else {
                likePost();
            }
        } else {
            skipPost();
        }
        post.style.transition = 'transform 0.3s ease';
        post.style.transform = 'translate(0px, 0px) rotate(0deg)';
    });
});

function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transition = 'transform 0.6s ease';
    post.style.transform = "translateX(100vw) rotate(30deg)";

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function displayDislikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transition = 'transform 0.6s ease';
    post.style.transform = "translateX(-100vw) rotate(-30deg)";
}

function displaySkipAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transition = 'transform 0.6s ease';
    post.style.transform = "translateY(100vh) rotate(0deg)";
}

function likePost() {
    if (isUserLoggedIn()) {
        displayLikeAnimation();
        makeApiRequest("/like/" + current_post_id).then(data => {
            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };
            window.user = data.user;
            window.analytics.track('like', { post: current_post });
            setXPProgress(oldUser);
            setTimeout(displayPost, 600); // Wait for animation to complete
        }).catch(error => {
            console.log(error);
        });
    } else {
        if (post_seen > 7) {
            openRegisterModal();
        } else {
            displayLikeAnimation();
            setTimeout(displayPost, 600); // Wait for animation to complete
        }
    }
}

function skipPost() {
    if (isUserLoggedIn()) {
        displaySkipAnimation();
        makeApiRequest("/skip/" + current_post_id).then(data => {
            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };
            window.user = data.user;
            setXPProgress(oldUser);
            window.analytics.track('skip', { post: current_post });
            setTimeout(displayPost, 600); // Wait for animation to complete
        }).catch(error => {
            console.log(error);
        });
    } else {
        if (post_seen > 7) {
            openRegisterModal();
        } else {
            displaySkipAnimation();
            setTimeout(displayPost, 600); // Wait for animation to complete
        }
    }
}

function dislikePost() {
    if (isUserLoggedIn()) {
        displayDislikeAnimation();
        makeApiRequest("/dislike/" + current_post_id).then(data => {
            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };
            window.user = data.user;
            setXPProgress(oldUser);
            window.analytics.track('dislike', { post: current_post });
            setTimeout(displayPost, 600); // Wait for animation to complete
        }).catch(error => {
            console.log(error);
        });
    } else {
        if (post_seen > 7) {
            openRegisterModal();
        } else {
            displayDislikeAnimation();
            setTimeout(displayPost, 600); // Wait for animation to complete
        }
    }
}
