function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh)";

    post.style.animation = 'swipeRight 0.5s forwards';
}