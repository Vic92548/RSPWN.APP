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

export async function getNextFeedPost(userid) {
    console.log("FEED START");

    // Fetch IDs from likes, dislikes, and skips
    const likes = await prisma.like.findMany({
        where: { userId : userid },
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


    const posts = await prisma.post.findMany({
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
        take: 1 // Limit the number of posts fetched
    });

    const post = posts[0];

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


    console.log(posts);


    if (userid === "anonymous") {
        console.log("Sending feed as anonymous or no posts available");
        return new Response(JSON.stringify(post), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }


    if (post) {
        console.log("Selected post:", post.id);

        return new Response(JSON.stringify(post), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } else {
        return new Response("No new posts to display", { status: 404 });
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
