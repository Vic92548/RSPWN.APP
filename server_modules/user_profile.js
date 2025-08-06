import { usersCollection, postsCollection, followsCollection, viewsCollection } from "./database.js";

async function handleProfilePage(request, templates) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith('/@')) {
        return null;
    }

    const username = path.substring(2);

    if (!username) {
        return new Response("Username not provided", { status: 400 });
    }

    try {
        const user = await usersCollection.findOne({
            username: username
        });

        if (!user) {
            const notFoundHtml = await templates.render('index.html', {
                username: escapeHtml(username),
                meta_title: `User not found - VAPR`,
                meta_description: `The user @${username} was not found on VAPR.`
            });

            return new Response(notFoundHtml, {
                status: 404,
                headers: { "Content-Type": "text/html" }
            });
        }

        const profileData = await gatherProfileData(user);

        const avatarUrl = profileData.avatar
            ? `https://cdn.discordapp.com/avatars/${profileData.id}/${profileData.avatar}.png?size=256`
            : 'https://vapr-club.b-cdn.net/default_vapr_avatar.png';

        const xpPercentage = (profileData.xp / profileData.xp_required) * 100;

        let postsHtml = '';
        if (profileData.recentPosts.length === 0) {
            postsHtml = '<p class="no-posts"><i class="fa-solid fa-inbox"></i> No posts yet</p>';
        } else {
            postsHtml = profileData.recentPosts.map(post => {
                const timeAgoText = getTimeAgo(post.timestamp);
                return `
                   <a href="/post/${post.id}" class="profile-post-card">
                       <h4>${escapeHtml(post.title)}</h4>
                       <div class="post-meta">
                           <span><i class="fa-solid fa-eye"></i> ${formatNumber(post.views)}</span>
                           <span><i class="fa-solid fa-clock"></i> ${timeAgoText}</span>
                       </div>
                   </a>
               `;
            }).join('');
        }

        const templateData = {
            username: escapeHtml(profileData.username),
            user_id: profileData.id,
            avatar_url: avatarUrl,
            level: profileData.level,
            join_date: profileData.joinDateFormatted,
            posts_count: formatNumber(profileData.stats.posts),
            followers_count: formatNumber(profileData.stats.followers),
            total_views: formatNumber(profileData.stats.totalViews),
            xp_current: profileData.xp,
            xp_required: profileData.xp_required,
            xp_percentage: xpPercentage.toFixed(1),
            posts_html: postsHtml,

            meta_title: `@${profileData.username} - VAPR Profile`,
            meta_description: `Check out @${profileData.username}'s profile on VAPR - Level ${profileData.level} creator with ${profileData.stats.posts} posts and ${profileData.stats.followers} followers.`,
            meta_url: `https://vapr.club/@${profileData.username}`,
            meta_image: avatarUrl
        };

        const profileHtml = await templates.render('index.html', templateData);

        return new Response(profileHtml, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "public, max-age=300"
            }
        });

    } catch (error) {
        console.error("Error rendering profile:", error);
        return new Response("Internal server error", { status: 500 });
    }
}

async function gatherProfileData(user) {
    const postsCount = await postsCollection.countDocuments({
        userId: user.id
    });

    const followerCount = await followsCollection.countDocuments({
        creatorId: user.id
    });

    const userPosts = await postsCollection.find({
        userId: user.id
    }).toArray();

    let totalViews = 0;
    for (const post of userPosts) {
        const views = await viewsCollection.countDocuments({
            postId: post.id
        });
        totalViews += views;
    }

    const recentPosts = await postsCollection
        .find({ userId: user.id })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

    const postsWithViews = await Promise.all(recentPosts.map(async post => {
        const views = await viewsCollection.countDocuments({
            postId: post.id
        });
        return { ...post, views };
    }));

    const joinDate = user._id.getTimestamp();
    const joinDateFormatted = new Date(joinDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        level: user.level || 0,
        xp: user.xp || 0,
        xp_required: user.xp_required || 700,
        joinDate: joinDate,
        joinDateFormatted: joinDateFormatted,
        backgroundId: user.backgroundId || null,
        stats: {
            posts: postsCount,
            followers: followerCount,
            totalViews: totalViews
        },
        recentPosts: postsWithViews
    };
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
}

export { handleProfilePage };