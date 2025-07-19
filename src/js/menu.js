// Enhanced Menu JavaScript Functions

// Initialize enhanced menu
function initMenu() {
    if (!MainPage) return;

    // Update user info if logged in
    if (isUserLoggedIn()) {
        updateMenuUserInfo();
        showMenuUserElements();
        updateQuickStats();
    }

    // Update online users count
    updateOnlineUsers();

    // Add menu animations
    addMenuAnimations();

    // Update GitHub stars
    if (document.getElementById('github_stars')) {
        updateGithubStars(document.getElementById('github_stars'));
    }
}

// Update menu user info
function updateMenuUserInfo() {
    if (!window.user) return;

    // Update avatar
    const menuAvatar = document.getElementById('menu_user_avatar');
    if (menuAvatar && window.user.avatar) {
        menuAvatar.src = `https://cdn.discordapp.com/avatars/${window.user.id}/${window.user.avatar}.png?size=128`;
    } else if (menuAvatar) {
        // Use default avatar
        menuAvatar.src = 'https://vapr-club.b-cdn.net/default_vapr_avatar.png';
    }

    // Update username
    const menuUsername = document.getElementById('menu_username');
    if (menuUsername) {
        menuUsername.textContent = '@' + window.user.username;
    }

    // Update level
    const menuLevel = document.getElementById('menu_user_level');
    if (menuLevel) {
        menuLevel.textContent = window.user.level || 0;
    }

    // Update XP bar
    updateMenuXPBar();
}

// Update menu XP bar
function updateMenuXPBar() {
    if (!window.user) return;

    const xp = window.user.xp || 0;
    const xpRequired = window.user.xp_required || 700;
    const xpPercentage = (xp / xpRequired) * 100;

    const xpBar = document.getElementById('menu_xp_bar');
    const xpText = document.getElementById('menu_xp_text');

    if (xpBar) {
        xpBar.style.width = xpPercentage + '%';
    }

    if (xpText) {
        xpText.textContent = `${xp} / ${xpRequired} XP`;
    }
}

// Show menu elements for logged-in users
function showMenuUserElements() {
    const userCard = document.getElementById('menu_user_info');
    const quickStats = document.getElementById('quick_stats');
    const logoutBtn = document.getElementById('logout_btn');

    if (userCard) userCard.style.display = 'flex';
    if (quickStats) quickStats.style.display = 'grid';
    if (logoutBtn) logoutBtn.style.display = 'flex';
}

// Update quick stats
async function updateQuickStats() {
    try {
        // Get today's XP
        const xpResponse = await makeApiRequest('/api/xp-today', true);
        if (xpResponse && xpResponse.xp !== undefined) {
            const dailyXPEl = document.getElementById('daily_xp');
            if (dailyXPEl) {
                animateCounter(dailyXPEl, 0, xpResponse.xp, 1000);
            }
        }

        // Get user's posts for stats
        const postsResponse = await makeApiRequest('/me/posts', true);
        if (postsResponse && Array.isArray(postsResponse)) {
            let totalFollowers = 0;
            let totalViews = 0;

            postsResponse.forEach(post => {
                totalFollowers += post.followersCount || 0;
                totalViews += post.viewsCount || 0;
            });

            const followerEl = document.getElementById('follower_count');
            const viewsEl = document.getElementById('total_views');

            if (followerEl) {
                animateCounter(followerEl, 0, totalFollowers, 1000);
            }
            if (viewsEl) {
                animateCounter(viewsEl, 0, totalViews, 1000);
            }
        }
    } catch (error) {
        console.error('Error updating quick stats:', error);
    }
}

// Animate counter
function animateCounter(element, start, end, duration) {
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        const currentValue = Math.floor(start + (end - start) * easeOutQuart);
        element.textContent = formatNumber(currentValue);

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }

    requestAnimationFrame(updateCounter);
}

// Format number for display
function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
}

// Update online users count
async function updateOnlineUsers() {
    try {
        const response = await fetch('/api/user-count');
        const data = await response.json();

        const onlineEl = document.getElementById('online_users');
        if (onlineEl && data.count) {
            onlineEl.textContent = data.count.toLocaleString() + ' online';
        }
    } catch (error) {
        console.error('Error fetching online users:', error);
    }
}

// Add menu animations
function addMenuAnimations() {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach((item, index) => {
        // Add staggered entrance animation
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            item.style.transition = 'all 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 50);

        // Add hover sound effect (optional)
        item.addEventListener('mouseenter', () => {
            // You could add a subtle sound effect here
        });
    });
}

// Enhanced menu open function
function openMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;

    menu.style.display = 'flex';

    // Refresh data when menu opens
    if (isUserLoggedIn()) {
        updateMenuUserInfo();
        updateQuickStats();
    }

    // Animate menu entrance
    const menuContainer = menu.querySelector('.menu-container');
    if (menuContainer) {
        menuContainer.style.transform = 'translateX(-100%)';
        menuContainer.style.opacity = '0';

        setTimeout(() => {
            menuContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            menuContainer.style.transform = 'translateX(0)';
            menuContainer.style.opacity = '1';
        }, 10);
    }

    // Re-initialize animations
    addMenuAnimations();
}

// Enhanced menu hide function
function hideMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;

    const menuContainer = menu.querySelector('.menu-container');
    if (menuContainer) {
        menuContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        menuContainer.style.transform = 'translateX(-100%)';
        menuContainer.style.opacity = '0';

        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    } else {
        menu.style.display = 'none';
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('jwt');
        window.user = null;
        window.location.href = '/';
    }
}

// Override existing functions to use new menu
const originalOpenNewPostModel = window.opeNewPostModel;
window.opeNewPostModel = function() {
    hideMenu();
    originalOpenNewPostModel();
};

const originalOpenAnalytics = window.openAnalytics;
window.openAnalytics = function() {
    hideMenu();
    originalOpenAnalytics();
};

const originalOpenCustomizationMenu = window.openCustomizationMenu;
window.openCustomizationMenu = function() {
    hideMenu();
    originalOpenCustomizationMenu();
};

const originalOpenLeaderboardModal = window.openLeaderboardModal;
window.openLeaderboardModal = function() {
    hideMenu();
    originalOpenLeaderboardModal();
};

// Initialize on DOM load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initMenu);

    // Re-initialize when user logs in
    const originalLoadUserData = window.loadUserData;
    window.loadUserData = function() {
        originalLoadUserData();
        setTimeout(initMenu, 500);
    };
}