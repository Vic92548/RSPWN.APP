import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
dotenv.config();

import cors from 'cors';
import serveStatic from 'serve-static';
import multer from 'multer';

import { handleOAuthCallback, redirectToDiscordLogin, authenticateRequest, updateBackgroundId } from './server_modules/auth.js';
import { startDylan } from './server_modules/discord_bot.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://ka-f.fontawesome.com",
                "https://kit.fontawesome.com"
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://kit.fontawesome.com",
                "https://ka-f.fontawesome.com",
                "https://cdn.jsdelivr.net",
                "https://cloud.umami.is",
                "https://eu-assets.i.posthog.com",
                "https://eu.i.posthog.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "blob:",
                "https://cdn.discordapp.com",
                "https://vapr-club.b-cdn.net",
                "https://vz-3641e40e-815.b-cdn.net"
            ],
            connectSrc: [
                "'self'",
                "https://api.github.com",
                "https://ka-f.fontawesome.com",
                "https://kit.fontawesome.com",
                "https://cloud.umami.is",
                "https://eu.i.posthog.com",
                "https://discord.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://kit.fontawesome.com",
                "https://ka-f.fontawesome.com"
            ],
            frameSrc: [
                "'self'",
                "https://iframe.mediadelivery.net"
            ],
            mediaSrc: [
                "'self'",
                "https://iframe.mediadelivery.net",
                "https://vz-3641e40e-815.b-cdn.net"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false
}));

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8080'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.'
});

const createPostLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Post creation limit reached. Please wait before creating more posts.'
});

app.use('/api/', generalLimiter);
app.use('/auth/', authLimiter);
app.use('/posts', createPostLimiter);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

const templates = createRenderer({
    baseDir: './src/components/',
    enableCache: true,
    includePattern: /\[\[(.+?)\]\]/g,
    variablePattern: /\{\{(.+?)\}\}/g,
});

async function authMiddleware(req, res, next) {
    const authResult = await authenticateRequest(req);
    if (!authResult.isValid) {
        return res.status(401).json({ error: 'Unauthorized' });
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
    try {
        const htmlContent = await templates.render('index.html', {
            meta_description: "Self promote your awesomeness",
            meta_author: "VAPR",
            meta_image: "https://vapr-club.b-cdn.net/posts/3bad19ce-9f1b-4abd-a718-3d701c3ca09a.png",
            meta_url: "https://vapr.club/"
        });
        res.status(200).type('html').send(htmlContent);
    } catch (error) {
        console.error('Template rendering error:', error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/login', authLimiter, async (req, res) => {
    const response = await redirectToDiscordLogin();
    const setCookieHeader = response.headers.get('set-cookie');

    if (setCookieHeader) {
        res.setHeader('Set-Cookie', setCookieHeader);
    }

    res.redirect(response.headers.get('location'));
});

app.get('/auth/discord/callback', authLimiter, async (req, res) => {
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
    res.json({ success: true });
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
    if (!backgroundId || !/^[a-zA-Z0-9_-]+$/.test(backgroundId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid backgroundId parameter"
        });
    }

    try {
        await updateBackgroundId(req.userData.id, backgroundId);
        res.json({
            success: true,
            message: "Background updated successfully"
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

app.post('/posts', authMiddleware, upload.single('file'), createPostLimiter, async (req, res) => {
    const expressReq = createExpressRequest(req);
    const response = await createPost(expressReq, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/posts/:id', async (req, res) => {
    if (!/^[a-f0-9-]{36}$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid post ID format' });
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
    if (!/^[a-f0-9-]{36}$/.test(req.params.id)) {
        return res.status(400).send("Invalid post ID");
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

    try {
        const htmlContent = await templates.render('index.html', {
            meta_description: post.title || "VAPR Post",
            meta_author: post.username || "VAPR User",
            meta_image: post.content || "https://vapr-club.b-cdn.net/default_vapr_avatar.png",
            meta_url: "https://vapr.club" + req.path
        });
        res.status(200).type('html').send(htmlContent);
    } catch (error) {
        console.error('Template rendering error:', error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/like/:id', authMiddleware, async (req, res) => {
    if (!/^[a-f0-9-]{36}$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid post ID format' });
    }

    const response = await likePost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/dislike/:id', authMiddleware, async (req, res) => {
    if (!/^[a-f0-9-]{36}$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid post ID format' });
    }

    const response = await dislikePost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/skip/:id', authMiddleware, async (req, res) => {
    if (!/^[a-f0-9-]{36}$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid post ID format' });
    }

    const response = await skipPost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/manage-follow', authMiddleware, async (req, res) => {
    const postId = req.query.postId;
    const action = req.query.action;

    if (!postId || (postId !== 'profile_follow' && !/^[a-f0-9-]{36}$/.test(postId))) {
        return res.status(400).json({
            success: false,
            message: "Invalid postId parameter"
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
            message: "Invalid action specified"
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

    if (!postId || !/^[a-f0-9-]{36}$/.test(postId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid postId parameter"
        });
    }

    const allowedEmojis = ['💩', '👀', '😂', '❤️', '💯', 'null'];
    if (!allowedEmojis.includes(emoji)) {
        return res.status(400).json({
            success: false,
            message: "Invalid emoji parameter"
        });
    }

    const response = await addReaction(postId, req.userData.id, emoji === 'null' ? null : emoji);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/get-reactions', async (req, res) => {
    const postId = req.query.postId;

    if (!postId || !/^[a-f0-9-]{36}$/.test(postId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid postId parameter"
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
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/register-view', async (req, res) => {
    const postId = req.query.postId;

    if (!postId || !/^[a-f0-9-]{36}$/.test(postId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid postId parameter"
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

    if (!postId || !/^[a-f0-9-]{36}$/.test(postId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid postId parameter"
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
            message: "Ambassador user ID is required"
        });
    }

    try {
        const acceptanceResult = await acceptInvitation(req.userData.id, ambassadorUserId);

        if (acceptanceResult.success) {
            res.json({
                success: true,
                message: "Invitation accepted successfully"
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

app.get('/@:username', async (req, res) => {
    const username = req.params.username;

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).send("Invalid username format");
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
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

try {
    await startDylan();
    console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
    app.listen(port);
} catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
}