import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();

import cors from 'cors';
import serveStatic from 'serve-static';
import multer from 'multer';

import { config } from './server_modules/config.js';
import { setupSecurityMiddleware, rateLimiters, corsOptions } from './server_modules/security.js';
import { createRenderMiddleware } from './server_modules/middleware/render.js';
import { handleOAuthCallback, redirectToDiscordLogin, authenticateRequest, updateBackgroundId } from './server_modules/auth.js';
import { getVideoIdByPostId } from './server_modules/posts/video.js';
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
} from './server_modules/post.js';
import { xpTodayHandler } from './server_modules/routes/xp_today.js';
import { usersCollection, postsCollection, gamesCollection } from './server_modules/database.js';
import { handleProfilePage } from './server_modules/user_profile.js';
import { createRenderer } from './server_modules/template_engine.js';
import {
    createGameVersion,
    getGameVersions,
    checkForUpdates,
    markUpdateAsSeen,
    markUpdateAsDownloaded
} from './server_modules/game_updates.js';
import {
    applyForCreatorProgram,
    getCreatorApplicationStatus,
    getPendingApplications,
    approveCreatorApplication,
    rejectCreatorApplication,
    trackGameCreatorClick,
    getCreatorCodeForPurchase,
    getCreatorStats
} from './server_modules/creators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = config.server.port;

const templates = createRenderer(config.templates);

app.set('trust proxy', config.server.trustProxy);

setupSecurityMiddleware(app);

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: config.limits.json }));
app.use(express.urlencoded({ extended: true, limit: config.limits.urlencoded }));
app.use(createRenderMiddleware(templates));

app.use('/api/', rateLimiters.general);
app.use('/auth/', rateLimiters.auth);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: config.limits.fileSize,
        files: config.limits.maxFiles
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [...config.media.allowedImageTypes, ...config.media.allowedVideoTypes];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(config.messages.errors.invalidFileType), false);
        }
    }
});

async function authMiddleware(req, res, next) {
    const authResult = await authenticateRequest(req);
    if (!authResult.isValid) {
        return res.status(401).json({ error: config.messages.errors.unauthorized });
    }
    req.userData = authResult.userData;
    next();
}

function createExpressRequest(req) {
    return {
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        method: req.method,
        headers: req.headers,
        body: req.body,
        file: req.file,
        cookies: req.cookies
    };
}

app.get('/', async (req, res) => {
    await res.render('index.html', {
        meta_description: config.meta.default.description,
        meta_author: config.meta.default.author,
        meta_image: config.meta.default.image,
        meta_url: config.meta.default.url
    });
});

app.get('/checkout/success', async (req, res) => {
    await res.render('index.html', {
        meta_description: config.meta.default.description,
        meta_author: config.meta.default.author,
        meta_image: config.meta.default.image,
        meta_url: config.meta.default.url
    });
});

app.get('/checkout/cancel', async (req, res) => {
    await res.render('index.html', {
        meta_description: config.meta.default.description,
        meta_author: config.meta.default.author,
        meta_image: config.meta.default.image,
        meta_url: config.meta.default.url
    });
});

app.get('/login', rateLimiters.auth, async (req, res) => {
    const response = await redirectToDiscordLogin();
    const setCookieHeader = response.headers.get('set-cookie');

    if (setCookieHeader) {
        res.setHeader('Set-Cookie', setCookieHeader);
    }

    res.redirect(response.headers.get('location'));
});

app.get('/auth/discord/callback', rateLimiters.auth, async (req, res) => {
    const response = await handleOAuthCallback(createExpressRequest(req));
    const html = await response.text();
    const setCookieHeader = response.headers.get('set-cookie');

    if (setCookieHeader) {
        res.setHeader('Set-Cookie', setCookieHeader);
    }

    res.status(response.status).type('html').send(html);
});

app.post('/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'jwt=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
    res.json(config.messages.success.logoutSuccess);
});

