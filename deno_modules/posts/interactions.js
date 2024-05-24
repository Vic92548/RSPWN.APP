import { addXP, EXPERIENCE_TABLE } from "../rpg.js";
import { likesCollection, viewsCollection, dislikesCollection, linkClicksCollection, postsCollection, usersCollection } from "../database.js";

export async function likePost(postId, userData) {
    try {
        const existingLike = await likesCollection.findOne({ postId: postId, userId: userData.id });
        if (existingLike) {
            return new Response(JSON.stringify({ success: false, message: "User has already liked this post" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        await likesCollection.insertOne({
            postId: postId,
            userId: userData.id,
            timestamp: new Date()
        });

        await addXP(userData.id, EXPERIENCE_TABLE.LIKE);

        userData = await usersCollection.findOne({ id: userData.id });
    } catch {
        // Handle error if needed
    }

    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function viewPost(postId, userId) {
    console.log("Starting to record view for userId " + userId + " for post:" + postId);
    try {
        const viewData = {
            postId: postId,
            userId: userId === "anonymous" ? "anonymous_" + crypto.randomUUID() : userId,
            timestamp: new Date()
        };
        await viewsCollection.insertOne(viewData);
    } catch (error) {
        console.error(error);
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function dislikePost(postId, userData) {
    try {
        const existingDislike = await dislikesCollection.findOne({ postId: postId, userId: userData.id });
        if (existingDislike) {
            return new Response(JSON.stringify({ success: false, message: "User has already disliked this post" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        await dislikesCollection.insertOne({
            postId: postId,
            userId: userData.id,
            timestamp: new Date()
        });

        await addXP(userData.id, EXPERIENCE_TABLE.DISLIKE);

        userData = await usersCollection.findOne({ id: userData.id });
    } catch {
        // Handle error if needed
    }

    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function skipPost(postId, userData) {
    try {
        const existingSkip = await skipsCollection.findOne({ postId: postId, userId: userData.id });
        if (existingSkip) {
            return new Response(JSON.stringify({ success: false, message: "User has already skipped this post" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        await skipsCollection.insertOne({
            postId: postId,
            userId: userData.id,
            timestamp: new Date()
        });

        await addXP(userData.id, EXPERIENCE_TABLE.SKIP);

        userData = await usersCollection.findOne({ id: userData.id });
    } catch {
        // Handle error if needed
    }

    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function clickLink(postId, userId) {
    console.log("Starting to record link click for userId " + userId + " for post: " + postId);
    try {
        // Fetch the post to get the URL
        const post = await postsCollection.findOne({ id: postId });
        if (!post || !post.link) {
            throw new Error("Post not found or does not contain a link");
        }

        const clickData = {
            postId: postId,
            url: post.link,
            userId: userId === "anonymous" ? "anonymous_" + crypto.randomUUID() : userId,
            timestamp: new Date()
        };
        await linkClicksCollection.insertOne(clickData);
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
