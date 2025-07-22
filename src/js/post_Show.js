function showPost() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translate(0px, 0px) rotate(0deg)";

    // Remove inline style overrides to let CSS handle the styling
    post.style.backgroundColor = "";  // Clear inline background color
    post.style.boxShadow = "";  // Clear inline box shadow - let CSS handle it

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
            api.getFeed().then(data => {

                console.log(data);

                feed_posts = data.sort((a, b) => 0.5 - Math.random());

                console.log(data);

                displayPost();

            }).catch(error => {
                console.log(error);
            });

        }


    }else{
        api.getPost(postId).then(data => {

            loading_steps--;
            hideLoading();

            current_post_id = data.id;
            current_post = data;
            drawPost(data);


            history.pushState(null, null, "/post/" + data.id);
        }).catch(error => {
            console.log(error);
        });
    }

}