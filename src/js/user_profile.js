// Check if we're on a profile page
function initProfilePage() {
    if (!window.profileData) return;

    // Add follow button functionality if user is logged in
    if (isUserLoggedIn()) {
        addFollowButton();
    }

    // Make usernames in posts clickable
    makeProfilePostsInteractive();

    // Add dynamic interactions
    addProfileInteractions();

    console.log(profileData);
    if (window.profileData && window.profileData.backgroundId) {
        const background = background_images.find(bg => bg.id === window.profileData.backgroundId);
        if (background) {
            document.getElementById('profile-body').style.backgroundImage = 'url(' + background.image_url + ')';
        }
    }
}

// Add follow button to profile page
function addFollowButton() {
    const profileHeader = document.querySelector('.profile-info');
    if (!profileHeader || !window.user || window.user.id === window.profileData.id) {
        return; // Don't show follow button on own profile
    }

    const followBtn = document.createElement('button');
    followBtn.className = 'glass_bt follow-profile-btn';
    followBtn.id = 'profile_follow_btn';

    // Check follow status
    checkProfileFollowStatus(window.profileData.id).then(isFollowing => {
        if (isFollowing) {
            followBtn.innerHTML = '<i class="fa-solid fa-user-minus"></i> Following';
            followBtn.classList.add('following');
        } else {
            followBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Follow';
        }
    });

    followBtn.onclick = () => toggleProfileFollow();

    profileHeader.appendChild(followBtn);
}

// Check if current user follows the profile user
async function checkProfileFollowStatus(profileUserId) {
    try {
        const isFollowing = await api.checkFollowStatus(profileUserId);
        return isFollowing;  // It's already a boolean
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}

// Toggle follow/unfollow
async function toggleProfileFollow() {
    if (!isUserLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    const followBtn = document.getElementById('profile_follow_btn');
    if (!followBtn) return;

    const isFollowing = followBtn.classList.contains('following');
    const action = isFollowing ? "unfollow" : "follow";

    try {
        // Create a temporary post object to reuse existing follow logic
        const tempPost = { id: "profile_follow", userId: window.profileData.id };

        const response = action === 'follow'
            ? await api.followPost(tempPost.id)
            : await api.unfollowPost(tempPost.id);

        if (response) {
            const followerCountEl = document.querySelector('.stat-value[data-stat="followers"]');

            if (isFollowing) {
                followBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Follow';
                followBtn.classList.remove('following');
                // Update follower count
                if (followerCountEl) {
                    const currentCount = parseInt(followerCountEl.textContent.replace(/[^0-9]/g, ''));
                    followerCountEl.textContent = formatNumber(Math.max(0, currentCount - 1));
                }
            } else {
                followBtn.innerHTML = '<i class="fa-solid fa-user-minus"></i> Following';
                followBtn.classList.add('following');
                // Update follower count
                if (followerCountEl) {
                    const currentCount = parseInt(followerCountEl.textContent.replace(/[^0-9]/g, ''));
                    followerCountEl.textContent = formatNumber(currentCount + 1);
                }
            }
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
    }
}

// Make profile posts interactive
function makeProfilePostsInteractive() {
    // Posts are already links in the SSR version, but we can add hover effects
    const postCards = document.querySelectorAll('.profile-post-card');

    postCards.forEach(card => {
        // Add click tracking
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = card.href.split('/post/')[1];

            // Store current location for back navigation
            sessionStorage.setItem('previousPage', window.location.pathname);

            // Navigate to post
            window.location.href = card.href;
        });
    });
}

// Add profile interactions
function addProfileInteractions() {
    // Add styles for follow button
    const style = document.createElement('style');
    style.textContent = `
        .follow-profile-btn {
            background-color: rgb(95, 148, 243);
            color: white;
            padding: 10px 20px;
            font-weight: 700;
            margin-top: 10px;
            border: none;
            cursor: pointer;
        }
        
        .follow-profile-btn.following {
            background-color: rgba(190, 213, 255, 0.4);
            border: 1px solid rgb(206, 220, 247, 0.42);
        }
        
        .follow-profile-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(95, 148, 243, 0.4);
        }
        
        .stat-value[data-stat="followers"] {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Format numbers for display
function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
});

// Update the main drawPost function to make usernames link to profiles
if (typeof drawPost !== 'undefined') {
    const originalDrawPost = drawPost;
    drawPost = function(data) {
        originalDrawPost(data);

        const usernameElement = document.getElementById("post_username");
        if (usernameElement && data.username) {
            usernameElement.style.cursor = "pointer";
            usernameElement.onclick = (e) => {
                e.preventDefault();
                window.location.href = `/@${data.username}`;
            };
        }
    };
}