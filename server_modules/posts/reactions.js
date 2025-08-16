import { reactionsCollection } from "../database.js";

export async function addReaction(postId, userId, emoji) {
    try {
        await reactionsCollection.deleteMany({
            postId: postId,
            userId: userId
        });

        const reaction = await reactionsCollection.insertOne({
            postId,
            userId,
            timestamp: new Date(),
            emoji
        });
        return new Response(JSON.stringify({ success: true, reaction }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Failed to add reaction:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to add reaction" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getReactionsByPostId(postId) {
    try {
        const reactions = await reactionsCollection.find({ postId }).toArray();
        return new Response(JSON.stringify({ success: true, reactions }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Failed to retrieve reactions:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to retrieve reactions" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}