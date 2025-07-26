import { followsCollection, postsCollection, usersCollection } from "../database.js";
import { sendMessageToDiscordWebhook } from "../discord.js";

export async function followPost(postId, followerId) {
    try {
        const post = await postsCollection.findOne({ id: postId }, { projection: { userId: 1 } });

        if (!post) {
            console.log("Post not found.");
            return new Response(JSON.stringify({ success: false, message: "Post not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const creatorId = post.userId;

        if (followerId === creatorId) {
            console.log("Cannot follow your own post.");
            return new Response(JSON.stringify({ success: false, message: "Cannot follow your own post" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const existingFollows = await followsCollection.find({ followerId, creatorId }).toArray();

        if (existingFollows.length > 0) {
            console.log("Already following this post.");
            return new Response(JSON.stringify({ success: false, message: "Already following this post" }), {
                status: 409,
                headers: { "Content-Type": "application/json" }
            });
        }

        const follow = await followsCollection.insertOne({
            postId,
            followerId,
            creatorId,
            timestamp: new Date()
        });

        const [follower, creator, followerCount] = await Promise.all([
            usersCollection.findOne({ id: followerId }, { projection: { username: 1, level: 1 } }),
            usersCollection.findOne({ id: creatorId }, { projection: { username: 1, level: 1 } }),
            followsCollection.countDocuments({ creatorId: creatorId })
        ]);

        const discordFollowWebhook = process.env.DISCORD_FOLLOW_WEBHOOK_URL;

        sendMessageToDiscordWebhook(
            discordFollowWebhook,
            ":incoming_envelope: **@" + follower.username + "**(lvl " + follower.level + ") is now following :arrow_right: **@" + creator.username + "**(lvl " + creator.level + "), followers: **" + followerCount + "**"
        );

        console.log("Followed post successfully.");
        return new Response(JSON.stringify({ success: true, follow }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error following post:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to follow post" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function unfollowPost(postId, followerId) {
    try {
        const post = await postsCollection.findOne({ id: postId }, { projection: { userId: 1 } });

        if (!post) {
            console.log("Post not found.");
            return new Response(JSON.stringify({ success: false, message: "Post not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const follow = await followsCollection.deleteOne({
            creatorId: post.userId,
            followerId
        });

        const [follower, creator, followerCount] = await Promise.all([
            usersCollection.findOne({ id: followerId }, { projection: { username: 1, level: 1 } }),
            usersCollection.findOne({ id: post.userId }, { projection: { username: 1, level: 1 } }),
            followsCollection.countDocuments({ creatorId: post.userId })
        ]);

        const discordFollowWebhook = process.env.DISCORD_FOLLOW_WEBHOOK_URL;
        sendMessageToDiscordWebhook(
            discordFollowWebhook,
            ":broken_heart: **@" + follower.username + "**(lvl " + follower.level + ") stopped following :arrow_right: **@" + creator.username + "**(lvl " + creator.level + "), followers: **" + followerCount + "**"
        );

        console.log("Unfollowed post successfully.");
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error unfollowing post:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to unfollow post" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function checkIfUserFollowsCreator(userId, creatorId) {
    try {
        const follows = await followsCollection.find({ followerId: userId, creatorId }).toArray();

        const isFollowing = follows.length > 0;

        return new Response(JSON.stringify({
            success: true,
            isFollowing: isFollowing,
            message: isFollowing ? "User follows the creator" : "User does not follow the creator"
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error checking if user follows creator:", error);
        return new Response(JSON.stringify({
            success: false,
            isFollowing: false,
            message: "Error checking follow status"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}