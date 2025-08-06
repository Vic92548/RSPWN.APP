import { postsCollection, likesCollection, dislikesCollection, viewsCollection, usersCollection, gamesCollection } from "../database.js";

export async function getNextFeedPosts(userid) {
    let posts = [];

    if (userid === "anonymous") {
        posts = await postsCollection.find().sort({ timestamp: -1 }).limit(10).toArray();
    } else {
        const likes = await likesCollection.find({ userId: userid }).toArray();
        const dislikes = await dislikesCollection.find({ userId: userid }).toArray();
        const skips = await dislikesCollection.find({ userId: userid }).toArray();

        const interactedPostIds = [...likes, ...dislikes, ...skips].map(interaction => interaction.postId);

        posts = await postsCollection.find({ id: { $nin: interactedPostIds } }).sort({ timestamp: -1 }).limit(10).toArray();

        if (posts.length === 0) {
            posts = await postsCollection.aggregate([{ $sample: { size: 10 } }]).toArray();
        }
    }

    posts = await Promise.all(posts.map(async post => {
        const views = await viewsCollection.countDocuments({ postId: post.id });

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
            views: views,
            username: postOwner?.username || 'Unknown',
            userAvatar: postOwner?.avatar || null,
            userLevel: postOwner?.level || 0,
            taggedGame
        };
    }));

    console.log(posts);

    if (posts.length === 0) {
        return new Response("No new posts to display", { status: 404 });
    } else {
        return new Response(JSON.stringify(posts), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }
}