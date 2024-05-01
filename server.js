// server.ts
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleOAuthCallback, redirectToDiscordLogin, authenticateRequest } from "./deno_modules/auth.js";
import { createPost, getPost } from "./deno_modules/post.js";

const port = 8080;

async function handleRequest(request){
    const url = new URL(request.url);

    if (url.pathname === "/") {
        return serveFile(request, "index.html");
    } else if (url.pathname === "/auth/discord/callback") {
        return handleOAuthCallback(request);
    } else if (url.pathname === "/login") {
        return redirectToDiscordLogin();
    }else if (url.pathname.startsWith("/me")) {
        const authResult = await authenticateRequest(request);

        console.log(authResult);

        if (!authResult.isValid) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Continue with the request handling for authenticated users
        return new Response(JSON.stringify(authResult.userData), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
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
        return getPost(id);
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
