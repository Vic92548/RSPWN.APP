import { MongoClient } from "https://deno.land/x/mongo@v0.28.0/mod.ts";
import { addXP, EXPERIENCE_TABLE } from "./rpg.js";
import { sendMessageToDiscordWebhook } from "./discord.js";
import { sendPrivateMessage } from "./discord_bot.js";

const databaseUrl = Deno.env.get("DATABASE_URL");

const client = new MongoClient();
await client.connect(databaseUrl);
const db = client.database("vapr");

const postsCollection = db.collection("posts");
const usersCollection = db.collection("users");
const viewsCollection = db.collection("views");
const likesCollection = db.collection("likes");
const dislikesCollection = db.collection("dislikes");
const followsCollection = db.collection("follows");
const reactionsCollection = db.collection("reactions");
const registrationReferralsCollection = db.collection("registrationReferrals");

export async function createPost(request, userData) {
    if (!request.headers.get("Content-Type")?.includes("multipart/form-data")) {
        return new Response("Invalid content type", { status: 400 });
    }

    const formData = await request.formData();
    const title = formData.get("title");
    const link = formData.get("link");
    const file = formData.get("file");

    let content = "";

    if (typeof title !== "string" || typeof userData.id !== "string") {
        return new Response("Missing or invalid fields", { status: 400 });
    }

    const postId = crypto.randomUUID();
    let fileExtension = "";
    if (file) {
        const parts = file.name.split('.');
        fileExtension = parts.length > 1 ? parts.pop() : "";
        const mediaResult = file ? await uploadToBunnyCDN(file, postId) : null;
        if (mediaResult.success) {
            content = "https://vapr.b-cdn.net/posts/" + postId + "." + fileExtension;
        } else {
            return new Response(JSON.stringify(mediaResult), {
                status: 201,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    await postsCollection.insertOne({
        id: postId,
        title,
        content,
        userId: userData.id,
        timestamp: new Date(),
        link
    });

    console.log("Post created!");

    await addXP(userData.id, EXPERIENCE_TABLE.POST);

    userData = await usersCollection.findOne({ id: userData.id });

    const post = { id: postId, title, content, userId: userData.id, timestamp: new Date(), link, user: userData, success: true };

    sendMessageToDiscordWebhook(
        "https://discord.com/api/webhooks/1236284348244955137/7b-J6UW1knzJhhFIY9AyplZAvKNF9F897oUsRqOPjJJZrCRmcW2A9QTOPWnL7UhD2-YI",
        "New post made by @*" + userData.username + "* (level **" + userData.level + "**) available on **VAPR** : https://vapr.gg/post/" + postId
    );

    notifyFollowers(userData.id, "A new post made by @*" + userData.username + "* is available on **VAPR** :point_right: https://vapr.gg/post/" + postId + ", go check this out and send some love :heart: *(you can stop to follow this creator if you don't want to receive this messages)*");

    return new Response(JSON.stringify(post), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPostData(id) {
    const post = await postsCollection.findOne({ id });

    if (!post) {
        return { title: "not found", content: "", userId: "unknown" };
    }

    const postOwner = await usersCollection.findOne({ id: post.userId }, { projection: { id: 1, username: 1 } });

    post.username = postOwner.username;

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
        // Handle error if needed
    }

    post.views = await viewsCollection.countDocuments({ postId: post.id });

    const postOwner = await usersCollection.findOne({ id: post.userId }, { projection: { id: 1, username: 1 } });

    post.username = postOwner.username;

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

        return {
            ...post,
            viewsCount,
            likesCount,
            dislikesCount,
            followersCount
        };
    }));

    return new Response(JSON.stringify(postsWithCounts), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

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

async function getRandomViews() {
    return new Promise((resolve, reject) => {
        resolve(Math.floor(Math.random() * (Math.random() * 10000)) + 30);
    });
}

export async function getNextFeedPosts(userid) {
    let posts = [];

    if (userid === "anonymous") {
        posts = await postsCollection.find().sort({ id: -1 }).limit(10).toArray();
    } else {
        const likes = await likesCollection.find({ userId: userid }).toArray();
        const dislikes = await dislikesCollection.find({ userId: userid }).toArray();
        const skips = await dislikesCollection.find({ userId: userid }).toArray();

        const interactedPostIds = [...likes, ...dislikes, ...skips].map(interaction => interaction.postId);

        posts = await postsCollection.find({ id: { $nin: interactedPostIds } }).sort({ timestamp: -1 }).limit(10).toArray();
    }

    posts = await Promise.all(posts.map(async post => {
        const views = await viewsCollection.countDocuments({ postId: post.id });
        const postOwner = await usersCollection.findOne({ id: post.userId }, { projection: { id: 1, username: 1 } });

        return {
            ...post,
            views: views,
            username: postOwner.username
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

async function uploadToBunnyCDN(file, postId) {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${postId}.${fileExtension}`;
    const accessKey = Deno.env.get("BUNNY_CDN_ACCESSKEY");
    const storageZoneUrl = Deno.env.get("BUNNY_CDN_STORAGE_URL");

    if (!accessKey || !storageZoneUrl) {
        throw new Error("Bunny CDN configuration is missing from environment variables.");
    }

    const uploadUrl = `${storageZoneUrl}/vapr/posts/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });

    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "AccessKey": accessKey,
            "Content-Type": "application/octet-stream",
            "accept": "application/json"
        },
        body: blob
    });

    if (!response.ok) {
        console.error("Failed to upload media. Response:", await response.text());
        return { success: false, msg: await response.text() };
    }

    const data = await response.json();
    console.log("POST UPLOADED IMAGE");
    console.log(data);
    return { success: true };
}

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

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1237068985233833994/-Q63qOJO3H-6HwkZoHSwmTaaelnLiDXBxNj4fA_9oJlDMN_AKO4rhGKfQBM8uvKR46vu",
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

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1237068985233833994/-Q63qOJO3H-6HwkZoHSwmTaaelnLiDXBxNj4fA_9oJlDMN_AKO4rhGKfQBM8uvKR46vu",
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

        if (follows.length > 0) {
            console.log("User follows the creator.");
            return new Response(JSON.stringify({ success: true, follows, message: "User follows the creator" }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } else {
            console.log("User does not follow the creator.");
            return new Response(JSON.stringify({ success: false, message: "User does not follow the creator" }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }
    } catch (error) {
        console.error("Error checking if user follows creator:", error);
        return new Response(JSON.stringify({ success: false, message: "Error checking follow status" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

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

        console.log("Reaction added successfully:", reaction);
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
        console.log("Reactions retrieved successfully:", reactions);
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

export async function acceptInvitation(invitedUserId, ambassadorUserId) {
    try {
        if (invitedUserId === ambassadorUserId) {
            return { success: false, message: "You can't invite yourself!" };
        }

        const invitee = await usersCollection.findOne({ id: invitedUserId });

        if (!invitee) {
            return { success: false, message: "Invitee user not found" };
        }

        const existingInvitation = await registrationReferralsCollection.findOne({ invitedUserId });

        if (existingInvitation) {
            return { success: false, message: "Invitation already accepted by this user" };
        }

        const ambassador = await usersCollection.findOne({ id: ambassadorUserId });

        if (!ambassador) {
            return { success: false, message: "Ambassador user not found" };
        }

        const referral = await registrationReferralsCollection.insertOne({
            invitedUserId: invitedUserId,
            ambassadorUserId: ambassadorUserId,
            timestamp: new Date()
        });

        const totalInvitations = await registrationReferralsCollection.countDocuments({ ambassadorUserId: ambassadorUserId });

        await addXP(ambassadorUserId, EXPERIENCE_TABLE.INVITE);

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1238786271514595398/VTlL7WzN9mNYq-ebtpT0cINS54HLlGjVp9fZ5MvSHytRdI5QrJe7fbSXWfopz8tJ1drZ",
            `@${invitee.username} accepted invitation from ${ambassador.username} 🥳 Total invitations accepted: ${totalInvitations}`
        );

        const existingFollows = await followsCollection.find({ followerId: invitedUserId, creatorId: ambassadorUserId }).toArray();

        if (existingFollows.length > 0) {
            console.log("Already following this post.");
            return { success: true, message: "User already following" };
        }

        const follow = await followsCollection.insertOne({
            postId: "invitation",
            followerId: invitedUserId,
            creatorId: ambassadorUserId,
            timestamp: new Date()
        });

        const [follower, creator, followerCount] = await Promise.all([
            usersCollection.findOne({ id: invitedUserId }, { projection: { username: 1, level: 1 } }),
            usersCollection.findOne({ id: ambassadorUserId }, { projection: { username: 1, level: 1 } }),
            followsCollection.countDocuments({ creatorId: ambassadorUserId })
        ]);

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1237068985233833994/-Q63qOJO3H-6HwkZoHSwmTaaelnLiDXBxNj4fA_9oJlDMN_AKO4rhGKfQBM8uvKR46vu",
            ":incoming_envelope: **@" + follower.username + "**(lvl " + follower.level + ") is now following :arrow_right: **@" + creator.username + "**(lvl " + creator.level + "), followers: **" + followerCount + "**"
        );

        return { success: true, message: "Invitation accepted successfully", referral: referral, totalInvitations: totalInvitations };
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return { success: false, message: "Failed to accept invitation" };
    }
}

export async function notifyFollowers(userId, message) {
    try {
        const followers = await followsCollection.find({ creatorId: userId }, { projection: { followerId: 1 } }).toArray();

        setTimeout(() => {
            followers.forEach(follower => {
                sendPrivateMessage(follower.followerId, message);
            });
        }, 10000);
    } catch (error) {
        console.error("Error notifying followers:", error);
    }
}
