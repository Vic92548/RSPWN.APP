function openAnalytics() {
    document.getElementById("old_posts").style.display = "flex";
    const old_posts_container = document.getElementById("old_posts_container");
    old_posts_container.innerHTML = "Loading ...";

    makeApiRequest("/me/posts", true).then(data => {
        console.log(data);

        for (let i = 0; i < data.length; i++) {
            const post = data[i];
            old_posts_container.innerHTML += '<li>\n' +
                '                        <span>' + post.title + '</span>\n' +
                '                        <div><span><i class="fa-solid fa-eye"></i> 22</span> <a href="/post/' + post.id + '">open</a></div>\n' +
                '                    </li>'
        }
    })

}

function closeAnalytics() {
    document.getElementById("old_posts").style.display = "none";
}