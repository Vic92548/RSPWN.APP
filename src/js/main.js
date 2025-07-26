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

loadUserData();

function hideLoading(){
    console.log("steps:"+loading_steps);
}

function showLoading(){
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
    const months = Math.round(days / 30.4);
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

let current_post_id = undefined;
let current_post = undefined;

function hidePost() {
    showLoading();
    document.getElementById("post_video").children[0].src = "";
    document.getElementsByClassName("post")[0].style.transform = "translateY(100vh)";
}

cardManager.register('add-post-card', {
    onShow: () => {
        setTimeout(() => {
            const titleInput = document.getElementById('title');
            if (titleInput) titleInput.focus();
        }, 500);
    }
});

function opeNewPostModel() {
    if (isUserLoggedIn()) {
        cardManager.show('add-post-card');
    } else {
        openRegisterModal();
    }
}

function closeAddPostCard() {
    cardManager.hide('add-post-card');
}

function closeNewPostModel() {
    closeAddPostCard();
}

function openRegisterModal() {
    document.getElementById("register").style.display = "flex";
}

function openUserAccountModel() {
    document.getElementById("account").style.display = "flex";

    APIHandler.handle(
        () => api.getMyPosts(),
        {
            onSuccess: (data) => {
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
            },
            onError: () => {
                const old_posts = document.getElementById("old-posts");
                old_posts.innerHTML = "<p>You don't have created any posts yet, what are you waiting for? :)</p>";
            }
        }
    );
}

async function updateFollowButton() {
    const follow_bt = document.getElementById("follow");

    if(isUserLoggedIn()){
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

        follow_bt.style.opacity = "0";
        follow_bt.style.display = "inline-block";

        if(following){
            follow_bt.innerHTML = '<i class="fa-solid fa-user-minus"></i>';
            follow_bt.onclick = unfollowPost;
            follow_bt.style.border = "1px solid rgb(206 220 247 / 42%)";
            follow_bt.style.backgroundColor = "rgb(190 213 255 / 40%)";
        }else{
            follow_bt.innerHTML = '<i class="fa-solid fa-user-plus"></i>';
            follow_bt.onclick = followPost;
            follow_bt.style.border = "1px solid rgb(77 137 245)";
            follow_bt.style.backgroundColor = "rgb(95 148 243)";
        }

        follow_bt.style.opacity = "1";

        if(current_post.userId === user.id){
            follow_bt.style.opacity = "0";
            follow_bt.style.display = "none";
        }
    }else{
        follow_bt.onclick = openRegisterModal;
    }
}

function followPost() {
    creators[current_post.userId].following = true;
    updateFollowButton();
    if(isUserLoggedIn()){
        APIHandler.handle(
            () => api.followPost(current_post.id),
            {
                errorMessage: 'Error when trying to follow. Please try again.'
            }
        );
    }else{
        openRegisterModal();
    }
}

function unfollowPost() {
    creators[current_post.userId].following = false;
    updateFollowButton();
    if(isUserLoggedIn()){
        APIHandler.handle(
            () => api.unfollowPost(current_post.id)
        );
    }else{
        openRegisterModal();
    }
}

async function checkUserFollowsCreator(creatorId) {
    try {
        const isFollowing = await api.checkFollowStatus(creatorId);
        console.log('Check follow status:', isFollowing);
        return isFollowing;
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
}

function formatViews(viewCount) {
    if (viewCount < 1000) {
        return viewCount;
    } else if (viewCount < 1000000) {
        return (viewCount / 1000).toFixed(2) + 'K';
    } else if (viewCount < 1000000000) {
        return (viewCount / 1000000).toFixed(2) + 'M';
    } else {
        return (viewCount / 1000000000).toFixed(2) + 'B';
    }
}

function openMenu() {
    document.getElementById("menu").style.display = 'flex';
}

function hideMenu() {
    if(window.innerWidth <= 768){
        document.getElementById("menu").style.display = 'none';
    }
}

if(MainPage){
    if(window.innerWidth >= 768){
        document.getElementById("menu").style.display = 'flex';
    }
}

function processJoinQueryParam() {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    if (params.has('join')) {
        const joinValue = params.get('join');
        console.log("Join param found with value = " + joinValue);
        localStorage.setItem('referrerId', joinValue);
        params.delete('join');
        window.history.replaceState({}, '', url.toString());
    }
}

function handleReferral() {
    const referrerId = localStorage.getItem('referrerId');

    if (referrerId) {
        APIHandler.handle(
            () => api.acceptInvitation(referrerId),
            {
                onSuccess: (data) => {
                    console.log('Invitation processed:', data);
                    if(creators[referrerId]){
                        creators[referrerId].following = true;
                        updateFollowButton();
                    }
                    localStorage.removeItem('referrerId');
                },
                onError: (error) => {
                    localStorage.removeItem('referrerId');
                }
            }
        );
    }
}

function openTextModal(text) {
    document.getElementById("text_modal_text").textContent = text;
    document.getElementById("text_modal").style.display = 'block';
}

function closeTextModal() {
    document.getElementById("text_modal").style.display = 'none';
}

function copyReferrerId() {
    if(isUserLoggedIn()){
        const referralUrl = `https://vapr.club?join=${user.id}`;
        const textArea = document.createElement('textarea');
        textArea.value = referralUrl;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);

        try {
            const successful = document.execCommand('copy');
            console.log(successful ? 'Referral URL copied to clipboard!' : 'Failed to copy the URL');
            Swal.fire({
                title: "Invitation copied to clipboard!",
                text: "Your invitation link (" + referralUrl + "), has been copied to clipboard!",
                icon: "success"
            });
        } catch (err) {
            console.error('Error copying to clipboard: ', err);
            Swal.fire({
                title: "Failed to copy to clipboard!",
                text: "Your invitation link (" + referralUrl + "), has failed to copy to clipboard!",
                icon: "error"
            });
        }

        document.body.removeChild(textArea);
    }else{
        openRegisterModal();
    }
}

processJoinQueryParam();

if(MainPage){
    showInitialPost();
}