import { sendMessageToDiscordWebhook } from './discord.js';

// Environment variable-based configuration
const clientId = Deno.env.get("DISCORD_ClientID");
const clientSecret = Deno.env.get("DISCORD_ClientSecret");
const DOMAIN = Deno.env.get("DOMAIN");
const redirectUri = `https://${DOMAIN}/auth/discord/callback`;

/**
 * Generates a unique secret key using cryptographic randomness.
 * @returns {string} A unique secret key encoded in base64.
 */
function generateSecretKey() {
    // Define the byte length for the secret key
    const byteLength = 32;  // This length is typically sufficient for most security needs

    // Generate cryptographically secure random bytes
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);

    return btoa(String.fromCharCode(...bytes));
}


/**
 * Authenticate requests by verifying the JWT token.
 * @param {Request} request The incoming HTTP request.
 * @returns {Promise<{isValid: boolean, userData?: any}>} The authentication status and user data if valid.
 */
export async function authenticateRequest(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { isValid: false };
    }

    const kv = await Deno.openKv();
    const secret_key = authHeader.slice(7);  // Remove "Bearer " from the start
    const user_id = await kv.get(["secret_keys", secret_key]);
    console.log(user_id);

    if(user_id.value){

        const userData = await kv.get(["discordUser", user_id.value]);
        if(userData.value){
            return { isValid: true, userData: userData ? userData.value : null };
        }else {
            return { isValid: false };
        }


    }else{
        return { isValid: false };
    }

    
    
}


// Function to handle the OAuth callback
export async function handleOAuthCallback(request) {
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


    // Optionally store user data and JWT in Deno KV
    const kv = await Deno.openKv();

    const oldUserData = await kv.get(["discordUser", userData.id]);

    const user_count = await kv.get(["web_stats", "users"]);

    if(!user_count.value){
        user_count.value = 0;
    }

    if(!oldUserData.value){

        const total_users = ++user_count.value;

        await kv.set(["web_stats", "users"], total_users);

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1235274235438436413/wIBKtVBz9QvyqqUN8Fu4jSoKfXsQn-ior-92FzPNPKxbDrI2i1VhzV4ps_XqzdjPlb9q",
            userData.username + " joined VAPR we are now " + total_users + " members!");

        await kv.set(["discordUser", userData.id], userData);
    }

    if(oldUserData.value.username !== userData.username){
        oldUserData.value.username = userData.username;

        await kv.set(["discordUser", userData.id], oldUserData);
    }

    const secret_key = generateSecretKey();
    await kv.set(["secret_keys", secret_key], userData.id);

    // Read and prepare the HTML response
    const htmlTemplate = await Deno.readTextFile("discord_callback.html");
    const htmlContent = htmlTemplate
        .replace('{{jwt}}', secret_key)
        .replace('{{userData}}', JSON.stringify(userData).replace(/"/g, '\\"'));

    return new Response(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html" }
    });
}

// Function to redirect to Discord login
export function redirectToDiscordLogin() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email`;
    return Response.redirect(authUrl);
}
