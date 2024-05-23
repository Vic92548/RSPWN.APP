import { addXP, EXPERIENCE_TABLE } from "../rpg.js";
import { likesCollection, viewsCollection, dislikesCollection, usersCollection } from "../database.js";

export async function likePost(postId, userData) {
    try {
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
    console.log("Starting to record view for userId" + userId + " for post:" + postId);
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
        await likesCollection.insertOne({
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
