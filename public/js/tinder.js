function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh)";

    post.style.animation = 'swipeRight 0.5s';

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}