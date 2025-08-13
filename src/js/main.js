let feed_posts = [];
let loading_steps = 2;
let post_seen = 0;
let creators = {};

function showInitialPost() {
    const path = window.location.pathname.split('/');
    showPost();
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

function setupSocialLink(id, link){
    const link_bt = DOM.get(id);
    link_bt.style.display = "inline-block";
    link_bt.href = link;
}

let current_post_id = undefined;
let current_post = undefined;

function hidePost() {
    DOM.get("post_video").children[0].src = "";
    document.getElementsByClassName("post")[0].style.transform = "translateY(100vh)";
}

cardManager.register('add-post-card', {
    route: '/new-post',
    onShow: () => {
        setTimeout(() => {
            const titleInput = DOM.get('title');
            if (titleInput) titleInput.focus();
        }, 500);
    }
});

function opeNewPostModel() {
    if (isUserLoggedIn()) {
        hideMenu();
        router.navigate('/new-post', true);
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
    DOM.show("register", "flex");
}

async function updateFollowButton() {
    const follow_bt = DOM.get("follow");

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

function openMenu() {
    DOM.show("menu", 'flex');
}

function hideMenu() {
    if(window.innerWidth <= 768){
        DOM.hide("menu");
    }
}

if(window.innerWidth >= 768){
    DOM.show("menu", 'flex');
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
    DOM.setText("text_modal_text", text);
    DOM.show("text_modal");
}

function closeTextModal() {
    DOM.hide("text_modal");
}

function copyReferrerId() {
    if(isUserLoggedIn()){
        const referralUrl = `https://vapr.club?join=${user.id}`;
        notify.copyToClipboard(referralUrl, "Invitation link copied to clipboard!");
    }else{
        openRegisterModal();
    }
}

processJoinQueryParam();

function navigateToMyProfile() {
    router.navigate(`/@${window.user.username}`, false);
}

window.closeProfileCard = function() {
    cardManager.hide('profile-card');
};

router.handleRoute();