function displayLikeAnimation() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(100vh) translateX(60vw)";

    post.style.backgroundColor = "rgba(0,255,0,0.4)";
    post.style.boxShadow = "0 0px 15px rgba(0, 255, 0, 0.3)";
}