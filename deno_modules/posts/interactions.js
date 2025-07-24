import { addXP, EXPERIENCE_TABLE } from "../rpg.js";
import { likesCollection, viewsCollection, dislikesCollection, skipsCollection, linkClicksCollection, postsCollection, usersCollection } from "../database.js";

async function hasUserInteracted(postId, userId) {
    const existingLike = await likesCollection.findOne({ postId, userId });
    const existingDislike = await dislikesCollection.findOne({ postId, userId });
    const existingSkip = await skipsCollection.findOne({ postId, userId });

    return existingLike || existingDislike || existingSkip;
}

export async function likePost(postId, userData) {
    try {
        if (await hasUserInteracted(postId, userData.id)) {
            return new Response(JSON.stringify({ success: true,user: userData }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        await likesCollection.insertOne({
            postId,
            userId: userData.id,
            timestamp: new Date()
        });

        await addXP(userData.id, EXPERIENCE_TABLE.LIKE);

        userData = await usersCollection.findOne({ id: userData.id });
    } catch (error) {
        console.error(error);
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
            postId,
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
        if (await hasUserInteracted(postId, userData.id)) {
            return new Response(JSON.stringify({ success: true, user: userData }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        await dislikesCollection.insertOne({
            postId,
            userId: userData.id,
            timestamp: new Date()
        });

        await addXP(userData.id, EXPERIENCE_TABLE.DISLIKE);

        userData = await usersCollection.findOne({ id: userData.id });
    } catch (error) {
        console.error(error);
    }

    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function skipPost(postId, userData) {
    try {
        if (await hasUserInteracted(postId, userData.id)) {
            return new Response(JSON.stringify({ success: true, user: userData }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        await skipsCollection.insertOne({
            postId,
            userId: userData.id,
            timestamp: new Date()
        });

        await addXP(userData.id, EXPERIENCE_TABLE.SKIP);

        userData = await usersCollection.findOne({ id: userData.id });
    } catch (error) {
        console.error(error);
    }

    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function clickLink(postId, userId) {
    console.log("Starting to record link click for userId " + userId + " for post: " + postId);
    try {
        const post = await postsCollection.findOne({ id: postId });
        if (!post || !post.link) {
            throw new Error("Post not found or does not contain a link");
        }

        const clickData = {
            postId,
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