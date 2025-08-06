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
import { usersCollection } from './server_modules/database.js';
import { handleProfilePage } from './server_modules/user_profile.js';
import { createRenderer } from './server_modules/template_engine.js';
import {
    createGameVersion,
    getGameVersions,
    checkForUpdates,
    markUpdateAsSeen,
    markUpdateAsDownloaded
} from './server_modules/game_updates.js';
import { uploadGameUpdate } from './server_modules/game_update_upload.js';

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

app.post('/api/games/:id/upload-update', authMiddleware, upload.single('file'), async (req, res) => {
    const gameId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ success: false, error: config.messages.errors.noFileUploaded });
    }

    if (req.file.mimetype !== 'application/zip' &&
        !req.file.originalname.toLowerCase().endsWith('.zip')) {
        return res.status(400).json({
            success: false,
            error: config.messages.errors.onlyZipAllowed
        });
    }

    const response = await uploadGameUpdate(gameId, req.userData.id, req.file);
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