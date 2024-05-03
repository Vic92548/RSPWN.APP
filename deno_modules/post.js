import { PrismaClient } from '../generated/client/deno/edge.js';
import { addXP, EXPERIENCE_TABLE } from "./rpg.js";

const prisma = new PrismaClient();

export async function createPost(request, userData) {
    if (!request.headers.get("Content-Type")?.includes("multipart/form-data")) {
        return new Response("Invalid content type", { status: 400 });
    }

    const formData = await request.formData();
    const title = formData.get("title");
    let content = formData.get("content");
    const link = formData.get("link");
    const file = formData.get("file");

    if (typeof title !== "string" || typeof userData.id !== "string") {
        return new Response("Missing or invalid fields", { status: 400 });
    }

    const postId = crypto.randomUUID();
    let fileExtension = "";
    if (file) {
        const parts = file.name.split('.');
        fileExtension = parts.length > 1 ? parts.pop() : "";
        const mediaUrl = file ? await uploadToBunnyCDN(file, postId) : null;
        content = mediaUrl;
    }

    const post = await prisma.post.create({
        data: {
            id: postId,
            title,
            content,
            user: { connect: { id: userData.id } },
            timestamp: new Date(),
            link
        }
    });

    await addXP(userData.id, EXPERIENCE_TABLE.POST);

    return new Response(JSON.stringify(post), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPost(id) {
    const post = await prisma.post.findUnique({
        where: { id },
        include: { user: true }
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

    const posts = await prisma.post.findMany({
        where: {
            NOT: {
                interactions: {
                    some: {
                        userId: userid
                    }
                }
            },
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20 // adjust as needed to limit the number of posts fetched
    });

    if (userid === "anonymous" || posts.length === 0) {
        console.log("Sending feed as anonymous or no posts available");
        return new Response(JSON.stringify(posts), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Filtering out posts already interacted with by the user
    const interactedPosts = await prisma.interaction.findMany({
        where: {
            userId: userid
        },
        select: {
            postId: true
        }
    });
    const interactedPostIds = interactedPosts.map(interaction => interaction.postId);
    const filteredPosts = posts.filter(post => !interactedPostIds.includes(post.id));

    const selectedPost = filteredPosts.length > 0 ? filteredPosts[0] : null;

    if (selectedPost) {
        console.log("Selected post:", selectedPost.id);
        return new Response(JSON.stringify(selectedPost), {
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
