import { create, verify, getNumericDate } from "https://deno.land/x/jwt/mod.ts";

// Environment variable-based configuration
const clientId = Deno.env.get("DISCORD_ClientID");
const clientSecret = Deno.env.get("DISCORD_ClientSecret");
const DOMAIN = Deno.env.get("DOMAIN");
const redirectUri = `https://${DOMAIN}/auth/discord/callback`;
const jwtSecret = "YOUR_SECRET_KEY";  // This should be replaced with a secure key and stored securely

/**
 * Authenticate requests by verifying the JWT token.
 * @param {Request} request The incoming HTTP request.
 * @returns {Promise<{isValid: boolean, userData?: any}>} The authentication status and user data if valid.
 */
export async function authenticateRequest(request: Request): Promise<{isValid: boolean, userData?: any}> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { isValid: false };
    }

    const token = authHeader.slice(7);  // Remove "Bearer " from the start

    try {
        const payload = await verify(token, jwtSecret, "HS512");
        // Optionally, fetch user data from storage if needed
        const kv = await Deno.openKv();
        const userData = await kv.get(["discordUser", payload.sub]);

        return { isValid: true, userData: userData ? userData.value : null };
    } catch (error) {
        console.error("Failed to verify JWT:", error);
        return { isValid: false };
    }
}


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

    const jwt = await create({ alg: "HS512", typ: "JWT" }, jwtPayload, jwtSecret);

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
