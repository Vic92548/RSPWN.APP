import { PrismaClient } from '../generated/client/deno/edge.js';
import { addXP, EXPERIENCE_TABLE } from "./rpg.js";
import {sendMessageToDiscordWebhook} from "./discord.js";

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
        where: { userId }
    });

    if (!posts.length) {
        return new Response("No posts found", { status: 404 });
    }

    return new Response(JSON.stringify(posts), {
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
        const existingFollow = await prisma.follow.findUnique({
            where: {
                postId_followerId: {
                    postId,
                    followerId,
                }
            }
        });

        if (existingFollow) {
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
        const follow = await prisma.follow.delete({
            where: {
                postId_followerId: {
                    postId,
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
        if (reactions.length > 0) {
            console.log("Reactions retrieved successfully:", reactions);
            return new Response(JSON.stringify({ success: true, reactions }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } else {
            return new Response("No reactions found for this post", { status: 404 });
        }
    } catch (error) {
        console.error("Failed to retrieve reactions:", error);
        return new Response(JSON.stringify({ success: false, message: "Failed to retrieve reactions" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}



