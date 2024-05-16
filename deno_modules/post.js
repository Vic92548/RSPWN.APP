import { PrismaClient } from '../generated/client/deno/edge.js';
import { addXP, EXPERIENCE_TABLE } from "./rpg.js";
import {sendMessageToDiscordWebhook} from "./discord.js";
import {sendPrivateMessage} from "./discord_bot.js";

const databaseUrl = Deno.env.get("DATABASE_URL");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});

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
        if(mediaResult.success){
            content = "https://vapr.b-cdn.net/posts/" + postId + "." + fileExtension;
        }else{
            return new Response(JSON.stringify(mediaResult), {
                status: 201,
                headers: { "Content-Type": "application/json" }
            });
        }

    }

    const post = await prisma.post.create({
        data: {
            id: postId,
            title,
            content,
            userId: userData.id,
            timestamp: new Date(),
            link
        }
    });

    console.log("Post created!");


    await addXP(userData.id, EXPERIENCE_TABLE.POST);

    userData = await prisma.user.findUnique({
        where: { id: userData.id }
    });

    post.user = userData;
    post.success = true;

    sendMessageToDiscordWebhook(
        "https://discord.com/api/webhooks/1236284348244955137/7b-J6UW1knzJhhFIY9AyplZAvKNF9F897oUsRqOPjJJZrCRmcW2A9QTOPWnL7UhD2-YI",
        "New post made by @*" + userData.username + "* (level **" + userData.level + "**) available on **VAPR** : https://vapr.gg/post/" + postId);

    notifyFollowers(userData.id, "A new post made by @*" + userData.username + "* is available on **VAPR** :point_right: https://vapr.gg/post/" + postId + ", go check this out and send some love :heart: *(you can stop to follow this creator if you don't want to receive this messages)*");


    return new Response(JSON.stringify(post), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPostData(id) {
    const post = await prisma.post.findUnique({
        where: { id }
    });

    if (!post) {
        return {title: "not found", content: "", userId: "unknown"};
    }

    const postOwner = await prisma.user.findUnique({
        where: { id: post.userId },
        select: {
            id: true,
            username: true
        }
    });

    post.username = postOwner.username;

    return post;
}

export async function getPost(id, userId = "anonymous") {
    const post = await prisma.post.findUnique({
        where: { id }
    });

    if (!post) {
        return new Response("Post not found", { status: 404 });
    }

    try{
        const view = await prisma.view.create({
            data: {
                postId: id,
                userId: userId,
                timestamp: new Date(), // Assuming your schema has a timestamp field
            }
        });
    }catch{

    }

    post.views = await prisma.view.count({
        where: {
            postId: post.id
        }
    });



    const postOwner = await prisma.user.findUnique({
        where: { id: post.userId },
        select: {
            id: true,
            username: true
        }
    });

    post.username = postOwner.username;

    return new Response(JSON.stringify(post), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPostList(userId) {
    const posts = await prisma.post.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' }
    });

    if (!posts.length) {
        return new Response("No posts found", { status: 404 });
    }

    // Map over the posts to include the counts of views, likes, dislikes, and followers
    const postsWithCounts = await Promise.all(posts.map(async post => {
        const viewsCount = await prisma.view.count({
            where: { postId: post.id }
        });
        const likesCount = await prisma.like.count({
            where: { postId: post.id }
        });
        const dislikesCount = await prisma.dislike.count({
            where: { postId: post.id }
        });
        const followersCount = await prisma.follow.count({
            where: { postId: post.id }
        });

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
    try{
        const view = await prisma.like.create({
            data: {
                postId: postId,
                userId: userData.id,
                timestamp: new Date(), // Assuming your schema has a timestamp field
            }
        });

        await addXP(userData.id, EXPERIENCE_TABLE.LIKE);

        userData = await prisma.user.findUnique({
            where: { id: userData.id }
        });
    }catch{

    }



    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

function generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export async function viewPost(postId, userId) {

    console.log("Starting to record view for userId" + userId + " for post:" + postId);
    try{
        if(userId === "anonymous"){

            const view = await prisma.view.create({
                data: {
                    postId: postId,
                    userId: "anonymous_" + crypto.randomUUID(),
                    timestamp: new Date(), // Assuming your schema has a timestamp field
                }
            });
        }else{
            const view = await prisma.view.create({
                data: {
                    postId: postId,
                    userId: userId,
                    timestamp: new Date(), // Assuming your schema has a timestamp field
                }
            });
        }

    }catch(error){
        console.error(error);
    }



    return new Response(JSON.stringify({ success: true}), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function dislikePost(postId, userData) {
    try{
        const view = await prisma.dislike.create({
            data: {
                postId: postId,
                userId: userData.id,
                timestamp: new Date(), // Assuming your schema has a timestamp field
            }
        });

        await addXP(userData.id, EXPERIENCE_TABLE.DISLIKE);

        userData = await prisma.user.findUnique({
            where: { id: userData.id }
        });
    }catch{

    }

    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function skipPost(postId, userData) {
    try{
        const view = await prisma.like.create({
            data: {
                postId: postId,
                userId: userData.id,
                timestamp: new Date(), // Assuming your schema has a timestamp field
            }
        });

        await addXP(userData.id, EXPERIENCE_TABLE.SKIP);

        userData = await prisma.user.findUnique({
            where: { id: userData.id }
        });
    }catch{

    }

    return new Response(JSON.stringify({ success: true, user: userData }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

async function getRandomViews(){
    return new Promise((resolve, reject) => {
        resolve(Math.floor(Math.random() * (Math.random() * 10000)) + 30);
    })
}

export async function getNextFeedPosts(userid) {
    let posts = [];

    if (userid === "anonymous") {
        // Fetch a random post if the user is anonymous
        posts = await prisma.post.findMany({
            take: 10, // Fetch ten random posts
            orderBy: {
                id: 'desc' // This orders by the post ID, adjust if you have another preference for randomness
            }
        });

        // Fetch real view counts and additional details for each post
        posts = await Promise.all(posts.map(async post => {
            const views = await prisma.view.count({
                where: {
                    postId: post.id
                }
            });

            const postOwner = await prisma.user.findUnique({
                where: { id: post.userId },
                select: {
                    id: true,
                    username: true
                }
            });

            return {
                ...post,
                views: views,
                username: postOwner.username
            };
        }));
    } else {
        // Fetch IDs from likes, dislikes, and skips for a known user
        const likes = await prisma.like.findMany({
            where: { userId: userid },
            select: { postId: true }
        });
        const dislikes = await prisma.dislike.findMany({
            where: { userId: userid },
            select: { postId: true }
        });
        const skips = await prisma.skip.findMany({
            where: { userId: userid },
            select: { postId: true }
        });

        // Combine all post IDs in a single array
        const interactedPostIds = [...likes, ...dislikes, ...skips].map(interaction => interaction.postId);

        // Fetch posts that have not been interacted with by the user
        posts = await prisma.post.findMany({
            where: {
                NOT: {
                    id: {
                        in: interactedPostIds
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 10 // Adjust this number based on the desired number of posts to fetch
        });

        // Fetch real view counts and additional details for each post
        posts = await Promise.all(posts.map(async post => {
            const views = await prisma.view.count({
                where: {
                    postId: post.id
                }
            });

            const postOwner = await prisma.user.findUnique({
                where: { id: post.userId },
                select: {
                    id: true,
                    username: true
                }
            });

            return {
                ...post,
                views: views,
                username: postOwner.username
            };
        }));
    }

    console.log(posts);

    // Return the (batch of) posts
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
        return {success: false, msg: await response.text()};
    }

    const data = await response.json();
    console.log("POST UPLOADED IMAGE");
    console.log(data);
    return {success: true}; // Adjust according to Bunny CDN response
}

export async function followPost(postId, followerId) {
    try {
        // Retrieve the post to get the creator's userId
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true } // Select only the userId
        });

        if (!post) {
            console.log("Post not found.");
            return new Response(JSON.stringify({ success: false, message: "Post not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const creatorId = post.userId;

        // Prevent following your own post
        if (followerId === creatorId) {
            console.log("Cannot follow your own post.");
            return new Response(JSON.stringify({ success: false, message: "Cannot follow your own post" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check if the follow already exists
        const existingFollows = await prisma.follow.findMany({
            where: {
                AND: [
                    { followerId: followerId },
                    { creatorId: creatorId } // Assuming 'creatorId' is also provided in the context
                ]
            }
        });

        if (existingFollows.length > 0) {
            console.log("Already following this post.");
            return new Response(JSON.stringify({ success: false, message: "Already following this post" }), {
                status: 409, // Conflict status code
                headers: { "Content-Type": "application/json" }
            });
        }


        // Create a new follow record
        const follow = await prisma.follow.create({
            data: {
                postId,
                followerId,
                creatorId,
                timestamp: new Date(),
            }
        });

        const [follower, creator, followerCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: followerId },
                select: { username: true, level: true }
            }),
            prisma.user.findUnique({
                where: { id: creatorId },
                select: { username: true, level: true }
            }),
            prisma.follow.count({
                where: {
                    creatorId: creatorId
                }
            })
        ]);

        sendMessageToDiscordWebhook("https://discord.com/api/webhooks/1237068985233833994/-Q63qOJO3H-6HwkZoHSwmTaaelnLiDXBxNj4fA_9oJlDMN_AKO4rhGKfQBM8uvKR46vu",
            ":incoming_envelope: **@" + follower.username + "**(lvl " + follower.level + ") is now following :arrow_right: **@" + creator.username + "**(lvl " + creator.level + "), followers: **" + followerCount + "**");

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
        // Retrieve the post to get the creator's userId
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true } // Select only the userId
        });

        if (!post) {
            console.log("Post not found.");
            return new Response(JSON.stringify({ success: false, message: "Post not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const follow = await prisma.follow.delete({
            where: {
                creatorId_followerId: {
                    creatorId: post.userId,
                    followerId,
                }
            }
        });

        const [follower, creator, followerCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: followerId },
                select: { username: true, level: true }
            }),
            prisma.user.findUnique({
                where: { id: follow.creatorId },
                select: { username: true, level: true }
            }),
            prisma.follow.count({
                where: {
                    creatorId: follow.creatorId
                }
            })
        ]);

        sendMessageToDiscordWebhook("https://discord.com/api/webhooks/1237068985233833994/-Q63qOJO3H-6HwkZoHSwmTaaelnLiDXBxNj4fA_9oJlDMN_AKO4rhGKfQBM8uvKR46vu",
            ":broken_heart:  **@" + follower.username + "**(lvl " + follower.level + ") stopped following :arrow_right: **@" + creator.username + "**(lvl " + creator.level + "), followers: **" + followerCount + "**");


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
        // Find any follows where the followerId is userId and the postId belongs to creatorId
        const follows = await prisma.follow.findMany({
            where: {
                followerId: userId,
                AND: {
                    creatorId
                }
            }
        });

        // Check if any follows exist
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
        // First, delete all existing reactions for this user on the specified post
        await prisma.reaction.deleteMany({
            where: {
                postId: postId,
                userId: userId
            }
        });

        // After deleting, add the new reaction
        const reaction = await prisma.reaction.create({
            data: {
                postId,
                userId,
                timestamp: new Date(),
                emoji
            }
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
        const reactions = await prisma.reaction.findMany({
            where: {
                postId
            }
        });
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

        if(invitedUserId === ambassadorUserId){
            return {success: false, message: "You can't invite yourself!"};
        }

        const invitee = await prisma.user.findUnique({
            where: { id: invitedUserId }
        });

        if (!invitee) {
            return { success: false, message: "Invitee user not found" };
        }

        // Verify if the invitation has already been made
        const existingInvitation = await prisma.registrationReferral.findFirst({
            where: {
                invitedUserId: invitedUserId
            }
        });

        if (existingInvitation) {
            return { success: false, message: "Invitation already accepted by this user" };
        }

        // Check if the ambassadorUserId actually exists
        const ambassador = await prisma.user.findUnique({
            where: { id: ambassadorUserId }
        });

        if (!ambassador) {
            return { success: false, message: "Ambassador user not found" };
        }

        // Create the referral entry
        const referral = await prisma.registrationReferral.create({
            data: {
                invitedUserId: invitedUserId,
                ambassadorUserId: ambassadorUserId,
                timestamp: new Date(),
            }
        });

        // Get the total number of successful referrals made by the ambassador
        const totalInvitations = await prisma.registrationReferral.count({
            where: {
                ambassadorUserId: ambassadorUserId
            }
        });

        // Assuming adding XP to the invited user's account as a reward for accepting the invitation
        await addXP(ambassadorUserId, EXPERIENCE_TABLE.INVITE);

        // Send a notification to Discord with the total number of invitations
        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1238786271514595398/VTlL7WzN9mNYq-ebtpT0cINS54HLlGjVp9fZ5MvSHytRdI5QrJe7fbSXWfopz8tJ1drZ",
            `@${invitee.username} accepted invitation from ${ambassador.username} 🥳 Total invitations accepted: ${totalInvitations}`
        );

        // Check if the follow already exists
        const existingFollows = await prisma.follow.findMany({
            where: {
                AND: [
                    { followerId: invitedUserId },
                    { creatorId: ambassadorUserId } // Assuming 'creatorId' is also provided in the context
                ]
            }
        });

        if (existingFollows.length > 0) {
            console.log("Already following this post.");
            return { success: true, message: "User already following" };
        }


        // Create a new follow record
        const follow = await prisma.follow.create({
            data: {
                postId: "invitation",
                followerId: invitedUserId,
                creatorId: ambassadorUserId,
                timestamp: new Date(),
            }
        });

        const [follower, creator, followerCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: invitedUserId },
                select: { username: true, level: true }
            }),
            prisma.user.findUnique({
                where: { id: ambassadorUserId },
                select: { username: true, level: true }
            }),
            prisma.follow.count({
                where: {
                    creatorId: ambassadorUserId
                }
            })
        ]);

        sendMessageToDiscordWebhook("https://discord.com/api/webhooks/1237068985233833994/-Q63qOJO3H-6HwkZoHSwmTaaelnLiDXBxNj4fA_9oJlDMN_AKO4rhGKfQBM8uvKR46vu",
            ":incoming_envelope: **@" + follower.username + "**(lvl " + follower.level + ") is now following :arrow_right: **@" + creator.username + "**(lvl " + creator.level + "), followers: **" + followerCount + "**");

        return { success: true, message: "Invitation accepted successfully", referral: referral, totalInvitations: totalInvitations };
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return { success: false, message: "Failed to accept invitation" };
    }
}

export async function notifyFollowers(userId, message) {
    try {
        // Get all followers of the given user
        const followers = await prisma.follow.findMany({
            where: { creatorId: userId },
            select: { followerId: true }
        });

        setTimeout(() => {
            followers.forEach(follower => {
                sendPrivateMessage(follower.followerId, message);
            });
        }, 2000);

        // Log a message for each follower


    } catch (error) {
        console.error("Error notifying followers:", error);
    }
}


