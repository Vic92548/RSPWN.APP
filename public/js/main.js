let feed_posts = [];
let loading_steps = 2;
let post_seen = 0;
let creators = {};

function showInitialPost() {
    const path = window.location.pathname.split('/');

    if(path.length < 3){
        displayPost();
    }else if(path[1] === "post"){
        displayPost(path[2]);
    }
}

function makeApiRequest(path, requireAuth = true) {
    return new Promise((resolve, reject) => {
        // Retrieve the JWT from local storage
        let jwt = localStorage.getItem('jwt');
        if (jwt === null) {
            jwt = "";
            if(requireAuth){
                reject("No JWT found in local storage.");
                return;
            }

        }



        console.log("JWT:" + jwt);
        // Prepare the request headers
        const headers = new Headers({
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
        });

        // Make the fetch request to the API
        fetch(path, {
            method: 'GET', // or 'POST', 'PUT', etc., depending on the requirement
            headers: headers
        })
        .then(response => {
            if (!response.ok) {
                console.log(response);

                if(response.status === 401){
                    reject("Unauthorized");
                }else{
                    throw new Error('Network response was not ok: ' + response.statusText);
                }

                
            }
            return response.json();  // Assuming the server responds with JSON
        })
        .then(data => {
            resolve(data);  // Resolve the promise with the response data
        })
        .catch(error => {
            reject(error);  // Reject the promise if there's an error
        });
    });
}

function isUserLoggedIn(){
    if(window.user){
        return true;
    }else{
        return false;
    }
}

function updateUsername() {
    const level_elements = document.getElementsByClassName("username");
    for (let i = 0; i < level_elements.length; i++) {
        level_elements[i].textContent = user.username;
        console.log("updated username : " + user.username);
    }
}

function loadUserData(){
    document.getElementById("sign_in").style.display = "none";
    document.getElementById("add_post").style.display = "none";

    makeApiRequest("/me").then(data => {
        window.user = data;
        updateUsername();
        updateLevel();

        const oldUser = {
            xp: 0,
            level: window.user.level,
            xp_required: window.user.xp_required
        };

        setXPProgress(oldUser, true);

        document.getElementById("sign_in").style.display = "none";
        document.getElementById("add_post").style.display = "block";
        document.getElementById("xp_bar").style.display = "block";



        loading_steps--;
        hideLoading();

        window.analytics.identify(data.id, {
            email: data.email,
            name: data.username
        });
    }).catch( error => {
        document.getElementById("sign_in").style.display = "block";
        document.getElementById("add_post").style.display = "none";
        loading_steps--;
        hideLoading();
    })
}

loadUserData();

function hideLoading(){

    console.log("steps:"+loading_steps);
    if(loading_steps <= 0){
        document.getElementsByTagName('H1')[0].className = "title";
    }


    //document.getElementsByTagName("ARTICLE")[0].style.transform = "translateY(0vh)";
}

function showLoading(){
    document.getElementsByTagName('H1')[0].className = "loading";

    document.getElementsByTagName("ARTICLE")[0].style.transform = "translateY(0vh)";
}

