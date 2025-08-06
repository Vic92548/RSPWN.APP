function drawPost(data){
    displayReactions();

    APIHandler.handle(
        () => api.registerView(data.id),
        {
            onSuccess: (data) => {
                console.log(data);
                console.log("Views updated");
            }
        }
    );

    post_seen++;
    showPost();
    console.log("Post DATA:");
    console.log(data);

    updateFollowButton();

    const titleEl = DOM.get("post_title");
    const showMoreButtonEl = DOM.get("post_title_show_more");
    titleEl.textContent = data.title;

    requestAnimationFrame(() => {
        const isClamped = titleEl.scrollHeight > titleEl.clientHeight;

        if (isClamped) {
            showMoreButtonEl.style.display = "inline-block";
            showMoreButtonEl.onclick = () => {
                titleEl.classList.toggle("expanded");
                const isExpanded = titleEl.classList.contains("expanded");
                showMoreButtonEl.innerHTML = isExpanded
                    ? `<i class="fa-solid fa-chevron-up"></i> Show less`
                    : `<i class="fa-solid fa-chevron-down"></i> Show more`;

                if (isExpanded) {
                    titleEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            };
        } else {
            showMoreButtonEl.style.display = "none";
        }
    });

    const username = data.username;
    DOM.setText("post_username", "@" + username);

    const avatarImg = DOM.get("user_avatar_img");
    const avatarLetter = DOM.get("avatar_letter");
    const avatarEl = DOM.get("user_avatar");

    function showLetterAvatar() {
        DOM.hide(avatarImg);
        DOM.show(avatarLetter, "flex");
        avatarLetter.textContent = username.charAt(0).toUpperCase();

        const hue = username.charCodeAt(0) * 3 % 360;
        avatarEl.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 70%, 60%))`;
    }

    function showDiscordAvatar(avatarHash) {
        if (avatarHash) {
            avatarImg.src = `https://cdn.discordapp.com/avatars/${data.userId}/${avatarHash}.png?size=128`;
            DOM.show(avatarImg);
            DOM.hide(avatarLetter);
            avatarEl.style.background = "none";

            avatarImg.onerror = () => {
                console.log("Failed to load Discord avatar, showing fallback");
                showLetterAvatar();
            };
        } else {
            showLetterAvatar();
        }
    }

    if (data.userAvatar !== undefined) {
        showDiscordAvatar(data.userAvatar);

        if (!window.creators) {
            window.creators = {};
        }
        if (!window.creators[data.userId]) {
            window.creators[data.userId] = {};
        }
        window.creators[data.userId].avatar = data.userAvatar;
        window.creators[data.userId].username = data.username;
        window.creators[data.userId].level = data.userLevel || 0;
    }
    else if (window.creators && window.creators[data.userId] && window.creators[data.userId].avatar !== undefined) {
        showDiscordAvatar(window.creators[data.userId].avatar);
    }
    else {
        APIHandler.handle(
            () => api.getUser(data.userId),
            {
                onSuccess: (userInfo) => {
                    if (!window.creators) {
                        window.creators = {};
                    }
                    if (!window.creators[data.userId]) {
                        window.creators[data.userId] = {};
                    }

                    window.creators[data.userId].avatar = userInfo.avatar || null;
                    window.creators[data.userId].username = userInfo.username;
                    window.creators[data.userId].level = userInfo.level || 0;

                    showDiscordAvatar(userInfo.avatar);
                },
                onError: (error) => {
                    console.error("Failed to fetch user info:", error);
                    showLetterAvatar();

                    if (!window.creators) {
                        window.creators = {};
                    }
                    if (!window.creators[data.userId]) {
                        window.creators[data.userId] = {};
                    }
                    window.creators[data.userId].avatar = null;
                }
            }
        );
    }

    DOM.setText("post_time", timeAgo(data.timestamp));

    animateViewCount(data.views);

    if(!data.content){
        data.content = "https://vapr.b-cdn.net/posts/200w.gif";
    }

    if(data.content.split("/posts/")[0] === "https://vapr-club.b-cdn.net"){
        DOM.get("post_image").src = data.content;
        DOM.show("post_image");
        DOM.hide("post_content");
        DOM.hide("post_video");

        const imageEl = DOM.get("post_image");
        imageEl.style.filter = "blur(10px)";
        imageEl.onload = () => {
            imageEl.style.filter = "none";
            imageEl.style.transition = "filter 0.3s ease";
        };
    }else if(data.content.includes("iframe.mediadelivery.net")){
        DOM.show("post_video");
        setTimeout(() => {
            DOM.get("post_video").children[0].src = data.content;
        }, 100);
        DOM.hide("post_content");
        DOM.hide("post_image");
    }

    DOM.get("post_image").onclick = function () {
        toggleImageZoom(DOM.get("post_image"));
    }

    const headerLinkButton = DOM.get("header_link_button");
    const headerGameButton = DOM.get("header_game_button");
    const links = DOM.get("post_link").children;

    for(let i = 0; i < links.length; i++){
        links[i].style.display = "none";
    }

    DOM.hide(headerLinkButton);
    DOM.hide(headerGameButton);

    if(data.taggedGame && data.taggedGame.id) {
        window.currentPostTaggedGame = data.taggedGame;
        DOM.show(headerGameButton, 'inline-flex');
        headerGameButton.innerHTML = `<i class="fa-solid fa-gamepad"></i><span>${data.taggedGame.title}</span>`;

        headerGameButton.style.opacity = '0';
        headerGameButton.style.transform = 'translateY(10px)';

        setTimeout(() => {
            headerGameButton.style.transition = 'all 0.3s ease';
            headerGameButton.style.opacity = '1';
            headerGameButton.style.transform = 'translateY(0)';
        }, 100);
    } else {
        window.currentPostTaggedGame = null;
    }

    if(data.link && !data.taggedGame){
        handlePostLinks(data.link);
    }
}

