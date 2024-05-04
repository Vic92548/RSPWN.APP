import { PrismaClient } from '../generated/client/deno/edge.js';
import { addXP, EXPERIENCE_TABLE } from "./rpg.js";

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
        const mediaUrl = file ? await uploadToBunnyCDN(file, postId) : null;
        content = "https://vapr.b-cdn.net/posts/" + postId + "." + fileExtension;
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

    return new Response(JSON.stringify(post), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPost(id) {
    const post = await prisma.post.findUnique({
        where: { id }
    });

    if (!post) {
        return new Response("Post not found", { status: 404 });
    }

    await prisma.post.update({
        where: { id },
        data: { views: { increment: 1 } }
    });

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
    await prisma.post.update({
        where: { id: postId },
        data: {
            likes: {
                create: {
                    userId: userData.id,
                    timestamp: new Date()
                }
            }
        }
    });

    await addXP(userData.id, EXPERIENCE_TABLE.LIKE);

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function dislikePost(postId, userData) {
    await prisma.post.update({
        where: { id: postId },
        data: {
            dislikes: {
                create: {
                    userId: userData.id,
                    timestamp: new Date()
                }
            }
        }
    });

    await addXP(userData.id, EXPERIENCE_TABLE.DISLIKE);

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function skipPost(postId, userData) {
    await prisma.post.update({
        where: { id: postId },
        data: {
            skips: {
                create: {
                    userId: userData.id,
                    timestamp: new Date()
                }
            }
        }
    });

    await addXP(userData.id, EXPERIENCE_TABLE.SKIP);

    return new Response(JSON.stringify({ success: true }), {
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


    const posts = await prisma.post.findUnique({
        where: {
            NOT: {
                id: {
                    in: interactedPostIds
                }
            }
        },
    });

    console.log(posts);


    if (userid === "anonymous") {
        console.log("Sending feed as anonymous or no posts available");
        return new Response(JSON.stringify(posts), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }


    if (posts) {
        console.log("Selected post:", posts.id);

        return new Response(JSON.stringify(posts), {
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
        throw new Error("Failed to upload media.");
    }

    const data = await response.json();
    console.log("POST UPLOADED IMAGE");
    console.log(data);
    return data.HttpPath; // Adjust according to Bunny CDN response
}
