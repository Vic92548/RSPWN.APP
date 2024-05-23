import { videosCollection } from "../database.js";

/**
 * Retrieves the videoId using the postId.
 *
 * @param {string} postId - The ID of the post.
 * @returns {Promise<string>} - The videoId associated with the given postId.
 * @throws {Error} - Throws an error if the video is not found.
 */
export async function getVideoIdByPostId(postId) {
    const video = await videosCollection.findOne({ postId: postId });
    if (video) {
        return video.videoId;
    } else {
        throw new Error(`Video not found for postId: ${postId}`);
    }
}