window.openTaggedGame = function() {
    if (window.currentPostTaggedGame && window.currentPostTaggedGame.id) {
        showGameDetails(window.currentPostTaggedGame.id);
    }
}

function navigateToProfile() {
    if (current_post && current_post.username) {
        window.location.href = `/@${current_post.username}`;
    }
}

function animateViewCount(targetViews) {
    const viewsEl = DOM.get("post_views");
    const startViews = parseInt(viewsEl.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateViews(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        const currentViews = Math.floor(startViews + (targetViews - startViews) * easeOutQuart);
        viewsEl.textContent = formatViews(currentViews);

        if (progress < 1) {
            requestAnimationFrame(updateViews);
        }
    }

    requestAnimationFrame(updateViews);
}

function toggleImageZoom(img) {
    if (img.classList.contains('zoomed')) {
        img.classList.remove('zoomed');
        DOM.query('.image-overlay')?.remove();
    } else {
        const overlay = DOM.create('div', {
            class: 'image-overlay',
            onclick: () => toggleImageZoom(img)
        });

        const zoomedImg = img.cloneNode();
        zoomedImg.className = 'zoomed-image';

        overlay.appendChild(zoomedImg);
        document.body.appendChild(overlay);

        img.classList.add('zoomed');

        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    }
}

function handlePostLinks(link) {
    try {
        const url = new URL(link);
        const hostname = url.hostname.toLowerCase();

        const linkMappings = {
            'discord.gg': { id: 'post_discord', icon: 'fa-brands fa-discord', label: 'Discord' },
            'reddit.com': { id: 'post_reddit', icon: 'fa-brands fa-reddit', label: 'Reddit' },
            'store.steampowered.com': { id: 'post_steam', icon: 'fa-brands fa-steam', label: 'Steam' },
            'x.com': { id: 'post_x', icon: 'fa-brands fa-x-twitter', label: 'X' },
            'twitter.com': { id: 'post_x', icon: 'fa-brands fa-x-twitter', label: 'X' },
            'threads.net': { id: 'post_threads', icon: 'fa-brands fa-threads', label: 'Threads' },
            'pinterest': { id: 'post_pinterest', icon: 'fa-brands fa-pinterest', label: 'Pinterest' },
            'twitch.tv': { id: 'post_twitch', icon: 'fa-brands fa-twitch', label: 'Twitch' },
            'youtube.com': { id: 'post_youtube', icon: 'fa-brands fa-youtube', label: 'YouTube' },
            'instagram.com': { id: 'post_instagram', icon: 'fa-brands fa-instagram', label: 'Instagram' },
            'store.epicgames.com': { id: 'post_epic', icon: 'fa-solid fa-gamepad', label: 'Epic Games' },
            'kickstarter.com': { id: 'post_kickstarter', icon: 'fa-brands fa-kickstarter', label: 'Kickstarter' },
            'kick.com': { id: 'post_kick', icon: 'fa-brands fa-kickstarter-k', label: 'Kick' },
            'patreon.com': { id: 'post_patreon', icon: 'fa-brands fa-patreon', label: 'Patreon' },
            'fortnite.com': { id: 'post_fortnite', icon: 'fa-solid fa-gamepad', label: 'Fortnite' },
            'nintendo.com': { id: 'post_nintendo', icon: 'fa-solid fa-gamepad', label: 'Nintendo' },
            'ubisoft.com': { id: 'post_ubisoft', icon: 'fa-solid fa-gamepad', label: 'Ubisoft' },
            'gumroad.com': { id: 'post_gumroad', icon: 'fa-solid fa-shopping-cart', label: 'Gumroad' },
            'garryhost.com': { id: 'post_garryhost', icon: 'fa-solid fa-server', label: "Garry's Host" },
            'itch.io': { id: 'post_itch', icon: 'fa-brands fa-itch-io', label: 'itch.io' }
        };

        let matchedLink = null;
        for (const [domain, linkInfo] of Object.entries(linkMappings)) {
            if (hostname.includes(domain)) {
                matchedLink = linkInfo;
                setupSocialLink(linkInfo.id, link);
                break;
            }
        }

        if (hostname === 'hayarobi-portfolio.carrd.co') {
            matchedLink = { id: 'post_hayarobi', icon: 'fa-solid fa-palette', label: 'Hayarobi' };
            setupSocialLink('post_hayarobi', link);
        }

        if (matchedLink) {
            const headerLinkButton = DOM.get("header_link_button");
            headerLinkButton.style.display = "inline-flex";
            headerLinkButton.href = link;
            headerLinkButton.innerHTML = `<i class="${matchedLink.icon}"></i><span>${matchedLink.label}</span>`;

            headerLinkButton.style.opacity = '0';
            headerLinkButton.style.transform = 'translateY(10px)';

            setTimeout(() => {
                headerLinkButton.style.transition = 'all 0.3s ease';
                headerLinkButton.style.opacity = '1';
                headerLinkButton.style.transform = 'translateY(0)';
            }, 100);
        }

    } catch (error) {
        console.error('Invalid URL:', link);
    }
}