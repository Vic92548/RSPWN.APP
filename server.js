// server.js
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleOAuthCallback, redirectToDiscordLogin, authenticateRequest, updateBackgroundId } from "./deno_modules/auth.js";
import { startDylan } from "./deno_modules/discord_bot.js";
import { getVideoIdByPostId } from "./deno_modules/posts/video.js";
import {
    createPost,
    getPost,
    getNextFeedPosts,
    likePost,
    dislikePost,
    skipPost,
    getPostList,
    getPostData,
    followPost,
    unfollowPost,
    checkIfUserFollowsCreator,
    addReaction,
    getReactionsByPostId,
    viewPost,
    acceptInvitation,
    clickLink
} from "./deno_modules/post.js";
import { xpTodayHandler } from "./deno_modules/routes/xp_today.js";
import { leaderboardHandler } from "./deno_modules/routes/leaderboard.js";
import { usersCollection } from "./deno_modules/database.js";
import { handleProfilePage } from "./deno_modules/user_profile.js";
import { createRenderer } from "./deno_modules/template_engine.js";
import { FastRouter } from "./deno_modules/router.js";

import {
    createFeed,
    joinFeed,
    leaveFeed,
    getUserFeeds,
    getPublicFeeds,
    getFeedDetails,
    getUserFeedPosts,
    searchFeeds
} from "./deno_modules/feeds/feed_manager.js";

const port = 8080;

// Initialize the template engine
const templates = createRenderer({
    baseDir: './src/components/',
    enableCache: true,
    includePattern: /\[\[(.+?)\]\]/g,
    variablePattern: /\{\{(.+?)\}\}/g,
});

// Initialize router
const router = new FastRouter();

// Register routes