app.get('/me', authMiddleware, async (req, res) => {
    const user = req.userData;
    if (!user.level) user.level = 0;
    if (!user.xp) user.xp = 0;
    if (!user.xp_required) user.xp_required = 700;
    res.json(user);
});

app.get('/me/posts', authMiddleware, async (req, res) => {
    const response = await getPostList(req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

// Fetch feed (authenticated if possible, otherwise anonymous)
app.get('/feed', rateLimiters.general, async (req, res) => {
    try {
        const authResult = await authenticateRequest(req);
        const userId = authResult?.isValid ? authResult.userData.id : 'anonymous';
        const response = await getNextFeedPosts(userId);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Error fetching feed:', err);
        res.status(500).json({ error: config.messages.errors.internalError });
    }
});

// Get all posts by a specific user
app.get('/api/user/:userId/posts', rateLimiters.general, async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await usersCollection.findOne({ id: userId }, { projection: { id: 1 } });
        if (!user) {
            return res.status(404).json({ error: config.messages.errors.userNotFound });
        }

        const response = await getPostList(userId);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('Error fetching user posts:', err);
        res.status(500).json({ error: config.messages.errors.internalError });
    }
});

// Resolve a post by URL or ID and return essential data
app.get('/api/post/resolve', rateLimiters.general, async (req, res) => {
    try {
        let { id, url } = req.query;

        if (!id && !url) {
            return res.status(400).json({ error: 'id or url required' });
        }

        if (!id && url) {
            try {
                const possible = String(url).match(/[a-f0-9-]{36}/i);
                if (possible && possible[0]) {
                    id = possible[0].toLowerCase();
                }
            } catch {}
        }

        if (!id || !config.validation.postId.test(id)) {
            return res.status(400).json({ error: config.messages.errors.invalidPostId });
        }

        const post = await getPostData(id);
        if (!post || post.userId === 'unknown') {
            return res.status(404).json({ error: config.messages.errors.postNotFound });
        }

        let media = post.content || null;
        let thumbnail = null;
        const mediaType = post.mediaType || 'image';

        if (typeof media === 'string' && media.includes('iframe.mediadelivery.net')) {
            try {
                const videoId = await getVideoIdByPostId(id);
                thumbnail = `https://vz-3641e40e-815.b-cdn.net/${videoId}/thumbnail.jpg`;
            } catch (error) {
                console.error('Error getting video thumbnail:', error);
            }
        }

        const payload = {
            id: post.id,
            title: post.title || '',
            media,
            mediaType,
            thumbnail,
            taggedGame: post.taggedGame || null
        };

        res.json(payload);
    } catch (err) {
        console.error('Error resolving post:', err);
        res.status(500).json({ error: config.messages.errors.internalError });
    }
});
app.get('/me/update-background', authMiddleware, async (req, res) => {
    const backgroundId = req.query.backgroundId;
    if (!backgroundId || !config.validation.backgroundId.test(backgroundId)) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidBackgroundId
        });
    }

    try {
        await updateBackgroundId(req.userData.id, backgroundId);
        res.json({
            success: true,
            message: config.messages.success.backgroundUpdated
        });
    } catch (error) {
        console.error('Error updating background:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update background"
        });
    }
});

