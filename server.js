// server.ts
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import {serve} from "https://deno.land/std@0.224.0/http/server.ts";
import { handleOAuthCallback, redirectToDiscordLogin } from "./deno_modules/auth.js";
import * as postController from "./controllers/postController.js";
import { authenticateMiddleware } from "./middlewares/authenticateMiddleware.js";

const port = 8080;

async function handleRequest(request) {
    const url = new URL(request.url);
    try {
        if (url.pathname.startsWith("/auth/")) {
            if (url.pathname === "/auth/discord/callback") {
                return handleOAuthCallback(request);
            } else if (url.pathname === "/login") {
                return redirectToDiscordLogin();
            }
        } else if (url.pathname.startsWith("/me/") || url.pathname.startsWith("/feed") || url.pathname.startsWith("/posts")) {
            // Here the middleware is used to authenticate all routes that require user context
            return postController.handlePostRoutes(request, url);
        } else if (url.pathname === "/") {
            return serveHomePage();
        } else {
            return serveStaticFile(request, url.pathname);
        }
    } catch (error) {
        console.error('Error:', error.message);
        return new Response(error.message || "Internal Server Error", { status: error.status || 500 });
    }
}

async function serveHomePage() {
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
}

async function serveStaticFile(request, pathname) {
    try {
        const filePath = `./public${pathname}`;
        return await serveFile(request, filePath);
    } catch (error) {
        console.error('Error serving file:', error);
        return new Response("Not Found", { status: 404 });
    }
}

console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
serve({ port }, handleRequest);