function timeAgo(dateParam) {
    if (!dateParam) {
        return null;
    }

    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
    const today = new Date();
    const seconds = Math.round((today - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30.4); // average number of days in month
    const years = Math.round(days / 365);

    if (seconds < 60) {
        return `${seconds} seconds ago`;
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours < 24) {
        return `${hours} hours ago`;
    } else if (days < 30) {
        return `${days} days ago`;
    } else if (months < 12) {
        return `${months} months ago`;
    } else {
        return `${years} years ago`;
    }
}

function setupSocialLink(id, link){
    const link_bt = document.getElementById(id);
    link_bt.style.display = "inline-block";
    link_bt.href = link;
}

function drawPost(data){
    post_seen++;
    showPost();
    console.log("Post DATA:");
    console.log(data);

    updateFollowButton();

    document.getElementById("post_title").textContent = data.title;
    document.getElementById("post_username").textContent = "@" + data.username;
    document.getElementById("post_time").textContent = timeAgo(data.timestamp);

    document.getElementById("post_views").textContent = data.views;

    if(!data.content){
        data.content = "https://vapr.b-cdn.net/posts/200w.gif";
    }

    if(data.content.split("/posts/")[0] === "https://vapr.b-cdn.net"){
        document.getElementById("post_image").src = data.content;
        document.getElementById("post_image").style.display = "block";
        document.getElementById("post_content").style.display = "none";
    }else{
        document.getElementById("post_content").textContent = data.content;
        document.getElementById("post_content").style.display = "block";
        document.getElementById("post_image").style.display = "none";
    }

    const links = document.getElementById("post_link").children;
    for(let i = 0; i < links.length;i++){
        links[i].style.display = "none";
    }


    if(data.link){
        const url = new URL(data.link);

        if(url.hostname.includes("itch.io")){
            setupSocialLink("post_itch", data.link);
        }

        switch(url.hostname){
            case 'discord.gg':
                setupSocialLink("post_discord", data.link);
                break;
            case 'www.reddit.com':
                setupSocialLink("post_reddit", data.link);
                break;
            case 'store.steampowered.com':
                setupSocialLink("post_steam", data.link);
                break;
            case 'x.com':
                setupSocialLink("post_x", data.link);
                break;
            case 'twitter.com':
                setupSocialLink("post_x", data.link);
                break;
            case 'www.threads.net':
                setupSocialLink("post_threads", data.link);
                break;
            case 'www.pinterest.fr':
                setupSocialLink("post_pinterest", data.link);
                break;
            case 'www.twitch.tv':
                setupSocialLink("post_twitch", data.link);
                break;
            case 'www.youtube.com':
                setupSocialLink("post_youtube", data.link);
                break;
            case 'www.instagram.com':
                setupSocialLink("post_instagram", data.link);
                break;
            case 'store.epicgames.com':
                setupSocialLink("post_epic", data.link);
                break;
            case 'www.kickstarter.com':
                setupSocialLink("post_kickstarter", data.link);
                break;
            case 'kick.com':
                setupSocialLink("post_kick", data.link);
                break;
            case 'www.patreon.com':
                setupSocialLink("post_patreon", data.link);
                break;
            default:
                break;
        }
    }
}

let current_post_id = undefined;
let current_post = undefined;

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
            makeApiRequest("/feed", false).then(data => {

                console.log(data);

                feed_posts = data.sort((a, b) => 0.5 - Math.random());

                console.log(data);

                displayPost();

            }).catch(error => {
                console.log(error);
            });

        }


    }else{
        makeApiRequest("/posts/"+postId, false).then(data => {

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

function hidePost() {
    showLoading();
    document.getElementsByClassName("post")[0].style.transform = "translateY(100vh)";
}

function showPost() {
    const post = document.getElementsByClassName("post")[0];
    post.style.transform = "translateY(0vh) translateX(0vw)";

    post.style.backgroundColor = "rgba(255,255,255,0.4)";
    post.style.boxShadow = "0 0px 15px rgba(255, 255, 255, 0.3)";

    post.style.animation = 'none';
}

document.getElementById('file').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('preview').src = e.target.result;
            document.getElementById('preview').style.display = "block";
            document.getElementById('upload-icon').hidden = true;
            document.querySelector('.upload-text').textContent = 'Click to replace the image';
        };
        reader.readAsDataURL(this.files[0]);
    }
});


function opeNewPostModel() {
    document.getElementById("add-post").style.display = "flex";
}
function closeNewPostModel() {
    document.getElementById("add-post").style.display = "none";
}

document.getElementById('postForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const link = document.getElementById('link').value;
    const file = document.getElementById('file').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('link', link);
    
    if (file) {
        const fileExtension = file.name.split('.').pop(); // Extract the file extension
        const fileName = `${new Date().getTime()}.${fileExtension}`; // Create a unique file name using a timestamp
        const fileContentType = file.type || 'application/octet-stream'; // Default to a binary type if unknown
    
        // Create a new Blob from the file with the specified content type
        const blob = new Blob([file], { type: fileContentType });
    
        // Append the blob to formData with the custom filename
        formData.append("file", blob, fileName);
    }
    

    const jwt = localStorage.getItem('jwt');

    // Prepare the request headers
    const headers = new Headers({
        "Authorization": `Bearer ${jwt}`
    });

    try {
        document.getElementById("add-post").style.display = "none";
        hidePost();

        const response = await fetch('/posts', {
            method: 'POST',
            body: formData,
            headers: headers
        });

        const result = await response.json();
        if (response.ok) {

            if(result.success){
                window.analytics.track('new_post_uploaded', {postId: result.id});

                document.getElementById("add-post").style.display = "none";
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                displayPost(result.id);
                // Optionally clear the form or handle according to your needs

                // Clear post
                document.getElementById('title').value = '';
                document.getElementById('file').value = '';
                document.getElementById('link').value = '';
                document.getElementById('preview').style.display = 'none';

                const oldUser = {
                    xp: window.user.xp,
                    level: window.user.level,
                    xp_required: window.user.xp_required
                };

                window.user = result.user;

                setXPProgress(oldUser);
            }else{
                alert(result.msg);
            }


            
        } else {
            alert('Failed to create post. Please try again with an other image.');
            displayPost();
        }
    } catch (error) {
        console.error('Failed to submit post:', error);
        alert('Error submitting post.');
    }
});

