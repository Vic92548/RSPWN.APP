document.addEventListener('DOMContentLoaded', (event) => {
    if(!MainPage){
        return;
    }

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
        let velocityy = Math.abs(changeY) / elapsedTime;

        if (velocity > 0.3 || Math.abs(changeX) > 100) {
            if (changeX < -100) {
                dislikePost();
            } else if (changeX > 100) {
                likePost();
            }
        }else if (velocityy > 0.3 || Math.abs(changeY) > 100) {
            if (changeY < -100) {
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
    const transform = post.style.transform;

    console.log(transform);
    let translateX = transform.split("translate(")[1].split("px,");
    let translateY = translateX[1].split('px)')
    const rotate = parseInt(translateY[1].split("rotate(")[1].split("deg)")[0]);
    translateY = parseInt(translateY[0]);
    translateX = parseInt(translateX[0]);

    console.log({
        translateX: translateX,
        translateY: translateY,
        rotate
    })

    post.style.setProperty('--start-translate-x', `${translateX}px`);
    post.style.setProperty('--start-translate-y', `${translateY}px`);
    post.style.setProperty('--start-rotate', `${rotate}deg`);

    post.style.transform = "translateY(100vh)";
    post.style.transition = 'all 1s ease-in-out';
}

function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.animation = 'swipeRight 0.6s';
    post.style.transform = "translateY(100vh)";

    notify.showActionFeedback('liked');

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#059669']
    });
}

function displayDislikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.animation = 'swipeLeft 0.6s';
    post.style.transform = "translateY(100vh)";

    notify.showActionFeedback('passed');
}

function displaySkipAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.animation = 'skip 0.6s';
    post.style.transform = "translateY(100vh)";

    notify.showActionFeedback('skipped');
}

function likePost() {
    const post = document.getElementsByClassName("post")[0];
    setInitialTransform(post);
    if (isUserLoggedIn()) {
        displayLikeAnimation();
        APIHandler.handle(
            () => api.likePost(current_post_id),
            {
                updateXP: true,
                onSuccess: () => setTimeout(displayPost, 600)
            }
        );
    } else {
        if (post_seen > 3) {
            openRegisterModal();
        } else {
            displayLikeAnimation();
            setTimeout(displayPost, 1000);
        }
    }
}

function skipPost() {
    const post = document.getElementsByClassName("post")[0];
    setInitialTransform(post);
    if (isUserLoggedIn()) {
        displaySkipAnimation();
        APIHandler.handle(
            () => api.skipPost(current_post_id),
            {
                updateXP: true,
                onSuccess: () => setTimeout(displayPost, 600)
            }
        );
    } else {
        if (post_seen > 3) {
            openRegisterModal();
        } else {
            displaySkipAnimation();
            setTimeout(displayPost, 1000);
        }
    }
}

function dislikePost() {
    const post = document.getElementsByClassName("post")[0];
    setInitialTransform(post);
    if (isUserLoggedIn()) {
        displayDislikeAnimation();
        APIHandler.handle(
            () => api.dislikePost(current_post_id),
            {
                updateXP: true,
                onSuccess: () => setTimeout(displayPost, 600)
            }
        );
    } else {
        if (post_seen > 3) {
            openRegisterModal();
        } else {
            displayDislikeAnimation();
            setTimeout(displayPost, 1000);
        }
    }
}