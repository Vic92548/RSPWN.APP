// server.ts
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleOAuthCallback, redirectToDiscordLogin, authenticateRequest } from "./deno_modules/auth.js";
import { createPost, getPost, getNextFeedPosts, likePost, dislikePost, skipPost, getPostList, getPostData,  followPost, unfollowPost, checkIfUserFollowsCreator, addReaction, getReactionsByPostId } from "./deno_modules/post.js";

const port = 8080;

async function handleRequest(request){
    const url = new URL(request.url);

    if (url.pathname === "/") {
        const htmlTemplate = await Deno.readTextFile("index.html");
        const htmlContent = htmlTemplate
            .replaceAll('{{meta_description}}', "The place to share gaming content")
            .replaceAll('{{meta_author}}', "VAPR")
            .replaceAll('{{meta_image}}', "https://vapr.b-cdn.net/VLTRXN_3.webp")
            .replaceAll('{{meta_url}}', "https://vapr.gg/");

        return new Response(htmlContent, {
            status: 200,
            headers: { "Content-Type": "text/html" }
        });
    } else if (url.pathname === "/auth/discord/callback") {
        return handleOAuthCallback(request);
    } else if (url.pathname === "/login") {
        return redirectToDiscordLogin();
    }else if (url.pathname.startsWith("/me/posts")) {
        const authResult = await authenticateRequest(request);

        console.log(authResult);

        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Continue with the request handling for authenticated users
        return getPostList(authResult.userData.id);
    }else if (url.pathname.startsWith("/me")) {
        const authResult = await authenticateRequest(request);

        console.log(authResult);

        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        if(!authResult.userData.level){
            authResult.userData.level = 0;
        }

        if(!authResult.userData.xp){
            authResult.userData.xp = 0;
        }

        if(!authResult.userData.xp_required){
            authResult.userData.xp_required = 700;
        }

        // Continue with the request handling for authenticated users
        return new Response(JSON.stringify(authResult.userData), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }else if (url.pathname.startsWith("/feed")) {
        const authResult = await authenticateRequest(request);

        if (!authResult.isValid) {
            return getNextFeedPosts("anonymous");
        }

        return getNextFeedPosts(authResult.userData.id);
    }// Create a new post
    else if (request.method === "POST" && url.pathname === "/posts") {
        const authResult = await authenticateRequest(request);
        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Continue with the request handling for authenticated users
        return createPost(request, authResult.userData);

    }
    // Retrieve a post by ID
    else if (request.method === "GET" && url.pathname.startsWith("/posts/")) {
        const id = url.pathname.split('/')[2];  // Extract the post ID from the URL

        const authResult = await authenticateRequest(request);

        console.log(authResult);

        if (!authResult.isValid) {
            return getPost(id);
        }

        return getPost(id, authResult.userData.id);
    }else if (request.method === "GET" && url.pathname.startsWith("/post/")) {
        const id = url.pathname.split('/')[2];  // Extract the post ID from the URL

        const post = await getPostData(id);

        const htmlTemplate = await Deno.readTextFile("index.html");
        const htmlContent = htmlTemplate
            .replaceAll('{{meta_description}}', post.title)
            .replaceAll('{{meta_author}}', post.username)
            .replaceAll('{{meta_image}}', post.content)
            .replaceAll('{{meta_url}}', "https://vapr.gg/" + url.pathname);

        return new Response(htmlContent, {
            status: 200,
            headers: { "Content-Type": "text/html" }
        });
    }else if (url.pathname.startsWith("/like/")) {
        const id = url.pathname.split('/')[2];  // Extract the post ID from the URL

        const authResult = await authenticateRequest(request);
        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        return likePost(id, authResult.userData);
    }else if (url.pathname.startsWith("/dislike/")) {
        const id = url.pathname.split('/')[2];  // Extract the post ID from the URL

        const authResult = await authenticateRequest(request);
        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        return dislikePost(id, authResult.userData);
    }else if (url.pathname.startsWith("/skip/")) {
        const id = url.pathname.split('/')[2];  // Extract the post ID from the URL

        const authResult = await authenticateRequest(request);
        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        return skipPost(id, authResult.userData);
    }else if (url.pathname.startsWith("/manage-follow") && request.method === "GET") {
        const postId = url.searchParams.get('postId');
        const action = url.searchParams.get('action');  // Expected to be 'follow' or 'unfollow'
        const authResult = await authenticateRequest(request);

        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        if (action === 'follow') {
            return followPost(postId, authResult.userData.id);
        } else if (action === 'unfollow') {
            return unfollowPost(postId, authResult.userData.id);
        } else {
            return new Response(JSON.stringify({ success: false, message: "Invalid action specified" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
    }
    else if (url.pathname.startsWith("/check-follow/") && request.method === "GET") {
        const creatorId = url.pathname.split('/')[2];  // Extract the creator ID from the URL
        const authResult = await authenticateRequest(request);

        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        return checkIfUserFollowsCreator(authResult.userData.id, creatorId);
    }else if (url.pathname.startsWith("/add-reaction") && request.method === "GET") {
        const postId = url.searchParams.get('postId'); // Get the post ID from URL query parameter
        const emoji = url.searchParams.get('emoji'); // Get the emoji from URL query parameter
        const authResult = await authenticateRequest(request);

        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        return addReaction(postId, authResult.userData.id, emoji);
    }

    // Route to get all reactions for a post using GET request
    else if (url.pathname.startsWith("/get-reactions") && request.method === "GET") {
        const postId = url.searchParams.get('postId'); // Get the post ID from URL query parameter

        return getReactionsByPostId(postId);
    } else{
        try {
            const filePath = `./public${url.pathname}`;
            return await serveFile(request, filePath);
        } catch (error) {
            console.error(error);
            return new Response("Not Found", { status: 404 });
        }
    }
}



console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
Deno.serve({ port }, handleRequest);