function openRegisterModal() {
    document.getElementById("register").style.display = "flex";
}

function openUserAccountModel() {
    document.getElementById("account").style.display = "flex";

    makeApiRequest("/me/posts").then(data => {

        console.log("Coucou");
        console.log(data);

        const old_posts = document.getElementById("old-posts");
        old_posts.innerHTML = "";

        for (let i = 0; i < data.length; i++) {
            old_posts.innerHTML += '<div class="post-card">\n' +
                '                    <h4>' + data[i].title + '</h4>\n' +
                '                    <div style="display: flex; justify-content: space-between">\n' +
                '                        <span><i class="fa-solid fa-eye"></i> <span>loading...</span></span>\n' +
                '                        <span><i class="fa-solid fa-heart"></i> <span>loading...</span></span>\n' +
                '                        <span><i class="fa-solid fa-heart-crack"></i> <span>loading...</span></span>\n' +
                '                        <span><i class="fa-solid fa-forward"></i> <span>loading...</span></span>\n' +
                '                    </div>\n' +
                '                </div>'
        }
    }).catch( () => {
        const old_posts = document.getElementById("old-posts");
        old_posts.innerHTML = "<p>You don't have created any posts yet, what are you waiting for? :)</p>";
    })
}

async function updateFollowButton() {

    let following;

    console.log("CURRENT POST");
    console.log(current_post);

    if(creators[current_post.userId]){
        following = creators[current_post.userId].following;
    }else{
        creators[current_post.userId] = {
            following: false
        }
    }

    if(following === undefined){
        following = await checkUserFollowsCreator(current_post.userId);
        creators[current_post.userId].following = following;
    }

    const follow_bt = document.getElementById("follow");
    follow_bt.style.opacity = "0";
    follow_bt.style.display = "inline-block";

    if(following){
        follow_bt.textContent = '<i class="fa-solid fa-user-minus"></i>';
        follow_bt.onclick = followPost;
    }else{
        follow_bt.textContent = '<i class="fa-solid fa-user-plus"></i>';
        follow_bt.onclick = unfollowPost;
    }

    follow_bt.style.opacity = "1";

    if(current_post.userId === user.id){
        follow_bt.style.opacity = "0";
        follow_bt.style.display = "none";
    }
}

function followPost() {
    creators[current_post.userId].following = true;
    updateFollowButton();
    if(isUserLoggedIn()){
        makeApiRequest(`/manage-follow?action=follow&postId=${current_post.id}`).then(data => {
            console.log('Followed successfully:', data);

        }).catch(error => {
            console.error('Error following post:', error);
            alert('Error when trying to follow. Please try again.');
        });
    }else{
        openRegisterModal();
    }

}

function unfollowPost() {
    creators[current_post.userId].following = false;
    if(isUserLoggedIn()){
        makeApiRequest(`/manage-follow?action=unfollow&postId=${current_post.id}`).then(data => {
            console.log('Unfollowed successfully:', data);
            alert('You have unfollowed this post.');
        }).catch(error => {
            console.error('Error unfollowing post:', error);
            alert('Error unfollowing post. Please try again.');
        });
    }else{
        openRegisterModal();
    }

}

function checkUserFollowsCreator(creatorId) {
    return new Promise((resolve, reject) => {
        makeApiRequest(`/check-follow/${creatorId}`).then(data => {
            console.log('Check follow status:', data);
            if (data.success) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).catch(error => {
            console.error('Error checking follow status:', error);
            reject(false);  // You may also consider rejecting with the error message itself
        });
    });
}




showInitialPost();