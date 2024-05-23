function displayPage(type) {
    const post = document.getElementsByClassName("post")[0];
    const game = document.getElementsByClassName("game")[0];

    if(type === "post"){
        game.style.display = "none";
        post.style.display = "block";

        showPost();
    }else if(type === "game"){
        game.style.display = "block";
        post.style.display = "none";


    }
}