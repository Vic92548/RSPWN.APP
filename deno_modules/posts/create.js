import { postsCollection, usersCollection, videosCollection } from "../database.js";
import { addXP, EXPERIENCE_TABLE } from "../rpg.js";
import { sendMessageToDiscordWebhook } from "../discord.js";
import { notifyFollowers } from "../post.js"; // Adjust import path based on actual location

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 15 MB in bytes

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

    if (file && file.size > MAX_FILE_SIZE) {
        return new Response("File size exceeds the 15MB limit", { status: 400 });
    }

    const postId = crypto.randomUUID();
    let fileExtension = "";
    if (file) {
        const parts = file.name.split('.');
        fileExtension = parts.length > 1 ? parts.pop() : "";
        let mediaResult;
        if (file.type.startsWith("video")) {
            mediaResult = await uploadVideoToBunnyCDN(file, postId);
        } else {
            mediaResult = await uploadImageToBunnyCDN(file, postId);
        }
        if (mediaResult.success) {
            content = mediaResult.url;
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

async function uploadImageToBunnyCDN(file, postId) {
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

    console.log("POST UPLOADED IMAGE");
    return { success: true, url: `https://vapr.b-cdn.net/posts/${fileName}` };
}

async function uploadVideoToBunnyCDN(file, postId) {
    const libraryId = Deno.env.get("BUNNY_CDN_LIBRARY_ID");
    const accessKey = Deno.env.get("BUNNY_CDN_VIDEO_API_KEY");

    if (!accessKey || !libraryId) {
        throw new Error("Bunny CDN configuration is missing from environment variables.");
    }

    // Step 1: Create a video object
    const createVideoUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
    const createVideoResponse = await fetch(createVideoUrl, {
        method: "POST",
        headers: {
            "AccessKey": accessKey,
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({ title: postId })
    });

    if (!createVideoResponse.ok) {
        console.error("Failed to create video object. Response:", await createVideoResponse.text());
        return { success: false, msg: await createVideoResponse.text() };
    }

    const videoData = await createVideoResponse.json();
    const videoId = videoData.guid;

    // Step 2: Upload the video content
    const uploadVideoUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });

    const uploadVideoResponse = await fetch(uploadVideoUrl, {
        method: "PUT",
        headers: {
            "AccessKey": accessKey,
            "accept": "application/json"
        },
        body: blob
    });

    if (!uploadVideoResponse.ok) {
        console.error("Failed to upload video content. Response:", await uploadVideoResponse.text());
        return { success: false, msg: await uploadVideoResponse.text() };
    }

    // Step 3: Add video document to MongoDB
    await videosCollection.insertOne({
        videoId: videoId,
        postId: postId,
        libraryId: libraryId,
        timestamp: new Date()
    });

    console.log("POST UPLOADED VIDEO AND DOCUMENT ADDED TO MONGODB");
    return { success: true, url: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=true&muted=false&preload=true&responsive=true` };
}