app.get('/feed', async (req, res) => {
    const authResult = await authenticateRequest(req);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    const response = await getNextFeedPosts(userId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/posts', authMiddleware, upload.single('file'), rateLimiters.createPost, async (req, res) => {
    const expressReq = createExpressRequest(req);
    const response = await createPost(expressReq, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/posts/:id', rateLimiters.general, async (req, res) => {
    if (!config.validation.postId.test(req.params.id)) {
        return res.status(400).json({ error: config.messages.errors.invalidPostId });
    }

    const authResult = await authenticateRequest(req);

    if (authResult.isValid) {
        const response = await getPost(req.params.id, authResult.userData.id);
        const data = await response.json();
        res.status(response.status).json(data);
    } else {
        const response = await getPost(req.params.id);
        const data = await response.json();
        res.status(response.status).json(data);
    }
});

app.get('/post/:id', async (req, res) => {
    if (!config.validation.postId.test(req.params.id)) {
        return res.status(400).send(config.messages.errors.invalidPostId);
    }

    const id = req.params.id;
    const post = await getPostData(id);

    if (post.content && post.content.includes("iframe.mediadelivery.net")) {
        try {
            const video_id = await getVideoIdByPostId(id);
            post.content = "https://vz-3641e40e-815.b-cdn.net/" + video_id + "/thumbnail.jpg";
        } catch (error) {
            console.error('Error getting video thumbnail:', error);
        }
    }

    await res.render('index.html', {
        meta_description: post.title || "VAPR Post",
        meta_author: post.username || "VAPR User",
        meta_image: post.content || config.meta.default.defaultAvatar,
        meta_url: "https://vapr.club" + req.path
    });
});

// Server-side route for game details pages: /games/:gameName
app.get('/games/:gameName', async (req, res) => {
    try {
        const toSlug = (s) => String(s)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const slug = (req.params.gameName || '').toLowerCase();

        // Attempt to find by explicit slug field first if present
        let game = await gamesCollection.findOne({ slug });

        if (!game) {
            // Fallback: fetch minimal fields and match by slugified title
            const games = await gamesCollection
                .find({}, { projection: { id: 1, title: 1, description: 1, coverImage: 1 } })
                .toArray();
            game = games.find(g => toSlug(g.title) === slug) || null;
        }

        const baseUrl = (config.server?.baseUrl) || config.meta.default.url;

        if (game) {
            const cleanDesc = (game.description || '').replace(/<[^>]*>/g, '').trim();
            await res.render('index.html', {
                meta_description: cleanDesc || config.meta.default.description,
                meta_author: 'VAPR',
                meta_image: game.coverImage || config.meta.default.image,
                meta_url: baseUrl + req.path
            });
        } else {
            // If no match, render with defaults to allow client-side 404/handling
            await res.render('index.html', {
                meta_description: config.meta.default.description,
                meta_author: config.meta.default.author,
                meta_image: config.meta.default.image,
                meta_url: baseUrl + req.path
            });
        }
    } catch (err) {
        console.error('Error handling /games/:gameName:', err);
        await res.render('index.html', {
            meta_description: config.meta.default.description,
            meta_author: config.meta.default.author,
            meta_image: config.meta.default.image,
            meta_url: (config.server?.baseUrl || config.meta.default.url) + req.path
        });
    }
});

// Server-side route for creator program page: /creator-program
app.get('/creator-program', async (req, res) => {
    const baseUrl = (config.server?.baseUrl) || config.meta.default.url;
    await res.render('index.html', {
        meta_description: 'Join the VAPR Creator Program to earn rewards and grow your audience with game content.',
        meta_author: 'VAPR',
        meta_image: config.meta.default.image,
        meta_url: baseUrl + req.path
    });
});

// Server-side route for Terms of Service page: /terms
app.get('/terms', async (req, res) => {
    const baseUrl = (config.server?.baseUrl) || config.meta.default.url;
    await res.render('index.html', {
        meta_description: 'Read the VAPR Terms of Service to understand the rules and conditions for using our platform.',
        meta_author: 'VAPR',
        meta_image: config.meta.default.image,
        meta_url: baseUrl + req.path
    });
});

// Server-side route for Privacy Policy page: /privacy
app.get('/privacy', async (req, res) => {
    const baseUrl = (config.server?.baseUrl) || config.meta.default.url;
    await res.render('index.html', {
        meta_description: 'Learn how VAPR collects, uses, and protects your data in our Privacy Policy.',
        meta_author: 'VAPR',
        meta_image: config.meta.default.image,
        meta_url: baseUrl + req.path
    });
});

app.get('/like/:id', authMiddleware, async (req, res) => {
    if (!config.validation.postId.test(req.params.id)) {
        return res.status(400).json({ error: config.messages.errors.invalidPostId });
    }

    const response = await likePost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/dislike/:id', authMiddleware, async (req, res) => {
    if (!config.validation.postId.test(req.params.id)) {
        return res.status(400).json({ error: config.messages.errors.invalidPostId });
    }

    const response = await dislikePost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/skip/:id', authMiddleware, async (req, res) => {
    if (!config.validation.postId.test(req.params.id)) {
        return res.status(400).json({ error: config.messages.errors.invalidPostId });
    }

    const response = await skipPost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/manage-follow', authMiddleware, async (req, res) => {
    const postId = req.query.postId;
    const action = req.query.action;

    if (!postId || (postId !== 'profile_follow' && !config.validation.postId.test(postId))) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidPostIdParam
        });
    }

    let response;
    if (action === 'follow') {
        response = await followPost(postId, req.userData.id);
    } else if (action === 'unfollow') {
        response = await unfollowPost(postId, req.userData.id);
    } else {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidAction
        });
    }

    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/check-follow/:creatorId', authMiddleware, async (req, res) => {
    const response = await checkIfUserFollowsCreator(req.userData.id, req.params.creatorId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/add-reaction', authMiddleware, async (req, res) => {
    const postId = req.query.postId;
    const emoji = req.query.emoji;

    if (!postId || !config.validation.postId.test(postId)) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidPostIdParam
        });
    }

    if (!config.reactions.allowedEmojis.includes(emoji)) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidEmoji
        });
    }

    const response = await addReaction(postId, req.userData.id, emoji === 'null' ? null : emoji);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/get-reactions', async (req, res) => {
    const postId = req.query.postId;

    if (!postId || !config.validation.postId.test(postId)) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidPostIdParam
        });
    }

    const response = await getReactionsByPostId(postId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await usersCollection.findOne(
            { id: userId },
            { projection: { username: 1, avatar: 1, id: 1, level: 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: config.messages.errors.userNotFound });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: config.messages.errors.internalError });
    }
});

