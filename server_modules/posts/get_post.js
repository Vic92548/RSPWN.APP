import { postsCollection, viewsCollection, usersCollection, likesCollection, dislikesCollection, followsCollection, linkClicksCollection, gamesCollection } from "../database.js";

export async function getPostData(id) {
    const post = await postsCollection.findOne({ id });

    if (!post) {
        return { title: "not found", content: "", userId: "unknown" };
    }

    const postOwner = await usersCollection.findOne(
        { id: post.userId },
        {
            projection: {
                id: 1,
                username: 1,
                avatar: 1,
                level: 1
            }
        }
    );

    post.username = postOwner?.username || 'Unknown';
    post.userAvatar = postOwner?.avatar || null;
    post.userLevel = postOwner?.level || 0;

    if (post.taggedGameId) {
        const taggedGame = await gamesCollection.findOne({ id: post.taggedGameId });
        if (taggedGame) {
            post.taggedGame = {
                id: taggedGame.id,
                title: taggedGame.title,
                coverImage: taggedGame.coverImage
            };
        }
    }

    return post;
}

export async function getPost(id, userId = "anonymous") {
    const post = await postsCollection.findOne({ id });

    if (!post) {
        return new Response("Post not found", { status: 404 });
    }

    try {
        await viewsCollection.insertOne({
            postId: id,
            userId: userId,
            timestamp: new Date()
        });
    } catch {
    }

    post.views = await viewsCollection.countDocuments({ postId: post.id });

    const postOwner = await usersCollection.findOne(
        { id: post.userId },
        {
            projection: {
                id: 1,
                username: 1,
                avatar: 1,
                level: 1
            }
        }
    );

    post.username = postOwner?.username || 'Unknown';
    post.userAvatar = postOwner?.avatar || null;
    post.userLevel = postOwner?.level || 0;

    if (post.taggedGameId) {
        const taggedGame = await gamesCollection.findOne({ id: post.taggedGameId });
        if (taggedGame) {
            post.taggedGame = {
                id: taggedGame.id,
                title: taggedGame.title,
                coverImage: taggedGame.coverImage
            };
        }
    }

    return new Response(JSON.stringify(post), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPostList(userId) {
    const posts = await postsCollection.find({ userId }).sort({ timestamp: -1 }).toArray();

    if (!posts.length) {
        return new Response("No posts found", { status: 404 });
    }

    const postsWithCounts = await Promise.all(posts.map(async post => {
        const viewsCount = await viewsCollection.countDocuments({ postId: post.id });
        const likesCount = await likesCollection.countDocuments({ postId: post.id });
        const dislikesCount = await dislikesCollection.countDocuments({ postId: post.id });
        const followersCount = await followsCollection.countDocuments({ postId: post.id });
        const linkClicksCount = await linkClicksCollection.countDocuments({ postId: post.id });

        let taggedGame = null;
        if (post.taggedGameId) {
            const game = await gamesCollection.findOne({ id: post.taggedGameId });
            if (game) {
                taggedGame = {
                    id: game.id,
                    title: game.title,
                    coverImage: game.coverImage
                };
            }
        }

        return {
            ...post,
            viewsCount,
            likesCount,
            dislikesCount,
            followersCount,
            linkClicksCount,
            taggedGame
        };
    }));

    return new Response(JSON.stringify(postsWithCounts), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}