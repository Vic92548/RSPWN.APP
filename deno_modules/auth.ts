import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";
import { crypto } from "https://deno.land/std/crypto/mod.ts";

// Environment variable-based configuration
const clientId = Deno.env.get("DISCORD_ClientID");
const clientSecret = Deno.env.get("DISCORD_ClientSecret");
const DOMAIN = Deno.env.get("DOMAIN");
const redirectUri = `https://${DOMAIN}/auth/discord/callback`;
const jwtSecret = "YOUR_SECRET_KEY"; // This should be replaced with a secure key and stored securely

// Generate a CryptoKey for HMAC SHA-512
const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true, // whether the key is extractable (i.e., can be used in exportKey)
    ["sign", "verify"] // can be used to sign and verify
);

// Function to handle the OAuth callback
export async function handleOAuthCallback(request: Request): Promise<Response> {
    const url = new URL(request.url, `https://${DOMAIN}/`);
    const code = url.searchParams.get("code");
    if (!code) return new Response("Authorization code not found", { status: 400 });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
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

    // Fetch user data from Discord API
    const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
        return new Response("Failed to fetch user data", { status: userResponse.status });
    }

    const userData = await userResponse.json();
    const jwtPayload = {
        iss: `https://${DOMAIN}`,
        sub: userData.id,
        exp: getNumericDate(3600),  // JWT with 1 hour expiration
        data: {
            username: userData.username,
            avatar: userData.avatar,
            email: userData.email  // Assuming 'email' scope is granted
        }
    };

    const jwt = await create({ alg: "HS512", typ: "JWT" }, jwtPayload, key);

    // Optionally store user data and JWT in Deno KV
    const kv = await Deno.openKv();
    await kv.set(["discordUser", userData.id], { ...userData, jwt });

    // Read and prepare the HTML response
    const htmlTemplate = await Deno.readTextFile("discord_callback.html");
    const htmlContent = htmlTemplate
        .replace('{{jwt}}', jwt)
        .replace('{{userData}}', JSON.stringify(userData).replace(/"/g, '\\"'));

    return new Response(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html" }
    });
}

// Function to redirect to Discord login
export function redirectToDiscordLogin(): Response {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
    return Response.redirect(authUrl);
}
