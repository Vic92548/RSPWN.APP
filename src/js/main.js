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

    console.log("steps:"+loading_steps);/*
    if(loading_steps <= 0){
        document.getElementsByTagName('H1')[0].className = "title";
    }
    */


    //document.getElementsByTagName("ARTICLE")[0].style.transform = "translateY(0vh)";
}

function showLoading(){
    //document.getElementsByTagName('H1')[0].className = "loading";

    //document.getElementsByTagName("ARTICLE")[0].style.transform = "translateY(0vh)";
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



let current_post_id = undefined;
let current_post = undefined;



function hidePost() {
    showLoading();
    document.getElementById("post_video").children[0].src = "";
    document.getElementsByClassName("post")[0].style.transform = "translateY(100vh)";
}

// Updated opeNewPostModel function to use the new card system
function opeNewPostModel() {
    if(isUserLoggedIn()){
        showAddPostCard();
    }else{
        openRegisterModal();
    }
}

// New function to show the add post card
function showAddPostCard() {
    // Hide the current post
    const post = document.getElementsByClassName("post")[0];
    if (post) {
        post.style.display = "none";
    }

    // Show the add post card
    const addPostCard = document.getElementById("add-post-card");
    if (addPostCard) {
        addPostCard.style.display = "block";

        // Trigger the show animation
        setTimeout(() => {
            addPostCard.classList.add("show");
        }, 10);

        // Focus on the title input
        setTimeout(() => {
            document.getElementById("title").focus();
        }, 500);
    }
}

// New function to close the add post card
function closeAddPostCard() {
    const addPostCard = document.getElementById("add-post-card");
    const post = document.getElementsByClassName("post")[0];

    if (addPostCard) {
        addPostCard.classList.remove("show");

        // Wait for animation to complete
        setTimeout(() => {
            addPostCard.style.display = "none";

            // Show the post again
            if (post) {
                post.style.display = "block";
            }
        }, 800);
    }
}

// Replace closeNewPostModel with the new function
function closeNewPostModel() {
    closeAddPostCard();
}

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

        api.followPost(current_post.id).then(data => {
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
    updateFollowButton();
    if(isUserLoggedIn()){

        api.unfollowPost(current_post.id).then(data => {
            console.log('Unfollowed successfully:', data);
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
        api.checkFollowStatus(creatorId).then(data => {
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

function formatViews(viewCount) {
    if (viewCount < 1000) {
        return viewCount; // return the number as is if it's less than 1000
    } else if (viewCount < 1000000) {
        return (viewCount / 1000).toFixed(2) + 'K'; // return in 'K' format for thousands
    } else if (viewCount < 1000000000) {
        return (viewCount / 1000000).toFixed(2) + 'M'; // return in 'M' format for millions
    } else {
        return (viewCount / 1000000000).toFixed(2) + 'B'; // return in 'B' format for billions
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
    // Create a URL object based on the current location
    const url = new URL(window.location.href);

    // Access the URL's search parameters
    const params = url.searchParams;

    // Check if the 'join' query parameter exists
    if (params.has('join')) {
        // Retrieve the value of the 'join' parameter
        const joinValue = params.get('join');

        console.log("Join param found with value = " + joinValue);

        // Store the value in local storage
        localStorage.setItem('referrerId', joinValue);

        // Remove the 'join' parameter from the URL
        params.delete('join');

        // Replace the state in history without reloading the page to reflect the new URL
        window.history.replaceState({}, '', url.toString());
    }
}

function handleReferral() {
    // Check if 'referrerId' is stored in local storage
    const referrerId = localStorage.getItem('referrerId');

    if (referrerId) {

        api.acceptInvitation(referrerId).then(data => {
            console.log('Invitation processed:', data);

            if(creators[referrerId]){
                creators[referrerId].following = true;
                updateFollowButton();
            }


            // Remove 'referrerId' from local storage after processing
            localStorage.removeItem('referrerId');


        }).catch(error => {
            console.log("failed to accept invitation");
        });

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
    // Construct the URL with the userId as a query parameter
    if(isUserLoggedIn()){
        const referralUrl = `https://vapr.club?join=${user.id}`;

        // Create a temporary text area to hold the URL
        const textArea = document.createElement('textarea');
        textArea.value = referralUrl;

        // Avoid styling that would make the textarea visible
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';

        // Append the textarea to the document
        document.body.appendChild(textArea);

        // Select the URL
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices

        try {
            // Copy the text inside the text area
            const successful = document.execCommand('copy');

            // Provide feedback on whether the URL was copied successfully
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

        // Remove the textarea element from the document after copying
        document.body.removeChild(textArea);
    }else{
        openRegisterModal();
    }
}

processJoinQueryParam();

if(MainPage){
    showInitialPost();
}