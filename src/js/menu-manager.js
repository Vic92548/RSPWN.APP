class MenuManager {
    constructor() {
        this.menuConfig = null;
        this.isCollapsed = false;
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('/menu-config.json');
            this.menuConfig = await response.json();
            this.updateMenu();
        } catch (error) {
            console.error('Failed to load menu configuration:', error);
        }
    }

    isItemVisible(item, userContext = {}) {
        const visibility = item.visibility || {};
        const platform = this.detectPlatform();

        if (visibility.hideOnMobile && platform === 'mobile') return false;
        if (visibility.hideOnDesktop && platform === 'desktop') return false;
        if (visibility.hideOnWeb && platform === 'web') return false;

        if (visibility.requireAuth && !userContext.isLoggedIn) return false;
        if (visibility.showOnlyWhenLoggedOut && userContext.isLoggedIn) return false;
        if (visibility.showOnlyWhenLoggedIn && !userContext.isLoggedIn) return false;
        if (visibility.requireDeveloper && !userContext.isDeveloper) return false;

        return true;
    }

    isSectionVisible(section, userContext = {}) {
        const visibility = section.visibility || {};
        const platform = this.detectPlatform();

        if (visibility.hideOnMobile && platform === 'mobile') return false;
        if (visibility.hideOnDesktop && platform === 'desktop') return false;
        if (visibility.hideOnWeb && platform === 'web') return false;

        if (visibility.requireAuth && !userContext.isLoggedIn) return false;
        if (visibility.showOnlyWhenLoggedOut && userContext.isLoggedIn) return false;
        if (visibility.showOnlyWhenLoggedIn && !userContext.isLoggedIn) return false;
        if (visibility.requireDeveloper && !userContext.isDeveloper) return false;

        const visibleItems = section.items.filter(item => this.isItemVisible(item, userContext));
        return visibleItems.length > 0;
    }

    detectPlatform() {
        if (typeof window.__TAURI__ !== 'undefined') return 'desktop';
        if (window.innerWidth <= 768) return 'mobile';
        return 'web';
    }

    isSpecialButton(item) {
        const url = item.action || '';
        const specialType = item.specialType || '';

        if (specialType === 'discord' || url.includes('discord')) {
            return 'discord';
        }
        if (specialType === 'github' || url.includes('github')) {
            return 'github';
        }
        return null;
    }

    renderMenuItem(item, userContext = {}) {
        if (!this.isItemVisible(item, userContext)) return '';

        const specialType = this.isSpecialButton(item);
        const iconClass = item.iconClass ? ` ${item.iconClass}` : '';
        const badgeClass = item.badgeClass ? ` ${item.badgeClass}` : '';
        const elementId = item.elementId ? ` id="${item.elementId}"` : '';
        const badgeId = item.badgeId ? ` id="${item.badgeId}"` : '';

        let badgeHtml = '';
        if (item.badge) {
            badgeHtml = `<span class="menu-badge${badgeClass}"${badgeId}>${item.badge}</span>`;
        }

        let arrowHtml = '';
        if (item.arrow) {
            arrowHtml = '<i class="fa-solid fa-chevron-right menu-item-arrow"></i>';
        }

        return `
            <li class="menu-item glass-secondary glass-shimmer" onclick="${item.action}"${elementId}>
                <div class="menu-item-icon${iconClass}">
                    <i class="${item.icon}"></i>
                </div>
                <div class="menu-item-content">
                    <span class="menu-item-title">${item.title}</span>
                    ${item.subtitle ? `<span class="menu-item-desc">${item.subtitle}</span>` : ''}
                </div>
                ${badgeHtml}
                ${arrowHtml}
            </li>
        `;
    }

    renderMenuSection(section, userContext = {}) {
        if (!this.isSectionVisible(section, userContext)) return '';

        const sectionId = section.sectionId ? ` id="${section.sectionId}"` : '';
        const authClass = section.visibility?.requireAuth ? ' auth-required' : '';
        const developerClass = section.visibility?.requireDeveloper ? ' developer-section' : '';

        const items = section.items
            .filter(item => this.isItemVisible(item, userContext))
            .map(item => this.renderMenuItem(item, userContext))
            .join('');

        if (!items) return '';

        return `
            <div class="menu-section${authClass}${developerClass}"${sectionId}>
                <h4 class="menu-section-title">${section.category}</h4>
                <ul class="menu-list">
                    ${items}
                </ul>
            </div>
        `;
    }

    renderMenu(userContext = {}) {
        if (!this.menuConfig) return '';

        const sections = this.menuConfig.menuSections
            .filter(section => this.isSectionVisible(section, userContext))
            .map(section => this.renderMenuSection(section, userContext))
            .join('');

        return sections;
    }

    updateMenu() {
        const userContext = this.getUserContext();
        const menuNav = document.querySelector('.menu-nav');

        if (!menuNav || !this.menuConfig) return;

        const menuContent = this.renderMenu(userContext);
        menuNav.innerHTML = menuContent;

        this.initializeSpecialButtons();
        this.addMenuAnimations();
    }

    getUserContext() {
        const context = {
            isLoggedIn: isUserLoggedIn ? isUserLoggedIn() : false,
            isDeveloper: isGameDeveloper ? isGameDeveloper() : false,
            user: window.user || null
        };
        console.log('Menu user context:', context);
        return context;
    }

    initializeSpecialButtons() {
        setTimeout(() => {
            console.log('Initializing special buttons...');

            const githubStars = document.getElementById('github_stars');
            console.log('GitHub stars element:', githubStars);
            if (githubStars && window.updateGitHubStars) {
                console.log('Updating GitHub stars...');
                window.updateGitHubStars(githubStars);
            }

            const discordMembers = document.getElementById('discord_members');
            console.log('Discord members element:', discordMembers);
            if (discordMembers && window.updateDiscordMembers) {
                console.log('Updating Discord members...');
                window.updateDiscordMembers(discordMembers);
            }
        }, 100);
    }

    addMenuAnimations() {
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }

    updateMenuTooltips(isCollapsed) {
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

    addItemToConfig(sectionName, item) {
        if (!this.menuConfig) return false;

        const section = this.menuConfig.menuSections.find(s => s.category === sectionName);
        if (section) {
            section.items.push(item);
            return true;
        }
        return false;
    }

    removeItemFromConfig(sectionName, itemTitle) {
        if (!this.menuConfig) return false;

        const section = this.menuConfig.menuSections.find(s => s.category === sectionName);
        if (section) {
            const itemIndex = section.items.findIndex(item => item.title === itemTitle);
            if (itemIndex !== -1) {
                section.items.splice(itemIndex, 1);
                return true;
            }
        }
        return false;
    }

    updateItemVisibility(sectionName, itemTitle, visibilityOptions) {
        if (!this.menuConfig) return false;

        const section = this.menuConfig.menuSections.find(s => s.category === sectionName);
        if (section) {
            const item = section.items.find(item => item.title === itemTitle);
            if (item) {
                item.visibility = { ...item.visibility, ...visibilityOptions };
                return true;
            }
        }
        return false;
    }

    getMenuConfig() {
        return this.menuConfig;
    }
}

window.menuManager = new MenuManager();