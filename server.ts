// server.ts
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleOAuthCallback, redirectToDiscordLogin } from "./deno_modules/auth.ts";

const port = 8080;

async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
        return serveFile(request, "index.html");
    } else if (url.pathname.startsWith("/public")) {
        try {
            const filePath = `.${url.pathname}`;
            return await serveFile(request, filePath);
        } catch (error) {
            console.error(error);
            return new Response("Not Found", { status: 404 });
        }
    } else if (url.pathname === "/auth/discord/callback") {
        return handleOAuthCallback(request);
    } else if (url.pathname === "/login") {
        return redirectToDiscordLogin();
    }

    return new Response("Not Found", { status: 404 });
}

console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
Deno.serve({ port }, handleRequest);
