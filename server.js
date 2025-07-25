import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
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
        file: req.file
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

app.get('/login', async (req, res) => {
    const response = await redirectToDiscordLogin();
    res.redirect(response.headers.get('location'));
});

app.get('/auth/discord/callback', async (req, res) => {
    const response = await handleOAuthCallback(createExpressRequest(req));
    const html = await response.text();
    res.status(response.status).type('html').send(html);
});

app.get('/me', authMiddleware, async (req, res) => {
    console.log(req.userData);
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
    if (!backgroundId) {
        return res.status(400).json({
            success: false,
            message: "backgroundId parameter is required"
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

app.post('/posts', authMiddleware, upload.single('file'), async (req, res) => {
    const expressReq = createExpressRequest(req);
    const response = await createPost(expressReq, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/posts/:id', async (req, res) => {
    const authResult = await authenticateRequest(req);
    console.log(authResult);

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
    const id = req.params.id;
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
            meta_url: "https://vapr.club" + req.path
        });
        res.status(200).type('html').send(htmlContent);
    } catch (error) {
        console.error('Template rendering error:', error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/like/:id', authMiddleware, async (req, res) => {
    const response = await likePost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/dislike/:id', authMiddleware, async (req, res) => {
    const response = await dislikePost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/skip/:id', authMiddleware, async (req, res) => {
    const response = await skipPost(req.params.id, req.userData);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/manage-follow', authMiddleware, async (req, res) => {
    const postId = req.query.postId;
    const action = req.query.action;

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
    const response = await addReaction(postId, req.userData.id, emoji);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/get-reactions', async (req, res) => {
    const postId = req.query.postId;
    const response = await getReactionsByPostId(postId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/api/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await usersCollection.findOne(
            { id: userId },
            { projection: { username: 1, avatar: 1, id: 1 } }
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
    const authResult = await authenticateRequest(req);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    const response = await viewPost(postId, userId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/click-link', async (req, res) => {
    const postId = req.query.postId;
    const authResult = await authenticateRequest(req);
    const userId = authResult.isValid ? authResult.userData.id : "anonymous";
    const response = await clickLink(postId, userId);
    const data = await response.json();
    res.status(response.status).json(data);
});

app.get('/accept-invitation', authMiddleware, async (req, res) => {
    const ambassadorUserId = req.query.ambassadorUserId;

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
                message: "Failed to accept invitation"
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

app.get('/api/xp-today', async (req, res) => {
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
    const expressReq = createExpressRequest(req);
    const profileResponse = await handleProfilePage(expressReq, templates);
    if (profileResponse) {
        const html = await profileResponse.text();
        res.status(profileResponse.status).type('html').send(html);
    } else {
        res.status(404).send("Profile not found");
    }
});

app.use(serveStatic(join(__dirname, 'public')));

try {
    await startDylan();
    console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
    app.listen(port);
} catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
}