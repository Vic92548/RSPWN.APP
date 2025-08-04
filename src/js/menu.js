function initMenu() {
    if (!MainPage) return;

    if (isUserLoggedIn()) {
        updateMenuUserInfo();
        showMenuUserElements();
    }

    updateOnlineUsers();
    addMenuAnimations();

    if (window.innerWidth >= 769) {
        initMenuCollapseState();
        addCollapsedMenuInteractions();
    }
}

function updateDeveloperSection() {
    const devSection = document.querySelector('.menu-section[title="Developer"]');
    if (devSection) {
        devSection.style.display = isGameDeveloper() ? 'block' : 'none';
    }
}

function toggleMenuCollapse() {
    const menuContainer = document.querySelector('.menu-container');
    const mainElement = document.querySelector('main');
    const toggleButton = document.querySelector('.menu-toggle i');

    if (!menuContainer) return;

    menuContainer.classList.toggle('collapsed');

    if (mainElement) {
        mainElement.classList.toggle('menu-collapsed');
    }

    const isCollapsed = menuContainer.classList.contains('collapsed');
    localStorage.setItem('menuCollapsed', isCollapsed);

    updateMenuTooltips(isCollapsed);

    if (toggleButton) {
        toggleButton.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function updateMenuTooltips(isCollapsed) {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        if (isCollapsed) {
            const title = item.querySelector('.menu-item-title');
            if (title) {
                item.setAttribute('data-tooltip', title.textContent);
            }
        } else {
            item.removeAttribute('data-tooltip');
        }
    });
}

function initMenuCollapseState() {
    const savedState = localStorage.getItem('menuCollapsed');
    const menuContainer = document.querySelector('.menu-container');
    const mainElement = document.querySelector('main');

    if (savedState === 'true' && menuContainer) {
        menuContainer.classList.add('collapsed');
        if (mainElement) {
            mainElement.classList.add('menu-collapsed');
        }
        updateMenuTooltips(true);

        const toggleButton = document.querySelector('.menu-toggle i');
        if (toggleButton) {
            toggleButton.style.transform = 'rotate(180deg)';
        }
    }
}

function addCollapsedMenuInteractions() {
    const menuContainer = document.querySelector('.menu-container');
    if (!menuContainer) return;
}

function updateMenuUserInfo() {
    if (!window.user) return;

    const menuAvatar = document.getElementById('menu_user_avatar');
    if (menuAvatar && window.user.avatar) {
        menuAvatar.src = `https://cdn.discordapp.com/avatars/${window.user.id}/${window.user.avatar}.png?size=128`;
    } else if (menuAvatar) {
        menuAvatar.src = 'https://vapr-club.b-cdn.net/default_vapr_avatar.png';
    }

    const menuUsername = document.getElementById('menu_username');
    if (menuUsername) {
        menuUsername.textContent = '@' + window.user.username;
    }

    const menuLevel = document.getElementById('menu_user_level');
    if (menuLevel) {
        menuLevel.textContent = window.user.level || 0;
    }

    updateMenuXPBar();
}

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

function showMenuUserElements() {
    const userCard = document.getElementById('menu_user_info');
    const logoutBtn = document.getElementById('logout_btn');

    if (userCard) userCard.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'flex';
}

async function updateOnlineUsers() {
    try {
        const data = await api.getUserCount();

        const onlineEl = document.getElementById('online_users');
        if (onlineEl && data.count) {
            onlineEl.textContent = data.count.toLocaleString() + ' users';
        }
    } catch (error) {
        console.error('Error fetching online users:', error);
    }
}

function addMenuAnimations() {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            item.style.transition = 'all 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 50);

        item.addEventListener('mouseenter', () => {
        });
    });
}

function isRunningInTauri() {
    return typeof window.__TAURI__ !== 'undefined';
}

function getLatestVersion() {
    const versionElement = document.querySelector('.menu-version span');
    if (versionElement) {
        const versionText = versionElement.textContent;
        const versionMatch = versionText.match(/v(\d+\.\d+\.\d+)/);
        if (versionMatch) {
            return versionMatch[1];
        }
    }
    return '1.1.19';
}

function downloadDesktopApp() {
    const version = getLatestVersion();
    const downloadUrl = `https://github.com/Vic92548/VAPR/releases/download/v${version}/VAPR_${version}_x64_en-US.msi`;

    if (window.analytics && window.analytics.track) {
        window.analytics.track('desktop_app_download_clicked', {
            version: version,
            platform: 'windows'
        });
    }

    window.open(downloadUrl, '_blank');

    notify.info("Download started!", `The VAPR desktop app download should begin shortly.<br><small>Windows 64-bit • v${version}</small>`, {
        timer: 5000
    });
}

function openMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;

    menu.style.display = 'flex';

    if (isUserLoggedIn()) {
        updateMenuUserInfo();
    }

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

    addMenuAnimations();
}

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

async function logout() {
    const confirmed = await notify.confirm('Logout', 'Are you sure you want to logout?');

    if (confirmed) {
        try {
            await fetch('/logout', {
                method: 'POST',
                credentials: 'include'
            });

            localStorage.removeItem('userData');

            if (window.clearSDKUserInfo) {
                window.clearSDKUserInfo();
            }

            window.user = null;
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    }
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth < 769) {
            const menuContainer = document.querySelector('.menu-container');
            const mainElement = document.querySelector('main');

            if (menuContainer) {
                menuContainer.classList.remove('collapsed');
            }
            if (mainElement) {
                mainElement.classList.remove('menu-collapsed');
            }
        } else {
            initMenuCollapseState();
        }
    }, 250);
});

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

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initMenu();

        if (window.innerWidth >= 769) {
            initMenuCollapseState();
        }

        if (window.user && window.VAPR) {
            insertVAPRUserInfo();
        }
    });

    const originalLoadUserData = window.loadUserData;
    window.loadUserData = function() {
        originalLoadUserData();
        setTimeout(() => {
            initMenu();
            if (window.user && window.VAPR) {
                insertVAPRUserInfo();
            }
        }, 500);
    };
}

function insertVAPRUserInfo() {
    const menuHeader = document.querySelector('.menu-header');
    if (!menuHeader) return;

    const container = menuHeader.parentElement;
    const menuNav = container.querySelector('.menu-nav');

    const existingUserInfo = document.getElementById('menu_user_info');
    if (existingUserInfo) existingUserInfo.remove();

    const avatarUrl = window.user.avatar
        ? `https://cdn.discordapp.com/avatars/${window.user.id}/${window.user.avatar}.png?size=128`
        : 'https://vapr-club.b-cdn.net/default_vapr_avatar.png';

    const xpPercent = ((window.user.xp || 0) / (window.user.xp_required || 700)) * 100;

    const userInfo = document.createElement('user-info-card');
    userInfo.setAttribute('id', 'menu_user_info');
    userInfo.setAttribute('avatar', avatarUrl);
    userInfo.setAttribute('username', '@' + window.user.username);
    userInfo.setAttribute('level', window.user.level || 0);
    userInfo.setAttribute('xp', window.user.xp || 0);
    userInfo.setAttribute('xp-required', window.user.xp_required || 700);
    userInfo.setAttribute('xp-percent', xpPercent.toFixed(1));

    container.insertBefore(userInfo, menuNav);
}

window.toggleMenuCollapse = toggleMenuCollapse;
window.openMenu = openMenu;
window.hideMenu = hideMenu;
window.logout = logout;
window.downloadDesktopApp = downloadDesktopApp;