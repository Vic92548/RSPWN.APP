import { postsCollection, usersCollection, videosCollection } from "../database.js";
import { addXP, EXPERIENCE_TABLE } from "../rpg.js";
import { sendMessageToDiscordWebhook } from "../discord.js";
import { notifyFollowersByEmail } from "./notify_by_email.js";
import { notifyFollowers } from "../post.js";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];

const webhookUrl = process.env.WEBHOOK_URL;

async function sendWebhook(url, data) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseBody = await response.json();
        console.log("Webhook sent successfully:", responseBody);
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
}

function validateFile(file) {
    if (!file) {
        return { valid: false, error: "No file provided" };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: "File size exceeds the 50MB limit" };
    }

    const parts = file.name.split('.');
    const extension = parts.length > 1 ? parts.pop().toLowerCase() : "";

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) && ALLOWED_VIDEO_EXTENSIONS.includes(extension);

    if (!isImage && !isVideo) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: Images (${ALLOWED_IMAGE_EXTENSIONS.join(', ')}), Videos (${ALLOWED_VIDEO_EXTENSIONS.join(', ')})`
        };
    }

    return {
        valid: true,
        isVideo,
        extension,
        type: file.type
    };
}

export async function createPost(request, userData) {
    try {
        const title = request.body.title;
        const link = request.body.link;
        const file = request.file;
        const community = request.body.community;

        if (typeof title !== "string" || !title.trim()) {
            return new Response(JSON.stringify({
                success: false,
                error: "Title is required"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (typeof userData.id !== "string") {
            return new Response(JSON.stringify({
                success: false,
                error: "Invalid user data"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const validation = validateFile(file);
        if (!validation.valid) {
            return new Response(JSON.stringify({
                success: false,
                error: validation.error
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const postId = crypto.randomUUID();
        let content = "";

        try {
            let mediaResult;
            if (validation.isVideo) {
                mediaResult = await uploadVideoToBunnyCDN(file, postId);
            } else {
                mediaResult = await uploadImageToBunnyCDN(file, postId);
            }

            if (!mediaResult.success) {
                console.error("Media upload failed:", mediaResult.msg);
                return new Response(JSON.stringify({
                    success: false,
                    error: "Failed to upload media: " + (mediaResult.msg || "Unknown error")
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }

            content = mediaResult.url;
        } catch (uploadError) {
            console.error("Media upload exception:", uploadError);
            return new Response(JSON.stringify({
                success: false,
                error: "Failed to upload media: " + uploadError.message
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        try {
            await postsCollection.insertOne({
                id: postId,
                title: title.trim(),
                content,
                userId: userData.id,
                timestamp: new Date(),
                link: link || null,
                community: community || null,
                mediaType: validation.isVideo ? 'video' : 'image',
                fileExtension: validation.extension
            });

            console.log("Post created successfully!");

            await addXP(userData.id, EXPERIENCE_TABLE.POST);

            userData = await usersCollection.findOne({ id: userData.id });

            const baseUrl = process.env.BASE_URL;
            const discordWebhook = process.env.DISCORD_POST_WEBHOOK_URL;

            if (discordWebhook) {
                sendMessageToDiscordWebhook(
                    discordWebhook,
                    `New post made by @*${userData.username}* (level **${userData.level}**) available on **VAPR** : ${baseUrl}/post/${postId}`
                );
            }

            if (webhookUrl) {
                const payload = {
                    creatorId: userData.id,
                    postId: postId,
                    postTitle: title.trim(),
                };
                sendWebhook(webhookUrl, payload);
            }

            await notifyFollowersByEmail(userData.id, postId, title.trim());

            const post = {
                id: postId,
                title: title.trim(),
                content,
                userId: userData.id,
                timestamp: new Date(),
                link: link || null,
                user: userData,
                success: true
            };

            return new Response(JSON.stringify(post), {
                status: 201,
                headers: { "Content-Type": "application/json" }
            });

        } catch (dbError) {
            console.error("Database error:", dbError);

            try {
                await cleanupFailedUpload(postId, validation.isVideo ? 'video' : 'image', validation.extension);
                console.log("Cleaned up media after database error");
            } catch (cleanupError) {
                console.error("Failed to cleanup media:", cleanupError);
            }

            return new Response(JSON.stringify({
                success: false,
                error: "Failed to create post in database"
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

    } catch (error) {
        console.error("Unexpected error in createPost:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "An unexpected error occurred"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

async function uploadImageToBunnyCDN(file, postId) {
    try {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${postId}.${fileExtension}`;
        const accessKey = process.env.BUNNY_CDN_ACCESSKEY;
        const storageZoneUrl = process.env.BUNNY_CDN_STORAGE_URL;
        const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;

        if (!accessKey || !storageZoneUrl || !cdnHostname) {
            throw new Error("Bunny CDN configuration is missing from environment variables.");
        }

        const uploadUrl = `${storageZoneUrl}posts/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "AccessKey": accessKey,
                "Content-Type": file.mimetype || "application/octet-stream",
                "accept": "application/json"
            },
            body: file.buffer
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to upload image. Response:", errorText);
            return { success: false, msg: errorText };
        }

        console.log("Image uploaded successfully to Bunny CDN");
        return { success: true, url: `https://${cdnHostname}/posts/${fileName}` };
    } catch (error) {
        console.error("Error in uploadImageToBunnyCDN:", error);
        return { success: false, msg: error.message };
    }
}