app.get('/register-view', async (req, res) => {
    const postId = req.query.postId;

    if (!postId || !config.validation.postId.test(postId)) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidPostIdParam
        });
    }

    const authResult = await authenticateRequest(req);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    const response = await viewPost(postId, userId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/click-link', async (req, res) => {
    const postId = req.query.postId;

    if (!postId || !config.validation.postId.test(postId)) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.invalidPostIdParam
        });
    }

    const authResult = await authenticateRequest(req);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    const response = await clickLink(postId, userId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/accept-invitation', authMiddleware, async (req, res) => {
    const ambassadorUserId = req.query.ambassadorUserId;

    if (!ambassadorUserId) {
        return res.status(400).json({
            success: false,
            message: config.messages.errors.ambassadorRequired
        });
    }

    try {
        const acceptanceResult = await acceptInvitation(req.userData.id, ambassadorUserId);

        if (acceptanceResult.success) {
            res.json({
                success: true,
                message: config.messages.success.invitationAccepted
            });
        } else {
            res.status(400).json({
                success: false,
                message: acceptanceResult.message || "Failed to accept invitation"
            });
        }
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({
            success: false,
            message: "Error processing your request"
        });
    }
});

app.get('/api/xp-today', authMiddleware, async (req, res) => {
    const response = await xpTodayHandler(createExpressRequest(req));
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/user-count', async (req, res) => {
    const count = await usersCollection.countDocuments();
    res.json({ count });
});

app.get('/api/analytics', authMiddleware, async (req, res) => {
    const { analyticsHandler } = await import("./server_modules/routes/analytics.js");
    const response = await analyticsHandler(createExpressRequest(req), { isValid: true, userData: req.userData });
    const data = await response.json();
    res.status(response.status).json(data);
});

