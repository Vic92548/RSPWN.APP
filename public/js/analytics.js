function loadPosts() {
    makeApiRequest("/me/posts", true).then(data => {
        console.log(data);
    })
}