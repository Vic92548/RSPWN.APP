// Backend handler for server-side rendered profiles

import {usersCollection, postsCollection, followsCollection, viewsCollection} from "./database.js";

async function handleProfilePage(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Check if this is a profile request
    if (!path.startsWith('/@')) {
        return null; // Let other handlers process this
    }

    const username = path.substring(2); // Remove /@

    if (!username) {
        return new Response("Username not provided", { status: 400 });
    }

    try {
        // Find user by username
        const user = await usersCollection.findOne({
            username: username
        });

        if (!user) {
            // Return 404 page
            const notFoundHtml = await generateProfileNotFound(username);
            return new Response(notFoundHtml, {
                status: 404,
                headers: { "Content-Type": "text/html" }
            });
        }

        // Gather profile data
        const profileData = await gatherProfileData(user);

        // Generate HTML with embedded data
        const profileHtml = await generateProfileHtml(profileData);

        return new Response(profileHtml, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "public, max-age=300" // Cache for 5 minutes
            }
        });

    } catch (error) {
        console.error("Error rendering profile:", error);
        return new Response("Internal server error", { status: 500 });
    }
}

async function gatherProfileData(user) {
    // Get user's posts count
    const postsCount = await postsCollection.countDocuments({
        userId: user.id
    });

    // Get follower count
    const followerCount = await followsCollection.countDocuments({
        creatorId: user.id
    });

    // Get total views across all posts
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

    // Get recent posts (limit to 10)
    const recentPosts = await postsCollection
        .find({ userId: user.id })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

    // Add view counts to recent posts
    const postsWithViews = await Promise.all(recentPosts.map(async post => {
        const views = await viewsCollection.countDocuments({
            postId: post.id
        });
        return { ...post, views };
    }));

    // Format join date
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

async function generateProfileHtml(profileData) {
    // Read the base template
    const template = await Deno.readTextFile("src/components/profile_page.html");

    // Generate avatar URL
    const avatarUrl = profileData.avatar
        ? `https://cdn.discordapp.com/avatars/${profileData.id}/${profileData.avatar}.png`
        : 'https://vapr.b-cdn.net/V_round_128.png';

    // Calculate XP percentage
    const xpPercentage = (profileData.xp / profileData.xp_required) * 100;

    // Generate posts HTML
    let postsHtml = '';
    if (profileData.recentPosts.length === 0) {
        postsHtml = '<p class="no-posts">No posts yet</p>';
    } else {
        postsHtml = profileData.recentPosts.map(post => {
            const timeAgoText = getTimeAgo(post.timestamp);
            return `
                <a href="/post/${post.id}" class="profile-post-card">
                    <h4>${escapeHtml(post.title)}</h4>
                    <div class="post-meta">
                        <span><i class="fa-solid fa-eye"></i> ${formatNumber(post.views)}</span>
                        <span>${timeAgoText}</span>
                    </div>
                </a>
            `;
        }).join('');
    }

    // Replace placeholders in template
    let html = template
        .replace(/{{username}}/g, escapeHtml(profileData.username))
        .replace(/{{user_id}}/g, profileData.id)
        .replace(/{{avatar_url}}/g, avatarUrl)
        .replace(/{{level}}/g, profileData.level)
        .replace(/{{join_date}}/g, profileData.joinDateFormatted)
        .replace(/{{posts_count}}/g, formatNumber(profileData.stats.posts))
        .replace(/{{followers_count}}/g, formatNumber(profileData.stats.followers))
        .replace(/{{total_views}}/g, formatNumber(profileData.stats.totalViews))
        .replace(/{{xp_current}}/g, profileData.xp)
        .replace(/{{xp_required}}/g, profileData.xp_required)
        .replace(/{{xp_percentage}}/g, xpPercentage.toFixed(1))
        .replace(/{{posts_html}}/g, postsHtml)
        .replace(/{{profile_data_json}}/g, JSON.stringify(profileData));

    // SEO meta tags
    const metaDescription = `Check out @${profileData.username}'s profile on VAPR - Level ${profileData.level} creator with ${profileData.stats.posts} posts and ${profileData.stats.followers} followers.`;
    const metaTitle = `@${profileData.username} - VAPR Profile`;

    html = html
        .replace(/{{meta_title}}/g, escapeHtml(metaTitle))
        .replace(/{{meta_description}}/g, escapeHtml(metaDescription))
        .replace(/{{meta_url}}/g, `https://vapr.club/@${profileData.username}`)
        .replace(/{{meta_image}}/g, avatarUrl);

    return html;
}

async function generateProfileNotFound(username) {
    const template = await Deno.readTextFile("src/components/profile_404.html");

    return template
        .replace(/{{username}}/g, escapeHtml(username))
        .replace(/{{meta_title}}/g, `User not found - VAPR`)
        .replace(/{{meta_description}}/g, `The user @${username} was not found on VAPR.`);
}

// Helper functions
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

export {handleProfilePage};