function openAnalytics() {

    if(isUserLoggedIn()){
        document.getElementById("old_posts").style.display = "flex";
        const old_posts_container = document.getElementById("old_posts_container");
        old_posts_container.innerHTML = "Loading ...";

        makeApiRequest("/me/posts", true).then(data => {
            console.log(data);

            old_posts_container.innerHTML = "";
            for (let i = 0; i < data.length; i++) {
                const post = data[i];

                const li = document.createElement("li");
                const title = document.createElement("span");
                title.textContent = post.title;

                li.appendChild(title);
                const stats = document.createElement("div");
                stats.innerHTML = '<div><span><i class="fa-solid fa-eye"></i> ' + post.viewsCount + ' &nbsp;&nbsp;<i class="fa-solid fa-heart"></i> ' + post.likesCount + ' &nbsp;&nbsp;<i class="fa-solid fa-heart-crack"></i> ' + post.dislikesCount + ' &nbsp;&nbsp;<i class="fa-solid fa-user-plus"></i> ' + post.followersCount + '</span> <a href="/post/' + post.id + '">open</a></div>';

                li.appendChild(stats);

                old_posts_container.appendChild(li);
            }
        });
    }else{
        openRegisterModal();
    }



}

function closeAnalytics() {
    document.getElementById("old_posts").style.display = "none";
}