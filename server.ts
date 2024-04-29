import { serveFile } from "https://deno.land/std/http/file_server.ts";

const port = 8080;

const handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    // Serve index.html at the root
    if (url.pathname === "/") {
        return serveFile(request, "index.html");
    }

    // Serve static files from the public directory
    try {
        const filePath = `./public${url.pathname}`;
        return await serveFile(request, filePath);
    } catch (error) {
        // If the file is not found or any other error, return a 404
        console.error(error);
        return new Response("Not Found", { status: 404 });
    }
};

console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
Deno.serve({ port }, handler);