// Home page
router.get('/', async (request, url) => {
    try {
        const htmlContent = await templates.render('index.html', {
            meta_description: "Self promote your awesomeness",
            meta_author: "VAPR",
            meta_image: "https://vapr-club.b-cdn.net/posts/3bad19ce-9f1b-4abd-a718-3d701c3ca09a.png",
            meta_url: "https://vapr.club/"
        });

        return new Response(htmlContent, {
            status: 200,
            headers: { "Content-Type": "text/html" }
        });
    } catch (error) {
        console.error('Template rendering error:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
});

// Auth routes
router.get('/login', async () => redirectToDiscordLogin());
router.get('/auth/discord/callback', async (request) => handleOAuthCallback(request));

// User routes
router.get('/me', async (request, url, authResult) => {
    console.log(authResult);
    const user = authResult.userData;

    if (!user.level) user.level = 0;
    if (!user.xp) user.xp = 0;
    if (!user.xp_required) user.xp_required = 700;

    return new Response(JSON.stringify(user), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}, { requireAuth: true, prefix: true });

router.get('/me/posts', async (request, url, authResult) => {
    console.log(authResult);
    return getPostList(authResult.userData.id);
}, { requireAuth: true });

router.get('/me/update-background', async (request, url, authResult) => {
    const backgroundId = url.searchParams.get('backgroundId');
    if (!backgroundId) {
        return new Response(JSON.stringify({
            success: false,
            message: "backgroundId parameter is required"
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        await updateBackgroundId(authResult.userData.id, backgroundId);
        return new Response(JSON.stringify({
            success: true,
            message: "Background updated successfully"
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error updating background:', error);
        return new Response(JSON.stringify({
            success: false,
            message: "Failed to update background"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}, { requireAuth: true });

// Feed route
router.get('/feed', async (request, url) => {
    const authResult = await authenticateRequest(request);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    return getNextFeedPosts(userId);
}, { prefix: true });

// Post routes
router.post('/posts', async (request, url, authResult) => {
    return createPost(request, authResult.userData);
}, { requireAuth: true });

router.get('/posts/', async (request, url) => {
    const id = url.pathname.split('/')[2];
    const authResult = await authenticateRequest(request);

    console.log(authResult);

    if (authResult.isValid) {
        return getPost(id, authResult.userData.id);
    }
    return getPost(id);
}, { prefix: true });

router.get('/post/', async (request, url) => {
    const id = url.pathname.split('/')[2];
    const post = await getPostData(id);

    if (post.content.includes("iframe.mediadelivery.net")) {
        const video_id = await getVideoIdByPostId(id);
        post.content = "https://vz-3641e40e-815.b-cdn.net/" + video_id + "/thumbnail.jpg";
    }

    try {
        const htmlContent = await templates.render('index.html', {
            meta_description: post.title,
            meta_author: post.username,
            meta_image: post.content,
            meta_url: "https://vapr.club" + url.pathname
        });

        return new Response(htmlContent, {
            status: 200,
            headers: { "Content-Type": "text/html" }
        });
    } catch (error) {
        console.error('Template rendering error:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
}, { prefix: true });

// Post interaction routes
router.get('/like/', async (request, url, authResult) => {
    const id = url.pathname.split('/')[2];
    return likePost(id, authResult.userData);
}, { prefix: true, requireAuth: true });

router.get('/dislike/', async (request, url, authResult) => {
    const id = url.pathname.split('/')[2];
    return dislikePost(id, authResult.userData);
}, { prefix: true, requireAuth: true });

router.get('/skip/', async (request, url, authResult) => {
    const id = url.pathname.split('/')[2];
    return skipPost(id, authResult.userData);
}, { prefix: true, requireAuth: true });

// Follow management
router.get('/manage-follow', async (request, url, authResult) => {
    const postId = url.searchParams.get('postId');
    const action = url.searchParams.get('action');

    if (action === 'follow') {
        return followPost(postId, authResult.userData.id);
    } else if (action === 'unfollow') {
        return unfollowPost(postId, authResult.userData.id);
    } else {
        return new Response(JSON.stringify({
            success: false,
            message: "Invalid action specified"
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
}, { requireAuth: true });

router.get('/check-follow/', async (request, url, authResult) => {
    const creatorId = url.pathname.split('/')[2];
    return checkIfUserFollowsCreator(authResult.userData.id, creatorId);
}, { prefix: true, requireAuth: true });

// Reaction routes
router.get('/add-reaction', async (request, url, authResult) => {
    const postId = url.searchParams.get('postId');
    const emoji = url.searchParams.get('emoji');
    return addReaction(postId, authResult.userData.id, emoji);
}, { requireAuth: true });

router.get('/get-reactions', async (request, url) => {
    const postId = url.searchParams.get('postId');
    return getReactionsByPostId(postId);
});

router.get('/api/user/:userId', async (request, url) => {
    const userId = url.pathname.split('/')[3];

    try {
        const user = await usersCollection.findOne(
            { id: userId },
            { projection: { username: 1, avatar: 1, id: 1 } }
        );

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify(user), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});

// View and click tracking
router.get('/register-view', async (request, url) => {
    const postId = url.searchParams.get('postId');
    const authResult = await authenticateRequest(request);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    return viewPost(postId, userId);
});

router.get('/click-link', async (request, url) => {
    const postId = url.searchParams.get('postId');
    const authResult = await authenticateRequest(request);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    return clickLink(postId, userId);
});

// Invitation route
router.get('/accept-invitation', async (request, url, authResult) => {
    const ambassadorUserId = url.searchParams.get('ambassadorUserId');

    try {
        const acceptanceResult = await acceptInvitation(authResult.userData.id, ambassadorUserId);

        if (acceptanceResult.success) {
            return new Response(JSON.stringify({
                success: true,
                message: "Invitation accepted successfully"
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({
                success: false,
                message: "Failed to accept invitation"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return new Response(JSON.stringify({
            success: false,
            message: "Error processing your request"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}, { requireAuth: true });

// API routes
router.get('/api/xp-today', async (request) => xpTodayHandler(request));
router.get('/api/leaderboard', async (request) => leaderboardHandler(request));
router.get('/api/user-count', async () => {
    const count = await usersCollection.countDocuments();
    return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
});

router.get('/api/analytics', async (request, url, authResult) => {
    const { analyticsHandler } = await import("./deno_modules/routes/analytics.js");
    return analyticsHandler(request, authResult);
}, { requireAuth: true });

router.post('/feeds', async (request, url, authResult) => {
    const body = await request.json();
    return createFeed(authResult.userData.id, body);
}, { requireAuth: true });

router.get('/feeds/mine', async (request, url, authResult) => {
    return getUserFeeds(authResult.userData.id);
}, { requireAuth: true });

router.get('/feeds/public', async (request, url) => {
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    return getPublicFeeds(limit, offset);
}, { requireAuth: false });

router.get('/feeds/search', async (request, url) => {
    const query = url.searchParams.get('q');
    const isPrivate = url.searchParams.get('private');
    return searchFeeds(query, isPrivate ? isPrivate === 'true' : null);
}, { requireAuth: false });

router.get('/feeds/:feedId', async (request, url) => {
    const feedId = url.pathname.split('/')[2];
    const authResult = await authenticateRequest(request);
    const userId = authResult.isValid ? authResult.userData.id : null;
    return getFeedDetails(feedId, userId);
}, { prefix: true });

router.post('/feeds/:feedId/join', async (request, url, authResult) => {
    const feedId = url.pathname.split('/')[2];
    return joinFeed(authResult.userData.id, feedId);
}, { prefix: true, requireAuth: true });

router.post('/feeds/:feedId/leave', async (request, url, authResult) => {
    const feedId = url.pathname.split('/')[2];
    return leaveFeed(authResult.userData.id, feedId);
}, { prefix: true, requireAuth: true });

// Update the main feed route to use the new feed system
router.get('/feed', async (request, url) => {
    const authResult = await authenticateRequest(request);

    if (authResult.isValid) {
        // Get posts from user's joined feeds
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        return getUserFeedPosts(authResult.userData.id, limit, offset);
    } else {
        // For anonymous users, show posts from popular public feeds
        return getNextFeedPosts("anonymous");
    }
}, { prefix: true });

// Profile pages (must be last due to catch-all nature)
router.get('/@', async (request, url) => {
    const profileResponse = await handleProfilePage(request, templates);
    if (profileResponse) {
        return profileResponse;
    }
}, { prefix: true });

// Main request handler
async function handleRequest(request) {
    // Try router first - pass authenticateRequest function
    const response = await router.handle(request, authenticateRequest);

    if (response) {
        return response;
    }

    // Fall back to static file serving
    try {
        const url = new URL(request.url);
        const filePath = `./public${url.pathname}`;
        return await serveFile(request, filePath);
    } catch (error) {
        console.error(error);
        return new Response("Not Found", { status: 404 });
    }
}

try {
    startDylan();
    console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
    console.log(`Router initialized with ${Object.keys(router.routes.GET).length} GET routes`);
    Deno.serve({ port }, handleRequest);
} catch (err) {
    console.error('Fatal startup error:', err);
    Deno.exit(1);
}