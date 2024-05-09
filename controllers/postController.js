// postController.ts
import {
    createPost,
    getPost,
    getNextFeedPosts,
    getPostList,
    likePost,
    dislikePost,
    skipPost,
    followPost,
    unfollowPost,
    checkIfUserFollowsCreator,
    addReaction,
    getReactionsByPostId,
    viewPost,
    getPostData
} from "../deno_modules/post.js";
import { authenticateMiddleware } from "../middlewares/authenticateMiddleware.js";  // Ensure this path matches your project structure

async function handlePostRoutes(request, url) {
    try {
        // Check paths that don't necessarily require authentication
        if (url.pathname.startsWith("/posts/") && request.method === "GET") {
            const id = url.pathname.split('/')[2];
            return getPost(id); // Public post viewing
        } else if (url.pathname.startsWith("/get-reactions") && request.method === "GET") {
            const postId = url.searchParams.get('postId');
            return getReactionsByPostId(postId); // Public reaction viewing
        } else if (url.pathname.startsWith("/feed")) {
            const authResult = await authenticateMiddleware(request).catch(() => ({ isValid: false }));  // Attempt to authenticate but allow fallback to anonymous access
            if (!authResult.isValid) {
                return getNextFeedPosts("anonymous"); // Provide feed for unauthenticated users if allowed
            }
            return getNextFeedPosts(authResult.userData.id); // Authenticated user feed
        }

        // Authenticate for the following routes
        request = await authenticateMiddleware(request);

        // Authenticated routes
        if (url.pathname.startsWith("/me/posts")) {
            return getPostList(request.authResult.userData.id);
        } else if (url.pathname === "/posts" && request.method === "POST") {
            return createPost(request, request.authResult.userData);
        } else if (url.pathname.startsWith("/like/") || url.pathname.startsWith("/dislike/") || url.pathname.startsWith("/skip/")) {
            const id = url.pathname.split('/')[2];
            if (url.pathname.startsWith("/like/")) {
                return likePost(id, request.authResult.userData);
            } else if (url.pathname.startsWith("/dislike/")) {
                return dislikePost(id, request.authResult.userData);
            } else if (url.pathname.startsWith("/skip/")) {
                return skipPost(id, request.authResult.userData);
            }
        } else if (url.pathname.startsWith("/manage-follow") && request.method === "GET") {
            const postId = url.searchParams.get('postId');
            const action = url.searchParams.get('action');
            if (action === 'follow') {
                return followPost(postId, request.authResult.userData.id);
            } else if (action === 'unfollow') {
                return unfollowPost(postId, request.authResult.userData.id);
            }
        } else if (url.pathname.startsWith("/check-follow/") && request.method === "GET") {
            const creatorId = url.pathname.split('/')[2];
            return checkIfUserFollowsCreator(request.authResult.userData.id, creatorId);
        } else if (url.pathname.startsWith("/add-reaction") && request.method === "GET") {
            const postId = url.searchParams.get('postId');
            const emoji = url.searchParams.get('emoji');
            return addReaction(postId, request.authResult.userData.id, emoji);
        } else if (url.pathname.startsWith("/register-view") && request.method === "GET") {
            const postId = url.searchParams.get('postId');
            return viewPost(postId, request.authResult.userData);
        } else {
            throw { status: 404, message: "Not Found" };
        }
    } catch (error) {
        console.error('Error in handlePostRoutes:', error.message);
        return new Response(error.message || "Internal Server Error", { status: error.status || 500 });
    }
}

export { handlePostRoutes };