async function uploadVideoToBunnyCDN(file, postId) {
    try {
        const libraryId = process.env.BUNNY_CDN_LIBRARY_ID;
        const accessKey = process.env.BUNNY_CDN_VIDEO_API_KEY;

        if (!accessKey || !libraryId) {
            throw new Error("Bunny CDN video configuration is missing from environment variables.");
        }

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
            const errorText = await createVideoResponse.text();
            console.error("Failed to create video object. Response:", errorText);
            return { success: false, msg: errorText };
        }

        const videoData = await createVideoResponse.json();
        const videoId = videoData.guid;

        const uploadVideoUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

        const uploadVideoResponse = await fetch(uploadVideoUrl, {
            method: "PUT",
            headers: {
                "AccessKey": accessKey,
                "accept": "application/json"
            },
            body: file.buffer
        });

        if (!uploadVideoResponse.ok) {
            const errorText = await uploadVideoResponse.text();
            console.error("Failed to upload video content. Response:", errorText);

            try {
                await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
                    method: "DELETE",
                    headers: {
                        "AccessKey": accessKey,
                        "accept": "application/json"
                    }
                });
            } catch (deleteError) {
                console.error("Failed to cleanup video object:", deleteError);
            }

            return { success: false, msg: errorText };
        }

        await videosCollection.insertOne({
            videoId: videoId,
            postId: postId,
            libraryId: libraryId,
            timestamp: new Date()
        });

        console.log("Video uploaded successfully to Bunny CDN");
        return {
            success: true,
            url: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=true&muted=false&preload=true&responsive=true`
        };
    } catch (error) {
        console.error("Error in uploadVideoToBunnyCDN:", error);
        return { success: false, msg: error.message };
    }
}

export async function cleanupFailedUpload(postId, mediaType = 'image', fileExtension = null) {
    try {
        if (mediaType === 'video') {
            const video = await videosCollection.findOne({ postId });
            if (video) {
                const libraryId = process.env.BUNNY_CDN_LIBRARY_ID;
                const accessKey = process.env.BUNNY_CDN_VIDEO_API_KEY;

                const deleteResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${video.videoId}`, {
                    method: "DELETE",
                    headers: {
                        "AccessKey": accessKey,
                        "accept": "application/json"
                    }
                });

                if (deleteResponse.ok) {
                    console.log(`Successfully deleted video ${video.videoId} from Bunny CDN`);
                } else {
                    console.error(`Failed to delete video: ${await deleteResponse.text()}`);
                }

                await videosCollection.deleteOne({ postId });
            }
        } else {
            await deleteImageFromBunnyCDN(postId, fileExtension);
        }
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}

async function deleteImageFromBunnyCDN(postId, fileExtension) {
    try {
        const accessKey = process.env.BUNNY_CDN_ACCESSKEY;
        const storageZoneUrl = process.env.BUNNY_CDN_STORAGE_URL;

        if (!accessKey || !storageZoneUrl) {
            throw new Error("Bunny CDN configuration missing for deletion");
        }

        const extensions = fileExtension ? [fileExtension] : ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for (const ext of extensions) {
            const fileName = `${postId}.${ext}`;
            const deleteUrl = `${storageZoneUrl}posts/${fileName}`;

            const response = await fetch(deleteUrl, {
                method: "DELETE",
                headers: {
                    "AccessKey": accessKey,
                    "accept": "application/json"
                }
            });

            if (response.ok) {
                console.log(`Successfully deleted image ${fileName} from Bunny CDN`);
                return true;
            } else if (response.status === 404) {
                continue;
            } else {
                console.error(`Failed to delete image ${fileName}: ${await response.text()}`);
            }
        }

        console.warn(`Could not find/delete image for post ${postId} with any common extension`);
        return false;
    } catch (error) {
        console.error("Error deleting image from Bunny CDN:", error);
        return false;
    }
}

export async function verifyMediaExists(url, mediaType = 'image') {
    try {
        if (mediaType === 'video') {
            return /^https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/[a-f0-9-]+/.test(url);
        } else {
            const response = await fetch(url, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'VAPR-Media-Validator/1.0'
                }
            });
            return response.ok;
        }
    } catch (error) {
        console.error("Error verifying media:", error);
        return false;
    }
}

export async function batchCleanupFailedPosts(postIds) {
    const results = {
        success: [],
        failed: [],
        errors: []
    };

    for (const postId of postIds) {
        try {
            const post = await postsCollection.findOne({ id: postId });

            if (!post) {
                results.failed.push({ postId, reason: "Post not found" });
                continue;
            }

            const mediaType = post.mediaType || 'image';
            const fileExtension = post.fileExtension || null;

            await cleanupFailedUpload(postId, mediaType, fileExtension);

            await postsCollection.deleteOne({ id: postId });

            results.success.push(postId);
        } catch (error) {
            results.errors.push({ postId, error: error.message });
        }
    }

    return results;
}