import {
    getAllGames,
    getUserGames,
    redeemGameKey,
    generateGameKeys,
    getGameKeys,
    getGameDownloadUrl, downloadKeysAsCSV
} from './server_modules/games.js';
import { recordPlaytimeSession, getUserPlaytimeTotals } from './server_modules/playtime.js';

app.get('/api/games', async (req, res) => {
    const response = await getAllGames();
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/my-games', authMiddleware, async (req, res) => {
    const response = await getUserGames(req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

// Playtime APIs
app.post('/api/playtime/session', authMiddleware, async (req, res) => {
    const response = await recordPlaytimeSession(req.userData.id, req.body || {});
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/playtime/totals', authMiddleware, async (req, res) => {
    const response = await getUserPlaytimeTotals(req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/games/redeem-key', authMiddleware, async (req, res) => {
    const { key } = req.body;
    if (!key) {
        return res.status(400).json({ success: false, error: config.messages.errors.keyRequired });
    }
    const response = await redeemGameKey(req.userData.id, key);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/games/:id/generate-keys', authMiddleware, async (req, res) => {
    const gameId = req.params.id;
    const count = parseInt(req.body.count) || 5;
    const tag = req.body.tag || null;
    const response = await generateGameKeys(gameId, req.userData.id, count, tag);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/games/:id/keys/download', authMiddleware, async (req, res) => {
    const gameId = req.params.id;
    const tag = req.query.tag || null;
    const response = await downloadKeysAsCSV(gameId, req.userData.id, tag);

    if (response.headers.get('Content-Type') === 'text/csv') {
        const csv = await response.text();
        res.set({
            'Content-Type': response.headers.get('Content-Type'),
            'Content-Disposition': response.headers.get('Content-Disposition')
        });
        res.send(csv);
    } else {
        const data = await response.json();
        res.status(response.status).json(data);
    }
});

app.get('/api/games/:id/keys', authMiddleware, async (req, res) => {
    const gameId = req.params.id;
    const response = await getGameKeys(gameId, req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/games/:id/download', authMiddleware, async (req, res) => {
    const gameId = req.params.id;
    const response = await getGameDownloadUrl(gameId, req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/games/:id/versions', authMiddleware, async (req, res) => {
    const gameId = req.params.id;
    const versionData = req.body;

    const response = await createGameVersion(gameId, req.userData.id, versionData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/games/:id/versions', async (req, res) => {
    const gameId = req.params.id;
    const response = await getGameVersions(gameId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/updates/check', authMiddleware, async (req, res) => {
    const response = await checkForUpdates(req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/updates/:gameId/seen', authMiddleware, async (req, res) => {
    const response = await markUpdateAsSeen(req.userData.id, req.params.gameId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/updates/:gameId/downloaded', authMiddleware, async (req, res) => {
    const { version } = req.body;
    const response = await markUpdateAsDownloaded(req.userData.id, req.params.gameId, version);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/creators/apply', authMiddleware, async (req, res) => {
    const { tebexWalletId } = req.body;
    const response = await applyForCreatorProgram(req.userData.id, tebexWalletId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/creators/status', authMiddleware, async (req, res) => {
    const response = await getCreatorApplicationStatus(req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/creators/stats', authMiddleware, async (req, res) => {
    const response = await getCreatorStats(req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/admin/creator-applications', authMiddleware, async (req, res) => {
    const response = await getPendingApplications(req.userData.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/admin/creator-applications/:id/approve', authMiddleware, async (req, res) => {
    const response = await approveCreatorApplication(req.userData.id, req.params.id);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/admin/creator-applications/:id/reject', authMiddleware, async (req, res) => {
    const { reason } = req.body;
    const response = await rejectCreatorApplication(req.userData.id, req.params.id, reason);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.post('/api/creators/track-game-click', async (req, res) => {
    const { gameId, postId } = req.body;

    const authResult = await authenticateRequest(req);
    const userId = authResult.isValid ? authResult.userData.id : 'anonymous_' + crypto.randomUUID();

    const response = await trackGameCreatorClick(userId, gameId, postId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/creators/code-for-purchase/:gameId', async (req, res) => {
    const authResult = await authenticateRequest(req);
    const userId = authResult.isValid ? authResult.userData.id : 'anonymous';

    const response = await getCreatorCodeForPurchase(userId, req.params.gameId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/@:username', async (req, res) => {
    const username = req.params.username;

    if (!config.validation.username.test(username)) {
        return res.status(400).send(config.messages.errors.invalidUsername);
    }

    const expressReq = createExpressRequest(req);
    const profileResponse = await handleProfilePage(expressReq, templates);

    if (profileResponse) {
        const html = await profileResponse.text();
        res.status(profileResponse.status).type('html').send(html);
    } else {
        res.status(404).send("Profile not found");
    }
});

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');
const escapeXml = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = normalizeBaseUrl(config.server.baseUrl);
        const now = new Date().toISOString();

        const staticUrls = [
            { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: now },
            { loc: `${baseUrl}/checkout/success`, changefreq: 'monthly', priority: '0.4', lastmod: now },
            { loc: `${baseUrl}/checkout/cancel`, changefreq: 'monthly', priority: '0.4', lastmod: now },
            { loc: `${baseUrl}/login`, changefreq: 'monthly', priority: '0.3', lastmod: now },
            { loc: `${baseUrl}/terms`, changefreq: 'yearly', priority: '0.2', lastmod: now },
            { loc: `${baseUrl}/privacy`, changefreq: 'yearly', priority: '0.2', lastmod: now },
        ];

        const [posts, users] = await Promise.all([
            postsCollection
                .find({}, { projection: { id: 1, timestamp: 1 } })
                .sort({ timestamp: -1 })
                .toArray(),
            usersCollection
                .find({ username: { $exists: true, $ne: null } }, { projection: { username: 1, updatedAt: 1, lastActiveAt: 1 } })
                .sort({ username: 1 })
                .toArray(),
        ]);

        const parts = [];
        parts.push('<?xml version="1.0" encoding="UTF-8"?>');
        parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

        for (const u of staticUrls) {
            parts.push('  <url>');
            parts.push(`    <loc>${escapeXml(u.loc)}</loc>`);
            if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
            if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
            if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
            parts.push('  </url>');
        }

        for (const p of posts) {
            const lastmod = p.timestamp ? new Date(p.timestamp).toISOString() : now;
            parts.push('  <url>');
            parts.push(`    <loc>${baseUrl}/post/${escapeXml(p.id)}</loc>`);
            parts.push(`    <lastmod>${lastmod}</lastmod>`);
            parts.push('    <changefreq>weekly</changefreq>');
            parts.push('    <priority>0.8</priority>');
            parts.push('  </url>');
        }

        for (const u of users) {
            const lastmodDate = u.updatedAt || u.lastActiveAt || null;
            const lastmod = lastmodDate ? new Date(lastmodDate).toISOString() : now;
            parts.push('  <url>');
            parts.push(`    <loc>${baseUrl}/@${escapeXml(u.username)}</loc>`);
            parts.push(`    <lastmod>${lastmod}</lastmod>`);
            parts.push('    <changefreq>weekly</changefreq>');
            parts.push('    <priority>0.6</priority>');
            parts.push('  </url>');
        }

        parts.push('</urlset>');
        res.type('application/xml').send(parts.join('\n'));
    } catch (err) {
        console.error('Error generating sitemap:', err);
        res.status(500).send('Internal Server Error');
    }
});



app.use(serveStatic(join(__dirname, 'public'), {
    maxAge: config.static.maxAge,
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', config.static.cacheControl);
        res.setHeader('Pragma', config.static.pragma);
        res.setHeader('Expires', config.static.expires);
        res.setHeader('Surrogate-Control', config.static.surrogateControl);

        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: config.messages.errors.somethingWrong });
});

try {
    console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
    app.listen(port);
} catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
}