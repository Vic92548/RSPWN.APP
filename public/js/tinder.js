document.addEventListener('DOMContentLoaded', (event) => {
    const post = document.getElementsByClassName("post")[0];
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let startTime = 0;

    post.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = startX;
        currentY = startY;
        startTime = new Date().getTime();
        post.style.transition = 'none';
        post.style.animation = 'none';
    });

    post.addEventListener('touchmove', (e) => {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
        let changeX = currentX - startX;
        let changeY = currentY - startY;
        post.style.transform = `translate(${changeX}px, ${changeY}px) rotate(${changeX * 0.1}deg)`;
    });

    post.addEventListener('touchend', (e) => {
        let changeX = currentX - startX;
        let changeY = currentY - startY;
        let elapsedTime = new Date().getTime() - startTime;
        let velocity = Math.abs(changeX) / elapsedTime;

        if (velocity > 0.3 || Math.abs(changeX) > 100) {
            if (changeX < -100) {
                dislikePost();
            } else if (changeX > 100) {
                likePost();
            } else {
                skipPost();
            }
        } else {
            resetPostPosition();
        }
    });

    function resetPostPosition() {
        post.style.transition = 'transform 0.3s ease';
        post.style.transform = 'translate(0px, 0px) rotate(0deg)';
    }
});

function setInitialTransform(post) {
    const style = window.getComputedStyle(post);
    const transform = style.transform;

    let translateX = "0px, 0px) rotate(0deg)".split("translate(")[1].split("px,");
    let translateY = translateX[1].split('px)')
    const rotate = parseInt(translateY[1].split("rotate(")[1].split("deg)")[0]);
    translateY = parseInt(translateY[0]);
    translateX = parseInt(translateX[0]);

    post.style.setProperty('--start-translate-x', `${translateX}px`);
    post.style.setProperty('--start-translate-y', `${translateY}px`);
    post.style.setProperty('--start-rotate', `${rotate}deg`);
}


function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh)";
    setInitialTransform(post);
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
    setInitialTransform(post);
    post.style.animation = 'swipeLeft 0.6s';
}

function displaySkipAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh)";
    setInitialTransform(post);
    post.style.animation = 'skip 0.6s';
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
