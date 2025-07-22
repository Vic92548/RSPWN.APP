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

// Enhanced animation feedback
function showActionFeedback(action) {
    const feedback = document.createElement('div');
    feedback.className = 'action-feedback ' + action;
    feedback.innerHTML = `<i class="fa-solid fa-${action === 'liked' ? 'heart' : action === 'passed' ? 'heart-crack' : 'forward'}"></i> ${action.charAt(0).toUpperCase() + action.slice(1)}!`;

    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.remove();
    }, 1000);
}

function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.animation = 'swipeRight 0.6s';
    post.style.transform = "translateY(100vh)";

    showActionFeedback('liked');

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

    showActionFeedback('passed');
}

function displaySkipAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.animation = 'skip 0.6s';
    post.style.transform = "translateY(100vh)";

    showActionFeedback('skipped');
}

function likePost() {
    const post = document.getElementsByClassName("post")[0];
    setInitialTransform(post);
    if (isUserLoggedIn()) {
        displayLikeAnimation();
        api.likePost(current_post_id).then(data => {
            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };
            window.user = data.user;
            setXPProgress(oldUser);
            setTimeout(displayPost, 600); // Wait for animation to complete
        }).catch(error => {
            console.log(error);
        });
    } else {
        if (post_seen > 3) {
            openRegisterModal();
        } else {
            displayLikeAnimation();
            setTimeout(displayPost, 1000); // Wait for animation to complete
        }
    }
}

function skipPost() {
    const post = document.getElementsByClassName("post")[0];
    setInitialTransform(post);
    if (isUserLoggedIn()) {
        displaySkipAnimation();
        api.skipPost(current_post_id).then(data => {
            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };
            window.user = data.user;
            setXPProgress(oldUser);
            setTimeout(displayPost, 600); // Wait for animation to complete
        }).catch(error => {
            console.log(error);
        });
    } else {
        if (post_seen > 3) {
            openRegisterModal();
        } else {
            displaySkipAnimation();
            setTimeout(displayPost, 1000); // Wait for animation to complete
        }
    }
}

function dislikePost() {
    const post = document.getElementsByClassName("post")[0];
    setInitialTransform(post);
    if (isUserLoggedIn()) {
        displayDislikeAnimation();
        api.dislikePost(current_post_id).then(data => {
            const oldUser = {
                xp: window.user.xp,
                level: window.user.level,
                xp_required: window.user.xp_required
            };
            window.user = data.user;
            setXPProgress(oldUser);
            setTimeout(displayPost, 600); // Wait for animation to complete
        }).catch(error => {
            console.log(error);
        });
    } else {
        if (post_seen > 3) {
            openRegisterModal();
        } else {
            displayDislikeAnimation();
            setTimeout(displayPost, 1000); // Wait for animation to complete
        }
    }
}

// Add action feedback styles
if (!document.getElementById('action-feedback-styles')) {
    const style = document.createElement('style');
    style.id = 'action-feedback-styles';
    style.textContent = `
        .action-feedback {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 50px;
            font-size: 24px;
            font-weight: 700;
            z-index: 10000;
            animation: feedbackPulse 0.5s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .action-feedback.liked {
            background: rgba(34, 197, 94, 0.9);
        }

        .action-feedback.passed {
            background: rgba(239, 68, 68, 0.9);
        }

        .action-feedback.skipped {
            background: rgba(59, 130, 246, 0.9);
        }

        @keyframes feedbackPulse {
            0% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.9;
            }
        }
    `;
    document.head.appendChild(style);
}