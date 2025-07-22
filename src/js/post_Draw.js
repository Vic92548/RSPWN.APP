function drawPost(data){
    displayReactions();

    makeApiRequest("/register-view?postId=" + data.id, false).then(data => {
        console.log(data);
        console.log("Views updated");
    });

    post_seen++;
    showPost();
    console.log("Post DATA:");
    console.log(data);

    updateFollowButton();

    // Enhanced title handling
    const titleEl = document.getElementById("post_title");
    const showMoreButtonEl = document.getElementById("post_title_show_more");
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

                // Smooth scroll to show full title
                if (isExpanded) {
                    titleEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            };
        } else {
            showMoreButtonEl.style.display = "none";
        }
    });

    // Enhanced user info with real Discord avatar
    const username = data.username;
    document.getElementById("post_username").textContent = "@" + username;

    // Handle avatar
    const avatarImg = document.getElementById("user_avatar_img");
    const avatarLetter = document.getElementById("avatar_letter");
    const avatarEl = document.getElementById("user_avatar");

    // Function to show letter avatar fallback
    function showLetterAvatar() {
        avatarImg.style.display = "none";
        avatarLetter.style.display = "flex";
        avatarLetter.textContent = username.charAt(0).toUpperCase();

        // Generate avatar background color based on username
        const hue = username.charCodeAt(0) * 3 % 360;
        avatarEl.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 70%, 60%))`;
    }

    // Function to show Discord avatar
    function showDiscordAvatar(avatarHash) {
        if (avatarHash) {
            avatarImg.src = `https://cdn.discordapp.com/avatars/${data.userId}/${avatarHash}.png?size=128`;
            avatarImg.style.display = "block";
            avatarLetter.style.display = "none";
            avatarEl.style.background = "none";

            // Handle image load error
            avatarImg.onerror = () => {
                console.log("Failed to load Discord avatar, showing fallback");
                showLetterAvatar();
            };
        } else {
            showLetterAvatar();
        }
    }

    // First check if avatar data is included in the post data
    if (data.userAvatar !== undefined) {
        // Use avatar from post data
        showDiscordAvatar(data.userAvatar);

        // Cache the avatar info
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
    // Then check if we have the creator's avatar in cache
    else if (window.creators && window.creators[data.userId] && window.creators[data.userId].avatar !== undefined) {
        showDiscordAvatar(window.creators[data.userId].avatar);
    }
    // Finally, fetch user info if needed
    else {
        // Fetch user info to get avatar
        makeApiRequest(`/api/user/${data.userId}`, false)
            .then(userInfo => {
                // Initialize creators object if it doesn't exist
                if (!window.creators) {
                    window.creators = {};
                }
                if (!window.creators[data.userId]) {
                    window.creators[data.userId] = {};
                }

                // Store avatar info (even if null)
                window.creators[data.userId].avatar = userInfo.avatar || null;
                window.creators[data.userId].username = userInfo.username;
                window.creators[data.userId].level = userInfo.level || 0;

                // Show the avatar
                showDiscordAvatar(userInfo.avatar);
            })
            .catch(error => {
                console.error("Failed to fetch user info:", error);
                showLetterAvatar();

                // Cache the failure to avoid repeated API calls
                if (!window.creators) {
                    window.creators = {};
                }
                if (!window.creators[data.userId]) {
                    window.creators[data.userId] = {};
                }
                window.creators[data.userId].avatar = null;
            });
    }

    document.getElementById("post_time").textContent = timeAgo(data.timestamp);

    // Animate view count in overlay
    animateViewCount(data.views);

    if(!data.content){
        data.content = "https://vapr.b-cdn.net/posts/200w.gif";
    }

    if(data.content.split("/posts/")[0] === "https://vapr-club.b-cdn.net"){
        document.getElementById("post_image").src = data.content;
        document.getElementById("post_image").style.display = "block";
        document.getElementById("post_content").style.display = "none";
        document.getElementById("post_video").style.display = "none";

        // Enhanced image handling
        const imageEl = document.getElementById("post_image");
        imageEl.style.filter = "blur(10px)";
        imageEl.onload = () => {
            imageEl.style.filter = "none";
            imageEl.style.transition = "filter 0.3s ease";
        };
    }else if(data.content.includes("iframe.mediadelivery.net")){
        document.getElementById("post_video").style.display = "block";
        setTimeout(() => {
            document.getElementById("post_video").children[0].src = data.content;
        }, 100);
        document.getElementById("post_content").style.display = "none";
        document.getElementById("post_image").style.display = "none";
    }

    document.getElementById("post_image").onclick = function () {
        toggleImageZoom(document.getElementById("post_image"));
    }

    // Handle link button in header
    const headerLinkButton = document.getElementById("header_link_button");
    const links = document.getElementById("post_link").children;

    // Hide all links first
    for(let i = 0; i < links.length; i++){
        links[i].style.display = "none";
    }

    headerLinkButton.style.display = "none";

    if(data.link){
        // Process the link and setup the header button
        handlePostLinks(data.link);
    }
}

// Navigate to user profile
function navigateToProfile() {
    if (current_post && current_post.username) {
        window.location.href = `/@${current_post.username}`;
    }
}

// Animate view count
function animateViewCount(targetViews) {
    const viewsEl = document.getElementById("post_views");
    const startViews = parseInt(viewsEl.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateViews(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        const currentViews = Math.floor(startViews + (targetViews - startViews) * easeOutQuart);
        viewsEl.textContent = formatViews(currentViews);

        if (progress < 1) {
            requestAnimationFrame(updateViews);
        }
    }

    requestAnimationFrame(updateViews);
}

// Enhanced image zoom with overlay
function toggleImageZoom(img) {
    if (img.classList.contains('zoomed')) {
        // Zoom out
        img.classList.remove('zoomed');
        document.querySelector('.image-overlay')?.remove();
    } else {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        overlay.onclick = () => toggleImageZoom(img);

        // Clone image for zoom
        const zoomedImg = img.cloneNode();
        zoomedImg.className = 'zoomed-image';

        overlay.appendChild(zoomedImg);
        document.body.appendChild(overlay);

        img.classList.add('zoomed');

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    }
}

// Enhanced link handling with header button
function handlePostLinks(link) {
    try {
        const url = new URL(link);
        const hostname = url.hostname.toLowerCase();

        // Link mapping
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

        // Find matching link
        let matchedLink = null;
        for (const [domain, linkInfo] of Object.entries(linkMappings)) {
            if (hostname.includes(domain)) {
                matchedLink = linkInfo;
                setupSocialLink(linkInfo.id, link);
                break;
            }
        }

        // Special case for hayarobi
        if (hostname === 'hayarobi-portfolio.carrd.co') {
            matchedLink = { id: 'post_hayarobi', icon: 'fa-solid fa-palette', label: 'Hayarobi' };
            setupSocialLink('post_hayarobi', link);
        }

        // Setup header link button
        if (matchedLink) {
            const headerLinkButton = document.getElementById("header_link_button");
            headerLinkButton.style.display = "inline-flex";
            headerLinkButton.href = link;
            headerLinkButton.innerHTML = `<i class="${matchedLink.icon}"></i><span>${matchedLink.label}</span>`;

            // Animate appearance
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