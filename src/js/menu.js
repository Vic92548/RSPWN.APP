function initMenu() {
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
    const devSection = DOM.query('.menu-section[title="Developer"]');
    if (devSection) {
        devSection.style.display = isGameDeveloper() ? 'block' : 'none';
    }
}

function toggleMenuCollapse() {
    const menuContainer = DOM.query('.menu-container');
    const mainElement = DOM.query('main');
    const toggleButton = DOM.query('.menu-toggle i');

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
    const menuItems = DOM.queryAll('.menu-item');

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
    const menuContainer = DOM.query('.menu-container');
    const mainElement = DOM.query('main');

    if (savedState === 'true' && menuContainer) {
        menuContainer.classList.add('collapsed');
        if (mainElement) {
            mainElement.classList.add('menu-collapsed');
        }
        updateMenuTooltips(true);

        const toggleButton = DOM.query('.menu-toggle i');
        if (toggleButton) {
            toggleButton.style.transform = 'rotate(180deg)';
        }
    }
}

function addCollapsedMenuInteractions() {
    const menuContainer = DOM.query('.menu-container');
    if (!menuContainer) return;
}

function updateMenuUserInfo() {
    if (!window.user) return;

    const menuAvatar = DOM.get('menu_user_avatar');
    if (menuAvatar && window.user.avatar) {
        menuAvatar.src = `https://cdn.discordapp.com/avatars/${window.user.id}/${window.user.avatar}.png?size=128`;
    } else if (menuAvatar) {
        menuAvatar.src = 'https://vapr-club.b-cdn.net/default_vapr_avatar.png';
    }

    const menuUsername = DOM.get('menu_username');
    if (menuUsername) {
        menuUsername.textContent = '@' + window.user.username;
    }

    const menuLevel = DOM.get('menu_user_level');
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

    const xpBar = DOM.get('menu_xp_bar');
    const xpText = DOM.get('menu_xp_text');

    if (xpBar) {
        xpBar.style.width = xpPercentage + '%';
    }

    if (xpText) {
        xpText.textContent = `${xp} / ${xpRequired} XP`;
    }
}

function showMenuUserElements() {
    const userCard = DOM.get('menu_user_info');
    const accountSection = DOM.get('account_section');

    if (userCard) DOM.show(userCard, 'flex');
    if (accountSection) DOM.show(accountSection);
}

async function updateOnlineUsers() {
    try {
        const data = await api.getUserCount();

        const onlineEl = DOM.get('online_users');
        if (onlineEl && data.count) {
            onlineEl.textContent = data.count.toLocaleString() + ' users';
        }
    } catch (error) {
        console.error('Error fetching online users:', error);
    }
}

function addMenuAnimations() {
    const menuItems = DOM.queryAll('.menu-item');

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
    const versionElement = DOM.query('.menu-version span');
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
    const menu = DOM.get('menu');
    if (!menu) return;

    DOM.show(menu, 'flex');

    if (isUserLoggedIn()) {
        updateMenuUserInfo();
        showMenuUserElements();
    } else {
        const accountSection = DOM.get('account_section');
        if (accountSection) DOM.hide(accountSection);
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
    const menu = DOM.get('menu');
    if (!menu) return;

    const menuContainer = menu.querySelector('.menu-container');
    if (menuContainer) {
        menuContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        menuContainer.style.transform = 'translateX(-100%)';
        menuContainer.style.opacity = '0';

        setTimeout(() => {
            DOM.hide(menu);
        }, 300);
    } else {
        DOM.hide(menu);
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
            const menuContainer = DOM.query('.menu-container');
            const mainElement = DOM.query('main');

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

if (window.VAPR && typeof window.VAPR.on === 'function') {
    const toggleAccountSection = (el) => {
        if (isUserLoggedIn()) {
            DOM.show(el);
        } else {
            DOM.hide(el);
        }
    };

    window.VAPR.on('#account_section', 'created', toggleAccountSection);
    window.VAPR.on('#account_section', 'mounted', toggleAccountSection);
}

function insertVAPRUserInfo() {
    const menuHeader = DOM.query('.menu-header');
    if (!menuHeader) return;

    const container = menuHeader.parentElement;
    const menuNav = container.querySelector('.menu-nav');

    const existingUserInfo = DOM.get('menu_user_info');
    if (existingUserInfo) existingUserInfo.remove();

    const avatarUrl = window.user.avatar
        ? `https://cdn.discordapp.com/avatars/${window.user.id}/${window.user.avatar}.png?size=128`
        : 'https://vapr-club.b-cdn.net/default_vapr_avatar.png';

    const xpPercent = ((window.user.xp || 0) / (window.user.xp_required || 700)) * 100;

    const userInfo = DOM.create('user-info-card', {
        id: 'menu_user_info',
        avatar: avatarUrl,
        username: '@' + window.user.username,
        level: window.user.level || 0,
        xp: window.user.xp || 0,
        'xp-required': window.user.xp_required || 700,
        'xp-percent': xpPercent.toFixed(1)
    });

    container.insertBefore(userInfo, menuNav);
}