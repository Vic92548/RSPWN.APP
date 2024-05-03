import { PrismaClient } from '../generated/client/deno/edge.js';
import { sendMessageToDiscordWebhook } from './discord.js';

const prisma = new PrismaClient();

// Environment variable-based configuration
const clientId = Deno.env.get("DISCORD_ClientID");
const clientSecret = Deno.env.get("DISCORD_ClientSecret");
const DOMAIN = Deno.env.get("DOMAIN");
const redirectUri = `https://${DOMAIN}/auth/discord/callback`;

function generateSecretKey() {
    const byteLength = 32;  // Typically sufficient for security needs
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
}

export async function authenticateRequest(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { isValid: false };
    }

    const token = authHeader.slice(7);  // Remove "Bearer "
    const secretKey = await prisma.secretKey.findUnique({
        where: { key: token }
    });

    if (secretKey && secretKey.userId) {
        const userData = await prisma.user.findUnique({
            where: { id: secretKey.userId }
        });

        if (userData) {
            return { isValid: true, userData };
        }
    }
    return { isValid: false };
}

export async function handleOAuthCallback(request) {
    const url = new URL(request.url, `https://${DOMAIN}/`);
    const code = url.searchParams.get("code");
    if (!code) return new Response("Authorization code not found", { status: 400 });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri
        })
    });

    if (!tokenResponse.ok) {
        return new Response("Failed to obtain access token", { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
        return new Response("Failed to fetch user data", { status: userResponse.status });
    }

    const userData = await userResponse.json();

    let user = await prisma.user.findUnique({
        where: { id: userData.id }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                provider: 'discord'
            }
        });

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1235274235438436413/wIBKtVBz9QvyqqUN8Fu4jSoKfXsQn-ior-92FzPNPKxbDrI2i1VhzV4ps_XqzdjPlb9q",
            `${userData.username} joined VAPR we are now ${await prisma.user.count()} members!`
        );
    } else if (user.username !== userData.username) {
        user = await prisma.user.update({
            where: { id: userData.id },
            data: { username: userData.username }
        });
    }

    const secret_key = generateSecretKey();
    await prisma.secretKey.create({
        data: {
            key: secret_key,
            userId: userData.id
        }
    });

    const htmlTemplate = await Deno.readTextFile("discord_callback.html");
    const htmlContent = htmlTemplate
        .replace('{{jwt}}', secret_key)
        .replace('{{userData}}', JSON.stringify(userData).replace(/"/g, '\\"'));

    return new Response(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html" }
    });
}

export function redirectToDiscordLogin() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email`;
    return Response.redirect(authUrl);
}
