function showPost() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translate(0px, 0px) rotate(0deg)";
    post.style.backgroundColor = "";
    post.style.boxShadow = "";
    post.style.animation = 'none';
}

function displayPost(postId = undefined){
    hidePost();
    if(!postId){
        if(feed_posts.length > 0){
            const data = feed_posts.shift();
            loading_steps--;
            hideLoading();
            current_post_id = data.id;
            current_post = data;
            drawPost(data);
            history.pushState(null, null, "/post/" + data.id);
        }else{
            APIHandler.handle(
                () => api.getFeed(),
                {
                    onSuccess: (data) => {
                        console.log(data);
                        feed_posts = data.sort((a, b) => 0.5 - Math.random());
                        console.log(data);
                        displayPost();
                    }
                }
            );
        }
    }else{
        APIHandler.handle(
            () => api.getPost(postId),
            {
                onSuccess: (data) => {
                    loading_steps--;
                    hideLoading();
                    current_post_id = data.id;
                    current_post = data;
                    drawPost(data);
                    history.pushState(null, null, "/post/" + data.id);
                }
            }
        );
    }
}